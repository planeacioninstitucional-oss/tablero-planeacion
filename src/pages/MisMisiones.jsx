import { useApp } from '../context';

const statusBadge = (e) => {
    const m = { 'Pendiente': 'badge-pending', 'En Proceso': 'badge-progress', 'Completado': 'badge-done', 'Vencido': 'badge-overdue' };
    return <span className={'badge ' + (m[e] || 'badge-pending')}><span>●</span>{e}</span>;
};

export default function MisMisiones() {
    const { user, tasks, editTask } = useApp();
    const myTasks = tasks.filter(t => t.responsable && t.responsable.includes(user?.nombre));

    const total = myTasks.length;
    const done = myTasks.filter(t => t.estado === 'Completado').length;
    const pct = total > 0 ? Math.round((done / total) * 100) : 0;

    return (
        <div className="page-container">
            <div className="page-header">
                <div className="page-title">My Missions 🎯</div>
                <div className="page-subtitle">Tus responsabilidades asignadas · {user?.nombre}</div>
            </div>

            {/* PERSONAL STATS */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 16, marginBottom: 28 }}>
                {[
                    { label: 'Mis Tareas', value: total, color: '#6C63FF', icon: 'assignment' },
                    { label: 'Completadas', value: done, color: '#00D4AA', icon: 'check_circle' },
                    { label: 'Pendientes', value: myTasks.filter(t => t.estado === 'Pendiente').length, color: '#FFD166', icon: 'hourglass_empty' },
                    { label: 'En Proceso', value: myTasks.filter(t => t.estado === 'En Proceso').length, color: '#6C63FF', icon: 'pending' },
                ].map(k => (
                    <div key={k.label} className="kpi-card" style={{ padding: '14px 18px' }}>
                        <div className="kpi-label">{k.label}</div>
                        <div className="kpi-value" style={{ fontSize: '1.6rem', color: k.color }}>{k.value}</div>
                        <span className="material-icons kpi-icon" style={{ color: k.color }}>{k.icon}</span>
                    </div>
                ))}
            </div>

            {/* PROGRESS */}
            <div className="card" style={{ marginBottom: 24 }}>
                <div className="flex-between mb-4">
                    <div style={{ fontWeight: 700 }}>Mi Progreso Personal</div>
                    <div style={{ fontWeight: 700, color: 'var(--accent-cyan)', fontSize: '1.1rem' }}>{pct}%</div>
                </div>
                <div className="progress-bar" style={{ height: 10 }}>
                    <div className="progress-fill" style={{ width: pct + '%', background: 'linear-gradient(90deg, var(--primary), var(--accent-cyan))' }} />
                </div>
                <div style={{ marginTop: 8, fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    {done} de {total} tareas completadas
                </div>
            </div>

            {/* TASK CARDS */}
            {myTasks.length === 0 ? (
                <div className="empty-state">
                    <div className="empty-state-icon">🎯</div>
                    <div className="empty-state-text">No tienes responsabilidades asignadas aún.<br />El jefe de oficina te asignará actividades pronto.</div>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {myTasks.map(t => (
                        <div key={t.id} className="card" style={{ display: 'flex', alignItems: 'flex-start', gap: 16, padding: '18px 20px' }}>
                            <div style={{ width: 42, height: 42, borderRadius: 12, background: t.estado === 'Completado' ? 'rgba(0,212,170,0.15)' : t.estado === 'Vencido' ? 'rgba(255,107,53,0.15)' : 'rgba(108,99,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                <span className="material-icons" style={{ fontSize: 22, color: t.estado === 'Completado' ? '#00D4AA' : t.estado === 'Vencido' ? '#FF6B35' : '#8A84FF' }}>
                                    {t.estado === 'Completado' ? 'check_circle' : t.estado === 'Vencido' ? 'timer_off' : t.estado === 'En Proceso' ? 'pending' : 'radio_button_unchecked'}
                                </span>
                            </div>
                            <div style={{ flex: 1 }}>
                                <div style={{ fontWeight: 700, marginBottom: 4 }}>{t.actividad}</div>
                                {t.descripcion && <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: 8 }}>{t.descripcion}</div>}
                                <div style={{ display: 'flex', gap: 12, fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                    <span>📅 Plazo: <strong style={{ color: new Date(t.plazo) < new Date() && t.estado !== 'Completado' ? '#FF6B35' : 'var(--text-secondary)' }}>{t.plazo}</strong></span>
                                    <span>⚡ {t.prioridad}</span>
                                </div>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
                                {statusBadge(t.estado)}
                                <select className="form-select" style={{ padding: '4px 8px', fontSize: '0.75rem', width: 'auto' }} value={t.estado} onChange={e => editTask(t.id, { estado: e.target.value })}>
                                    {['Pendiente', 'En Proceso', 'Completado'].map(s => <option key={s}>{s}</option>)}
                                </select>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
