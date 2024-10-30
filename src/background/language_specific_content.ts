import { Block, BlockType, Cell, Note, PromptSections } from "../models.js";
import { containsLanguageSpecificContent } from "./utils.js";

function checkForLanguageSpecificContent(cells: Cell[]): Note[] {
    const notes: Note[] = []
    for (const cell of cells) {
        const block = new Block(cell)
        if (block.type === BlockType.PROMPT) {
            for (const line of block.lines) {
                const section = PromptSections.getSection(line)
                if (section == PromptSections.STARTER_CODE) {
                    break
                }
                if (containsLanguageSpecificContent(line)) {
                    const word = line.split(" ").find(word => containsLanguageSpecificContent(word))
                    notes.push({
                        blockName: block.type,
                        lineNumber: block.lines.indexOf(line),
                        lineText: line,
                        message: "You should not use camelCase or snake_case in the prompt",
                        success: false,
                        variableName: word ?? line
                    })
                }
            }
        } else if (block.type === BlockType.SOLUTION) {
            for (const line of block.lines) {
                if (containsLanguageSpecificContent(line) || line.toLowerCase().includes("python") || line.toLowerCase().includes("swift")) {
                    const word = line.split(" ").find(word => containsLanguageSpecificContent(word))
                    notes.push({
                        blockName: block.type,
                        lineNumber: block.lines.indexOf(line),
                        lineText: line,
                        message: "You should not use language specific content in the solution",
                        success: false,
                        variableName: word ?? line
                    })
                }
            }
        }
    }
    return notes
}

export default checkForLanguageSpecificContent;