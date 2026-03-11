const { GoogleGenAI } = require("@google/genai");

async function check() {
  const apiKey = "AIzaSyB8B50gF5834SiDx7Cqj1Z-evCS1LweCC0";
  const ai = new GoogleGenAI({ apiKey });

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-1.5-flash',
      contents: 'Respond with "OK" if this works.',
    });
    console.log("API Key is working! Response:", response.text);
  } catch (err) {
    console.error("API Key error:", err.message);
  }
}

check();
