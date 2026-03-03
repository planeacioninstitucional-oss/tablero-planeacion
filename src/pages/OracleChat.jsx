import { useState, useRef, useEffect } from 'react';
import { useApp } from '../context';

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
            const response = await fetch('http://localhost:5000/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt: text.trim() })
            });
            const data = await response.json();

            const aiText = response.ok ? data.text : (data.error || 'Hubo un error al procesar tu solicitud.');
            setMessages(prev => [...prev, { id: Date.now() + 1, role: 'ai', text: aiText }]);
        } catch (error) {
            console.error('Error fetching from server:', error);
            setMessages(prev => [...prev, { id: Date.now() + 1, role: 'ai', text: 'Error de conexión con Oracle. Asegúrate de que el servidor local está corriendo.' }]);
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

            <div className="chat-layout" style={{ height: 'calc(100vh - 200px)' }}>
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
