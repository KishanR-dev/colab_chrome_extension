import analyzeCells from "../background/background.js"
import { answerPrompt, translateToPython } from "../background/gpt.js"
import { formatExamples, translateTestsToPython } from "../background/static_translator.js"
import { Block, BlockType, Cell, MessageType } from "../models.js"
import { buildSection } from "./html/html.js"

const askGPTBtn: HTMLButtonElement = document.getElementById('askGPTBtn') as HTMLButtonElement
const copyPromptBtn: HTMLButtonElement = document.getElementById('copyPromptBtn') as HTMLButtonElement
const copyAnswersBtns: HTMLDivElement = document.getElementById('copyAnswersBtns') as HTMLDivElement
const copyExamplesBtn: HTMLButtonElement = document.getElementById('copyExamplesBtn') as HTMLButtonElement
const copySolutionBtn: HTMLButtonElement = document.getElementById('copySolutionBtn') as HTMLButtonElement
const copyPythonBtn: HTMLButtonElement = document.getElementById('copyPythonBtn') as HTMLButtonElement
const checkReviewBtn: HTMLButtonElement = document.getElementById('checkReviewBtn') as HTMLButtonElement
const goToLLMReviewerBtn: HTMLButtonElement = document.getElementById('goToLLMReviewerBtn') as HTMLButtonElement
const prompt = document.getElementById('prompt') as HTMLTextAreaElement
const report = document.getElementById('report')!
const textArea = document.getElementById('prompt') as HTMLTextAreaElement
const translateToPythonBtn: HTMLButtonElement = document.getElementById('translateToPythonBtn') as HTMLButtonElement
const draftPythonTestsBtn: HTMLButtonElement = document.getElementById('draftPythonTestsBtn') as HTMLButtonElement
const examplesFormatterBtn: HTMLButtonElement = document.getElementById('examplesFormatterBtn') as HTMLButtonElement

document.addEventListener('DOMContentLoaded', analyzeColab)
document.addEventListener('mouseenter', analyzeColab)
askGPTBtn.addEventListener('click', getPrompt)
copyPromptBtn.addEventListener('click', copyPrompt)
checkReviewBtn.addEventListener('click', checkThisReview)
goToLLMReviewerBtn.addEventListener('click', goToLLMReviewer)
translateToPythonBtn.addEventListener('click', translateSwiftToPython)
draftPythonTestsBtn.addEventListener('click', draftPythonTests)
examplesFormatterBtn.addEventListener('click', formatExamplesFromClipboard)

function analyzeColab() {
  chrome.tabs.query({ active: true, currentWindow: true, url: "https://colab.research.google.com/drive/*" }, tabs => {
    if (tabs[0] === undefined) { return; }
    chrome.tabs.sendMessage(tabs[0].id!, { source: MessageType.GET_CELLS }, (cells: Cell[]) => {
      if (chrome.runtime.lastError) {
        alert(chrome.runtime.lastError.message)
      }
      if (!cells) {
        alert('No cells found')
        return
      }

      const response = analyzeCells(cells)

      report.innerHTML = ''
      report.appendChild(document.createElement('h2')).textContent = 'Analysis Report'
      report.appendChild(buildSection('Language Specific content', response.languageSpecificContent, false))
      report.appendChild(buildSection('Solution', response.solution))
      report.appendChild(buildSection('Snake cases', response.snakeCases))
      report.appendChild(buildSection('Test cases', response.testCases))
    })
  })
}

function getPrompt() {
  chrome.tabs.query({ active: true, currentWindow: true, url: "https://colab.research.google.com/drive/*" }, tabs => {
    if (tabs[0] === undefined) { return; }
    chrome.tabs.sendMessage(tabs[0].id!, { source: MessageType.GET_PROMPT }, (cells: Cell[]) => {
      textArea.textContent = cells[0].prompt
      textArea.classList.remove('hidden')
      copyPromptBtn.classList.remove('hidden')
      askGPTBtn.innerText = "Ask to GPT"
      askGPTBtn.removeEventListener('click', getPrompt)
      askGPTBtn.addEventListener('click', askGPT)
    })
  })
}

async function copyToClipboard(text: string, button: HTMLButtonElement) {
  navigator.clipboard.writeText(text)
  const originalText = button.textContent!
  button.textContent = 'Copied!'
  await new Promise(resolve => setTimeout(resolve, 1000))
  button.textContent = originalText
}

function copyPrompt() {
  copyToClipboard(prompt.value, copyPromptBtn)
}

