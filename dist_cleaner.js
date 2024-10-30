import fs from 'fs'
import path from 'path'


const directory = './dist' // Path to your compiled JavaScript files

function removeEsModuleLine(filePath) {
    const fileContent = fs.readFileSync(filePath, 'utf-8')
    const newContent = fileContent.replace(/Object\.defineProperty\(exports, "__esModule", \{ value: true \}\)/g, '')
    fs.writeFileSync(filePath, newContent, 'utf-8')
}

function processDirectory(dirPath) {
    fs.readdirSync(dirPath).forEach(file => {
        const fullPath = path.join(dirPath, file)
        if (fs.statSync(fullPath).isDirectory()) {
            processDirectory(fullPath)
        } else if (fullPath.endsWith('.js')) {
            removeEsModuleLine(fullPath)
        }
    })
}

processDirectory(directory)
