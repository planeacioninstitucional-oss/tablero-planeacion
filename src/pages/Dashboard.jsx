import { useApp } from '../context';

const getBars = () => [60, 80, 45, 90, 70, 55, 88];
const barColors = ['#6C63FF', '#00D4AA', '#FF6B35', '#6C63FF', '#00D4AA', '#FFD166', '#6C63FF'];
const days = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];

export default function Dashboard() {
    const { user, tasks } = useApp();
    const total = tasks.length;
    const completadas = tasks.filter(t => t.estado === 'Completado').length;
    const pendientes = tasks.filter(t => t.estado === 'Pendiente').length;
    const vencidas = tasks.filter(t => t.estado === 'Vencido').length;
    const urgentes = tasks.filter(t => t.prioridad === 'Alta' && t.estado !== 'Completado');
    const proximas = tasks
        .filter(t => t.estado !== 'Completado')
        .sort((a, b) => new Date(a.plazo) - new Date(b.plazo))
        .slice(0, 4);

    const pct = Math.round((completadas / total) * 100);

    const statusBadge = (e) => {
        const m = { 'Pendiente': 'badge-pending', 'Completado': 'badge-done', 'Vencido': 'badge-overdue' };
        return <span className={'badge ' + (m[e] || 'badge-pending')}><span>●</span>{e}</span>;
    };

    return (
        <div className="page-container">
            {/* WELCOME */}
            <div style={{ marginBottom: 28, padding: '28px 32px', borderRadius: 'var(--radius)', background: 'linear-gradient(135deg, rgba(108,99,255,0.2), rgba(0,212,170,0.1))', border: '1px solid rgba(108,99,255,0.25)', position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', right: 24, top: '50%', transform: 'translateY(-50%)', fontSize: 80, opacity: 0.08 }}>⚡</div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: 6, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                    {user?.rol === 'jefe' ? '👔 Jefe de Oficina' : '👤 Funcionario'}
                </div>
                <div style={{ fontSize: '1.6rem', fontWeight: 700 }}>
                    Buenos días, <span style={{ color: 'var(--primary-light)' }}>{user?.nombre || 'Usuario'}</span>
                </div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: 4 }}>
                    {new Date().toLocaleDateString('es-CO', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </div>
                <div style={{ marginTop: 16, display: 'flex', alignItems: 'center', gap: 14 }}>
                    <div style={{ flex: 1, maxWidth: 240 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                            <span>Cumplimiento global</span><span style={{ color: 'var(--accent-cyan)', fontWeight: 700 }}>{pct}%</span>
                        </div>
                        <div className="progress-bar">
                            <div className="progress-fill" style={{ width: pct + '%', background: 'linear-gradient(90deg, var(--primary), var(--accent-cyan))' }} />
                        </div>
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', paddingLeft: 16, borderLeft: '1px solid var(--border)' }}>
                        {vencidas > 0
                            ? <><span style={{ color: 'var(--status-overdue)' }}>⚠️ {vencidas} tarea{vencidas !== 1 ? 's' : ''} vencida{vencidas !== 1 ? 's' : ''}</span> que requieren atención</>
                            : <span style={{ color: 'var(--accent-cyan)' }}>✅ Sin tareas vencidas</span>
                        }
                    </div>
                </div>
            </div>

            {/* KPI CARDS */}
            <div className="kpi-grid">
                {[
                    { label: 'Total Actividades', value: total, icon: 'list_alt', color: '#6C63FF', sub: 'Asignadas a la oficina' },
                    { label: 'Completadas', value: completadas, icon: 'check_circle', color: '#00D4AA', sub: `${pct}% del total` },
                    { label: 'Pendientes', value: pendientes, icon: 'hourglass_empty', color: '#FFD166', sub: 'Pendientes de ejecución' },
                    { label: 'Vencidas', value: vencidas, icon: 'timer_off', color: '#FF6B35', sub: 'Requieren atención urgente' },
                ].map(k => (
                    <div key={k.label} className="kpi-card">
                        <div className="kpi-label">{k.label}</div>
                        <div className="kpi-value" style={{ color: k.color }}>{k.value}</div>
                        <div className="kpi-sub">{k.sub}</div>
                        <span className="material-icons kpi-icon" style={{ color: k.color }}>{k.icon}</span>
                        <div style={{ position: 'absolute', top: 0, right: 0, width: 80, height: 80, borderRadius: '50%', background: k.color, opacity: 0.12, filter: 'blur(25px)' }} />
                    </div>
                ))}
            </div>

            <div className="grid-2" style={{ gap: 20 }}>
                {/* VELOCITY CHART */}
                <div className="card">
                    <div className="flex-between mb-4">
                        <div>
                            <div style={{ fontWeight: 700, fontSize: '1rem' }}>Team Velocity</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Tareas completadas esta semana</div>
                        </div>
                        <span className="material-icons" style={{ color: 'var(--primary-light)', fontSize: 22 }}>bar_chart</span>
                    </div>
                    <div className="bar-chart" style={{ alignItems: 'flex-end', height: 90, gap: 6 }}>
                        {getBars().map((h, i) => (
                            <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                                <div className="bar" style={{ width: '100%', height: h + '%', background: barColors[i], borderRadius: '6px 6px 0 0', opacity: i === 6 ? 1 : 0.6 }} />
                                <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{days[i]}</div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* CRITICAL */}
                <div className="card">
                    <div className="flex-between mb-4">
                        <div>
                            <div style={{ fontWeight: 700, fontSize: '1rem' }}>Misiones Críticas</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Alta prioridad pendientes</div>
                        </div>
                        <span className="material-icons" style={{ color: 'var(--accent-orange)', fontSize: 22 }}>priority_high</span>
                    </div>
                    {urgentes.length === 0
                        ? <div className="empty-state"><div className="empty-state-icon">🎯</div><div className="empty-state-text">Sin misiones críticas pendientes</div></div>
                        : urgentes.slice(0, 3).map(t => (
                            <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                                <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent-pink)', flexShrink: 0 }} />
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>{t.actividad}</div>
                                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{t.responsable} · {t.plazo}</div>
                                </div>
                                {statusBadge(t.estado)}
                            </div>
                        ))}
                </div>
            </div>

            {/* UPCOMING DEADLINES */}
            <div className="card mt-6">
                <div className="flex-between mb-4">
                    <div>
                        <div style={{ fontWeight: 700, fontSize: '1rem' }}>Próximos Vencimientos</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Ordenadas por fecha más próxima</div>
                    </div>
                    <span className="material-icons" style={{ color: 'var(--accent-cyan)', fontSize: 22 }}>schedule</span>
                </div>
                <div className="table-container">
                    <table className="data-table">
                        <thead><tr><th>Actividad</th><th>Responsable</th><th>Plazo</th><th>Estado</th></tr></thead>
                        <tbody>
                            {proximas.map(t => (
                                <tr key={t.id}>
                                    <td style={{ fontWeight: 500 }}>{t.actividad}</td>
                                    <td style={{ color: 'var(--text-secondary)' }}>{t.responsable}</td>
                                    <td style={{ color: new Date(t.plazo) < new Date() ? 'var(--accent-orange)' : 'var(--text-secondary)' }}>{t.plazo}</td>
                                    <td>{statusBadge(t.estado)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
