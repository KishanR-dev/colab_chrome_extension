import { isSnakeCase } from "./utils.js"
import { Block, Cell, Note } from "../models.js"


function checkForSnakeCaseFunctions(cells: Cell[]): Note[] {
    const notes: Note[] = []
    for (const cell of cells) {
        const lines = cell.content.split("\n")
        const block = new Block(cell)
        for (let index = 0; index < lines.length; index++) {
            const line = lines[index]
            if (line.includes("def ")) {
                const functionName = line.split("def ")[1].split("(")[0]
                const success = isSnakeCase(functionName)
                if (!success && line.includes("def setUp(self):")) {
                    // Skip setUp function in tests
                    continue
                }
                notes.push({
                    blockName: block.type,
                    lineNumber: index,
                    lineText: line,
                    message: "Function names should be in snake_case",
                    success,
                    variableName: functionName
                })
            }
        }
    }
    return notes
}

export default checkForSnakeCaseFunctions