import analyzeCells from "../background/background.js"
import { answerPrompt, compareModelAnswers, createFoldersOnDrive, generateRLHFConversation, generateTestCode, reEvaluateModelAnswers, rewriteSolution, translateToPython, uploadScreenshotsOnDrive } from "../background/api.js"
import { extractAnswersFromText } from "../background/rlhf.js"
import { convertToUnitTest, formatExamples, translateTestsToPython } from "../background/static_translator.js"
import { Block, BlockType, Cell, MessageType } from "../models.js"
import { buildSection, buildTurnsSection } from "./html/html.js"

// Static colab panel
const askGPTBtn = document.getElementById('askGPTBtn') as HTMLButtonElement
const copyPromptBtn = document.getElementById('copyPromptBtn') as HTMLButtonElement
const copyAnswersBtns = document.getElementById('copyAnswersBtns') as HTMLDivElement
const copyExamplesBtn = document.getElementById('copyExamplesBtn') as HTMLButtonElement
const copySolutionBtn = document.getElementById('copySolutionBtn') as HTMLButtonElement
const copyPythonBtn = document.getElementById('copyPythonBtn') as HTMLButtonElement
const checkReviewBtn = document.getElementById('checkReviewBtn') as HTMLButtonElement
const goToLLMReviewerBtn = document.getElementById('goToLLMReviewerBtn') as HTMLButtonElement
const promptTextArea = document.getElementById('prompt') as HTMLTextAreaElement
const report = document.getElementById('report')!
const textArea = document.getElementById('prompt') as HTMLTextAreaElement
const translateToPythonBtn = document.getElementById('translateToPythonBtn') as HTMLButtonElement
const draftPythonTestsBtn = document.getElementById('draftPythonTestsBtn') as HTMLButtonElement
const examplesFormatterBtn = document.getElementById('examplesFormatterBtn') as HTMLButtonElement
const rewriteSolutionBtn = document.getElementById('rewriteSolutionBtn') as HTMLButtonElement
const assertToUnitTestBtn = document.getElementById('assertToUnitTestBtn') as HTMLButtonElement
// RLHF helper
const createFoldersSection = document.getElementById('createFoldersSection') as HTMLDivElement
const taskIdParagraph = document.getElementById('taskIdParagraph') as HTMLParagraphElement
const copyTaskIdBtn = document.getElementById('copyTaskIdBtn') as HTMLButtonElement
const readRLHFPromptBtn = document.getElementById('readRLHFPromptBtn') as HTMLButtonElement
const generateRLHFTurnsBtn = document.getElementById('generateRLHFTurnsBtn') as HTMLButtonElement
const tabRLHF = document.getElementById('tab-2') as HTMLInputElement
const showClipboardBtn = document.getElementById('showClipboardBtn') as HTMLButtonElement
const readModelAnswersBtn = document.getElementById('readModelAnswersBtn') as HTMLButtonElement
const compareTurnBtn = document.getElementById('compareTurnBtn') as HTMLButtonElement
const reEvaluateTurnBtn = document.getElementById('reEvaluateTurnBtn') as HTMLButtonElement
const copyToClipboardBtn = document.getElementById('copyToClipboardBtn') as HTMLButtonElement
const generateTestCodeBtn = document.getElementById('generateTestCodeBtn') as HTMLButtonElement
const generateTestCodeDropdown = document.getElementById('generateTestCodeDropdown') as HTMLSelectElement
const copyTestCodeBtn = document.getElementById('copyTestCodeBtn') as HTMLButtonElement
const codeOutput = document.getElementById('codeOutput') as HTMLTextAreaElement
const comparisonResponse = document.getElementById('comparisonResponse') as HTMLTextAreaElement
const requestedChanges = document.getElementById('requestedChanges') as HTMLTextAreaElement
const turnsSection = document.getElementById('turnsSection') as HTMLDivElement
const turnDropdown = document.getElementById('turnDropdown') as HTMLSelectElement
const languageDropdown = document.getElementById('languageDropdown') as HTMLSelectElement
const turnsScreenshots = document.getElementById('turnsScreenshots') as HTMLDivElement
const foldersBtn = document.getElementById('foldersBtn') as HTMLButtonElement
// Static colab panel
document.addEventListener('DOMContentLoaded', analyzeColab)
document.addEventListener('mouseenter', analyzeColab)
askGPTBtn.addEventListener('click', getPrompt)
copyPromptBtn.addEventListener('click', copyPrompt)
checkReviewBtn.addEventListener('click', checkThisReview)
goToLLMReviewerBtn.addEventListener('click', goToLLMReviewer)
translateToPythonBtn.addEventListener('click', translateSwiftToPython)
draftPythonTestsBtn.addEventListener('click', draftPythonTests)
examplesFormatterBtn.addEventListener('click', formatExamplesFromClipboard)
rewriteSolutionBtn.addEventListener('click', rewriteSolutionHandler)
assertToUnitTestBtn.addEventListener('click', convertToUnitTestHandler)
// RLHF helper
readRLHFPromptBtn.addEventListener('mouseenter', readRLHFPrompt)
generateRLHFTurnsBtn.addEventListener('click', generateRLHFTurns)
showClipboardBtn.addEventListener('click', showClipboard)
readModelAnswersBtn.addEventListener('mouseenter', readModelAnswers)
readModelAnswersBtn.addEventListener('click', () => copyToClipboard(readModelAnswersBtn.getAttribute('data-code')!, readModelAnswersBtn))
compareTurnBtn.addEventListener('click', compareTurn)
reEvaluateTurnBtn.addEventListener('click', reEvaluateTurn)
compareTurnBtn.addEventListener('mouseenter', () => toggleTextarea('compare'))
copyToClipboardBtn.addEventListener('click', () => copyToClipboard(copyToClipboardBtn.getAttribute('data-code')!, copyToClipboardBtn))
reEvaluateTurnBtn.addEventListener('mouseenter', () => toggleTextarea('reevaluate'))
generateTestCodeBtn.addEventListener('click', generateTurnTestCode)
copyTestCodeBtn.addEventListener('click', () => copyToClipboard(copyTestCodeBtn.getAttribute('data-code')!, copyTestCodeBtn))
turnDropdown.addEventListener('mouseenter', getTaskInfo)
turnDropdown.addEventListener('change', onTurnChange)
foldersBtn.addEventListener('click', createFolders)

