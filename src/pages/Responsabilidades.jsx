import { useState } from 'react';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { useApp } from '../context';
import logoInfibague from '../assets/planinfi.jpeg'; // Reusing existing image as logo, user can swap it later

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
        actividad: '', responsable: '', plazo: '', prioridad: 'Media', estado: 'Pendiente', descripcion: '', archivado: false
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
                    {task && task.created_at && (
                        <div className="form-group" style={{ marginBottom: 12 }}>
                            <label className="form-label" style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>📅 Fecha de creación</label>
                            <div style={{ padding: '8px 14px', background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
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
                                            <input type="checkbox" checked={isSelected} onChange={(e) => {
                                                let newArr = [...currentArr];
                                                if (e.target.checked) newArr.push(f);
                                                else newArr = newArr.filter(item => item !== f);
                                                set('responsable', newArr.join(', '));
                                            }} /> {f}
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
                        <button type="submit" className="btn btn-primary"><span className="material-icons">save</span> Guardar</button>
                    </div>
                </form>
            </div>
        </div>
    );
}

function ResponsableFilter({ funcionarios, selected, onChange }) {
    const [open, setOpen] = useState(false);
    const label = selected.length === 0 ? 'Todos' : selected.length === 1 ? selected[0].split(' ')[0] : `${selected.length} seleccionados`;
    return (
        <div style={{ position: 'relative' }}>
            <button type="button" onClick={() => setOpen(o => !o)} style={{ padding: '6px 14px', fontSize: '0.78rem', background: selected.length > 0 ? 'rgba(108,99,255,0.25)' : 'rgba(255,255,255,0.07)', border: `1px solid ${selected.length > 0 ? 'rgba(108,99,255,0.5)' : 'var(--border)'}`, borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'inherit', minWidth: 140 }}>
                <span className="material-icons" style={{ fontSize: 15 }}>person</span> {label} <span className="material-icons" style={{ fontSize: 14, marginLeft: 'auto' }}>{open ? 'expand_less' : 'expand_more'}</span>
            </button>
            {open && (
                <div style={{ position: 'absolute', top: '110%', left: 0, zIndex: 100, minWidth: 260, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', boxShadow: '0 8px 24px rgba(0,0,0,0.3)', padding: '10px 0', maxHeight: 280, overflowY: 'auto' }}>
                    <div style={{ padding: '4px 14px 8px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Filtrar por responsable</span>
                        {selected.length > 0 && <button type="button" onClick={() => onChange([])} style={{ fontSize: '0.7rem', color: 'var(--accent-pink)', background: 'none', border: 'none', cursor: 'pointer' }}>Limpiar</button>}
                    </div>
                    {funcionarios.map(f => {
                        const isChecked = selected.includes(f);
                        return (
                            <label key={f} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 14px', cursor: 'pointer', fontSize: '0.8rem', color: 'var(--text-primary)', background: isChecked ? 'rgba(108,99,255,0.1)' : 'transparent', transition: 'background 0.15s' }}>
                                <input type="checkbox" checked={isChecked} onChange={() => onChange(isChecked ? selected.filter(s => s !== f) : [...selected, f])} style={{ accentColor: '#6C63FF' }} /> {f.split(' ').slice(0, 3).join(' ')}
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
    
    // UI State
    const [modal, setModal] = useState(null);
    const [search, setSearch] = useState('');
    const [filterEstados, setFilterEstados] = useState([]);
    const [filterPrioridad, setFilterPrioridad] = useState('Todos');
    const [filterResponsables, setFilterResponsables] = useState([]);
    const [tab, setTab] = useState('principal'); // 'principal' | 'agrupada' | 'archivadas'

    const toggleEstado = (estado) => setFilterEstados(prev => prev.includes(estado) ? prev.filter(e => e !== estado) : [...prev, estado]);

    const handleSave = (form) => {
        if (modal && modal !== 'new') editTask(modal.id, form);
        else addTask(form);
    };

    const handleStatusChange = (id, estado) => editTask(id, { estado });
    const handleArchive = (id, archivadoStatus) => editTask(id, { archivado: archivadoStatus });

    // FILTER LOGIC
    const filteredTasks = tasks.filter(t => {
        const matchSearch = t.actividad.toLowerCase().includes(search.toLowerCase()) || t.responsable.toLowerCase().includes(search.toLowerCase());
        const matchEstado = filterEstados.length === 0 || filterEstados.includes(t.estado);
        const matchPrioridad = filterPrioridad === 'Todos' || t.prioridad === filterPrioridad;
        const matchResp = filterResponsables.length === 0 || filterResponsables.some(r => t.responsable && t.responsable.includes(r));
        const matchArchive = tab === 'archivadas' ? t.archivado === true : !t.archivado;
        return matchSearch && matchEstado && matchPrioridad && matchResp && matchArchive;
    });

    // ─── EXCELJS EXPORT ───────────────────────────────────────────────────────
    const exportExcel = async () => {
        const workbook = new ExcelJS.Workbook();
        const sheet = workbook.addWorksheet('Control de Actividades');

        // Column Setup
        sheet.columns = [
            { header: 'N°', key: 'id', width: 6 },
            { header: 'Actividad', key: 'actividad', width: 50 },
            { header: 'Responsable(s)', key: 'responsable', width: 45 },
            { header: 'Fecha Creación', key: 'created_at', width: 18 },
            { header: 'Plazo Límite', key: 'plazo', width: 18 },
            { header: 'Prioridad', key: 'prioridad', width: 15 },
            { header: 'Estado', key: 'estado', width: 15 },
            { header: 'Descripción', key: 'descripcion', width: 60 }
        ];

        // Insert Title Rows
        sheet.insertRow(1, ['TABLERO DE RESPONSABILIDADES INSTITUCIONAL OFICINA DE PLANEACION INSTITUCIONAL']);
        sheet.insertRow(2, ['']); // space for logo or just spacing
        sheet.insertRow(3, ['']); 
        
        sheet.mergeCells('A1:H1');
        const titleCell = sheet.getCell('A1');
        titleCell.font = { name: 'Arial', size: 16, bold: true, color: { argb: 'FFFFFFFF' } };
        titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1F3A60' } };
        titleCell.alignment = { vertical: 'middle', horizontal: 'center' };
        sheet.getRow(1).height = 40;

        // Try to add image
        try {
            const response = await fetch(logoInfibague);
            const blob = await response.blob();
            const buffer = await blob.arrayBuffer();
            const imageId = workbook.addImage({ buffer, extension: 'jpeg' });
            // Add image to top-left corner
            sheet.addImage(imageId, {
                tl: { col: 0, row: 1 },
                ext: { width: 120, height: 60 }
            });
        } catch (err) {
            console.error('No se pudo cargar el logo para Excel', err);
        }

        // Header Styling (Row 4 because we inserted 3 rows)
        const headerRow = sheet.getRow(4);
        headerRow.eachCell((cell) => {
            cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4F81BD' } };
            cell.border = {
                top: { style: 'thin' }, left: { style: 'thin' },
                bottom: { style: 'thin' }, right: { style: 'thin' }
            };
            cell.alignment = { vertical: 'middle', horizontal: 'center' };
        });

        // Data Rows
        filteredTasks.forEach((t, i) => {
            const row = sheet.addRow({
                id: i + 1,
                actividad: t.actividad,
                responsable: t.responsable,
                created_at: t.created_at ? formatDate(t.created_at) : '—',
                plazo: t.plazo || '—',
                prioridad: t.prioridad,
                estado: t.estado,
                descripcion: t.descripcion || ''
            });

            row.eachCell((cell, colNumber) => {
                // Soft background for odd/even rows
                cell.fill = {
                    type: 'pattern', pattern: 'solid',
                    fgColor: { argb: i % 2 === 0 ? 'FFF2F2F2' : 'FFFFFFFF' }
                };
                // Borders
                cell.border = { bottom: { style: 'thin', color: { argb: 'FFCCCCCC' } }, left: { style: 'thin', color: { argb: 'FFCCCCCC' } }, right: { style: 'thin', color: { argb: 'FFCCCCCC' } } };
                cell.alignment = { vertical: 'middle', wrapText: true };

                // State coloring
                if (colNumber === 7) { // Estado column
                    if (t.estado === 'Vencido') cell.font = { color: { argb: 'FFD32F2F' }, bold: true };
                    else if (t.estado === 'Pendiente') cell.font = { color: { argb: 'FFF57F17' }, bold: true }; // Yellow/Orange
                    else if (t.estado === 'Completado') cell.font = { color: { argb: 'FF388E3C' }, bold: true };
                }
            });
        });

        const buffer = await workbook.xlsx.writeBuffer();
        saveAs(new Blob([buffer]), `Control_Actividades_${new Date().toISOString().slice(0, 10)}.xlsx`);
    };

    // Component for rendering a single task row in table
    const renderRow = (t, i) => (
        <tr key={t.id} style={{ opacity: t.archivado ? 0.7 : 1 }}>
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
                {isJefe && !t.archivado ? (
                    <select className="form-select" style={{ padding: '4px 8px', fontSize: '0.78rem', width: 'auto' }} value={t.estado} onChange={e => handleStatusChange(t.id, e.target.value)}>
                        {estadoOptions.map(s => <option key={s}>{s}</option>)}
                    </select>
                ) : statusBadge(t.estado)}
            </td>
            {isJefe && (
                <td>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        {!t.archivado && <button className="icon-btn" title="Editar" onClick={() => setModal(t)}><span className="material-icons" style={{ fontSize: 17 }}>edit</span></button>}
                        <button className="icon-btn btn-danger" title="Eliminar" onClick={() => { if (confirm('¿Eliminar esta responsabilidad?')) deleteTask(t.id); }}><span className="material-icons" style={{ fontSize: 17 }}>delete</span></button>
                        
                        {/* Archiving logic */}
                        {t.estado === 'Completado' && !t.archivado && (
                            <button className="icon-btn" style={{ color: 'var(--accent-cyan)', borderColor: 'var(--accent-cyan)' }} title="Enviar a Completadas (Archivar)" onClick={() => handleArchive(t.id, true)}>
                                <span className="material-icons" style={{ fontSize: 17 }}>archive</span>
                            </button>
                        )}
                        {t.archivado && (
                            <button className="icon-btn" style={{ color: 'var(--accent-cyan)', borderColor: 'var(--accent-cyan)' }} title="Desarchivar (Volver al Principal)" onClick={() => handleArchive(t.id, false)}>
                                <span className="material-icons" style={{ fontSize: 17 }}>unarchive</span>
                            </button>
                        )}
                    </div>
                </td>
            )}
        </tr>
    );

    return (
        <div className="page-container fade-in">
            <div className="page-header flex-between">
                <div>
                    <h1 className="page-title">Mission Control</h1>
                    <p className="page-subtitle">Tablero de Responsabilidades Institucional · {isJefe ? 'Vista Jefe — Edición completa' : 'Vista Funcionario — Solo lectura'}</p>
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                    <button className="btn btn-secondary" onClick={exportExcel} title="Descargar Excel">
                        <span className="material-icons">file_download</span> Descargar Excel
                    </button>
                    {isJefe && tab !== 'archivadas' && (
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
                    { l: 'Pendientes', v: tasks.filter(t => t.estado === 'Pendiente' && !t.archivado).length, c: '#FFD166' },
                    { l: 'Urgentes', v: tasks.filter(t => t.prioridad === 'Alta' && t.estado !== 'Completado' && !t.archivado).length, c: '#FF6B9D' },
                    { l: 'Completadas (No Archiv.)', v: tasks.filter(t => t.estado === 'Completado' && !t.archivado).length, c: '#00D4AA' },
                ].map(k => (
                    <div key={k.l} className="kpi-card" style={{ padding: '14px 18px' }}>
                        <div className="kpi-label">{k.l}</div>
                        <div className="kpi-value" style={{ fontSize: '1.7rem', color: k.c }}>{k.v}</div>
                    </div>
                ))}
            </div>

            {/* TABS */}
            <div style={{ display: 'flex', gap: 16, marginBottom: 24, borderBottom: '1px solid var(--border)' }}>
                {[
                    { id: 'principal', label: 'Lista Principal', icon: 'list_alt' },
                    { id: 'agrupada', label: 'Vista por Responsable', icon: 'people' },
                    { id: 'archivadas', label: 'Tareas Completadas (Archivo)', icon: 'inventory_2' }
                ].map(tb => (
                    <button
                        key={tb.id}
                        onClick={() => setTab(tb.id)}
                        style={{
                            background: 'none', border: 'none', borderBottom: tab === tb.id ? '2px solid var(--accent-cyan)' : '2px solid transparent',
                            color: tab === tb.id ? 'var(--text-primary)' : 'var(--text-muted)',
                            padding: '10px 16px', fontSize: '0.9rem', fontWeight: 600, cursor: 'pointer',
                            display: 'flex', alignItems: 'center', gap: 8, transition: 'all 0.2s'
                        }}
                    >
                        <span className="material-icons" style={{ fontSize: 18 }}>{tb.icon}</span> {tb.label}
                    </button>
                ))}
            </div>

            {/* FILTER BAR */}
            <div className="filter-bar" style={{ flexWrap: 'wrap', gap: 12, marginBottom: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span className="material-icons" style={{ color: 'var(--text-muted)', fontSize: 18 }}>search</span>
                    <input className="search-input" placeholder="Buscar actividad o responsable..." value={search} onChange={e => setSearch(e.target.value)} />
                </div>
                <div className="filter-group">
                    <span className="filter-label">Estado:</span>
                    {estadoOptions.map(s => (
                        <button key={s} className={'filter-chip' + (filterEstados.includes(s) ? ' active' : '')} onClick={() => toggleEstado(s)} title={filterEstados.includes(s) ? 'Clic para quitar filtro' : 'Clic para filtrar'}>{s}</button>
                    ))}
                    {filterEstados.length > 0 && <button className="filter-chip" onClick={() => setFilterEstados([])} style={{ opacity: 0.6, fontSize: '0.72rem' }}>✕ Limpiar</button>}
                </div>
                <div className="filter-group">
                    <span className="filter-label">Prioridad:</span>
                    {['Todos', ...prioridadOptions].map(p => (
                        <button key={p} className={'filter-chip' + (filterPrioridad === p ? ' active' : '')} onClick={() => setFilterPrioridad(p)}>{p}</button>
                    ))}
                </div>
                {tab !== 'agrupada' && (
                    <div className="filter-group" style={{ alignItems: 'center' }}>
                        <span className="filter-label">Responsable:</span>
                        <ResponsableFilter funcionarios={funcionarios} selected={filterResponsables} onChange={setFilterResponsables} />
                    </div>
                )}
            </div>
            
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

            {/* RENDER CONTENT BASED ON TAB */}
            {tab === 'principal' || tab === 'archivadas' ? (
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
                                {filteredTasks.length === 0 ? (
                                    <tr><td colSpan={isJefe ? 8 : 7} style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>{tab === 'archivadas' ? 'No hay tareas archivadas.' : 'Sin resultados para los filtros aplicados'}</td></tr>
                                ) : filteredTasks.map((t, i) => renderRow(t, i))}
                            </tbody>
                        </table>
                    </div>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                    {funcionarios.map(f => {
                        // Filter tasks where this user is responsible
                        const fTasks = filteredTasks.filter(t => t.responsable && t.responsable.includes(f));
                        if (fTasks.length === 0) return null;

                        const individuales = fTasks.filter(t => !t.responsable.includes(','));
                        const compartidas = fTasks.filter(t => t.responsable.includes(','));

                        return (
                            <div key={f} className="card" style={{ padding: '20px' }}>
                                <h2 style={{ fontSize: '1.2rem', color: 'var(--accent-cyan)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <span className="material-icons">person</span> {f}
                                </h2>
                                
                                {individuales.length > 0 && (
                                    <div style={{ marginBottom: compartidas.length > 0 ? 20 : 0 }}>
                                        <h3 style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.05em' }}>📌 Tareas Individuales</h3>
                                        <div className="table-container" style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)' }}>
                                            <table className="data-table" style={{ margin: 0 }}>
                                                <tbody>{individuales.map((t, i) => renderRow(t, i))}</tbody>
                                            </table>
                                        </div>
                                    </div>
                                )}

                                {compartidas.length > 0 && (
                                    <div>
                                        <h3 style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.05em' }}>🤝 Tareas Compartidas</h3>
                                        <div className="table-container" style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)' }}>
                                            <table className="data-table" style={{ margin: 0 }}>
                                                <tbody>{compartidas.map((t, i) => renderRow(t, i))}</tbody>
                                            </table>
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                    {filteredTasks.length === 0 && (
                        <div className="card" style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>Sin resultados para los filtros aplicados</div>
                    )}
                </div>
            )}

            {modal && (
                <TaskModal task={modal === 'new' ? null : modal} onClose={() => setModal(null)} onSave={handleSave} funcionarios={funcionarios} />
            )}
        </div>
    );
}
