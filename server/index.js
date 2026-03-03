require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();
app.use(cors());
app.use(express.json());

// Load Gemini API key
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || 'AIzaSy...'); // Note: User needs to put key in .env
const model = genAI.getGenerativeModel({
    model: "gemini-1.5-pro",
    systemInstruction: "Eres Oracle, un asistente de inteligencia artificial exclusivo para la Oficina de Planeación. Ayudas a estructurar informes, generar ideas, mejorar procesos y responder preguntas sobre gestión pública. Eres profesional, claro y muy útil."
});

app.post('/api/chat', async (req, res) => {
    try {
        const { prompt } = req.body;
        if (!prompt) {
            return res.status(400).json({ error: 'Prompt is required' });
        }

        const result = await model.generateContent(prompt);
        const text = result.response.text();

        res.json({ text });
    } catch (error) {
        console.error('Gemini error:', error);
        res.status(500).json({ error: 'Failed to generate response', details: error.message });
    }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Oracle Gemini server running on port ${PORT}`);
});
