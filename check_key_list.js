const { GoogleGenAI } = require("@google/genai");

async function check() {
    const apiKey = "AIzaSyB8B50gF5834SiDx7Cqj1Z-evCS1LweCC0";
    const ai = new GoogleGenAI({ apiKey });

    try {
        const list = await ai.models.list();
        for await (const model of list) {
            console.log(model.name);
        }
    } catch (err) {
        console.error("API Key error:", err.message);
    }
}

check();
