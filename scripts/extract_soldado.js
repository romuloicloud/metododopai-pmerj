const { GoogleGenAI } = require('@google/genai');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

const GEMINI_API_KEY = process.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY;

if (!GEMINI_API_KEY) {
    console.error("❌ Erro: VITE_GEMINI_API_KEY não encontrada");
    process.exit(1);
}

const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
const PDF_PATH = path.join(__dirname, 'prova_soldado.pdf');

async function extractQuestions() {
    console.log("📥 Lendo PDF local: prova_soldado.pdf...");

    if (!fs.existsSync(PDF_PATH)) {
        console.error("❌ Arquivo não encontrado:", PDF_PATH);
        return;
    }

    const pdfBuffer = fs.readFileSync(PDF_PATH);
    const pdfBase64 = Buffer.from(pdfBuffer).toString('base64');

    console.log(`✅ PDF lido (${(pdfBuffer.byteLength / 1024).toFixed(0)} KB)`);
    console.log("🧠 Enviando para Gemini extrair questões...");

    const prompt = `
    Você é um especialista em provas da PMERJ (Polícia Militar do Estado do Rio de Janeiro).
    Analise este PDF da Prova de Soldado da PMERJ (IBADE 2023) e extraia TODAS as 50 questões.
    
    Para CADA questão, retorne no formato JSON abaixo:
    {
        "numero_original": 1,
        "materia": "Língua Portuguesa",
        "topico": "Interpretação de Texto",
        "texto_base": "O sol que entra pelas janelas...",
        "enunciado": "O tema apresentado pelo texto é:",
        "alternativas": {
            "A": "o hábito de leitura e escrita de presidiárias.",
            "B": "a biografia de mulheres negras importantes.",
            "C": "o quotidiano do presídio talavera bruce.",
            "D": "um projeto de leitura desenvolvido em presídios.",
            "E": "uma reflexão sobre a maldade do ser humano."
        },
        "gabarito_sugerido": "D"
    }

    REGRAS:
    1. A prova tem 50 questões no total. Extraia as 50.
    2. A propriedade 'materia' deve seguir exatamente um destes nomes: 'Língua Portuguesa', 'Matemática Básica', 'Direitos Humanos', 'Legislação Aplicada à PMERJ'. Para matérias de Direito como Penal, adeque a Legislação.
    3. Retorne APENAS o array JSON \`[ {...}, {...} ]\`.
    `;

    try {
        const result = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: [
                {
                    role: 'user',
                    parts: [
                        { inlineData: { mimeType: 'application/pdf', data: pdfBase64 } },
                        { text: prompt }
                    ]
                }
            ],
            config: {
                responseMimeType: 'application/json'
            }
        });

        const text = result.text;
        const questions = JSON.parse(text);

        const outputPath = path.join(__dirname, '..', 'soldado_2023_parsed.json');
        fs.writeFileSync(outputPath, JSON.stringify(questions, null, 4), 'utf-8');

        console.log(`\n🎉 Sucesso! ${questions.length} questões extraídas!`);
        console.log(`📄 Salvo em: ${outputPath}`);

    } catch (error) {
        console.error("❌ Erro na extração:", error);
    }
}

extractQuestions();
