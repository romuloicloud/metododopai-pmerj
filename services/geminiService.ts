import { GoogleGenAI, GenerateContentResponse, Type } from "@google/genai";
import { Question, AiExplanation, TheoryLesson } from '../types';
import { mockQuestions, mockLesson, mockLessonPortugues, mockLessonDireito } from './mockData';
import { supabase } from './supabaseClient';
import { syllabus } from './syllabusData';
import { shuffleOptionsWithCorrectIndex } from '../src/utils/helpers';

// A chave de API é injetada pelo Vite via VITE_GEMINI_API_KEY
// Usamos uma inicialização segura que não crasha o app se a chave estiver ausente
let ai: any;
try {
    const apiKey = import.meta.env?.VITE_GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY;
    if (apiKey) {
        ai = new GoogleGenAI({ apiKey });
        console.log("GoogleGenAI initialized successfully!");
    } else {
        console.warn("API Key is empty during initialization.");
    }
} catch (e) {
    console.warn('GoogleGenAI não inicializado:', e);
}


const editalContentPlaceholder = `
CONTEÚDO PROGRAMÁTICO - PMERJ SOLDADO (FGV)

I - LÍNGUA PORTUGUESA
1. Leitura e interpretação de textos. 2. Ortografia oficial. 3. Acentuação gráfica. 4. Morfologia (Sintaxe e Classes de Palavras). 5. Pontuação. 6. Concordância nominal e verbal. 7. Regência nominal e verbal.

II - MATEMÁTICA BÁSICA
1. Operações com conjuntos numéricos. 2. Razão e proporção. 3. Regra de três simples e composta. 4. Porcentagem. 5. Geometria básica (áreas e volumes). 6. Probabilidade e Estatística básica.

III - DIREITOS HUMANOS
1. Declaração Universal dos Direitos Humanos. 2. Direitos e Garantias Fundamentais na CF/88 (Art. 5º). 3. Pacto de San José da Costa Rica. 4. Tortura e Tratamentos Cruéis.

IV - LEGISLAÇÃO APLICADA À PMERJ
1. Estatuto dos Policiais Militares (Lei 443/81). 2. Lei de Abuso de Autoridade (Lei 13.869/19). 3. Lei Maria da Penha (Lei 11.340/06). 4. Estatuto do Desarmamento (Lei 10.826/03). 5. Hierarquia e Disciplina Militar.
`;

const subtopics = {
    'Língua Portuguesa': [
        'Interpretação de Textos Judiciais e Informativos',
        'Ortografia e Acentuação',
        'Concordância Verbal e Nominal',
        'Sintaxe da Oração e do Período',
        'Pontuação Básica e Avançada',
        'Classes de Palavras e suas Funções'
    ],
    'Matemática Básica': [
        'Razão, Proporção e Regra de Três',
        'Porcentagem e Aplicações no Dia a Dia',
        'Probabilidade e Estatística Básica',
        'Operações com Conjuntos Numéricos',
        'Geometria Básica: Áreas e Volumes'
    ],
    'Direitos Humanos': [
        'Dignidade da Pessoa Humana na CF/88',
        'Pacto de San José da Costa Rica e Policiamento',
        'Declaração Universal dos Direitos Humanos',
        'Combate à Tortura e Abuso de Poder',
        'Direitos e Garantias Fundamentais (Art 5º)'
    ],
    'Legislação Aplicada à PMERJ': [
        'Lei Maria da Penha e Atuação Policial',
        'Estatuto dos Policiais Militares (Deveres e Direitos)',
        'Lei de Abuso de Autoridade (Prevenção)',
        'Estatuto do Desarmamento (Posse e Porte)',
        'Hierarquia e Disciplina na PMERJ'
    ]
};

const difficulties = [
    'Fácil (nível de dificuldade similar à prova de 2017)',
    'Médio (nível de dificuldade similar à prova de 2022)',
    'Desafio (nível de dificuldade similar à prova de FGV inédita)',
];

const portugueseTextTypes = ['uma crônica curta', 'uma notícia breve', 'um poema simples', 'uma tirinha'];


