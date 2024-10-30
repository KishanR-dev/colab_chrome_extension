import { Cell, ColabContent } from "../models.js"
import checkForLanguageSpecificContent from "./language_specific_content.js"
import checkForSnakeCaseFunctions from "./snake_case.js"
import checkForSolutionBlock from "./solution_block.js"
import checkForTestCases from "./test_cases.js"



function analyzeCells(cells: Cell[]): ColabContent {
  return {
    languageSpecificContent: checkForLanguageSpecificContent(cells),
    snakeCases: checkForSnakeCaseFunctions(cells),
    solution: checkForSolutionBlock(cells),
    testCases: checkForTestCases(cells),
    // TODO: Add check for snake case variables
    // TODO: Add check for print statements
    // TODO: Add check for typing
    // TODO: Add check for same comments in both languages
    // TODO: Add check for prompt structure
  }
}

export default analyzeCells