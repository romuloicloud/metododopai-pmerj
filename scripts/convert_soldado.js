const fs = require('fs');
const path = require('path');

const inputPath = path.join(__dirname, '../soldado_2023_parsed.json');
const outputPath = path.join(__dirname, '../services/data_soldado_2023.ts');

try {
    const data = JSON.parse(fs.readFileSync(inputPath, 'utf8'));

    const mappedQuestions = data.map(q => {
        const optionKeys = Object.keys(q.alternativas);
        const optionsArray = optionKeys.map(k => q.alternativas[k]);
        const correctIndex = optionKeys.indexOf(q.gabarito_sugerido);

        return {
            id: `sd-2023-${q.numero_original}`,
            topic: q.topico,
            subject: q.materia,
            text: q.enunciado,
            baseText: q.texto_base ? q.texto_base : undefined,
            options: optionsArray,
            correctOptionIndex: correctIndex
        };
    });

    const fileContent = `import { Question } from '../types';\n\nexport const soldado2023Questions: Question[] = ${JSON.stringify(mappedQuestions, null, 4).replace(/"(subject)": "(.*?)"/g, '$1: "$2" as const')};\n`;

    fs.writeFileSync(outputPath, fileContent, 'utf8');
    console.log("TS file generated successfully at", outputPath);

} catch (err) {
    console.error("Error converting:", err);
}