function initState() {
  chrome.tabs.query({ active: true, currentWindow: true, url: "https://rlhf-v3.turing.com/prompt/*" }, tabs => {
    if (tabs[0]) {
      tabRLHF.click()
      getTaskInfo()
      document.addEventListener('mousemove', (event: MouseEvent) => {
        turnsScreenshots.style.setProperty('--mouse-x', `-${event.clientX/2}px`);
        turnsScreenshots.style.setProperty('--mouse-y', `-${event.clientY/5}px`);
      })
    }
  })
}

initState()

async function copyToClipboard(text: string, button: HTMLButtonElement) {
  navigator.clipboard.writeText(text)
  const originalText = button.textContent!
  console.log(originalText);
  const isIconButton = button.classList.contains('icon-button')
  button.textContent = isIconButton ? '✅' : 'Copied!'
  await new Promise(resolve => setTimeout(resolve, 1000))
  button.textContent = originalText
  console.log(button.textContent);
}

// Static colab panel
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

function copyPrompt() {
  copyToClipboard(promptTextArea.value, copyPromptBtn)
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
    const response = await answerPrompt(promptTextArea.value)
    askGPTBtn.classList.add('hidden')
    copyAnswersBtns.classList.remove('hidden')
    textArea.style.height = '0px'
    new Promise(resolve => setTimeout(resolve, 1000)).then(() => {
      textArea.classList.add('hidden')
      copyPromptBtn.innerText = 'Copy prompt'
      copyPromptBtn.classList.add('code-hover')
      copyPromptBtn.setAttribute('data-code', promptTextArea.value)
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
      const swiftCell = cells.find((c) => (new Block(c)).type === BlockType.SWIFT_CODE)
      if (!swiftCell) {
        return
      }
      const response = await translateToPython(swiftCell.content)
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

async function rewriteSolutionHandler() {
  rewriteSolutionBtn.disabled = true
  rewriteSolutionBtn.textContent = 'Rewriting...'
  chrome.tabs.query({ active: true, currentWindow: true, url: "https://colab.research.google.com/drive/*" }, tabs => {
    if (tabs[0] === undefined) { return; }
    chrome.tabs.sendMessage(tabs[0].id!, { source: MessageType.GET_CELLS }, async (cells: Cell[]) => {
      const solutionCell = cells.find((c) => (new Block(c)).type === BlockType.SOLUTION)
      if (!solutionCell) {
        return
      }
      const response = await rewriteSolution(solutionCell!.content)
      rewriteSolutionBtn.removeEventListener('click', rewriteSolutionHandler)
      rewriteSolutionBtn.setAttribute('data-code', response)
      rewriteSolutionBtn.classList.add('code-hover')
      rewriteSolutionBtn.addEventListener('click', () => copyToClipboard(response, rewriteSolutionBtn))
      rewriteSolutionBtn.textContent = 'Copy solution'
      rewriteSolutionBtn.disabled = false
    })
  })
}

function convertToUnitTestHandler() {
  chrome.tabs.query({ active: true, currentWindow: true, url: "https://colab.research.google.com/drive/*" }, tabs => {
    if (tabs[0] === undefined) { return; }
    chrome.tabs.sendMessage(tabs[0].id!, { source: MessageType.GET_CELLS }, async (cells: Cell[]) => {
      const pythonCell = cells.find((c) => (new Block(c)).type === BlockType.PYTHON_TEST)
      if (!pythonCell) {
        return
      }
      const response = convertToUnitTest(pythonCell.content)
      assertToUnitTestBtn.removeEventListener('click', convertToUnitTestHandler)
      assertToUnitTestBtn.setAttribute('data-code', response)
      assertToUnitTestBtn.classList.add('code-hover')
      assertToUnitTestBtn.addEventListener('click', () => copyToClipboard(response, assertToUnitTestBtn))
      assertToUnitTestBtn.textContent = 'Copy unittest code'
    })
  })
}

// RLHF helper
/**
 * Get the model answers from the selected turn
 * Prompt, Model A response, Model B response
 */
async function getModelAnswers(): Promise<Record<'prompt' | 'model_a' | 'model_b', string>> {
  const turn = turnDropdown.value === "-1" ? null : parseInt(turnDropdown.value)
  return new Promise((resolve, reject) => {
    chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
      if (tabs[0] === undefined) { reject(); return; }
      chrome.tabs.sendMessage(tabs[0].id!, { source: MessageType.READ_MODEL_ANSWERS, turn: turn }, (answers: Record<'prompt' | 'model_a' | 'model_b', string>) => {
        resolve(answers)
      })
    })
  })
}

/**
 * Get the RLHF initial prompt from the current tab
 */
async function getRLHFPrompt(): Promise<string | undefined> {
  return new Promise((resolve, reject) => {
    chrome.tabs.query({ active: true, currentWindow: true, url: "https://rlhf-v3.turing.com/prompt/*" }, tabs => {
      if (tabs[0] === undefined) { reject(); return; }
      chrome.tabs.sendMessage(tabs[0].id!, { source: MessageType.GET_RLHF_PROMPT }, (prompt: string) => {
        resolve(prompt)
      })
    })
  })
}

/**
 * Get the number of turns from the current tab and the task id
 */
async function getTaskInfo() {
  chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
    if (tabs[0] === undefined) { return; }
    chrome.tabs.sendMessage(tabs[0].id!, { source: MessageType.GET_TASK_INFO }, (taskInfo: { turnsCount: number, taskId: string }) => {
      const { turnsCount, taskId } = taskInfo
      const currentCount = turnDropdown.options.length
      if (currentCount !== turnsCount) {
        turnDropdown.innerHTML = ''
        for (let i = 1; i <= turnsCount; i++) {
          turnDropdown.innerHTML += `<option value="${i}">Turn ${i}</option>`
        }
        turnDropdown.value = turnsCount.toString()
      }
      taskIdParagraph.textContent = taskId
      copyTaskIdBtn.addEventListener('click', () => copyToClipboard(taskId, copyTaskIdBtn))
      copyTaskIdBtn.disabled = false
    })
  })
}

