import { useState } from 'react';
import { useApp } from '../context';

// Columns are now fetched dynamically from context
const CARD_COLORS = ['#6C63FF', '#00D4AA', '#FF6B35', '#FFD166', '#FF6B9D', '#38BDF8'];

function CardForm({ onSave, onClose, user }) {
    const [titulo, setTitulo] = useState('');
    const [cuerpo, setCuerpo] = useState('');
    const [color, setColor] = useState(CARD_COLORS[0]);
    const submit = (e) => {
        e.preventDefault();
        if (!titulo.trim()) return;
        onSave({ titulo, cuerpo, color, autor: user?.nombre || 'Anónimo', fecha: new Date().toISOString().slice(0, 10) });
        onClose();
    };
    return (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
            <div className="modal-box" style={{ maxWidth: 400 }}>
                <div className="modal-header">
                    <div className="modal-title">💡 Nueva Idea</div>
                    <button className="modal-close" onClick={onClose}><span className="material-icons">close</span></button>
                </div>
                <form onSubmit={submit}>
                    <div className="form-group">
                        <label className="form-label">Título de la idea *</label>
                        <input className="form-input" value={titulo} onChange={e => setTitulo(e.target.value)} placeholder="¿Cuál es tu idea?" required autoFocus />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Descripción</label>
                        <textarea className="form-textarea" value={cuerpo} onChange={e => setCuerpo(e.target.value)} placeholder="Explica tu idea en detalle..." style={{ minHeight: 70 }} />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Color</label>
                        <div style={{ display: 'flex', gap: 8 }}>
                            {CARD_COLORS.map(c => (
                                <button key={c} type="button" onClick={() => setColor(c)} style={{ width: 28, height: 28, borderRadius: '50%', background: c, border: color === c ? '3px solid white' : '3px solid transparent', cursor: 'pointer', transition: 'all 0.2s' }} />
                            ))}
                        </div>
                    </div>
                    <div className="modal-footer">
                        <button type="button" className="btn btn-secondary" onClick={onClose}>Cancelar</button>
                        <button type="submit" className="btn btn-primary"><span className="material-icons">add</span> Agregar</button>
                    </div>
                </form>
            </div>
        </div>
    );
}

function ColumnForm({ onSave, onClose }) {
    const [label, setLabel] = useState('');
    const [color, setColor] = useState(CARD_COLORS[0]);

    const submit = (e) => {
        e.preventDefault();
        if (!label.trim()) return;
        onSave({ label, color });
        onClose();
    };

    return (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
            <div className="modal-box" style={{ maxWidth: 400 }}>
                <div className="modal-header">
                    <div className="modal-title">📂 Nueva Área / Categoría</div>
                    <button className="modal-close" onClick={onClose}><span className="material-icons">close</span></button>
                </div>
                <form onSubmit={submit}>
                    <div className="form-group">
                        <label className="form-label">Nombre de la Categoría *</label>
                        <input className="form-input" value={label} onChange={e => setLabel(e.target.value)} placeholder="Ej: Notas Libres 📝" required autoFocus />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Color distintivo</label>
                        <div style={{ display: 'flex', gap: 8 }}>
                            {CARD_COLORS.map(c => (
                                <button key={c} type="button" onClick={() => setColor(c)} style={{ width: 28, height: 28, borderRadius: '50%', background: c, border: color === c ? '3px solid white' : '3px solid transparent', cursor: 'pointer', transition: 'all 0.2s' }} />
                            ))}
                        </div>
                    </div>
                    <div className="modal-footer">
                        <button type="button" className="btn btn-secondary" onClick={onClose}>Cancelar</button>
                        <button type="submit" className="btn btn-primary"><span className="material-icons">add</span> Crear Categoría</button>
                    </div>
                </form>
            </div>
        </div>
    );
}

