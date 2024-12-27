import { Note, Turn } from "../../models.js"


function buildSection(name: string, cells: Note[], required: boolean = true): Node {
    const id = name.toLowerCase().replace(' ', '-')
    if (cells.length === 0) {
        cells.push({
            blockName: 'Not found',
            lineNumber: -1,
            lineText: '',
            message: required ? 'No items found to analyze' : 'No issues found',
            success: !required,
            variableName: required ? 'Not found' : 'No issues found'
        })
    }
    const val = `
        <div class="section" id="${id}">
            <h3 class="title">${name}:</h3>
            ${cells.map(cell => `
                <div class="item">
                    <span class="icon">${cell.success ? '✅' : '❌'}</span>
                    <div class="col ${cell.lineNumber != -1 ? 'code-hover' : ''}" data-code="${cell.lineText}" data-line="${cell.lineNumber + 1}" data-blockName="${cell.blockName}">
                        <span class="code-line">${cell.variableName}</span>
                        ${cell.success ? '' : `<span>${cell.message}</span>`}
                    </div>
                </div>`).join('')}
        </div>
    `
    const div = document.createElement('div')
    div.innerHTML = val.trim()
    return div.firstChild!
}

function buildTurnsSection(turns: Turn[]): Node {
    const div = document.createElement('div')
    turns.forEach((turn, index) => {
        const header = document.createElement('div')
        header.textContent = `Turn ${index + 1}`
        div.appendChild(header)

        const textArea = document.createElement('textarea')
        textArea.textContent = turn.user
        div.appendChild(textArea)

        // elem.innerHTML = `<p>Assistant response: ${turn.assistant}</p>`
        // const buttonAsk = document.createElement('button')
        // buttonAsk.innerText = "Ask to server"
        // buttonAsk.setAttribute('turn', index.toString())
        // buttonAsk.setAttribute('prompt', turn.user)
        // elem.appendChild(buttonAsk)
        // elem.classList.add('row')
        // div.appendChild(elem)
    })
    return div
}

export { buildSection, buildTurnsSection }