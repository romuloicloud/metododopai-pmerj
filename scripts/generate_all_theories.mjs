import { GoogleGenAI, Type } from "@google/genai";
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Convert import.meta.url to a path for __dirname equivalent
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env vars
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const geminiKey = process.env.VITE_GEMINI_API_KEY;

if (!supabaseUrl || !supabaseKey || !geminiKey) {
    console.error("Missing environment variables. Check .env.local");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);
const ai = new GoogleGenAI({ apiKey: geminiKey });

// Import syllabus directly or define it here if we can't import TS easily in a JS script
const syllabus = {
    'Língua Portuguesa': [
        'Compreensão e interpretação de textos',
        'Tipologia textual',
        'Ortografia oficial',
        'Acentuação gráfica',
        'Classes de palavras',
        'Sintaxe da oração e do período',
        'Pontuação',
        'Concordância nominal e verbal',
        'Regência nominal e verbal',
        'Significação das palavras'
    ],
    'Matemática Básica': [
        'Números inteiros, racionais e reais',
        'Sistema legal de medidas',
        'Razão e proporção',
        'Grandezas diretamente e inversamente proporcionais',
        'Regra de três simples e composta',
        'Porcentagem',
        'Juros simples',
        'Equações do 1º e 2º graus',
        'Sistemas de equações',
        'Geometria plana e espacial',
        'Noções de probabilidade e estatística'
    ],
    'Noções de Direitos Humanos': [
        'Conceito e evolução histórica',
        'Direitos Humanos na Constituição Federal de 1988',
        'Declaração Universal dos Direitos Humanos',
        'Convenção Americana sobre Direitos Humanos (Pacto de San José)'
    ],
    'Noções de Direito Administrativo': [
        'Estado, Governo e Administração Pública',
        'Conceito, fontes e princípios do Direito Administrativo',
        'Organização administrativa da União',
        'Agentes públicos',
        'Poderes da Administração Pública',
        'Atos administrativos',
        'Controle da Administração Pública e responsabilização civil do Estado'
    ],
    'Noções de Direito Penal': [
        'Aplicação da lei penal',
        'O fato típico e seus elementos',
        'Culpabilidade',
        'Concurso de pessoas',
        'Crimes contra a pessoa',
        'Crimes contra o patrimônio',
        'Crimes contra a dignidade sexual',
        'Crimes contra a Administração Pública'
    ],
    'Noções de Direito Penal Militar': [
        'Aplicação da lei penal militar',
        'Crime militar',
        'Penas principais',
        'Crimes contra a autoridade ou disciplina militar',
        'Crimes contra o serviço militar e o dever militar'
    ]
};


const generateAndSaveTheory = async (subject, topic) => {
    console.log(`\n=== Procesing Subject: ${subject} | Topic: ${topic} ===`);

    try {
        // 1. Check if it already exists
        const { data: existingTheory } = await supabase
            .from('teoria')
            .select('id')
            .eq('materia', subject)
            .eq('topico', topic)
            .maybeSingle();

        if (existingTheory) {
            console.log(`Theory for "${topic}" already exists. Skipping.`);
            return;
        }

        console.log(`Drafting theory and questions with Gemini...`);

        // Prompt adjusted to return 4 questions and rich HTML content
        const prompt = `
        Gere uma aula teórica completa e questões para o concurso da PMERJ (Soldado, Nível Médio).
        Matéria: "${subject}"
        Tópico: "${topic}"

        Sua resposta DEVE ser PURAMENTE JSON no formato abaixo. NÃO adicione blocos de markdown no entorno.

        {
           "conteudo_html": "Uma string contendo o HTML rico da aula (use tags como <b>, <p>, <ul>, <li>, <h3>, <blockquote>, <br/>). A aula deve ser direta, ter foco no que a FGV cobra e usar linguagem assertiva para o concurseiro. O conteúdo deve ter entre 300 e 500 palavras.",
           "questoes": [
               {
                   "pergunta": "Texto da pergunta 1",
                   "alternativas": ["1", "2", "3", "4"],
                   "correta": 0,
                   "explicacao": "Explicação detalhada"
               },
               // Gere EXATAMENTE 4 (quatro) questões inéditas de múltipla escolha com dificuldade progressiva.
           ]
        }
        `;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: 'application/json',
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        conteudo_html: { type: Type.STRING },
                        questoes: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    pergunta: { type: Type.STRING },
                                    alternativas: { type: Type.ARRAY, items: { type: Type.STRING } },
                                    correta: { type: Type.INTEGER },
                                    explicacao: { type: Type.STRING }
                                },
                                required: ['pergunta', 'alternativas', 'correta', 'explicacao']
                            }
                        }
                    },
                    required: ['conteudo_html', 'questoes']
                },
                temperature: 0.2
            }
        });

        if (!response.text) {
            throw new Error("Empty response from AI");
        }

        const data = JSON.parse(response.text);

        console.log(`Inserting theory into DB...`);
        // Insert Theory
        const { data: theoryInsert, error: theoryError } = await supabase
            .from('teoria')
            .insert({
                materia: subject,
                topico: topic,
                conteudo_html: data.conteudo_html
            })
            .select()
            .single();

        if (theoryError) throw theoryError;

        console.log(`Inserting ${data.questoes.length} questions into DB...`);
        // Insert Questions
        const questionsToInsert = data.questoes.map(q => ({
            teoria_id: theoryInsert.id,
            pergunta: q.pergunta,
            alternativas: q.alternativas,
            correta: q.correta,
            explicacao: q.explicacao
        }));

        const { error: qtError } = await supabase
            .from('treinamento')
            .insert(questionsToInsert);

        if (qtError) throw qtError;

        console.log(`Successfully completed "${topic}"`);

        // Wait a bit to avoid rate limits
        await new Promise(r => setTimeout(r, 2000));

    } catch (error) {
        console.error(`Failed on "${topic}":`, error.message);
    }
};

const runAll = async () => {
    console.log("Starting full DB population...");
    for (const [subject, topics] of Object.entries(syllabus)) {
        for (const topic of topics) {
            await generateAndSaveTheory(subject, topic);
        }
    }
    console.log("Finished all subjects and topics.");
};

runAll();
