import { useState } from 'react';
import { useApp } from '../context';

const estadoOptions = ['Pendiente', 'En Proceso', 'Completado', 'Vencido'];
const prioridadOptions = ['Alta', 'Media', 'Baja'];

const statusBadge = (e) => {
    const m = { 'Pendiente': 'badge-pending', 'En Proceso': 'badge-progress', 'Completado': 'badge-done', 'Vencido': 'badge-overdue' };
    return <span className={'badge ' + (m[e] || 'badge-pending')}><span>●</span>{e}</span>;
};
const prioridadBadge = (p) => {
    const m = { 'Alta': 'priority-alta', 'Media': 'priority-media', 'Baja': 'priority-baja' };
    return <span className={m[p]} style={{ fontWeight: 600, fontSize: '0.8rem' }}>{p === 'Alta' ? '🔴' : p === 'Media' ? '🟡' : '🟢'} {p}</span>;
};

function TaskModal({ task, onClose, onSave, funcionarios }) {
    const [form, setForm] = useState(task || {
        actividad: '', responsable: '', plazo: '', prioridad: 'Media', estado: 'Pendiente', descripcion: ''
    });
    const set = (k, v) => setForm(prev => ({ ...prev, [k]: v }));
    const submit = (e) => { e.preventDefault(); onSave(form); onClose(); };
    return (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
            <div className="modal-box">
                <div className="modal-header">
                    <div className="modal-title">{task ? '✏️ Editar Responsabilidad' : '➕ Nueva Responsabilidad'}</div>
                    <button className="modal-close" onClick={onClose}><span className="material-icons">close</span></button>
                </div>
                <form onSubmit={submit}>
                    <div className="form-group">
                        <label className="form-label">Actividad / Responsabilidad *</label>
                        <input className="form-input" value={form.actividad} onChange={e => set('actividad', e.target.value)} required placeholder="Describe la actividad..." />
                    </div>
                    <div className="grid-2">
                        <div className="form-group">
                            <label className="form-label">Responsable(s) *</label>
                            <div style={{ maxHeight: '120px', overflowY: 'auto', background: 'var(--input-bg, rgba(255,255,255,0.06))', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '10px 14px' }}>
                                {funcionarios.map(f => {
                                    const currentArr = form.responsable ? form.responsable.split(', ') : [];
                                    const isSelected = currentArr.includes(f);
                                    return (
                                        <label key={f} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, fontSize: '0.85rem', cursor: 'pointer', color: 'var(--text-primary)' }}>
                                            <input
                                                type="checkbox"
                                                checked={isSelected}
                                                onChange={(e) => {
                                                    let newArr = [...currentArr];
                                                    if (e.target.checked) newArr.push(f);
                                                    else newArr = newArr.filter(item => item !== f);
                                                    set('responsable', newArr.join(', '));
                                                }}
                                            />
                                            {f}
                                        </label>
                                    );
                                })}
                            </div>
                            {(!form.responsable || form.responsable.trim() === '') && <div style={{ color: 'var(--accent-orange)', fontSize: '0.75rem', marginTop: 4 }}>Seleccione al menos uno</div>}
                        </div>
                        <div className="form-group">
                            <label className="form-label">Fecha límite *</label>
                            <input className="form-input" type="date" value={form.plazo} onChange={e => set('plazo', e.target.value)} required />
                        </div>
                    </div>
                    <div className="grid-2">
                        <div className="form-group">
                            <label className="form-label">Prioridad</label>
                            <select className="form-select" value={form.prioridad} onChange={e => set('prioridad', e.target.value)}>
                                {prioridadOptions.map(p => <option key={p} value={p}>{p}</option>)}
                            </select>
                        </div>
                        <div className="form-group">
                            <label className="form-label">Estado</label>
                            <select className="form-select" value={form.estado} onChange={e => set('estado', e.target.value)}>
                                {estadoOptions.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                        </div>
                    </div>
                    <div className="form-group">
                        <label className="form-label">Descripción / Observaciones</label>
                        <textarea className="form-textarea" value={form.descripcion} onChange={e => set('descripcion', e.target.value)} placeholder="Detalles adicionales..." />
                    </div>
                    <div className="modal-footer">
                        <button type="button" className="btn btn-secondary" onClick={onClose}>Cancelar</button>
                        <button type="submit" className="btn btn-primary">
                            <span className="material-icons">save</span> Guardar
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default function Responsabilidades() {
    const { user, tasks, addTask, editTask, deleteTask, funcionarios } = useApp();
    const isJefe = user?.rol === 'jefe';
    const [modal, setModal] = useState(null); // null | 'new' | task object
    const [search, setSearch] = useState('');
    const [filterEstado, setFilterEstado] = useState('Todos');
    const [filterPrioridad, setFilterPrioridad] = useState('Todos');
    const [filterResponsable, setFilterResponsable] = useState('Todos');

    const filtered = tasks.filter(t => {
        const matchSearch = t.actividad.toLowerCase().includes(search.toLowerCase()) || t.responsable.toLowerCase().includes(search.toLowerCase());
        const matchEstado = filterEstado === 'Todos' || t.estado === filterEstado;
        const matchPrioridad = filterPrioridad === 'Todos' || t.prioridad === filterPrioridad;
        const matchResp = filterResponsable === 'Todos' || (t.responsable && t.responsable.includes(filterResponsable));
        return matchSearch && matchEstado && matchPrioridad && matchResp;
    });

    const handleSave = (form) => {
        if (modal && modal !== 'new') editTask(modal.id, form);
        else addTask(form);
    };

    const handleStatusChange = (id, estado) => editTask(id, { estado });

    return (
        <div className="page-container">
            <div className="page-header flex-between">
                <div>
                    <div className="page-title">Mission Control</div>
                    <div className="page-subtitle">Tablero de Responsabilidades Institucional · {isJefe ? 'Vista Jefe — Edición completa' : 'Vista Funcionario — Solo lectura'}</div>
                </div>
                {isJefe && (
                    <button className="btn btn-primary" onClick={() => setModal('new')}>
                        <span className="material-icons">add</span> Nueva Responsabilidad
                    </button>
                )}
            </div>

            {/* SUMMARY CARDS */}
            <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(4,1fr)', marginBottom: 20 }}>
                {[
                    { l: 'Total', v: tasks.length, c: '#6C63FF' },
                    { l: 'En Proceso', v: tasks.filter(t => t.estado === 'En Proceso').length, c: '#FFD166' },
                    { l: 'Urgentes', v: tasks.filter(t => t.prioridad === 'Alta' && t.estado !== 'Completado').length, c: '#FF6B9D' },
                    { l: 'Completadas', v: tasks.filter(t => t.estado === 'Completado').length, c: '#00D4AA' },
                ].map(k => (
                    <div key={k.l} className="kpi-card" style={{ padding: '14px 18px' }}>
                        <div className="kpi-label">{k.l}</div>
                        <div className="kpi-value" style={{ fontSize: '1.7rem', color: k.c }}>{k.v}</div>
                    </div>
                ))}
            </div>

            {/* FILTER BAR */}
            <div className="filter-bar">
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span className="material-icons" style={{ color: 'var(--text-muted)', fontSize: 18 }}>search</span>
                    <input className="search-input" placeholder="Buscar actividad o responsable..." value={search} onChange={e => setSearch(e.target.value)} />
                </div>
                <div className="filter-group">
                    <span className="filter-label">Estado:</span>
                    {['Todos', ...estadoOptions].map(s => (
                        <button key={s} className={'filter-chip' + (filterEstado === s ? ' active' : '')} onClick={() => setFilterEstado(s)}>{s}</button>
                    ))}
                </div>
                <div className="filter-group">
                    <span className="filter-label">Prioridad:</span>
                    {['Todos', ...prioridadOptions].map(p => (
                        <button key={p} className={'filter-chip' + (filterPrioridad === p ? ' active' : '')} onClick={() => setFilterPrioridad(p)}>{p}</button>
                    ))}
                </div>
                <div className="filter-group">
                    <span className="filter-label">Responsable:</span>
                    <select className="form-select" style={{ padding: '5px 10px', fontSize: '0.78rem' }} value={filterResponsable} onChange={e => setFilterResponsable(e.target.value)}>
                        <option>Todos</option>
                        {funcionarios.map(f => <option key={f}>{f}</option>)}
                    </select>
                </div>
            </div>

            {/* TABLE */}
            <div className="card" style={{ padding: 0 }}>
                <div className="table-container">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>#</th>
                                <th>Actividad</th>
                                <th>Responsable</th>
                                <th>Plazo</th>
                                <th>Prioridad</th>
                                <th>Estado</th>
                                {isJefe && <th>Acciones</th>}
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.length === 0 ? (
                                <tr><td colSpan={isJefe ? 7 : 6} style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>Sin resultados para los filtros aplicados</td></tr>
                            ) : filtered.map((t, i) => (
                                <tr key={t.id}>
                                    <td style={{ color: 'var(--text-muted)', fontWeight: 600 }}>{i + 1}</td>
                                    <td>
                                        <div style={{ fontWeight: 600, fontSize: '0.88rem' }}>{t.actividad}</div>
                                        {t.descripcion && <div style={{ fontSize: '0.73rem', color: 'var(--text-muted)', marginTop: 2 }}>{t.descripcion.slice(0, 60)}{t.descripcion.length > 60 ? '…' : ''}</div>}
                                    </td>
                                    <td style={{ color: 'var(--text-secondary)' }}>{t.responsable}</td>
                                    <td style={{ color: new Date(t.plazo) < new Date() && t.estado !== 'Completado' ? 'var(--accent-orange)' : 'var(--text-secondary)', fontWeight: 500 }}>{t.plazo}</td>
                                    <td>{prioridadBadge(t.prioridad)}</td>
                                    <td>
                                        {isJefe ? (
                                            <select className="form-select" style={{ padding: '4px 8px', fontSize: '0.78rem', width: 'auto' }} value={t.estado} onChange={e => handleStatusChange(t.id, e.target.value)}>
                                                {estadoOptions.map(s => <option key={s}>{s}</option>)}
                                            </select>
                                        ) : statusBadge(t.estado)}
                                    </td>
                                    {isJefe && (
                                        <td>
                                            <div style={{ display: 'flex', gap: 6 }}>
                                                <button className="icon-btn" title="Editar" onClick={() => setModal(t)}><span className="material-icons" style={{ fontSize: 17 }}>edit</span></button>
                                                <button className="icon-btn btn-danger" title="Eliminar" onClick={() => { if (confirm('¿Eliminar esta responsabilidad?')) deleteTask(t.id); }}><span className="material-icons" style={{ fontSize: 17 }}>delete</span></button>
                                            </div>
                                        </td>
                                    )}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {modal && (
                <TaskModal
                    task={modal === 'new' ? null : modal}
                    onClose={() => setModal(null)}
                    onSave={handleSave}
                    funcionarios={funcionarios}
                />
            )}
        </div>
    );
}