function onTurnChange() {
  readModelAnswersBtn.textContent = 'Read answer'
  readModelAnswersBtn.classList.remove('code-hover', 'paragraph')
  readModelAnswersBtn.removeAttribute('data-code')
}

function toggleTextarea(type: 'compare' | 'reevaluate') {
  comparisonResponse.hidden = type === 'compare'
  requestedChanges.hidden = type === 'compare'
}

async function readModelAnswers() {
  const answers = await getModelAnswers()
  if (answers) {
    readModelAnswersBtn.textContent = 'Copy answers'
    readModelAnswersBtn.classList.add('code-hover', 'paragraph')
    readModelAnswersBtn.setAttribute('data-code', `${answers.prompt}\n\nModel A response:\n${answers.model_a}\n\nModel B response:\n${answers.model_b}`)
  }
}

async function readRLHFPrompt() {
  const prompt = await getRLHFPrompt()
  if (prompt) {
    readRLHFPromptBtn.textContent = 'Copy prompt'
    readRLHFPromptBtn.classList.add('code-hover', 'paragraph')
    readRLHFPromptBtn.setAttribute('data-code', prompt)
    readRLHFPromptBtn.removeEventListener('mouseenter', readRLHFPrompt)
    readRLHFPromptBtn.addEventListener('click', () => copyToClipboard(prompt, readRLHFPromptBtn))
  }
}

