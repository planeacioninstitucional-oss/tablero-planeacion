import { GoogleGenerativeAI } from '@google/generative-ai';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    try {
        const { prompt } = req.body;
        if (!prompt) {
            return res.status(400).json({ error: 'Prompt is required' });
        }

        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
        const model = genAI.getGenerativeModel({
            model: "gemini-2.5-flash",
            systemInstruction: "Eres Oracle, un asistente de inteligencia artificial exclusivo para la Oficina de Planeación. Ayudas a estructurar informes, generar ideas, mejorar procesos y responder preguntas sobre gestión pública. Eres profesional, claro y muy útil."
        });

        const result = await model.generateContent(prompt);
        const text = result.response.text();

        return res.status(200).json({ text });
    } catch (error) {
        console.error('Gemini error:', error);
        return res.status(500).json({ error: 'Failed to generate response', details: error.message });
    }
}
