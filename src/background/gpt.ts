import { GPTResponse } from "../models.js"
import { convertToNaturalLanguage } from "./utils.js"

const _host = "http://localhost:3000"

async function answerPrompt(prompt: string): Promise<GPTResponse> {
    let response = await fetch(`${_host}/gpt/solve`, {
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

async function translateToPython(code: string): Promise<string> {
    let response = await fetch(`${_host}/gpt/translate`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ code }),
    })
    const responseBody = await response.json()
    return responseBody.code
}

export { answerPrompt, translateToPython }