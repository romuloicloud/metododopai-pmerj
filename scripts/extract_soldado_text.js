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
const TEXT_PATH = path.join(__dirname, '../prova_soldado_bruto.txt');

async function extractQuestions() {
    console.log("📥 Lendo texto bruto: prova_soldado_bruto.txt...");

    if (!fs.existsSync(TEXT_PATH)) {
        console.error("❌ Arquivo não encontrado:", TEXT_PATH);
        return;
    }

    const textContent = fs.readFileSync(TEXT_PATH, 'utf-8');

    console.log(`✅ Texto lido (${textContent.length} caracteres)`);
    console.log("🧠 Enviando texto para Gemini extrair questões...");

    const prompt = `
    Você é um especialista em provas da PMERJ (Polícia Militar do Estado do Rio de Janeiro).
    Analise o texto bruto desta Prova de Soldado da PMERJ (IBADE 2023) e extraia TODAS as 50 questões.
    
    Abaixo está o texto bruto da prova extraído do PDF:
    --- INÍCIO DA PROVA ---
    ${textContent}
    --- FIM DA PROVA ---
    
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
    1. A prova tem 50 questões no total (Numeradas de 1 a 50). Extraia todas as 50 do texto providenciado.
    2. A propriedade 'materia' deve seguir rigorosamente os temas do edital: 'Língua Portuguesa', 'Matemática Básica', 'Direitos Humanos', 'Legislação Aplicada à PMERJ' e afins identificados nas listagens da prova.
    3. Retorne APENAS um array JSON formatado corretamente. \`[ {...}, {...} ]\` sem crases ou markdown adicional ao redor se possível, ou o modelo se encarregará na extração da API.
    4. Mantenha os textos originais, não resuma.
    `;

    try {
        const result = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: 'application/json'
            }
        });

        const textOutput = result.text;
        const questions = JSON.parse(textOutput);

        const outputPath = path.join(__dirname, '..', 'soldado_2023_parsed.json');
        fs.writeFileSync(outputPath, JSON.stringify(questions, null, 4), 'utf-8');

        console.log(`\n🎉 Sucesso! ${questions.length} questões extraídas!`);
        console.log(`📄 Salvo em: ${outputPath}`);

    } catch (error) {
        console.error("❌ Erro na extração:", error);
    }
}

extractQuestions();
