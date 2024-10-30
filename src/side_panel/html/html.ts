import { Note } from "../../models.js"


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

export { buildSection }