export const getAIExplanation = async (question: Question, incorrectAnswer: string): Promise<AiExplanation | null> => {
    const prompt = `
    Você é um tutor de IA especializado em preparação para Concursos Públicos e Carreiras Policiais, focado na PMERJ. Sua missão é explicar conceitos complexos de forma objetiva, didática e direta para um adulto concurseiro. Use linguagem clara e técnica quando necessário, mantendo o tom encorajador voltado à aprovação na polícia militar.

    ${question.baseText ? `**Texto Base da Questão:**\n---\n${question.baseText}\n---\n` : ''}

    A pergunta era: "${question.text}"
    As opções eram: ${question.options.join(', ')}
    A resposta correta era: "${question.options[question.correctOptionIndex]}"
    O aluno respondeu incorretamente: "${incorrectAnswer}"

    Explique por que a resposta do aluno está errada e por que a resposta correta está certa. Foque em explicar o conceito por trás da resposta correta.
    Sua resposta deve ser *exclusivamente* o objeto JSON puro, sem markdown ou qualquer outro texto.
    `;

    try {
        const response: GenerateContentResponse = await ai.models.generateContent({
            model: 'gemini-1.5-flash',
            contents: prompt,
            config: {
                responseMimeType: 'application/json',
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        attentionDetail: { type: Type.STRING },
                        keyInsight: { type: Type.STRING },
                        analogy: {
                            type: Type.OBJECT,
                            properties: {
                                text: { type: Type.STRING },
                                imageUrl: { type: Type.STRING }
                            }
                        },
                        quickChallenge: {
                            type: Type.OBJECT,
                            properties: {
                                question: { type: Type.STRING },
                                correctAnswer: { type: Type.STRING }
                            }
                        }
                    }
                }
            }
        });

        if (response.text) {
            // A regex original às vezes falha caso a AI insira textos soltos em torno do markdown
            // Forçamos a limpeza global de blocos e extraimos só o que se parece um JSON
            const rawText = response.text;
            const cleanedText = rawText.replace(/```(?:json)?\s*([\s\S]*?)\s*```/g, '$1')
                .replace(/^[\s\S]*?({[\s\S]*})[\s\S]*$/, '$1')
                .trim();

            return JSON.parse(cleanedText) as AiExplanation;
        }
        return null;

    } catch (error: any) {
        console.error("Error fetching AI explanation. Details:", error?.message || error);
        return {
            attentionDetail: "O Método do Pai identificou uma divergência na sua resposta de acordo com a interpretação oficial da banca.",
            keyInsight: "A banca costuma cobrar detalhes específicos e exceções à regra neste tipo de assunto. Fique atento às 'pegadinhas' (palavras como 'sempre', 'nunca', 'exceto').",
            analogy: { text: "No Método do Pai nós treinamos no modo mais difícil para que a prova pareça fácil. Continue focado!", imageUrl: "" },
            quickChallenge: {
                question: "Recapitulando: devemos sempre nos atentar a palavras que generalizam a regra?",
                correctAnswer: "Sim!"
            }
        };
    }
};

