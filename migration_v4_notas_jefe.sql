-- ============================================================
-- MIGRATION V4: Tabla de Notas del Jefe (Editor de Texto Rico)
-- ============================================================
-- Ejecutar en el SQL Editor de Supabase

CREATE TABLE IF NOT EXISTS public.notas_jefe (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    titulo TEXT NOT NULL DEFAULT 'Sin título',
    contenido TEXT DEFAULT '',
    color TEXT DEFAULT '#1A1A2E',
    fijada BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    autor_id UUID REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Habilitar RLS
ALTER TABLE public.notas_jefe ENABLE ROW LEVEL SECURITY;

-- Solo el autor puede ver/editar sus notas
CREATE POLICY "jefe_notas_select" ON public.notas_jefe
    FOR SELECT USING (auth.uid() = autor_id);

CREATE POLICY "jefe_notas_insert" ON public.notas_jefe
    FOR INSERT WITH CHECK (auth.uid() = autor_id);

CREATE POLICY "jefe_notas_update" ON public.notas_jefe
    FOR UPDATE USING (auth.uid() = autor_id);

CREATE POLICY "jefe_notas_delete" ON public.notas_jefe
    FOR DELETE USING (auth.uid() = autor_id);

-- Índice para consulta rápida
CREATE INDEX idx_notas_jefe_autor ON public.notas_jefe(autor_id);
