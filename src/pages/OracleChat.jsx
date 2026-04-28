import { useState, useRef, useEffect } from 'react';
import { useApp } from '../context';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY || '');
const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
    systemInstruction: "Eres Oracle, un asistente de inteligencia artificial exclusivo para la Oficina de Planeación. Ayudas a estructurar informes, generar ideas, mejorar procesos y responder preguntas sobre gestión pública. Eres profesional, claro y muy útil."
});

const SUGGESTED_PROMPTS = [
    '¿Cómo puedo mejorar la eficiencia de los comités semanales?',
    'Dame ideas para digitalizar procesos en la oficina de planeación',
    '¿Cómo redactar un buen informe de gestión mensual?',
    'Estrategias para cumplir metas del Plan de Acción Municipal',
    '¿Cómo priorizar actividades cuando todo es urgente?',
    'Ideas innovadoras para presentar informes de manera visual',
];


export default function OracleChat() {
    const { user } = useApp();
    const [messages, setMessages] = useState([
        {
            id: 1, role: 'ai',
            text: `¡Hola, ${user?.nombre || 'equipo'}! 👋 Soy **Oracle**, tu asistente de inteligencia artificial para la Oficina de Planeación.\n\nEstoy aquí para ayudarte a generar ideas, estructurar informes, mejorar procesos y responder preguntas sobre gestión pública. ¿En qué te puedo ayudar hoy?`
        }
    ]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const bottomRef = useRef(null);

    useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

    const handleSendMessage = async (text) => {
        if (!text.trim() || loading) return;
        const userMsg = { id: Date.now(), role: 'user', text: text.trim() };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setLoading(true);

        try {
            const result = await model.generateContent(text.trim());
            const aiText = result.response.text();

            setMessages(prev => [...prev, { id: Date.now() + 1, role: 'ai', text: aiText }]);
        } catch (error) {
            console.error('Error calling Gemini:', error);
            setMessages(prev => [...prev, { id: Date.now() + 1, role: 'ai', text: 'Hubo un error al generar la respuesta. Por favor intenta de nuevo.' }]);
        } finally {
            setLoading(false);
        }
    };

    const handleKey = (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(input); } };

    const formatMsg = (text) => {
        return text.split('\n').map((line, i) => {
            const bold = line.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
            return <div key={i} style={{ marginBottom: line === '' ? 6 : 0 }} dangerouslySetInnerHTML={{ __html: bold || '&nbsp;' }} />;
        });
    };

    return (
        <div className="page-container" style={{ paddingBottom: 0 }}>
            <div className="page-header">
                <div className="page-title">Oracle Chat 🔮</div>
                <div className="page-subtitle">Asistente IA para la Oficina de Planeación · Genera ideas, informes y estrategias</div>
            </div>

            <div className="chat-layout">
                {/* SIDEBAR */}
                <div className="chat-sidebar">
                    <div className="chat-sidebar-header">💡 Preguntas sugeridas</div>
                    {SUGGESTED_PROMPTS.map((p, i) => (
                        <button key={i} className="prompt-chip" onClick={() => handleSendMessage(p)}>{p}</button>
                    ))}
                    <div style={{ marginTop: 'auto', padding: '12px 4px', fontSize: '0.72rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                        Oracle puede cometer errores. Verifica información importante con fuentes oficiales.
                    </div>
                </div>

                {/* CHAT MAIN */}
                <div className="chat-main">
                    <div className="chat-header">
                        <div className="oracle-dot" />
                        <div>
                            <div className="oracle-name">Oracle AI</div>
                            <div className="oracle-status">Online · Asistente de Planeación</div>
                        </div>
                    </div>

                    <div className="chat-messages">
                        {messages.map(msg => (
                            <div key={msg.id} className={'msg' + (msg.role === 'user' ? ' user-msg' : '')}>
                                <div className="msg-avatar" style={{ background: msg.role === 'ai' ? 'linear-gradient(135deg,#6C63FF,#00D4AA)' : '#6C63FF' }}>
                                    {msg.role === 'ai' ? '🔮' : (user?.nombre?.charAt(0) || 'U')}
                                </div>
                                <div className={'msg-bubble ' + (msg.role === 'ai' ? 'ai-bubble' : 'user-bubble')}>
                                    {formatMsg(msg.text)}
                                </div>
                            </div>
                        ))}
                        {loading && (
                            <div className="msg">
                                <div className="msg-avatar" style={{ background: 'linear-gradient(135deg,#6C63FF,#00D4AA)' }}>🔮</div>
                                <div className="msg-bubble ai-bubble" style={{ display: 'flex', gap: 5, alignItems: 'center', padding: '16px 20px' }}>
                                    {[0, 1, 2].map(i => (
                                        <div key={i} style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--primary-light)', animation: `pulse 1.2s ease ${i * 0.2}s infinite` }} />
                                    ))}
                                </div>
                            </div>
                        )}
                        <div ref={bottomRef} />
                    </div>

                    <div className="chat-input-area">
                        <textarea
                            className="chat-input"
                            rows={1}
                            placeholder="Escribe tu pregunta aquí... (Enter para enviar)"
                            value={input}
                            onChange={e => setInput(e.target.value)}
                            onKeyDown={handleKey}
                            style={{ resize: 'none', lineHeight: 1.5 }}
                        />
                        <button className="send-btn" onClick={() => handleSendMessage(input)} disabled={loading}>
                            <span className="material-icons">send</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
