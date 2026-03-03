import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context';

export default function Login() {
    const { signIn, signUp, funcionarios } = useApp();
    const [mode, setMode] = useState('login'); // 'login' | 'register'
    const [form, setForm] = useState({ email: '', password: '', nombre: '', rol: 'funcionario' });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const set = (k, v) => setForm(prev => ({ ...prev, [k]: v }));

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            if (mode === 'login') {
                await signIn({ email: form.email, password: form.password });
                navigate('/');
            } else {
                if (!form.nombre.trim()) { setError('El nombre es obligatorio.'); setLoading(false); return; }
                const data = await signUp({ email: form.email, password: form.password, nombre: form.nombre, rol: form.rol });
                if (data?.user && !data.session) {
                    setError('✅ Cuenta creada. Revisa tu correo para confirmar, luego inicia sesión.');
                    setMode('login');
                } else {
                    navigate('/');
                }
            }
        } catch (err) {
            const msgs = {
                'Invalid login credentials': 'Correo o contraseña incorrectos.',
                'Email not confirmed': 'Confirma tu correo antes de ingresar.',
                'User already registered': 'Este correo ya está registrado. Inicia sesión.',
            };
            setError(msgs[err.message] || err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-page">
            <div className="login-card">
                <div className="login-logo">
                    <div className="login-logo-icon">⚡</div>
                    <div className="login-title">Vibrant Flow</div>
                    <div className="login-subtitle">Tablero de Responsabilidades Institucional</div>
                </div>

                {/* MODE TABS */}
                <div style={{ display: 'flex', background: 'rgba(255,255,255,0.05)', borderRadius: 10, padding: 4, marginBottom: 24, gap: 4 }}>
                    {['login', 'register'].map(m => (
                        <button key={m} type="button"
                            onClick={() => { setMode(m); setError(''); }}
                            style={{
                                flex: 1, padding: '8px', border: 'none', borderRadius: 8,
                                background: mode === m ? 'rgba(108,99,255,0.4)' : 'transparent',
                                color: mode === m ? 'white' : 'var(--text-muted)',
                                fontFamily: 'Space Grotesk, sans-serif',
                                fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer',
                                transition: 'all 0.2s'
                            }}>
                            {m === 'login' ? '🔐 Iniciar Sesión' : '✨ Registrarse'}
                        </button>
                    ))}
                </div>

                <form onSubmit={handleSubmit}>
                    {mode === 'register' && (
                        <>
                            <div className="form-group">
                                <label className="form-label">Nombre completo</label>
                                <select className="form-select" value={form.nombre} onChange={e => set('nombre', e.target.value)} required>
                                    <option value="">Seleccione su nombre...</option>
                                    {funcionarios.map(f => <option key={f} value={f}>{f}</option>)}
                                </select>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Rol en la oficina</label>
                                <select className="form-select" value={form.rol} onChange={e => set('rol', e.target.value)}>
                                    <option value="jefe">👔 Jefe de Oficina</option>
                                    <option value="funcionario">👤 Funcionario</option>
                                </select>
                            </div>
                        </>
                    )}

                    <div className="form-group">
                        <label className="form-label">Correo institucional</label>
                        <input className="form-input" type="email" placeholder="usuario@oficina.gov.co" value={form.email} onChange={e => set('email', e.target.value)} required autoFocus />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Contraseña</label>
                        <input className="form-input" type="password" placeholder="Mínimo 6 caracteres" value={form.password} onChange={e => set('password', e.target.value)} required minLength={6} />
                    </div>

                    {error && (
                        <div style={{
                            padding: '10px 14px', borderRadius: 10, marginBottom: 16, fontSize: '0.82rem', lineHeight: 1.5,
                            background: error.startsWith('✅') ? 'rgba(0,212,170,0.1)' : 'rgba(255,107,53,0.12)',
                            border: error.startsWith('✅') ? '1px solid rgba(0,212,170,0.3)' : '1px solid rgba(255,107,53,0.3)',
                            color: error.startsWith('✅') ? 'var(--accent-cyan)' : 'var(--accent-orange)',
                        }}>
                            {error}
                        </div>
                    )}

                    <button type="submit" className="btn btn-primary login-btn" disabled={loading}>
                        {loading
                            ? <><span className="material-icons" style={{ fontSize: 18, animation: 'spin 1s linear infinite' }}>refresh</span> Procesando...</>
                            : <><span className="material-icons">rocket_launch</span> {mode === 'login' ? 'Ingresar al sistema' : 'Crear cuenta'}</>
                        }
                    </button>
                </form>

                {mode === 'login' && (
                    <div style={{ marginTop: 16, padding: '12px 16px', background: 'rgba(108,99,255,0.07)', borderRadius: 10, border: '1px solid rgba(108,99,255,0.15)', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                        💡 <strong style={{ color: 'var(--text-secondary)' }}>¿Primera vez?</strong> Haz clic en "Registrarse" para crear tu cuenta con tu correo institucional.
                    </div>
                )}

                <div style={{ marginTop: 20, textAlign: 'center', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                    Oficina de Planeación y Desarrollo · Sistema de Gestión Institucional
                </div>
            </div>

            <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
        </div>
    );
}
