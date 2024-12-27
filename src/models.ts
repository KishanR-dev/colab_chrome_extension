import { isPythonCode, isSwiftCode } from "./background/utils.js"


enum BlockType {
    PROMPT = "Prompt",
    SOLUTION = "Solution",
    PYTHON_HEADER = "Python header",
    PYTHON_CODE = "Python code",
    PYTHON_TEST = "Python test",
    SWIFT_HEADER = "Swift header",
    SWIFT_CODE = "Swift code",
    SWIFT_TEST = "Swift test",
    UNKNOWN = "UNKNOWN"
}

enum MessageType {
    GET_CELLS = "getCells",
    GET_PROMPT = "getPrompt",
    GPT_RESPONSE = "gptResponse",
    GET_RLHF_PROMPT = "getRLHFPrompt",
    GET_TURNS_COUNT = "getTurnsCount",
    PASTE_RLHF_ANSWERS = "pasteRLHFAnswers",
    READ_MODEL_ANSWERS = "readModelAnswers"
}

class Block {
    content: string
    private _cell: Cell

    constructor(cell: Cell) {
        /**
         * Represents a block of code or text
         *
         * @param cell: The cell to be represented as a block
         */
        this.content = cell.content
        this._cell = cell
    }

    get type(): BlockType {
        /**
         * Get the type of the block
         *
         * @return: The type of the block
         */
        let content = this.content.trim()
        if (content.startsWith("Assistant")) {
            content = content.slice(11)
        }
        content = content.replace("keyboard_arrow_down\n", "")
        if (content.startsWith("Metadata")) {
            return BlockType.PROMPT
        } else if (content.startsWith("Solution")) {
            return BlockType.SOLUTION
        } else if (content.startsWith("Python Answer")) {
            return BlockType.PYTHON_HEADER
        } else if (isPythonCode(this._cell)) {
            if (this.content.includes("import unittest") || this.content.includes("assert ")) {
                return BlockType.PYTHON_TEST
            }
            return BlockType.PYTHON_CODE
        } else if (content.startsWith("Swift Answer")) {
            return BlockType.SWIFT_HEADER
        } else if (isSwiftCode(this._cell)) {
            if (this.content.includes("import XCTest") || this.content.includes("assert(")) {
                return BlockType.SWIFT_TEST
            }
            return BlockType.SWIFT_CODE
        }
        console.log("Unknown block type: <", content, ">")


        return BlockType.UNKNOWN
    }

    get lines(): string[] {
        /**
         * Get the lines of the block
         *
         * @return: The lines of the block
         */
        return this.content.split("\n")
    }
}

interface Cell {
    cell_type: 'code' | 'text'
    content: string
    prompt: string | null
}

interface ColabContent {
    languageSpecificContent: Note[],
    snakeCases: Note[],
    solution: Note[],
    testCases: Note[]
}

interface Note {
    blockName: string | null
    lineNumber: number
    lineText: string
    message: string
    success: boolean
    variableName: string
}

interface Input {
    var_name: string,
    value: string
}

interface Example {
    input: Input[],
    output: string,
    explanation: string
}

interface GPTResponse {
    examples: Example[],
    examplesText: string | null,
    solution: string,
    python_code: string,
}

interface Turn {
    user: string,
    assistant: string
}

interface RLHFAnswer {
    score: string | null
    comment: string
}

enum RLHFKey {
    INSTRUCTION_FOLLOWING = "instruction_following",
    TRUTHFULNESS = "truthfulness",
    CONCISENESS = "conciseness",
    CONTENT_SAFETY = "content_safety",
    OVERALL_SATISFACTION = "overall_satisfaction",
}

interface RLHFAnswers {
    [key: string]: RLHFAnswer
}

class PromptSections {
    static PROMPT = "Prompt: -"
    static KEYWORDS = "Keywords: -"
    static DIFFICULTY_LEVEL = "Difficulty Level: -"
    static EXAMPLE = "Examples: -"
    static STARTER_CODE = "Starter Code: -"

    static get all(): string[] {
        return [PromptSections.PROMPT, PromptSections.KEYWORDS, PromptSections.DIFFICULTY_LEVEL, PromptSections.EXAMPLE, PromptSections.STARTER_CODE]
    }

    static getSection(source: string): string | undefined {
        for (const section of PromptSections.all) {
            if (source.startsWith(section)) {
                return section
            }
        }
    }
}

export { Block, BlockType, Cell, ColabContent, GPTResponse, MessageType, Note, PromptSections, RLHFAnswer, RLHFAnswers, RLHFKey, Turn }