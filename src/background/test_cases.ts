import { Block, BlockType, Cell, Note } from "../models.js"


function checkForTestCases(cells: Cell[]): Note[] {
    /**
     * Check if the cells from the Google Colab file has the correct test cases structure
     *
     * @param cells: The cells from the Google Colab file
     * @return: A list of errors if the file does not have the correct test cases structure
     */

    function getTopComment(lines: string[], index: number, sharp: string): string {
        let output = lines[index - 1]
        let comment_lines = 1

        while (index - comment_lines > 0) {
            comment_lines += 1
            const prev = lines[index - comment_lines]
            if (prev.includes(sharp)) {
                output = `${prev}${output.replace(sharp, '').trim()}`
            } else {
                break
            }
        }
        return output
    }

    const notes: Note[] = []
    const blocks: Block[] = cells.map(cell => new Block(cell))
    const testBlocks: Block[] = blocks.filter(block =>
        block.type === BlockType.PYTHON_TEST || block.type === BlockType.SWIFT_TEST
    )

    if (testBlocks.length === 0) {
        return [
            {
                blockName: "Not found",
                lineNumber: -1,
                lineText: "",
                message: "There are no test cases in the file",
                success: false,
                variableName: "No test cases"
            }
        ]
    }
    for (const block of testBlocks) {
        const lines = block.lines
        const usesTestFramework = lines[0].startsWith("import unittest") || lines[0].startsWith("import XCTest")
        let currentTest: number | null = usesTestFramework ? null : 0
        const sharp = block.type === BlockType.PYTHON_TEST ? "#" : "//"

        for (let index = 0; index < lines.length; index++) {
            const line = lines[index]

            if (usesTestFramework) {
                if (line.startsWith("class Test")) {
                    currentTest = 0
                } else if (currentTest !== null && (line.includes("  def test") || line.includes("func test"))) {
                    currentTest += 1
                    const comment = getTopComment(lines, index, sharp)
                    const success = comment.includes(`${sharp} Test Case ${currentTest}: `)
                    let message = comment
                    if (!success) {
                        message = `Expected '${sharp} Test Case ${currentTest}: ...' before the test case.`
                    }
                    notes.push({
                        blockName: block.type,
                        lineNumber: index - 1,
                        lineText: comment,
                        message,
                        success,
                        variableName: `Test case ${currentTest}`
                    })
                }
            } else {
                if (line.includes("assert ")) {
                    currentTest! += 1
                    const comment = getTopComment(lines, index, sharp)
                    const success = comment.includes(`${sharp} Test Case ${currentTest}: `)
                    let message = comment
                    if (!success) {
                        message = `Expected '${sharp} Test Case ${currentTest}: ...' before the test case`
                    }
                    notes.push({
                        blockName: block.type,
                        lineNumber: index - 1,
                        lineText: comment,
                        message,
                        success,
                        variableName: `Test case ${currentTest}`,
                    })
                }
            }
        }
    }

    return notes
}

export default checkForTestCases