export const generateQuestionFromEdital = async (subject: string): Promise<Question | null> => {
    const defaultSubtopics = ['Conceitos Básicos', 'Fundamentos', 'Aplicação Prática'];
    const availableSubtopics = subtopics[subject as keyof typeof subtopics] || defaultSubtopics;
    const randomSubtopic = availableSubtopics[Math.floor(Math.random() * availableSubtopics.length)];
    const randomDifficulty = difficulties[Math.floor(Math.random() * difficulties.length)];

    let portugueseInstruction = "";
    if (subject === 'LÍNGUA PORTUGUESA' && randomSubtopic.toLowerCase().includes('interpretação') || randomSubtopic.toLowerCase().includes('crônica') || randomSubtopic.toLowerCase().includes('notícia') || randomSubtopic.toLowerCase().includes('poema') || randomSubtopic.toLowerCase().includes('tirinhas')) {
        const randomTextType = portugueseTextTypes[Math.floor(Math.random() * portugueseTextTypes.length)];
        portugueseInstruction = `Como o subtópico envolve leitura, é OBRIGATÓRIO que você crie um 'baseText' original no formato de ${randomTextType}. O texto deve ser inédito e ter linguagem adequada para concurseiro prestando PMERJ adulto. A pergunta deve ser sobre este texto.`;
    }

    const prompt = `
    Você é um assistente de criação de conteúdo educacional especialista no concurso da Polícia Militar do Estado do Rio de Janeiro (PMERJ) - FGV. Sua tarefa é criar uma questão de múltipla escolha focada no nível deste concurso de soldado, baseada *estritamente* no conteúdo do edital fornecido.
    Conteúdo do Edital:
    ---
    ${editalContentPlaceholder}
    ---
    Instruções:
    1. Matéria: '${subject}'.
    2. Tópico Específico: '${randomSubtopic}'.
    3. Nível de Dificuldade: '${randomDifficulty}'.
    4. Instrução de Conteúdo: ${portugueseInstruction}
    5. Formato: 4 opções de resposta (A, B, C, D), apenas uma correta.
    6. Saída: Apenas o objeto JSON puro.
    `;

    try {
        const response: GenerateContentResponse = await ai.models.generateContent({
            model: 'gemini-1.5-flash',
            contents: prompt,
            config: {
                responseMimeType: 'application/json',
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        subject: { type: Type.STRING },
                        topic: { type: Type.STRING },
                        baseText: { type: Type.STRING },
                        text: { type: Type.STRING },
                        options: { type: Type.ARRAY, items: { type: Type.STRING } },
                        correctOptionIndex: { type: Type.INTEGER },
                    },
                    required: ['subject', 'topic', 'text', 'options', 'correctOptionIndex']
                },
                seed: Math.floor(Math.random() * 1000000)
            }
        });

        if (response.text) {
            const rawText = response.text;
            const cleanText = rawText.replace(/```(?:json)?\s*([\s\S]*?)\s*```/g, '$1')
                .replace(/^[\s\S]*?({[\s\S]*})[\s\S]*$/, '$1')
                .trim();

            const generatedQuestion = JSON.parse(cleanText) as Omit<Question, 'id'>;
            return { ...generatedQuestion, subject: subject as any, id: `gen-${Date.now()}` };
        }
        throw new Error("Empty response from AI.");

    } catch (error) {
        console.error("Error generating question from edital, returning mock question:", error);
        // Fallback para uma questão padrão em caso de erro.
        const mockQ = mockQuestions[Math.floor(Math.random() * mockQuestions.length)];
        const { shuffledOptions, newCorrectIndex } = shuffleOptionsWithCorrectIndex(mockQ.options, mockQ.correctOptionIndex);
        return {
            ...mockQ,
            options: shuffledOptions,
            correctOptionIndex: newCorrectIndex
        };
    }
};

