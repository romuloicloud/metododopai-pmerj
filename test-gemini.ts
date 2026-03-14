import { GoogleGenAI, Type } from "@google/genai";
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const ai = new GoogleGenAI({ apiKey: process.env.VITE_GEMINI_API_KEY });

async function test() {
    const topic = 'Direitos Humanos na Constituição Federal de 1988';
    const isDeepDive = false;
    let prompt = `Generate a micro-lesson for the topic: "${topic}". 
        The content must have:
        1. "topic": the topic name.
        2. "explanation": A theory explanation of max 300 words, clear and objective for an adult studying for PMERJ.
        3. "exercises": Exactly 4 multiple-choice questions (MCQs) with progressive difficulty. Each with 4 options, the correctOptionIndex (0-3), and a detailed explanation.`;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                systemInstruction: 'Act as: Police Exam Tutor. Level: Adult (Concurso PMERJ). Output: STRICT JSON. No filler text, just the raw JSON object.',
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
                temperature: 0.2
            }
        });

        console.log("Raw Response:");
        console.log(response.text);
    } catch (e) {
        console.error("Error:", e);
    }
}

test();
