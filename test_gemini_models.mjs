import { GoogleGenAI } from '@google/genai';

const apiKey = 'AIzaSyB8B50gF5834SiDx7Cqj1Z-evCS1LweCC0';
console.log('Testing Key:', apiKey.substring(0, 5) + '...');

const ai = new GoogleGenAI({ apiKey: apiKey });

async function testModel(modelName) {
    try {
        const res = await ai.models.generateContent({ model: modelName, contents: 'Diga oi' });
        console.log(`Model ${modelName} OK:`, res.text);
    } catch (err) {
        console.error(`Model ${modelName} Error:`, err.message);
    }
}

async function run() {
    await testModel('gemini-2.5-flash');
    await testModel('gemini-1.5-flash');
}

run();
