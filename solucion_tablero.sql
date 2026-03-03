-- 1. Crear tabla de categorías (paneles) dinámicos
CREATE TABLE IF NOT EXISTS public.kanban_columns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key TEXT UNIQUE NOT NULL,
  label TEXT NOT NULL,
  color TEXT NOT NULL,
  orden INT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Permisos (RLS) para que cualquier usuario logueado pueda agregar/ver/eliminar columnas
ALTER TABLE public.kanban_columns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Auth users view kanban_columns" ON public.kanban_columns FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Auth users insert kanban_columns" ON public.kanban_columns FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Auth users update kanban_columns" ON public.kanban_columns FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Auth users delete kanban_columns" ON public.kanban_columns FOR DELETE USING (auth.role() = 'authenticated');

-- Agregar las columnas de ejemplo para que la DB inicialice bien
INSERT INTO public.kanban_columns (key, label, color, orden) VALUES 
('spark', 'Spark 💡', '#FFD166', 1),
('developing', 'Developing 🔄', '#6C63FF', 2),
('moonshots', 'Moonshots 🚀', '#FF6B9D', 3),
('shipped', 'Shipped ✅', '#00D4AA', 4)
ON CONFLICT (key) DO NOTHING;

-- 2. Quitar la restricción fija/estricta de las 4 columnas de la tabla de tarjetas
ALTER TABLE public.kanban_cards DROP CONSTRAINT IF EXISTS kanban_cards_columna_check;

-- 3. Arreglo para que se puedan eliminar tarjetas y hacer que si se borra una categoría, se borren sus tarjetas en cascada
-- Eliminamos política vieja estricta (que solo dejaba borrar al autor)
DROP POLICY IF EXISTS "Own kanban delete" ON public.kanban_cards;
CREATE POLICY "Auth users delete kanban" ON public.kanban_cards FOR DELETE USING (auth.role() = 'authenticated');

-- Prevenir tarjetas flotando para poder anclar foreign key
DELETE FROM public.kanban_cards WHERE columna NOT IN (SELECT key FROM public.kanban_columns);

-- Añadimos relación directa para que "columna" esté forzada a existir en public.kanban_columns
ALTER TABLE public.kanban_cards DROP CONSTRAINT IF EXISTS fk_kanban_columna;
ALTER TABLE public.kanban_cards ADD CONSTRAINT fk_kanban_columna FOREIGN KEY (columna) REFERENCES public.kanban_columns(key) ON DELETE CASCADE;
