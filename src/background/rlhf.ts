function extractAnswersFromText(text: string) {
    let lines = text.replaceAll("\t", "").split("\n")
    let answer: Record<string, any> = {}
    let model: string | null = null
    const finalComparisonRegex = /Model [AB] is [a-z ]+ than Model [AB]/
    for (let i = 0; i < lines.length; i++) {
        let line = lines[i]
        if (line.length == 0) { continue; }
        if (line.includes("Evaluation of") || line.match(/^Model [A-B][a-zA-Z: ']{0,30}$/)) {
            model = line.includes("Evaluation of") ? line.split(":")[0].split(" ")[3].toLowerCase() : line.split(" Ev")[0]
            answer[model] = {}
        } else if (line.includes("Final Preference") || line.includes("Final Comparison") || (line.includes("Preference") && line.match(finalComparisonRegex))) {
            model = "comparison"
            answer[model] = { "score": line.split(": ")[1], "comment": "" }
        } else if (model == "comparison" && line.match(finalComparisonRegex)) {
            answer[model] = { "score": line, "comment": "" }
        } else if (model == "comparison" && !line.includes("Preference Explanation")) {
            answer[model]["comment"] += answer[model]["comment"] == "" ? line : `\n${line}`
        } else {
            let keyLine = line
            if (!line.includes("•") && !line.includes(":")) {
                let j = 1
                while (i - j >= 0 && !keyLine.includes(":")) {
                    keyLine = lines[i - j]
                    j++
                }
            }
            const key = keyLine.split(":")[0].toLowerCase().replaceAll(" ", "_")
            const values = line.split(": ")[1]
            if (values != undefined && values.includes(". ") && answer[model!][key] == undefined) {
                answer[model!][key] = { "score": values[0], "comment": values[1].split(". ")[0] }
            } else {
                if (model == null && (i == 0 || line.startsWith("Instruction "))) {
                    model = "model_a_infered"
                    answer[model] = {}
                } else if (model == "model_a_infered" && line.startsWith("Instruction ") && Object.keys(answer[model]).length > 0) {
                    model = "model_b_infered"
                    answer[model] = {}
                }
                if (model != null) {
                    if (answer[model][key] == undefined) {
                        answer[model][key] = { "score": values, "comment": "" }
                    } else {
                        answer[model][key]["comment"] += answer[model][key]["comment"] == "" ? line : `\n${line}`
                    }
                }
            }
        }
    }
    answer["comparison"]["comment"] = answer["comparison"]["comment"].trim()
    console.log(answer)
    return answer
}

export { extractAnswersFromText }