async function generateRLHFTurns() {
  generateRLHFTurnsBtn.disabled = true
  const prompt = await getRLHFPrompt()
  if (prompt) {
    const response = await generateRLHFConversation(prompt, languageDropdown.value)
    generateRLHFTurnsBtn.disabled = false
    turnsSection.append(...Array.from(buildTurnsSection(response)))
    generateRLHFTurnsBtn.remove()
  }
}

async function showClipboard() {
  const text = await navigator.clipboard.readText()
  let answers: string | Record<string, any>
  try {
    answers = JSON.parse(text)
  } catch (error) {
    answers = extractAnswersFromText(text)
  }
  fillAnswersOnDom(answers)
}

async function fillAnswersOnDom(answers: string | Record<string, any>) {
  const parsedAnswers = typeof answers === 'string' ? extractAnswersFromText(answers) : answers
  chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
    if (tabs[0] === undefined) { return; }
    const turn = turnDropdown.value === "-1" ? null : parseInt(turnDropdown.value)
    const urls = Array.from(createFoldersSection.lastElementChild?.children ?? []).map(child => (child as HTMLAnchorElement).href)
    const folderLinks = urls.length > 1 ? { model_a: urls[0], model_b: urls[1] } : undefined
    chrome.tabs.sendMessage(tabs[0].id!, { source: MessageType.PASTE_RLHF_ANSWERS, answers: parsedAnswers, turn: turn, folderLinks: folderLinks }, async (_: string) => {
      // alert(_)
    })
  })
}

async function compareTurn() {
  compareTurnBtn.disabled = true
  const answers = await getModelAnswers()
  if (answers) {
    const review = await compareModelAnswers(answers, codeOutput.value, languageDropdown.value)
    copyToClipboardBtn.setAttribute('data-code', JSON.stringify(review))
    copyToClipboardBtn.disabled = false
    fillAnswersOnDom(review)
  }
  compareTurnBtn.disabled = false
}

async function reEvaluateTurn() {
  reEvaluateTurnBtn.disabled = true
  const answers = await getModelAnswers()
  if (answers) {
    const review = await reEvaluateModelAnswers(answers, codeOutput.value, comparisonResponse.value, requestedChanges.value)
    copyToClipboardBtn.setAttribute('data-code', JSON.stringify(review))
    copyToClipboardBtn.disabled = false
    fillAnswersOnDom(review)
  }
  reEvaluateTurnBtn.disabled = false
}

