import { useState, useEffect, useRef, useCallback } from 'react';
import { useApp } from '../context';
import { supabase } from '../supabase';

const NOTE_COLORS = [
    { label: 'Oscuro', value: '#1A1A2E' },
    { label: 'Azul Noche', value: '#0F1B2D' },
    { label: 'Esmeralda', value: '#0D2818' },
    { label: 'Vino', value: '#2D0A1E' },
    { label: 'Dorado', value: '#2D2200' },
    { label: 'Púrpura', value: '#1A0D2E' },
];

const FONT_SIZES = [
    { label: 'Pequeña', value: '2' },
    { label: 'Normal', value: '3' },
    { label: 'Mediana', value: '4' },
    { label: 'Grande', value: '5' },
    { label: 'Muy Grande', value: '6' },
];

const TEXT_COLORS = [
    '#FFFFFF', '#E0E0E0', '#FFD166', '#FF6B9D', '#6C63FF',
    '#00D4AA', '#FF6B35', '#A78BFA', '#34D399', '#F87171',
    '#FBBF24', '#60A5FA', '#C084FC', '#FB923C',
];

export default function NotasJefe() {
    const { user } = useApp();
    const [notas, setNotas] = useState([]);
    const [activeNota, setActiveNota] = useState(null);
    const [saving, setSaving] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [showColorPicker, setShowColorPicker] = useState(false);
    const [showTextColor, setShowTextColor] = useState(false);
    const [showFontSize, setShowFontSize] = useState(false);
    const editorRef = useRef(null);
    const saveTimerRef = useRef(null);

    // ── Load notas ──────────────────────────────────────────────
    useEffect(() => {
        if (!user) return;
        const fetchNotas = async () => {
            const { data, error } = await supabase
                .from('notas_jefe')
                .select('*')
                .eq('autor_id', user.id)
                .order('fijada', { ascending: false })
                .order('updated_at', { ascending: false });
            if (!error && data) {
                setNotas(data);
                if (data.length > 0 && !activeNota) setActiveNota(data[0]);
            }
        };
        fetchNotas();
    }, [user]);

    // ── Load content into editor when switching note ─────────────
    useEffect(() => {
        if (editorRef.current && activeNota) {
            editorRef.current.innerHTML = activeNota.contenido || '';
        }
    }, [activeNota?.id]);

    // ── Auto-save with debounce ─────────────────────────────────
    const autoSave = useCallback(async (nota) => {
        if (!nota?.id) return;
        setSaving(true);
        const content = editorRef.current?.innerHTML || '';
        const { error } = await supabase
            .from('notas_jefe')
            .update({ contenido: content, updated_at: new Date().toISOString() })
            .eq('id', nota.id);
        if (!error) {
            setNotas(prev => prev.map(n => n.id === nota.id ? { ...n, contenido: content, updated_at: new Date().toISOString() } : n));
        }
        setSaving(false);
    }, []);

    const handleEditorInput = () => {
        if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
        saveTimerRef.current = setTimeout(() => autoSave(activeNota), 1200);
    };

    // ── Toolbar commands ────────────────────────────────────────
    const execCmd = (cmd, value = null) => {
        editorRef.current?.focus();
        document.execCommand(cmd, false, value);
    };

    // ── CRUD ────────────────────────────────────────────────────
    const createNota = async () => {
        const newNota = {
            titulo: 'Nueva nota',
            contenido: '<p>Escribe aquí...</p>',
            color: '#1A1A2E',
            fijada: false,
            autor_id: user.id,
        };
        const { data, error } = await supabase.from('notas_jefe').insert(newNota).select().single();
        if (!error && data) {
            setNotas(prev => [data, ...prev]);
            setActiveNota(data);
        }
    };

    const deleteNota = async (id) => {
        if (!confirm('¿Eliminar esta nota permanentemente?')) return;
        const { error } = await supabase.from('notas_jefe').delete().eq('id', id);
        if (!error) {
            const remaining = notas.filter(n => n.id !== id);
            setNotas(remaining);
            setActiveNota(remaining[0] || null);
        }
    };

    const updateTitle = async (id, titulo) => {
        await supabase.from('notas_jefe').update({ titulo, updated_at: new Date().toISOString() }).eq('id', id);
        setNotas(prev => prev.map(n => n.id === id ? { ...n, titulo } : n));
        if (activeNota?.id === id) setActiveNota(prev => ({ ...prev, titulo }));
    };

    const togglePin = async (nota) => {
        const newVal = !nota.fijada;
        await supabase.from('notas_jefe').update({ fijada: newVal }).eq('id', nota.id);
        setNotas(prev => {
            const updated = prev.map(n => n.id === nota.id ? { ...n, fijada: newVal } : n);
            return updated.sort((a, b) => (b.fijada ? 1 : 0) - (a.fijada ? 1 : 0) || new Date(b.updated_at) - new Date(a.updated_at));
        });
        if (activeNota?.id === nota.id) setActiveNota(prev => ({ ...prev, fijada: newVal }));
    };

    const changeNoteColor = async (color) => {
        if (!activeNota) return;
        await supabase.from('notas_jefe').update({ color }).eq('id', activeNota.id);
        setNotas(prev => prev.map(n => n.id === activeNota.id ? { ...n, color } : n));
        setActiveNota(prev => ({ ...prev, color }));
        setShowColorPicker(false);
    };

    // ── Filter ──────────────────────────────────────────────────
    const filtered = notas.filter(n => n.titulo.toLowerCase().includes(searchTerm.toLowerCase()));

    const formatDate = (d) => {
        if (!d) return '';
        const date = new Date(d);
        return date.toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    };

    const getPreview = (html) => {
        if (!html) return 'Nota vacía...';
        const text = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
        return text.slice(0, 80) + (text.length > 80 ? '...' : '');
    };

    // ── Access guard ────────────────────────────────────────────
    if (user?.rol !== 'jefe') {
        return (
            <div className="page-container">
                <div className="empty-state">
                    <div className="empty-state-icon">🔒</div>
                    <div className="empty-state-text">Acceso exclusivo para el Jefe de Oficina</div>
                </div>
            </div>
        );
    }

    return (
        <div className="page-container" style={{ paddingBottom: 0 }}>
            <div className="page-header">
                <div className="page-title">Bloc de Notas ✍️</div>
                <div className="page-subtitle">Tu espacio privado · Agenda reuniones, escribe notas y organiza tus ideas</div>
            </div>

            <div className="notes-layout">
                {/* ─── NOTES SIDEBAR ─────────────────────────────────── */}
                <div className="notes-sidebar">
                    <button className="btn btn-primary notes-new-btn" onClick={createNota}>
                        <span className="material-icons" style={{ fontSize: 18 }}>add</span>
                        Nueva Nota
                    </button>

                    <div className="notes-search-box">
                        <span className="material-icons" style={{ fontSize: 18, color: 'var(--text-muted)' }}>search</span>
                        <input
                            type="text"
                            placeholder="Buscar notas..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="notes-search-input"
                        />
                    </div>

                    <div className="notes-list">
                        {filtered.length === 0 && (
                            <div style={{ padding: 20, textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                                {notas.length === 0 ? 'Crea tu primera nota 📝' : 'Sin resultados'}
                            </div>
                        )}
                        {filtered.map(n => (
                            <div
                                key={n.id}
                                className={'note-card-mini' + (activeNota?.id === n.id ? ' active' : '')}
                                onClick={() => setActiveNota(n)}
                                style={{ borderLeft: `3px solid ${n.color === '#1A1A2E' ? 'var(--primary)' : n.color}` }}
                            >
                                <div className="note-card-mini-header">
                                    <span className="note-card-mini-title">{n.titulo}</span>
                                    {n.fijada && <span className="material-icons" style={{ fontSize: 14, color: 'var(--accent-cyan)' }}>push_pin</span>}
                                </div>
                                <div className="note-card-mini-preview">{getPreview(n.contenido)}</div>
                                <div className="note-card-mini-date">{formatDate(n.updated_at)}</div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* ─── EDITOR AREA ───────────────────────────────────── */}
                <div className="notes-editor-area">
                    {activeNota ? (
                        <>
                            {/* Title */}
                            <div className="notes-editor-header">
                                <input
                                    className="notes-title-input"
                                    value={activeNota.titulo}
                                    onChange={e => {
                                        const val = e.target.value;
                                        setActiveNota(prev => ({ ...prev, titulo: val }));
                                    }}
                                    onBlur={() => updateTitle(activeNota.id, activeNota.titulo)}
                                    placeholder="Título de la nota..."
                                />
                                <div className="notes-header-actions">
                                    <span className="notes-save-indicator">{saving ? '💾 Guardando...' : '✓ Guardado'}</span>
                                    <button className="icon-btn" title={activeNota.fijada ? 'Desfijar' : 'Fijar nota'} onClick={() => togglePin(activeNota)}>
                                        <span className="material-icons" style={{ color: activeNota.fijada ? 'var(--accent-cyan)' : undefined }}>push_pin</span>
                                    </button>
                                    <div style={{ position: 'relative' }}>
                                        <button className="icon-btn" title="Color de nota" onClick={() => setShowColorPicker(!showColorPicker)}>
                                            <span className="material-icons">palette</span>
                                        </button>
                                        {showColorPicker && (
                                            <div className="notes-color-dropdown">
                                                {NOTE_COLORS.map(c => (
                                                    <button key={c.value} className="notes-color-opt" onClick={() => changeNoteColor(c.value)} style={{ background: c.value }}>
                                                        {activeNota.color === c.value && <span className="material-icons" style={{ fontSize: 14, color: '#00D4AA' }}>check</span>}
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                    <button className="icon-btn" title="Eliminar nota" onClick={() => deleteNota(activeNota.id)}>
                                        <span className="material-icons" style={{ color: '#FF6B6B' }}>delete</span>
                                    </button>
                                </div>
                            </div>

                            {/* Toolbar */}
                            <div className="notes-toolbar">
                                <div className="toolbar-group">
                                    <button className="toolbar-btn" onClick={() => execCmd('bold')} title="Negrita">
                                        <span className="material-icons">format_bold</span>
                                    </button>
                                    <button className="toolbar-btn" onClick={() => execCmd('italic')} title="Cursiva">
                                        <span className="material-icons">format_italic</span>
                                    </button>
                                    <button className="toolbar-btn" onClick={() => execCmd('underline')} title="Subrayar">
                                        <span className="material-icons">format_underlined</span>
                                    </button>
                                    <button className="toolbar-btn" onClick={() => execCmd('strikeThrough')} title="Tachado">
                                        <span className="material-icons">strikethrough_s</span>
                                    </button>
                                </div>

                                <div className="toolbar-divider" />

                                <div className="toolbar-group">
                                    <button className="toolbar-btn" onClick={() => execCmd('justifyLeft')} title="Alinear izquierda">
                                        <span className="material-icons">format_align_left</span>
                                    </button>
                                    <button className="toolbar-btn" onClick={() => execCmd('justifyCenter')} title="Centrar">
                                        <span className="material-icons">format_align_center</span>
                                    </button>
                                    <button className="toolbar-btn" onClick={() => execCmd('justifyRight')} title="Alinear derecha">
                                        <span className="material-icons">format_align_right</span>
                                    </button>
                                    <button className="toolbar-btn" onClick={() => execCmd('justifyFull')} title="Justificar">
                                        <span className="material-icons">format_align_justify</span>
                                    </button>
                                </div>

                                <div className="toolbar-divider" />

                                <div className="toolbar-group">
                                    <button className="toolbar-btn" onClick={() => execCmd('insertUnorderedList')} title="Viñetas">
                                        <span className="material-icons">format_list_bulleted</span>
                                    </button>
                                    <button className="toolbar-btn" onClick={() => execCmd('insertOrderedList')} title="Lista numerada">
                                        <span className="material-icons">format_list_numbered</span>
                                    </button>
                                </div>

                                <div className="toolbar-divider" />

                                <div className="toolbar-group">
                                    {/* Font size */}
                                    <div style={{ position: 'relative' }}>
                                        <button className="toolbar-btn" onClick={() => { setShowFontSize(!showFontSize); setShowTextColor(false); }} title="Tamaño de letra">
                                            <span className="material-icons">format_size</span>
                                        </button>
                                        {showFontSize && (
                                            <div className="toolbar-dropdown">
                                                {FONT_SIZES.map(s => (
                                                    <button key={s.value} className="toolbar-dropdown-item" onClick={() => { execCmd('fontSize', s.value); setShowFontSize(false); }}>
                                                        {s.label}
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    {/* Text color */}
                                    <div style={{ position: 'relative' }}>
                                        <button className="toolbar-btn" onClick={() => { setShowTextColor(!showTextColor); setShowFontSize(false); }} title="Color de texto">
                                            <span className="material-icons">format_color_text</span>
                                        </button>
                                        {showTextColor && (
                                            <div className="toolbar-dropdown toolbar-color-grid">
                                                {TEXT_COLORS.map(c => (
                                                    <button key={c} className="toolbar-color-swatch" style={{ background: c }} onClick={() => { execCmd('foreColor', c); setShowTextColor(false); }} />
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    <button className="toolbar-btn" onClick={() => execCmd('removeFormat')} title="Limpiar formato">
                                        <span className="material-icons">format_clear</span>
                                    </button>
                                </div>

                                <div className="toolbar-divider" />

                                <div className="toolbar-group">
                                    <button className="toolbar-btn" onClick={() => execCmd('undo')} title="Deshacer">
                                        <span className="material-icons">undo</span>
                                    </button>
                                    <button className="toolbar-btn" onClick={() => execCmd('redo')} title="Rehacer">
                                        <span className="material-icons">redo</span>
                                    </button>
                                </div>
                            </div>

                            {/* Content Editable */}
                            <div
                                className="notes-editor-content"
                                ref={editorRef}
                                contentEditable
                                suppressContentEditableWarning
                                onInput={handleEditorInput}
                                style={{ background: activeNota.color !== '#1A1A2E' ? activeNota.color : undefined }}
                            />
                        </>
                    ) : (
                        <div className="empty-state" style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                            <div className="empty-state-icon">📝</div>
                            <div className="empty-state-text">Selecciona una nota o crea una nueva</div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