function KanbanCard({ card, col, onDelete, onMove, allCols }) {
    const [menu, setMenu] = useState(false);
    return (
        <div className="kanban-card" onClick={() => setMenu(!menu)}>
            <div className="kanban-card-dot" style={{ background: card.color }} />
            <div className="kanban-card-title" style={{ paddingRight: 16 }}>{card.titulo}</div>
            {card.cuerpo && <div className="kanban-card-body">{card.cuerpo}</div>}
            <div className="kanban-card-footer">
                <div className="kanban-card-author">👤 {card.autor} · {card.fecha}</div>
            </div>
            {menu && (
                <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 4, background: 'rgba(0,0,0,0.3)', borderRadius: 8, padding: 8 }} onClick={e => e.stopPropagation()}>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: 4 }}>Mover a:</div>
                    {allCols.filter(c => c.key !== col).map(c => (
                        <button key={c.key} className="btn btn-secondary btn-sm" style={{ justifyContent: 'flex-start', fontSize: '0.75rem' }} onClick={() => { onMove(card.id, col, c.key); setMenu(false); }}>
                            {c.label}
                        </button>
                    ))}
                    <button className="btn btn-danger btn-sm" onClick={() => { onDelete(card.id, col); setMenu(false); }}>
                        <span className="material-icons" style={{ fontSize: 14 }}>delete</span> Eliminar
                    </button>
                </div>
            )}
        </div>
    );
}

export default function IdeaLab() {
    const { user, kanban, kanbanCols, addKanbanCard, moveKanbanCard, deleteKanbanCard, addKanbanColumn, deleteKanbanColumn } = useApp();
    const [addTo, setAddTo] = useState(null);
    const [showColForm, setShowColForm] = useState(false);

    return (
        <div className="page-container">
            <div className="page-header flex-between">
                <div>
                    <div className="page-title">Idea Lab 💡</div>
                    <div className="page-subtitle">Tablero Kanban colaborativo · Agrega ideas o crea tus propias categorías libres</div>
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                    <button className="btn btn-secondary" onClick={() => setShowColForm(true)}>
                        <span className="material-icons">view_column</span> Nueva Categoría
                    </button>
                    <button className="btn btn-primary" onClick={() => setAddTo(kanbanCols[0]?.key || 'spark')}>
                        <span className="material-icons">add</span> Nueva Idea
                    </button>
                </div>
            </div>

            <div className="kanban-board">
                {kanbanCols.map(col => (
                    <div key={col.key} className="kanban-col">
                        <div className="kanban-col-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <div className="kanban-col-title" style={{ color: col.color }}>{col.label}</div>
                                <span className="kanban-count" style={{ background: col.color + '22', color: col.color }}>{kanban[col.key]?.length || 0}</span>
                            </div>
                            <button className="icon-btn" style={{ padding: 4, opacity: 0.5 }} onClick={() => { if (confirm('¿Eliminar esta categoría y todas sus tarjetas?')) deleteKanbanColumn(col.key); }}>
                                <span className="material-icons" style={{ fontSize: 16 }}>close</span>
                            </button>
                        </div>
                        {(kanban[col.key] || []).map(card => (
                            <KanbanCard
                                key={card.id}
                                card={card}
                                col={col.key}
                                allCols={kanbanCols}
                                onDelete={deleteKanbanCard}
                                onMove={moveKanbanCard}
                            />
                        ))}
                        <button className="add-card-btn" onClick={() => setAddTo(col.key)}>
                            <span className="material-icons" style={{ fontSize: 16 }}>add</span> Agregar idea
                        </button>
                    </div>
                ))}
            </div>

            {addTo && (
                <CardForm
                    user={user}
                    onSave={(card) => addKanbanCard(addTo, card)}
                    onClose={() => setAddTo(null)}
                />
            )}
            {showColForm && (
                <ColumnForm
                    onSave={(col) => addKanbanColumn(col)}
                    onClose={() => setShowColForm(false)}
                />
            )}
        </div>
    );
}
