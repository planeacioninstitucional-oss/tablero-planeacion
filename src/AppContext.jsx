import { useState, useEffect } from 'react';
import { supabase } from './supabase';
import { AppContext } from './context';

const funcionarios = [
    'PAOLA ANDREA OYOLA ALVIS',
    'LUIS ALEJANDRO GIRALDO MONTOYA',
    'LINDA KATHERIN GARCIA JIMENEZ',
    'ADRIANA ROCIO GUERP9 TRONCOSO',
    'MYRIAM LUCIA GARCIA ALVAREZ',
    'ANGY KATHERINE CRUZ AGUJA',
    'JORGE LUIS ROJAS',
    'AMA MARIA MORALES',
    'JAROL MAURICIO SANTOS LUNA',
    'ANDRES LAMPREA ARROYO',
    'SANDRA MARITZA MACHADO ROJAS',
    'MANUELA LUCIA GOMEZ GUACANEZ'
];

export function AppProvider({ children }) {
    const [user, setUser] = useState(null);          // { id, nombre, rol, email }
    const [authLoading, setAuthLoading] = useState(true);
    const [tasks, setTasks] = useState([]);
    const [kanbanCols, setKanbanCols] = useState([]);
    const [kanban, setKanban] = useState({});

    // ─── LOAD DATA ────────────────────────────────────────────────────────────
    const loadData = async () => {
        const [{ data: resp }, { data: cards }, { data: cols }] = await Promise.all([
            supabase.from('responsabilidades').select('*').order('created_at', { ascending: true }),
            supabase.from('kanban_cards').select('*').order('created_at', { ascending: true }),
            supabase.from('kanban_columns').select('*').order('orden', { ascending: true }),
        ]);
        if (resp) setTasks(resp.map(r => ({ ...r, plazo: r.plazo })));

        let fetchedCols = [];
        if (cols && cols.length > 0) {
            fetchedCols = cols;
            setKanbanCols(cols);
        } else {
            // Fallback default columns if DB is empty
            fetchedCols = [
                { key: 'spark', label: 'Spark 💡', color: '#FFD166' },
                { key: 'developing', label: 'Developing 🔄', color: '#6C63FF' },
                { key: 'moonshots', label: 'Moonshots 🚀', color: '#FF6B9D' },
                { key: 'shipped', label: 'Shipped ✅', color: '#00D4AA' },
            ];
            setKanbanCols(fetchedCols);
        }

        if (cards) {
            const grouped = {};
            fetchedCols.forEach(c => grouped[c.key] = []);
            cards.forEach(c => {
                if (grouped[c.columna]) grouped[c.columna].push(c);
                else grouped[c.columna] = [c]; // Safety for cards in deleted/unmapped cols
            });
            setKanban(grouped);
        }
    };

    // ─── AUTH: Listen to Supabase session ─────────────────────────────────────
    useEffect(() => {
        let mounted = true;

        const checkSession = async (session) => {
            try {
                if (session?.user) {
                    const { data: perfil, error } = await supabase
                        .from('perfiles')
                        .select('*')
                        .eq('id', session.user.id)
                        .maybeSingle();

                    if (error) {
                        console.error('Error fetching perfil:', error);
                        // Even if there's an error fetching profile, we shouldn't block the app loading infinitely
                    }

                    if (perfil) {
                        if (mounted) setUser({ id: session.user.id, email: session.user.email, nombre: perfil.nombre, rol: perfil.rol });
                        await loadData();
                    } else {
                        // Profile hasn't been created yet or user has no profile
                        if (mounted) setUser({ id: session.user.id, email: session.user.email, nombre: 'Usuario', rol: 'Funcionario' });
                    }
                } else {
                    if (mounted) {
                        setUser(null);
                        setTasks([]);
                        setKanbanCols([]);
                        setKanban({});
                    }
                }
            } catch (err) {
                console.error("Auth state change error:", err);
            } finally {
                if (mounted) setAuthLoading(false);
            }
        };

        // Extraer la sesión inicial por si onAuthStateChange no se dispara de inmediato
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (mounted && session) checkSession(session);
        });

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            if (mounted) checkSession(session);
        });

        return () => {
            mounted = false;
            subscription.unsubscribe();
        };
    }, []);

    // ─── SIGN UP ──────────────────────────────────────────────────────────────
    const signUp = async ({ email, password, nombre, rol }) => {
        // Pasamos nombre y rol como metadata → el trigger SQL los usa para crear el perfil
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: { data: { nombre, rol } },
        });
        if (error) throw error;

        // Fallback: si hay sesión inmediata (confirmación de email OFF), insertamos manualmente
        if (data.user && data.session) {
            const { error: perfilError } = await supabase
                .from('perfiles')
                .insert({ id: data.user.id, nombre, rol })
                .select()
                .maybeSingle();
            // Ignoramos error por duplicado (perfil ya creado por el trigger)
            if (perfilError && !perfilError.message.includes('duplicate')) throw perfilError;
        }
        return data;
    };

    // ─── SIGN IN ──────────────────────────────────────────────────────────────
    const signIn = async ({ email, password }) => {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        return data;
    };

    // ─── SIGN OUT ─────────────────────────────────────────────────────────────
    const signOut = async () => {
        await supabase.auth.signOut();
        setUser(null);
    };

    // ─── TASKS CRUD ───────────────────────────────────────────────────────────
    const addTask = async (task) => {
        const { data, error } = await supabase
            .from('responsabilidades')
            .insert({ ...task, creado_por: user?.id })
            .select()
            .single();
        if (error) throw error;
        setTasks(prev => [...prev, data]);
    };

    const editTask = async (id, updates) => {
        const { data, error } = await supabase
            .from('responsabilidades')
            .update(updates)
            .eq('id', id)
            .select()
            .single();
        if (error) throw error;
        setTasks(prev => prev.map(t => t.id === id ? data : t));
    };

    const deleteTask = async (id) => {
        const { error } = await supabase.from('responsabilidades').delete().eq('id', id);
        if (error) throw error;
        setTasks(prev => prev.filter(t => t.id !== id));
    };

    // ─── KANBAN CRUD ──────────────────────────────────────────────────────────
    const addKanbanCard = async (col, card) => {
        const { data, error } = await supabase
            .from('kanban_cards')
            .insert({ ...card, columna: col, autor_id: user?.id })
            .select()
            .single();
        if (error) throw error;
        setKanban(prev => ({ ...prev, [col]: [...prev[col], data] }));
    };

    const moveKanbanCard = async (cardId, fromCol, toCol) => {
        const { data, error } = await supabase
            .from('kanban_cards')
            .update({ columna: toCol })
            .eq('id', cardId)
            .select()
            .single();
        if (error) throw error;
        setKanban(prev => ({
            ...prev,
            [fromCol]: prev[fromCol].filter(c => c.id !== cardId),
            [toCol]: [...prev[toCol], data],
        }));
    };

    const deleteKanbanCard = async (cardId, col) => {
        const { error } = await supabase.from('kanban_cards').delete().eq('id', cardId);
        if (error) throw error;
        setKanban(prev => ({ ...prev, [col]: prev[col].filter(c => c.id !== cardId) }));
    };

    const addKanbanColumn = async (columnMsg) => {
        const baseKey = columnMsg.label.toLowerCase().replace(/[^a-z0-9]/g, '');
        const key = baseKey + '_' + Date.now().toString().slice(-4);
        const newColData = { ...columnMsg, key, orden: kanbanCols.length + 1 };

        const { data, error } = await supabase
            .from('kanban_columns')
            .insert(newColData)
            .select()
            .single();
        if (error) throw error;
        setKanbanCols(prev => [...prev, data]);
        setKanban(prev => ({ ...prev, [data.key]: [] }));
    };

    const deleteKanbanColumn = async (colKey) => {
        const { error } = await supabase.from('kanban_columns').delete().eq('key', colKey);
        if (error) throw error;
        // Also delete associated cards visually since DB might cascade
        setKanbanCols(prev => prev.filter(c => c.key !== colKey));
        setKanban(prev => {
            const newK = { ...prev };
            delete newK[colKey];
            return newK;
        });
    };

    return (
        <AppContext.Provider value={{
            user, authLoading,
            signUp, signIn, signOut,
            tasks, addTask, editTask, deleteTask,
            kanban, kanbanCols, addKanbanCard, moveKanbanCard, deleteKanbanCard, addKanbanColumn, deleteKanbanColumn,
            funcionarios,
            loadData,
        }}>
            {children}
        </AppContext.Provider>
    );
}