async function goToLLMReviewer() {
  chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
    chrome.tabs.sendMessage(tabs[0].id!, {}, async () => {
      const colabId = tabs[0].url?.split('/').pop()?.split('#')[0].split("?")[0]
      if (colabId) {
        await copyToClipboard(colabId, goToLLMReviewerBtn)
      }
      const url = `https://llm-reviewer.turing.com/colabs/review`
      window.close()
      window.open(url, '_blank')
    })
  })
}

function checkThisReview() {
  chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
    chrome.tabs.sendMessage(tabs[0].id!, {}, async () => {
      const colabId = tabs[0].url?.split('/').pop()?.split('#')[0].split("?")[0]
      if (colabId) {
        const url = `https://llm-reviewer.turing.com/colabs/${colabId}/reviews`
        window.close()
        window.open(url, '_blank')
      }
    })
  })
}

async function askGPT() {
  askGPTBtn.disabled = true
  try {
    const response = await answerPrompt(prompt.value)
    askGPTBtn.classList.add('hidden')
    copyAnswersBtns.classList.remove('hidden')
    textArea.style.height = '0px'
    new Promise(resolve => setTimeout(resolve, 1000)).then(() => {
      textArea.classList.add('hidden')
      copyPromptBtn.innerText = 'Copy prompt'
      copyPromptBtn.classList.add('code-hover')
      copyPromptBtn.setAttribute('data-code', prompt.value)
    })
    copyExamplesBtn.addEventListener('click', () => copyToClipboard(response.examplesText ?? "", copyExamplesBtn))
    copyExamplesBtn.setAttribute('data-code', response.examplesText ?? "")
    copySolutionBtn.addEventListener('click', () => copyToClipboard(response.solution, copySolutionBtn))
    copySolutionBtn.setAttribute('data-code', response.solution)
    copyPythonBtn.addEventListener('click', () => copyToClipboard(response.python_code, copyPythonBtn))
    copyPythonBtn.setAttribute('data-code', response.python_code)
  } catch (error) {
    alert(error)
  } finally {
    askGPTBtn.disabled = false
  }
}

async function translateSwiftToPython() {
  translateToPythonBtn.disabled = true
  chrome.tabs.query({ active: true, currentWindow: true, url: "https://colab.research.google.com/drive/*" }, tabs => {
    if (tabs[0] === undefined) { return; }
    chrome.tabs.sendMessage(tabs[0].id!, { source: MessageType.GET_CELLS }, async (cells: Cell[]) => {
      const pythonCell = cells.find((c) => (new Block(c)).type === BlockType.SWIFT_CODE)
      if (!pythonCell) {
        return
      }
      const response = await translateToPython(pythonCell.content)
      console.log(response);
      translateToPythonBtn.removeEventListener('click', translateSwiftToPython)
      translateToPythonBtn.setAttribute('data-code', response)
      translateToPythonBtn.classList.add('code-hover')
      translateToPythonBtn.addEventListener('click', () => copyToClipboard(response, translateToPythonBtn))
      translateToPythonBtn.disabled = false
      translateToPythonBtn.textContent = 'Copy Python code'
    })
  })
}

function draftPythonTests() {
  draftPythonTestsBtn.disabled = true
  chrome.tabs.query({ active: true, currentWindow: true, url: "https://colab.research.google.com/drive/*" }, tabs => {
    if (tabs[0] === undefined) { return; }
    chrome.tabs.sendMessage(tabs[0].id!, { source: MessageType.GET_CELLS }, async (cells: Cell[]) => {
      const swiftCell = cells.find((c) => (new Block(c)).type === BlockType.SWIFT_TEST)
      if (!swiftCell) {
        return
      }
      const response = translateTestsToPython(swiftCell.content)
      draftPythonTestsBtn.removeEventListener('click', draftPythonTests)
      draftPythonTestsBtn.setAttribute('data-code', response)
      draftPythonTestsBtn.classList.add('code-hover')
      draftPythonTestsBtn.addEventListener('click', () => copyToClipboard(response, draftPythonTestsBtn))
      draftPythonTestsBtn.disabled = false
      draftPythonTestsBtn.textContent = 'Copy Python tests'
    })
  })
}

async function formatExamplesFromClipboard() {
  /**
   * Format examples from the clipboard and copy to the clipboard
   */
  const examples = await navigator.clipboard.readText()
  const formattedExamples = formatExamples(examples)
  if (formattedExamples) {
    navigator.clipboard.writeText(formattedExamples)
    alert("Formatted examples copied to the clipboard")
  } else {
    alert("No examples found in your clipboard")
  }
}