export const generateTheoryLesson = async (topic: string, isDeepDive: boolean = false, knownSubject?: string): Promise<TheoryLesson> => {
    // Se NÃO FOR aprofundamento, tentamos cache. Se FOR aprofundamento, sempre bate na IA p/ ineditismo.
    if (!isDeepDive) {
        // Estratégia de Cache com Supabase
        const { data: cachedData, error: cacheError } = await supabase
            .from('lessons_cache')
            .select('lesson_data')
            .eq('topic', topic)
            .single();

        if (cacheError && cacheError.code !== 'PGRST116') { // PGRST116: "No rows found"
            console.error('Error fetching from Supabase cache:', cacheError.message);
        }

        if (cachedData) {
            console.log(`Supabase Cache HIT for topic: ${topic}`);
            return cachedData.lesson_data as TheoryLesson;
        }

        console.log(`Supabase Cache MISS for topic: ${topic}. Fetching from API.`);
    } else {
        console.log(`Deep Dive requested for topic: ${topic}. Going straight to AI.`);
    }

    const systemInstruction = 'Act as: Police Exam Tutor. Level: Adult (Concurso PMERJ). Output: STRICT JSON. No filler text, just the raw JSON object.';
    let prompt = "";

    if (isDeepDive) {
        prompt = `Generate a DEEP DIVE micro-lesson for the topic: "${topic}". 
        The student already read the basics and wants a deeper understanding.
        1. "topic": the topic name.
        2. "explanation": A theory explanation of max 300 words, focusing on exceptions, edge cases, and FGV tricks for an adult studying for PMERJ.
        3. "exercises": Exactly 3 multiple-choice questions (MCQs) of 'Desafio' difficulty. Each with 4 options, the correctOptionIndex (0-3), and a detailed explanation.`;
    } else {
        prompt = `Generate a micro-lesson for the topic: "${topic}". 
        The content must have:
        1. "topic": the topic name.
        2. "explanation": A theory explanation of max 300 words, clear and objective for an adult studying for PMERJ.
        3. "exercises": Exactly 4 multiple-choice questions (MCQs) with progressive difficulty. Each with 4 options, the correctOptionIndex (0-3), and a detailed explanation.`;
    }

    try {
        const timeoutPromise = new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error('API Timeout')), 35000) // 35s max
        );

        const response = await Promise.race([
            ai.models.generateContent({
                model: 'gemini-1.5-flash',
                contents: prompt,
                config: {
                    systemInstruction: systemInstruction,
                    responseMimeType: 'application/json',
                    responseSchema: {
                        type: Type.OBJECT,
                        properties: {
                            topic: { type: Type.STRING },
                            explanation: { type: Type.STRING },
                            exercises: {
                                type: Type.ARRAY,
                                items: {
                                    type: Type.OBJECT,
                                    properties: {
                                        question: { type: Type.STRING },
                                        options: { type: Type.ARRAY, items: { type: Type.STRING } },
                                        correctOptionIndex: { type: Type.INTEGER },
                                        explanation: { type: Type.STRING, description: "Detailed explanation of why the correct answer is correct and others are wrong." }
                                    },
                                    required: ['question', 'options', 'correctOptionIndex', 'explanation']
                                }
                            }
                        },
                        required: ['topic', 'explanation', 'exercises']
                    },
                    temperature: isDeepDive ? 0.6 : 0.2 // More creativity for deep dives
                }
            }),
            timeoutPromise
        ]) as GenerateContentResponse;

        if (!response.text) {
            throw new Error("Empty response from AI.");
        }

        const rawText = response.text;
        const cleanText = rawText.replace(/~~~\s*([\s\S]*?)\s*~~~/g, '$1').replace(/```(?:json)?\s*([\s\S]*?)\s*```/g, '$1')
            .replace(/^[\s\S]*?({[\s\S]*})[\s\S]*$/, '$1')
            .trim();
        const lessonData = JSON.parse(cleanText) as TheoryLesson;

        // Só salva no cache se não for aprofundamento (aprofundamento é gerado on-fly com variação de temperatura)
        if (!isDeepDive) {
            const { error: upsertError } = await supabase
                .from('lessons_cache')
                .upsert({ topic: topic, lesson_data: lessonData });

            if (upsertError) {
                console.error('Error saving lesson to Supabase cache:', upsertError.message);
            }
        }

        return lessonData;

    } catch (error) {
        console.error(`Error generating theory lesson for topic "${topic}", returning mock lesson:`, error);

        // Intelligent Fallback: Check which subject the topic belongs to
        let subject: keyof typeof syllabus | 'Unknown' = 'Unknown';

        if (knownSubject) {
            subject = knownSubject as keyof typeof syllabus;
        } else {
            for (const subj in syllabus) {
                if (syllabus[subj as keyof typeof syllabus].includes(topic)) {
                    subject = subj as keyof typeof syllabus;
                    break;
                }
            }
        }

        if (subject === 'Língua Portuguesa' || (knownSubject && knownSubject.includes('Portugu'))) {
            console.log("Serving Portuguese fallback lesson.");
            return {
                ...mockLessonPortugues,
                topic: topic
            };
        } else if (subject === 'Direitos Humanos' || subject === 'Legislação Aplicada à PMERJ' || (knownSubject && (knownSubject.includes('Humanos') || knownSubject.includes('Legisla')))) {
            console.log("Serving Law/Human Rights fallback lesson.");
            return {
                ...mockLessonDireito,
                topic: topic
            };
        } else {
            console.log("Serving generic fallback lesson.");
            return {
                ...mockLesson,
                topic: topic
            };
        }
    }
};

