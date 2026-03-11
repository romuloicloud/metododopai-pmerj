import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: "AIzaSyCwCDMIvguR8_-ZLANWNWhPUthUK-kjScU" });

async function test() {
    try {
        console.log("Testing API Key...");
        const res = await ai.models.generateContent({
            model: "gemini-2.0-flash",
            contents: "Say hello - this is a test"
        });
        console.log("SUCCESS:", res.text);
    } catch (e) {
        console.error("ERROR:", e);
        if (e.status) console.error("Status:", e.status);
        if (e.message) console.error("Message:", e.message);
    }
}

test();
