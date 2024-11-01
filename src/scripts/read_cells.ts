// import { Cell } from "../models.js"
// import { GPTResponse, MessageType } from "../models.js"
interface GPTResponse {
    examplesText: string | null,
    solution: string,
    pythonCode: string,
}
enum MessageType {
    GET_CELLS = "getCells",
    GET_PROMPT = "getPrompt",
    GPT_RESPONSE = "gptResponse",
}
// Importing from models.js is breaking the compiled code.


function readCells(): any[] {
    const htmlCells = Array.from(document.getElementsByClassName('notebook-cell-list'))[0].children
    const cells: any[] = []

    for (let cell of htmlCells) {
        const cellClasses = cell.classList
        if (cellClasses.contains('code')) {
            let codeCells = cell.getElementsByClassName('editor-scrollable')
            let codeCell: HTMLElement
            if (codeCells.length > 0) {
                codeCell = codeCells[0] as HTMLElement
            } else {
                codeCell = cell.getElementsByClassName('editor')[0] as HTMLElement
                if (codeCell.getElementsByClassName('monaco-colorized').length > 0) {
                    codeCell = codeCell.getElementsByClassName('monaco-colorized')[0] as HTMLElement
                } else if (codeCell.getElementsByClassName('editor-scrollable').length > 0) {
                    codeCell = codeCell.getElementsByClassName('editor-scrollable')[0] as HTMLElement
                }
            }
            cells.push({
                cell_type: 'code',
                content: codeCell.innerText.replaceAll(' ', ' ')
            })
        } else if (cellClasses.contains('text')) {
            const block = {
                cell_type: 'text',
                content: (cell as HTMLElement).innerText.replaceAll(' ', ' '),
                prompt: null as string | null
            }
            if (block.content.startsWith("Metadata")) {
                const markdown = (cell as HTMLElement).getElementsByClassName('markdown')[0]
                const p = markdown.getElementsByTagName('p')
                const codes = markdown.getElementsByTagName('pre')
                const code = codes[codes.length - 2]
                let prompt = p[0].innerText.replaceAll('Prompt: - ', '')
                prompt += `\n\n${p[1].innerText}`
                prompt += `\n\n${p[p.length - 1].innerText}`
                prompt += "\n```python\n" + code.innerText.trim() + "\n```"
                block.prompt = prompt
            }
            cells.push(block)
        }
    }

    return cells
}

chrome.runtime.onMessage.addListener(
    function (message: { source: MessageType, response?: GPTResponse }, _, sendResponse) {
        if (message.source === MessageType.GET_CELLS || message.source === MessageType.GET_PROMPT) {
            sendResponse(readCells())
        }
    }
)
