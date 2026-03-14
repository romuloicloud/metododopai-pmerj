import { GoogleGenAI } from '@google/genai';

const apiKey = 'AIzaSyBy2B38Y7zkpoIQmHTunyYL99CNkNRjCAc';
const ai = new GoogleGenAI({ apiKey });

async function runTest() {
    try {
        console.log("Chamando Gemini API...");
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: 'Diga a palavra "Sucesso".'
        });
        console.log("Resposta: ", response.text);
    } catch (error) {
        console.error("ERRO DA API:", error);
    }
}

runTest();
