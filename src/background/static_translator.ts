import { convertToCamelCase, convertToNaturalLanguage, convertToSnakeCase } from "./utils.js"

function convertToUnitTest(pythonCode: string): string {
    const lines = pythonCode.split("\n");
    const snakeCaseRegex = /([a-z]+_)+[a-z]+/g
    const functionCallRegex = /[a-z_]+[a-z]\(/g
    let className: string | undefined = lines.filter((line) => line.match(snakeCaseRegex))[0].match(functionCallRegex)?.[0]
    console.log(className);
    if (className) {
        className = className.substring(0, className.length - 1)
        className = `Test${convertToCamelCase(className)}`
    } else {
        className = "Test$"
    }
    let testCaseCode = `import unittest\n\n\nclass ${className}(unittest.TestCase):\n`;

    for (const line of lines) {
        const trimmedLine = line.trim()
        if (trimmedLine.startsWith("#")) {
            const methodName = trimmedLine.substring(trimmedLine.indexOf(":") + 2).replaceAll(" ", "_").replaceAll(",", "").toLowerCase()
            testCaseCode += `\n    ${trimmedLine}\n    def test_${methodName}(self):\n`
        } else if (trimmedLine.startsWith("assert")) {
            const assertion = trimmedLine.replace("assert ", "").replace(" == ", ", ")
            const assertionType = assertion.includes("== True") ? "True" : assertion.includes("== False") ? "False" : "Equal"
            testCaseCode += `        self.assert${assertionType}(${assertion})\n`
        } else {
            testCaseCode += `        ${line}\n`
        }
    }
    testCaseCode += '\n\nif __name__ == "__main__":\n    unittest.main(argv=[""], exit=False)'
    return testCaseCode;
}

function formatExamples(gptResponse: string): string {
    let examplesText = ""
    gptResponse = gptResponse.substring(gptResponse.indexOf("Example 1:"), gptResponse.indexOf("Solution"))
    const examples = gptResponse.split("Example")
    let index = 0
    for (const example of examples) {
        const lines = example.split("\n")
        console.log(lines);
        if (lines.length == 1) {
            continue
        }
        index += 1
        examplesText += `\n**Example ${index}:**\n`
        let step = ""
        lines.forEach((line) => {
            line = line.replace("•", "")
            if (line.includes("Input:")) {
                step = "input"
                examplesText += `- Input:\n`
            } else if (line.includes("Output:")) {
                step = "output"
                examplesText += `- Output:\n`
            } else if (line.includes("Explanation:")) {
                line = line.trim()
                step = "explanation"
                if (!line.startsWith("- ")) {
                    line = "- " + line
                }
                examplesText += `${line}\n`
            } else if (line.trim() != "") {
                // examplesText += `   - ${convertToNaturalLanguage(line.substring(2))}\n`
                if (step == "input") {
                    let variable = line.split(":")[0].trim()
                    const value = line.split(":")[1].trim()
                    variable = convertToNaturalLanguage(variable)
                    examplesText += `    - ${variable}: ${value}\n`
                } else if (step == "output") {
                    line = line.trim()
                    examplesText += `    - ${line}\n`
                // } else if (step == "explanation") {
                //     line = line.trim()
                //     examplesText += `    - ${line}\n`
                }
            }
        })
    }
    return examplesText
}

function translateTestsToPython(tests: string): string {
    // It was tested for single assert tests
    tests = tests.replaceAll("// ", "# ")
    tests = tests.replaceAll("let ", "")
    tests = tests.replaceAll("var ", "")
    tests = tests.replaceAll("false", "False")
    tests = tests.replaceAll("true", "True")
    tests = tests.replaceAll("||", "or")
    const varRegex = /[a-z]+([A-Z]|[0-9])/g
    const colonRegex = /[a-z]+:/g
    const functionAttrRegex = /[a-zA-Z0-9]+\.[a-zA-Z0-9]+/g
    const paramRegex = /[a-z]+: [a-z]+/g
    const lines = tests.split("\n")
    for (const [index, line] of lines.entries()) {
        let newLine: string
        if (line.includes(" = ")) {
            newLine = line.replace(varRegex, (match) => {
                return convertToSnakeCase(match)
            })
            if (newLine.match(paramRegex)) {
                newLine = newLine.replace(paramRegex, (match) => {
                    return convertToSnakeCase(match.split(":")[1].trim())
                })
            }
            lines[index] = newLine
        } else if (line.match(functionAttrRegex)) {
            newLine = line.replace(functionAttrRegex, (match) => {
                return convertToSnakeCase(match)
            })
            lines[index] = newLine
        }
        if (line.includes("assert(")) {
            newLine = line.substring(0, line.lastIndexOf(")"))
            newLine = newLine.replace("assert(", "assert ")
            newLine = newLine.replace(varRegex, (match) => {
                return convertToSnakeCase(match)
            })
            if (newLine.includes("\\(")) {
                const testStringIndex = newLine.indexOf('"Test')
                let testString = newLine.substring(testStringIndex)
                const interpolationIndex = testString.indexOf("\\(")
                let stack = 0
                let closingParenthesisIndex = -1;
                for (let i = interpolationIndex; i < testString.length; i++) {
                    if (testString[i] == "(") {
                        stack += 1
                    } else if (testString[i] == ")") {
                        stack -= 1
                        if (stack == 0) {
                            closingParenthesisIndex = i;
                            break;
                        }
                    }
                }
                if (closingParenthesisIndex != -1) {
                    const firstText = testString.substring(0, interpolationIndex)
                    const functionCall = testString.substring(interpolationIndex + 2, closingParenthesisIndex)
                    const lastPart = testString.substring(closingParenthesisIndex + 1)
                    testString = `f${firstText}{${functionCall}}${lastPart}`
                }
                newLine = newLine.substring(0, testStringIndex) + testString
            }
            lines[index] = newLine
        } else if (line.includes("func ")) {
            newLine = line.replace("func ", "def ")
            newLine = newLine.replace(varRegex, (match) => {
                return convertToSnakeCase(match)
            })
            newLine = newLine.replace("() {", "(self):")
            lines[index] = newLine
        } else if (line.includes("}")) {
            lines[index] = ""
        } else if (line.includes("XCTAssert")) {
            lines[index] = line.replace("XCTAssert", "self.assert").replace(varRegex, (match) => {
                if (!["assertE", "assertT", "assertF"].includes(match)) {
                    return convertToSnakeCase(match)
                }
                return match
            })
        } else if (line.includes("import XCTest")) {
            lines[index] = "import unittest"
        } else if (line.includes(": XCTestCase {")) {
            lines[index] = line.replace(": XCTestCase {", "(unittest.TestCase):")
        } else if (line.includes("defaultTestSuite.run()")) {
            lines[index] = "if __name__ == \"__main__\":\n    unittest.main(argv=[\"\"], exit=False)"
        }
        if (line.match(colonRegex) && line.match(/func .+[a-z]+:/g)) {
            const currentLine = lines[index]
            newLine = currentLine.replace(colonRegex, (_) => {
                return ""
            })
            newLine = newLine.replaceAll("  ", " ").replace("( ", "(")
            lines[index] = newLine
        }
    }
    let output = lines.join("\n")
    output = output.replaceAll("\n\n\n    # Test", "\n\n    # Test")
    return output
}

export { convertToUnitTest, formatExamples, translateTestsToPython }