export const validateExamAnswer = async (question: Question, incorrectAnswer: string): Promise<AiExplanation | null> => {
    const prompt = `
    Você é um tutor de IA especialista no concurso da PMERJ (Polícia Militar do Rio de Janeiro). Sua missão é fornecer explicações claras e detalhadas para questões de provas anteriores, ajudando um concurseiro adulto a entender não apenas o porquê errou, mas como o conteúdo é cobrado pela banca (ex: FGV).

    ${question.baseText ? `**Texto Base da Questão:**\n---\n${question.baseText}\n---\n` : ''}

    **Análise da Questão:**
    **Tópico da Questão:** ${question.topic}
    **Questão da Prova:** "${question.text}"
    **Opções:** ${question.options.join('; ')}
    **Resposta Correta:** "${question.options[question.correctOptionIndex]}"
    **Resposta do Aluno (Incorreta):** "${incorrectAnswer}"

    **Sua Tarefa (Retorne em formato JSON):**

    1.  **attentionDetail:** Explique de forma simples e direta por que a resposta do aluno está incorreta. Foque no raciocínio errado que ele pode ter tido.
    2.  **keyInsight:** Com base no tópico "${question.topic}", explique o conceito teórico chave que a questão está avaliando e como a banca usou a questão para testar esse conhecimento.
    3.  **analogy.text:** Mostre o passo a passo ou o raciocínio correto para chegar à resposta certa.
    Sua resposta deve ser *exclusivamente* o objeto JSON puro, sem markdown ou qualquer outro texto.
    `;

    try {
        const response: GenerateContentResponse = await ai.models.generateContent({
            model: 'gemini-1.5-flash',
            contents: prompt,
            config: {
                responseMimeType: 'application/json',
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        attentionDetail: { type: Type.STRING },
                        keyInsight: { type: Type.STRING },
                        analogy: {
                            type: Type.OBJECT,
                            properties: {
                                text: { type: Type.STRING },
                                imageUrl: { type: Type.STRING }
                            },
                            required: ['text']
                        },
                    },
                    required: ['attentionDetail', 'keyInsight', 'analogy']
                }
            }
        });

        if (response.text) {
            // Gemini might return an object without the optional fields, so we ensure they exist.
            const rawText = response.text;
            const cleanText = rawText.replace(/```(?:json)?\s*([\s\S]*?)\s*```/g, '$1')
                .replace(/^[\s\S]*?({[\s\S]*})[\s\S]*$/, '$1')
                .trim();

            const parsed = JSON.parse(cleanText);
            return {
                ...parsed,
                quickChallenge: parsed.quickChallenge || null,
                analogy: {
                    imageUrl: parsed.analogy?.imageUrl || '',
                    ...parsed.analogy
                }
            } as AiExplanation;
        }
        return null;

    } catch (error: any) {
        console.error("Error validating exam answer:", error?.message || error);
        return getAIExplanation(question, incorrectAnswer); // Fallback to the generic explanation
    }
};