async function generateTurnTestCode() {
  generateTestCodeBtn.disabled = true
  const model = generateTestCodeDropdown.value as "model_a" | "model_b"
  const answers = await getModelAnswers()
  if (answers) {
    const response = await generateTestCode(answers.prompt, answers[model])
    copyTestCodeBtn.setAttribute('data-code', response)
    copyTestCodeBtn.disabled = false
  }
  generateTestCodeBtn.disabled = false
}

async function createFolders() {
  const taskId = taskIdParagraph.textContent
  if (!taskId) { return; }

  foldersBtn.disabled = true
  const response = await createFoldersOnDrive(taskId)
  foldersBtn.disabled = false
  foldersBtn.textContent = 'Upload screenshots'
  foldersBtn.removeEventListener('click', createFolders)
  foldersBtn.addEventListener('click', uploadScreenshots)

  const keys: ("model_a" | "model_b")[] = ["model_a", "model_b"]
  keys.forEach((key, _) => {
    const a = document.createElement('a')
    a.href = response[key]
    a.textContent = '📁 ' + key.toUpperCase().replace('_', ' ')
    a.target = '_blank'
    createFoldersSection.lastElementChild!.appendChild(a)
  })

  turnsScreenshots.classList.remove('hidden')
  turnsScreenshots.addEventListener('paste', (event: ClipboardEvent) => {
    const items = event.clipboardData?.items
    if (!items) { return; }
    for (const item of items) {
      if (item.kind === 'file') {
        const file = item.getAsFile()

        const reader = new FileReader();

        reader.onloadend = (e) => {
          const url = e.target?.result as string
          const turn = prompt("Turn number", turnDropdown.value)
          const model = prompt("Model name(a/b/ideal)")
          if (!turn || !model) { return; }
          const col = document.createElement('div')
          col.classList.add('col')
          const img: HTMLImageElement = document.createElement('img')
          img.src = url
          img.setAttribute('data-turn', turn)
          img.setAttribute('data-model', model)
          col.appendChild(img)
          const p = document.createElement('p')
          p.textContent = `Turn ${turn} - Model ${model.toUpperCase()}`
          col.appendChild(p)
          const images = Array.from(turnsScreenshots.lastElementChild!.querySelectorAll('img'))
          const index = images.findIndex(img => {
            const aTurn = parseInt(img.getAttribute('data-turn')!)
            const bTurn = parseInt(turn)
            const aModel = img.getAttribute('data-model')!
            const bModel = model
            return aTurn > bTurn || (aTurn === bTurn && aModel > bModel)
          })
          turnsScreenshots.lastElementChild!.insertBefore(col, images[index]?.parentElement)
          img.addEventListener('click', () => {
            const currentSuffix = img.getAttribute('data-suffix')
            if (currentSuffix) {
              p.textContent = p.textContent!.replace(` (${currentSuffix})`, '')
            }
            const suffix = prompt("Suffix", currentSuffix ?? undefined)
            if (suffix) {
              img.setAttribute('data-suffix', suffix)
              p.textContent += ` (${suffix})`
            }
          })
        };
        reader.readAsDataURL(file!);
      }
    }
  });
}

async function uploadScreenshots() {
  const taskId = taskIdParagraph.textContent
  if (!taskId) { return; }
  foldersBtn.disabled = true
  const images = Array.from(turnsScreenshots.lastElementChild!.querySelectorAll('img')).map(img => ({
    turn: img.getAttribute('data-turn')!,
    model: img.getAttribute('data-model')!,
    image: img.src,
    suffix: img.getAttribute('data-suffix')
  }))
  const response = await uploadScreenshotsOnDrive(taskId, images)
  console.log(response)
  foldersBtn.disabled = false
  turnsScreenshots.lastElementChild!.innerHTML = ''
}

/*
TODOs:
- [x] Fix column layout
- [x] Add loading to button
- [x] Clear all elements on new turn
- [ ] Use session/local storage to store the code output
- [x] Send data as json
- [x] Build json on server side
- [x] Check if there is code to show no code buttons or links
- [x] Add a button to copy the json response to the clipboard
- [ ] Deal with errors on responses (backend)
*/