import { convertToSnakeCase } from "./utils.js"

function translateTestsToPython(tests: string): string {
    // It was tested for single assert tests
    tests = tests.replaceAll("// ", "# ")
    tests = tests.replaceAll("let ", "")
    tests = tests.replaceAll("var ", "")
    tests = tests.replaceAll("false", "False")
    tests = tests.replaceAll("true", "True")
    const varRegex = /[a-z]+([A-Z]|[0-9])/g
    const colonRegex = /[a-z]+:/g
    const functionAttrRegex = /[a-zA-Z0-9]+\.[a-zA-Z0-9]+/g
    const lines = tests.split("\n")
    for (const [index, line] of lines.entries()) {
        let newLine: string
        if (line.includes(" = ")) {
            newLine = line.replace(varRegex, (match) => {
                return convertToSnakeCase(match)
            })
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
        } else if (line.includes("XCTAssertEqual")) {
            lines[index] = line.replace("XCTAssertEqual", "self.assertEqual").replace(varRegex, (match) => {
                if (match != "assertE") {
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
        if (line.match(colonRegex) && line.includes("(")) {
            const currentLine = lines[index]
            newLine = currentLine.replace(colonRegex, (match) => {
                return ""
            })
            newLine = newLine.replaceAll("  ", " ").replace("( ", "(")
            lines[index] = newLine
        }
    }
    return lines.join("\n")
}

export { translateTestsToPython }