import { GoogleGenAI } from '@google/genai';

const apiKey = 'AIzaSyB8B50gF5834SiDx7Cqj1Z-evCS1LweCC0';
console.log('Testing Key:', apiKey.substring(0, 5) + '...');

const ai = new GoogleGenAI({ apiKey: apiKey });
ai.models.generateContent({ model: 'gemini-2.0-flash', contents: 'Diga oi' })
    .then(res => console.log('Gemini OK:', res.text))
    .catch(err => console.error('Gemini Error:', err.message));
