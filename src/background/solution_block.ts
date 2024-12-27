import { Block, BlockType, Cell, Note } from "../models.js";

function checkForSolutionBlock(cells: Cell[]): Note[] {
    const notes: Note[] = []
    const solutionBlock = cells.find(cell => (new Block(cell)).type === BlockType.SOLUTION)
    if (solutionBlock) {
        const content = solutionBlock.content.trim()
            .replace("Assistant\n\n", "")
            .replace("Solution\n\n", "")
            .replace("keyboard_arrow_down", "")
        if (content.length < 25) {
            notes.push({
                blockName: 'Solution',
                lineNumber: 0,
                lineText: content,
                message: 'Solution is too short',
                success: false,
                variableName: 'Solution'
            })
        } else if (solutionBlock.content.length > 600) {
            notes.push({
                blockName: 'Solution',
                lineNumber: 0,
                lineText: content,
                message: 'Solution is too long',
                success: false,
                variableName: 'Solution'
            })
        } else {
            notes.push({
                blockName: 'Solution',
                lineNumber: 0,
                lineText: content,
                message: 'Solution is good',
                success: true,
                variableName: 'Solution'
            })
        }
    } else {
        notes.push({
            blockName: 'Solution',
            lineNumber: -1,
            lineText: '',
            message: 'Solution block not found',
            success: false,
            variableName: 'Solution'
        })
    }
    return notes;
}

export default checkForSolutionBlock