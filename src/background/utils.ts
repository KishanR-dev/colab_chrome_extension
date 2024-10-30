import { Cell } from "../models.js"


function containsLanguageSpecificContent(string: string): boolean {
    return string.includes('_') || /[a-z]+[A-Z]+/.test(string)
}

function isCamelCase(string: string): boolean {
    return /^[a-z]+([A-Z][a-z]+)*$/.test(string)
}

function isPythonCode(cell: Cell): boolean {
    if (cell.cell_type === "code") {
        const lines = cell.content.split("\n")

        if (cell.content.includes("def ")) {
            const def_lines = lines.filter(line => line.includes("def "))
            for (const line of def_lines) {
                if (["(", ")", ":"].some(char => !line.includes(char))) {
                    return false
                }
            }
            return true
        } else if (cell.content.includes("class ")) {
            const class_lines = lines.filter(line => line.includes("class "))
            for (const line of class_lines) {
                if (!line.trim().startsWith("class ") || !line.endsWith(":")) {
                    return false
                }
            }
            return true
        } else if (cell.content.includes("assert ")) {
            return true
        }
    }
    return false
}

function isSnakeCase(string: string): boolean {
    return /^_{0,2}[a-z]+(_+([a-z]+|[0-9]+))*_{0,2}$/.test(string)
}

function isSwiftCode(cell: Cell): boolean {
    if (cell.cell_type === "code") {
        const lines = cell.content.split("\n")

        if (cell.content.includes("func ")) {
            const func_lines = lines.filter(line => line.includes("func "))
            for (const line of func_lines) {
                if (["(", ")", "{"].some(char => !line.includes(char))) {
                    return false
                }
            }
            return true
        } else if (cell.content.includes("class ")) {
            const class_lines = lines.filter(line => line.includes("class "))
            for (const line of class_lines) {
                if (!(line.startsWith("public ") || line.startsWith("private ")) || !line.endsWith("{")) {
                    return false
                }
            }
            return true
        } else if (cell.content.includes("assert(")) {
            return true
        }
    }
    return false
}

function convertToNaturalLanguage(variable: string): string {
    return variable
        .toLowerCase()
        .replace(/_([a-z])/g, (_, letter) => ' ' + letter.toUpperCase()) // Handle snake_case
        .replace(/^([a-z])/, (match) => match.toUpperCase()); // Capitalize the first letter    
}

function convertToSnakeCase(variable: string): string {
    return variable
        .replace(/([a-z])([A-Z])/g, '$1_$2')
        .toLowerCase()
        .replace(/([0-9])([a-z])/g, '$1_$2')
        .replace(/([a-z])([0-9])/g, '$1_$2')
}

export { containsLanguageSpecificContent, convertToNaturalLanguage,  isCamelCase, isPythonCode, isSnakeCase, isSwiftCode, convertToSnakeCase }