export const generateReinforcementQuestions = async (subject: string, topic: string): Promise<Question[] | null> => {
    const prompt = `
    Você é um tutor de IA especializado no concurso da Polícia Militar do Estado do Rio de Janeiro (PMERJ) - FGV.
    O aluno errou uma questão ou solicitou um Treino de Reforço no seguinte tópico:
    
    Matéria: ${subject}
    Tópico: ${topic}
    
    Sua missão é gerar exatamente 3 (três) questões de múltipla escolha INÉDITAS focadas neste tópico, no nível de dificuldade da banca FGV para soldados.
    
    Regras:
    1. Se for compreensão de texto de Língua Portuguesa, crie um pequeno texto base ('baseText') comum para as 3 questões ou um para cada.
    2. Cada questão deve ter 4 alternativas (A, B, C, D).
    3. Apenas uma alternativa correta por questão.
    4. Forneça o índice da alternativa correta (0 para A, 1 para B, etc).
    
    Sua resposta deve ser *exclusivamente* o objeto JSON puro, seguindo exatamente este array:
    `;

    try {
        const timeoutPromise = new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error('API Timeout')), 30000)
        );

        const response = await Promise.race([
            ai.models.generateContent({
                model: 'gemini-1.5-flash',
                contents: prompt,
                config: {
                    responseMimeType: 'application/json',
                    responseSchema: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                subject: { type: Type.STRING },
                                topic: { type: Type.STRING },
                                baseText: { type: Type.STRING },
                                text: { type: Type.STRING },
                                options: { type: Type.ARRAY, items: { type: Type.STRING } },
                                correctOptionIndex: { type: Type.INTEGER },
                            },
                            required: ['subject', 'topic', 'text', 'options', 'correctOptionIndex']
                        }
                    }
                }
            }),
            timeoutPromise
        ]) as GenerateContentResponse;

        if (response.text) {
            const rawText = response.text;
            // Tentamos limpar marcações (```json ... ``` e possivelmente [ ... ] no começo)
            const cleanText = rawText.replace(/```(?:json)?\s*([\s\S]*?)\s*```/g, '$1')
                .trim();
            // Para consertar marcações como [ {..} ] soltos no final, forçamos um substring
            let extractStr = cleanText;
            const openBracket = cleanText.indexOf('[');
            const openBrace = cleanText.indexOf('{');
            if (openBracket !== -1 && (openBrace === -1 || openBracket < openBrace)) {
                const closeBracket = cleanText.lastIndexOf(']');
                if (closeBracket !== -1) extractStr = cleanText.substring(openBracket, closeBracket + 1);
            } else if (openBrace !== -1) {
                const closeBrace = cleanText.lastIndexOf('}');
                if (closeBrace !== -1) extractStr = cleanText.substring(openBrace, closeBrace + 1);
            }

            const parsed = JSON.parse(extractStr);
            let generatedQuestions: Omit<Question, 'id'>[] = [];

            if (Array.isArray(parsed)) {
                generatedQuestions = parsed;
            } else if (parsed && typeof parsed === 'object') {
                // Muito comum a IA enviar { "questions": [...] } ignorando a regra do root array
                if (Array.isArray(parsed.questions)) {
                    generatedQuestions = parsed.questions;
                } else if (Array.isArray(parsed.questoes)) {
                    generatedQuestions = parsed.questoes;
                } else {
                    throw new Error("Invalid object format from AI without array property.");
                }
            } else {
                throw new Error("Invalid JSON type from AI, expected Object or Array.");
            }

            return generatedQuestions.map(q => ({
                ...q,
                id: `gen-reinforce-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`
            }));
        }
        throw new Error("Empty response from AI");

    } catch (error) {
        console.error("Error generating reinforcement questions, using fallback:", error);
        // Fallback: retornar questoes mock de acordo  com a disciplina para nao travar a tela
        const safeSubject = subject || 'Matemática Básica';
        if (safeSubject.toLowerCase().includes('portugu')) {
            return mockLessonPortugues.exercises.map((e, index) => {
                const { shuffledOptions, newCorrectIndex } = shuffleOptionsWithCorrectIndex(e.options, e.correctOptionIndex);
                return {
                    id: `mock-pt-${index}`,
                    subject: 'Língua Portuguesa',
                    topic: topic || 'Geral',
                    text: e.question,
                    options: shuffledOptions,
                    correctOptionIndex: newCorrectIndex
                };
            });
        } else {
            return mockLesson.exercises.map((e, index) => {
                const { shuffledOptions, newCorrectIndex } = shuffleOptionsWithCorrectIndex(e.options, e.correctOptionIndex);
                return {
                    id: `mock-mat-${index}`,
                    subject: 'Matemática Básica',
                    topic: topic || 'Geral',
                    text: e.question,
                    options: shuffledOptions,
                    correctOptionIndex: newCorrectIndex
                };
            });
        }
    }
};