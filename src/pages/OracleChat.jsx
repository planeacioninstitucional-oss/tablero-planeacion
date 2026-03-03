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

const AI_RESPONSES = {
    'comité': `Para mejorar la eficiencia de los comités:\n\n1. **Agenda previa**: Envíala 24hrs antes con los puntos específicos\n2. **Límite de tiempo**: Máximo 60 minutos con timekeeper\n3. **Solo decisiones**: Reserva el comité para tomar decisiones, no para informar\n4. **Acta en vivo**: Redacta el acta durante la reunión, no después\n5. **Compromisos claros**: Cada punto debe terminar con un responsable y fecha\n\nUna buena práctica: los primeros 5 minutos revisa compromisos del comité anterior.`,
    'digital': `Para digitalizar procesos en tu oficina:\n\n📊 **Corto plazo (1-30 días)**:\n- Implementar este tablero para seguimiento de responsabilidades\n- Digitalizar actas en Google Docs/Drive con plantillas\n- Usar WhatsApp Business para comunicados oficiales\n\n🚀 **Mediano plazo (1-3 meses)**:\n- Formularios digitales para solicitudes internas\n- Dashboard de indicadores en tiempo real\n- Firma digital para documentos\n\n💡 La clave es empezar con los procesos más repetitivos y con mayor impacto.`,
    'informe': `Estructura recomendada para un informe de gestión mensual:\n\n**1. Resumen Ejecutivo** (1 párrafo)\n- Estado general en 3 líneas\n\n**2. Avance de Indicadores**\n- Tabla con meta vs ejecución\n- Semáforo de cumplimiento (🟢🟡🔴)\n\n**3. Actividades Ejecutadas**\n- Lista con responsable y fecha\n\n**4. Actividades Pendientes**\n- Con justificación de retraso si aplica\n\n**5. Riesgos y Alertas**\n- Situaciones que requieren atención\n\n**6. Próximos pasos**\n- Compromisos para el siguiente periodo`,
    'default': `¡Excelente pregunta! Como asistente de la Oficina de Planeación, te sugiero:\n\n🎯 **Análisis inicial**: Identifica cuáles son los procesos con mayor impacto y cuáles consumen más tiempo innecesariamente.\n\n📋 **Documentación**: Antes de implementar cualquier mejora, documenta el proceso actual (AS-IS) y el proceso deseado (TO-BE).\n\n🔄 **Mejora continua**: Implementa ciclos PDCA (Planear-Hacer-Verificar-Actuar) para tus procesos.\n\n📊 **Métricas**: Define indicadores claros para medir el éxito de cada iniciativa.\n\n¿Quieres que profundice en algún aspecto específico?`,
};

const getAIResponse = (msg) => {
    const lower = msg.toLowerCase();
    if (lower.includes('comité') || lower.includes('reunión') || lower.includes('meeting')) return AI_RESPONSES['comité'];
    if (lower.includes('digital') || lower.includes('tecnolog') || lower.includes('sistema')) return AI_RESPONSES['digital'];
    if (lower.includes('informe') || lower.includes('reporte') || lower.includes('report')) return AI_RESPONSES['informe'];
    return AI_RESPONSES['default'];
};

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
        await new Promise(r => setTimeout(r, 900 + Math.random() * 800));
        const aiText = getAIResponse(text);
        setMessages(prev => [...prev, { id: Date.now() + 1, role: 'ai', text: aiText }]);
        setLoading(false);
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
