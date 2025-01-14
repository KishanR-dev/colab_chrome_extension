import { GPTResponse, Turn } from "../models.js"
import { convertToNaturalLanguage } from "./utils.js"

const _host = "http://localhost:3000"
// const _host = "https://d0a1-188-247-159-42.ngrok-free.app"

// Static Colab Analyzer
async function answerPrompt(prompt: string): Promise<GPTResponse> {
    let response = await fetch(`${_host}/llm/translation/solve`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ prompt }),
    })
    const responseData = await response.json()
    console.log(responseData);
    let gptResponse: GPTResponse = responseData
    let examplesText = ""
    for (const [index, example] of gptResponse.examples.entries()) {
        examplesText += `**Example ${index + 1}:**\n- Input:\n`
        example.input.forEach((i) => {
            examplesText += `   - ${convertToNaturalLanguage(i.var_name)}: ${i.value}\n`
        })
        examplesText += `- Output: ${example.output}\n- Explanation: ${example.explanation}\n\n`
    }
    gptResponse.examplesText = examplesText
    return gptResponse
}

async function rewriteSolution(text: string): Promise<string> {
    text = text.replace("Assistant\n\n", "").replace("Solution\n\n", "")
    let response = await fetch(`${_host}/llm/translation/rewrite`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ text }),
    })
    const responseBody = await response.json()
    return responseBody.text
}

async function translateToPython(code: string): Promise<string> {
    let response = await fetch(`${_host}/llm/translation/translate`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ code }),
    })
    const responseBody = await response.json()
    return responseBody.code
}

// RLHF helper
async function generateRLHFConversation(prompt: string, language: string): Promise<Turn[]> {
    let response = await fetch(`${_host}/llm/comparison/generate-turns`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ prompt, language }),
    })
    const responseBody = await response.json()
    return responseBody
}

async function compareModelAnswers(answers: Record<string, any>, codeOutput: string | null, language: string): Promise<string> {
    let response = await fetch(`${_host}/llm/comparison/compare`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ ...answers, output: codeOutput, language }),
    })
    const responseBody = await response.json()
    return responseBody
}

async function reEvaluateModelAnswers(answers: Record<string, any>, codeOutput: string, comparisonResponse: string, requestedChanges: string): Promise<string> {
    let response = await fetch(`${_host}/llm/comparison/reevaluate`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ ...answers, output: codeOutput, comparisonResponse, requestedChanges }),
    })
    const responseBody = await response.json()
    return responseBody
}

async function createFoldersOnDrive(taskId: string): Promise<{ model_a: string, model_b: string, created: boolean }> {
    let response = await fetch(`${_host}/gdrive/create-folders?task_id=${taskId}`, {
        method: "POST"
    })
    const responseBody = await response.json()
    return responseBody
}

async function generateTestCode(prompt: string, answer: string): Promise<string> {
    let response = await fetch(`${_host}/llm/comparison/generate-test-code`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ prompt, answer }),
    })
    const responseBody = await response.json()
    return responseBody
}

async function uploadScreenshotsOnDrive(taskId: string, images: { turn: string, model: string, image: string, suffix: string | null }[]): Promise<{ model_a: string, model_b: string, created: boolean }> {
    let response = await fetch(`${_host}/gdrive/upload-screenshots`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ task_id: taskId, images }),
    })
    const responseBody = await response.json()
    return responseBody
}

export {
    answerPrompt,
    compareModelAnswers,
    createFoldersOnDrive,
    generateRLHFConversation,
    generateTestCode,
    reEvaluateModelAnswers,
    rewriteSolution,
    translateToPython,
    uploadScreenshotsOnDrive
}
