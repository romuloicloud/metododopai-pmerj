import { config } from 'dotenv';
import { GoogleGenAI } from '@google/genai';

config({ path: '.env.local' });
console.log('Key:', process.env.VITE_GEMINI_API_KEY ? 'Present' : 'Missing');
console.log('Key Starts with:', process.env.VITE_GEMINI_API_KEY?.substring(0, 5));

const ai = new GoogleGenAI({ apiKey: process.env.VITE_GEMINI_API_KEY });
ai.models.generateContent({ model: 'gemini-2.0-flash', contents: 'Diga oi' })
    .then(res => console.log('Gemini OK:', res.text))
    .catch(err => console.error('Gemini Error:', err.message));
