import { useState } from 'react';
import * as XLSX from 'xlsx';
import { useApp } from '../context';

const estadoOptions = ['Pendiente', 'Completado', 'Vencido'];
const prioridadOptions = ['Alta', 'Media', 'Baja'];

const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    if (isNaN(d)) return dateStr;
    return d.toLocaleDateString('es-CO', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

const statusBadge = (e) => {
    const m = { 'Pendiente': 'badge-pending', 'Completado': 'badge-done', 'Vencido': 'badge-overdue' };
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
                    {/* Fecha de creación (solo lectura en edición) */}
                    {task && task.created_at && (
                        <div className="form-group" style={{ marginBottom: 12 }}>
                            <label className="form-label" style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                📅 Fecha de creación
                            </label>
                            <div style={{
                                padding: '8px 14px', background: 'rgba(255,255,255,0.04)',
                                border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)',
                                fontSize: '0.85rem', color: 'var(--text-secondary)'
                            }}>
                                {formatDate(task.created_at)}
                            </div>
                        </div>
                    )}
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

// ─── Multi-select Responsable Dropdown ────────────────────────────────────────
function ResponsableFilter({ funcionarios, selected, onChange }) {
    const [open, setOpen] = useState(false);
    const label = selected.length === 0
        ? 'Todos'
        : selected.length === 1
            ? selected[0].split(' ')[0]
            : `${selected.length} seleccionados`;

    return (
        <div style={{ position: 'relative' }}>
            <button
                type="button"
                onClick={() => setOpen(o => !o)}
                style={{
                    padding: '6px 14px', fontSize: '0.78rem', background: selected.length > 0 ? 'rgba(108,99,255,0.25)' : 'rgba(255,255,255,0.07)',
                    border: `1px solid ${selected.length > 0 ? 'rgba(108,99,255,0.5)' : 'var(--border)'}`,
                    borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'inherit',
                    minWidth: 140
                }}
            >
                <span className="material-icons" style={{ fontSize: 15 }}>person</span>
                {label}
                <span className="material-icons" style={{ fontSize: 14, marginLeft: 'auto' }}>{open ? 'expand_less' : 'expand_more'}</span>
            </button>
            {open && (
                <div style={{
                    position: 'absolute', top: '110%', left: 0, zIndex: 100, minWidth: 260,
                    background: 'var(--bg-card)', border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-sm)', boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
                    padding: '10px 0', maxHeight: 280, overflowY: 'auto'
                }}>
                    <div style={{ padding: '4px 14px 8px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Filtrar por responsable</span>
                        {selected.length > 0 && (
                            <button type="button" onClick={() => { onChange([]); }} style={{ fontSize: '0.7rem', color: 'var(--accent-pink)', background: 'none', border: 'none', cursor: 'pointer' }}>Limpiar</button>
                        )}
                    </div>
                    {funcionarios.map(f => {
                        const isChecked = selected.includes(f);
                        return (
                            <label key={f} style={{
                                display: 'flex', alignItems: 'center', gap: 10, padding: '7px 14px',
                                cursor: 'pointer', fontSize: '0.8rem', color: 'var(--text-primary)',
                                background: isChecked ? 'rgba(108,99,255,0.1)' : 'transparent',
                                transition: 'background 0.15s'
                            }}>
                                <input
                                    type="checkbox"
                                    checked={isChecked}
                                    onChange={() => {
                                        if (isChecked) onChange(selected.filter(s => s !== f));
                                        else onChange([...selected, f]);
                                    }}
                                    style={{ accentColor: '#6C63FF' }}
                                />
                                {f.split(' ').slice(0, 3).join(' ')}
                            </label>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

export default function Responsabilidades() {
    const { user, tasks, addTask, editTask, deleteTask, funcionarios } = useApp();
    const isJefe = user?.rol === 'jefe';
    const [modal, setModal] = useState(null); // null | 'new' | task object
    const [search, setSearch] = useState('');
    const [filterEstados, setFilterEstados] = useState([]); // multi-select: []= todos
    const [filterPrioridad, setFilterPrioridad] = useState('Todos');
    const [filterResponsables, setFilterResponsables] = useState([]); // multi-select

    const toggleEstado = (estado) => {
        setFilterEstados(prev =>
            prev.includes(estado) ? prev.filter(e => e !== estado) : [...prev, estado]
        );
    };

    const filtered = tasks.filter(t => {
        const matchSearch = t.actividad.toLowerCase().includes(search.toLowerCase()) || t.responsable.toLowerCase().includes(search.toLowerCase());
        const matchEstado = filterEstados.length === 0 || filterEstados.includes(t.estado);
        const matchPrioridad = filterPrioridad === 'Todos' || t.prioridad === filterPrioridad;
        const matchResp = filterResponsables.length === 0 || filterResponsables.some(r => t.responsable && t.responsable.includes(r));
        return matchSearch && matchEstado && matchPrioridad && matchResp;
    });

    const handleSave = (form) => {
        if (modal && modal !== 'new') editTask(modal.id, form);
        else addTask(form);
    };

    const handleStatusChange = (id, estado) => editTask(id, { estado });

    // ─── EXCEL EXPORT ───────────────────────────────────────────────────────
    const exportExcel = () => {
        const rows = filtered.map((t, i) => ({
            'N°': i + 1,
            'Actividad': t.actividad,
            'Responsable(s)': t.responsable,
            'Fecha Creación': t.created_at ? formatDate(t.created_at) : '—',
            'Fecha Límite': t.plazo || '—',
            'Prioridad': t.prioridad,
            'Estado': t.estado,
            'Descripción': t.descripcion || '',
        }));

        const ws = XLSX.utils.json_to_sheet(rows);

        // Column widths
        ws['!cols'] = [
            { wch: 5 },   // N°
            { wch: 45 },  // Actividad
            { wch: 40 },  // Responsable
            { wch: 16 },  // Fecha Creación
            { wch: 14 },  // Fecha Límite
            { wch: 10 },  // Prioridad
            { wch: 12 },  // Estado
            { wch: 50 },  // Descripción
        ];

        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Control de Actividades');
        XLSX.writeFile(wb, `Control_Actividades_${new Date().toISOString().slice(0, 10)}.xlsx`);
    };

    return (
        <div className="page-container">
            <div className="page-header flex-between">
                <div>
                    <div className="page-title">Mission Control</div>
                    <div className="page-subtitle">Tablero de Responsabilidades Institucional · {isJefe ? 'Vista Jefe — Edición completa' : 'Vista Funcionario — Solo lectura'}</div>
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                    <button className="btn btn-secondary" onClick={exportExcel} title="Descargar Excel">
                        <span className="material-icons">file_download</span> Descargar Excel
                    </button>
                    {isJefe && (
                        <button className="btn btn-primary" onClick={() => setModal('new')}>
                            <span className="material-icons">add</span> Nueva Responsabilidad
                        </button>
                    )}
                </div>
            </div>

            {/* SUMMARY CARDS */}
            <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(4,1fr)', marginBottom: 20 }}>
                {[
                    { l: 'Total', v: tasks.length, c: '#6C63FF' },
                    { l: 'Pendientes', v: tasks.filter(t => t.estado === 'Pendiente').length, c: '#FFD166' },
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
            <div className="filter-bar" style={{ flexWrap: 'wrap', gap: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span className="material-icons" style={{ color: 'var(--text-muted)', fontSize: 18 }}>search</span>
                    <input className="search-input" placeholder="Buscar actividad o responsable..." value={search} onChange={e => setSearch(e.target.value)} />
                </div>
                <div className="filter-group">
                    <span className="filter-label">Estado:</span>
                    {estadoOptions.map(s => (
                        <button
                            key={s}
                            className={'filter-chip' + (filterEstados.includes(s) ? ' active' : '')}
                            onClick={() => toggleEstado(s)}
                            title={filterEstados.includes(s) ? 'Clic para quitar filtro' : 'Clic para filtrar'}
                        >{s}</button>
                    ))}
                    {filterEstados.length > 0 && (
                        <button className="filter-chip" onClick={() => setFilterEstados([])} style={{ opacity: 0.6, fontSize: '0.72rem' }}>✕ Limpiar</button>
                    )}
                </div>
                <div className="filter-group">
                    <span className="filter-label">Prioridad:</span>
                    {['Todos', ...prioridadOptions].map(p => (
                        <button key={p} className={'filter-chip' + (filterPrioridad === p ? ' active' : '')} onClick={() => setFilterPrioridad(p)}>{p}</button>
                    ))}
                </div>
                <div className="filter-group" style={{ alignItems: 'center' }}>
                    <span className="filter-label">Responsable:</span>
                    <ResponsableFilter
                        funcionarios={funcionarios}
                        selected={filterResponsables}
                        onChange={setFilterResponsables}
                    />
                </div>
            </div>
            {/* Active filters summary */}
            {(filterEstados.length > 0 || filterResponsables.length > 0) && (
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12, fontSize: '0.75rem' }}>
                    {filterEstados.map(e => (
                        <span key={e} style={{ background: 'rgba(108,99,255,0.2)', border: '1px solid rgba(108,99,255,0.35)', borderRadius: 20, padding: '2px 10px', color: 'var(--text-secondary)' }}>
                            Estado: {e} <button onClick={() => toggleEstado(e)} style={{ background: 'none', border: 'none', color: 'var(--accent-pink)', cursor: 'pointer', fontSize: '0.8rem', padding: 0, marginLeft: 4 }}>✕</button>
                        </span>
                    ))}
                    {filterResponsables.map(r => (
                        <span key={r} style={{ background: 'rgba(0,212,170,0.15)', border: '1px solid rgba(0,212,170,0.3)', borderRadius: 20, padding: '2px 10px', color: 'var(--text-secondary)' }}>
                            {r.split(' ')[0]} <button onClick={() => setFilterResponsables(prev => prev.filter(x => x !== r))} style={{ background: 'none', border: 'none', color: 'var(--accent-pink)', cursor: 'pointer', fontSize: '0.8rem', padding: 0, marginLeft: 4 }}>✕</button>
                        </span>
                    ))}
                </div>
            )}

            {/* TABLE */}
            <div className="card" style={{ padding: 0 }}>
                <div className="table-container">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>#</th>
                                <th>Actividad</th>
                                <th>Responsable</th>
                                <th>Fecha Creación</th>
                                <th>Plazo Límite</th>
                                <th>Prioridad</th>
                                <th>Estado</th>
                                {isJefe && <th>Acciones</th>}
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.length === 0 ? (
                                <tr><td colSpan={isJefe ? 8 : 7} style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>Sin resultados para los filtros aplicados</td></tr>
                            ) : filtered.map((t, i) => (
                                <tr key={t.id}>
                                    <td style={{ color: 'var(--text-muted)', fontWeight: 600 }}>{i + 1}</td>
                                    <td>
                                        <div style={{ fontWeight: 600, fontSize: '0.88rem' }}>{t.actividad}</div>
                                        {t.descripcion && <div style={{ fontSize: '0.73rem', color: 'var(--text-muted)', marginTop: 2 }}>{t.descripcion.slice(0, 60)}{t.descripcion.length > 60 ? '…' : ''}</div>}
                                    </td>
                                    <td style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>{t.responsable}</td>
                                    <td style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{formatDate(t.created_at)}</td>
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
