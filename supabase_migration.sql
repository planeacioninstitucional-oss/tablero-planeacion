-- =============================================
-- TABLERO DE RESPONSABILIDADES - SCHEMA SETUP
-- Run this in Supabase SQL Editor
-- =============================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- TABLE: perfiles (linked to auth.users)
-- =============================================
CREATE TABLE IF NOT EXISTS public.perfiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nombre TEXT NOT NULL,
  rol TEXT NOT NULL CHECK (rol IN ('jefe', 'funcionario')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.perfiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view profiles" ON public.perfiles FOR SELECT USING (TRUE);
CREATE POLICY "Users insert own profile" ON public.perfiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users update own profile" ON public.perfiles FOR UPDATE USING (auth.uid() = id);

-- =============================================
-- TABLE: responsabilidades
-- =============================================
CREATE TABLE IF NOT EXISTS public.responsabilidades (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  actividad TEXT NOT NULL,
  responsable TEXT NOT NULL,
  responsable_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  plazo DATE NOT NULL,
  prioridad TEXT NOT NULL CHECK (prioridad IN ('Alta', 'Media', 'Baja')) DEFAULT 'Media',
  estado TEXT NOT NULL CHECK (estado IN ('Pendiente', 'En Proceso', 'Completado', 'Vencido')) DEFAULT 'Pendiente',
  descripcion TEXT DEFAULT '',
  creado_por UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.responsabilidades ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Auth users view responsabilidades" ON public.responsabilidades
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Jefes insert" ON public.responsabilidades
  FOR INSERT WITH CHECK (
    auth.role() = 'authenticated' AND
    EXISTS (SELECT 1 FROM public.perfiles WHERE id = auth.uid() AND rol = 'jefe')
  );

CREATE POLICY "Jefes update any" ON public.responsabilidades
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.perfiles WHERE id = auth.uid() AND rol = 'jefe')
  );

CREATE POLICY "Funcionarios update own estado" ON public.responsabilidades
  FOR UPDATE USING (
    responsable_id = auth.uid() AND
    EXISTS (SELECT 1 FROM public.perfiles WHERE id = auth.uid() AND rol = 'funcionario')
  );

CREATE POLICY "Jefes delete" ON public.responsabilidades
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.perfiles WHERE id = auth.uid() AND rol = 'jefe')
  );

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS responsabilidades_updated_at ON public.responsabilidades;
CREATE TRIGGER responsabilidades_updated_at
  BEFORE UPDATE ON public.responsabilidades
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- =============================================
-- TABLE: kanban_cards
-- =============================================
CREATE TABLE IF NOT EXISTS public.kanban_cards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  titulo TEXT NOT NULL,
  cuerpo TEXT DEFAULT '',
  color TEXT DEFAULT '#6C63FF',
  columna TEXT NOT NULL CHECK (columna IN ('spark', 'developing', 'moonshots', 'shipped')) DEFAULT 'spark',
  autor TEXT NOT NULL,
  autor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  fecha DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.kanban_cards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Auth users view kanban" ON public.kanban_cards
  FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Auth users insert kanban" ON public.kanban_cards
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Auth users update kanban" ON public.kanban_cards
  FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Own kanban delete" ON public.kanban_cards
  FOR DELETE USING (autor_id = auth.uid());

-- =============================================
-- SEED DATA (initial demo rows)
-- =============================================
INSERT INTO public.responsabilidades (actividad, responsable, plazo, prioridad, estado, descripcion) VALUES
  ('Informe mensual de gestión', 'María López', '2025-03-15', 'Alta', 'En Proceso', 'Consolidar indicadores del mes.'),
  ('Actualización Plan de Acción', 'Carlos Ruiz', '2025-03-20', 'Media', 'Pendiente', 'Revisar y ajustar actividades del PAM.'),
  ('Comité de seguimiento POA', 'Ana Torres', '2025-03-10', 'Alta', 'Completado', 'Preparar agenda y actas.'),
  ('Reporte SARO trimestral', 'Luis García', '2025-03-05', 'Alta', 'Vencido', 'Cargar matriz de riesgos.'),
  ('Capacitación cultura ciudadana', 'María López', '2025-03-28', 'Baja', 'Pendiente', 'Coordinar con colegios distritales.'),
  ('Revisión presupuestal Q1', 'Carlos Ruiz', '2025-03-25', 'Media', 'En Proceso', 'Verificar ejecución del presupuesto.')
ON CONFLICT DO NOTHING;

INSERT INTO public.kanban_cards (titulo, cuerpo, color, columna, autor, fecha) VALUES
  ('¿Sistema de turnos digital?', 'Reemplazar papeletas por app de turnos para comités.', '#6C63FF', 'spark', 'María López', CURRENT_DATE),
  ('Dashboard en pantalla TV', 'Proyectar el tablero en la TV de la sala de reuniones.', '#00D4AA', 'spark', 'Ana Torres', CURRENT_DATE),
  ('Plantilla de actas unificada', 'Una sola plantilla para todas las actas de comité.', '#FF6B35', 'developing', 'Carlos Ruiz', CURRENT_DATE),
  ('IA para informes automáticos', '¿Y si la IA redactara los informes mensuales?', '#FFD166', 'moonshots', 'Luis García', CURRENT_DATE),
  ('Nuevo formato de actas aprobado', 'Formato estándar adoptado para todas las actas.', '#FF6B9D', 'shipped', 'Ana Torres', CURRENT_DATE)
ON CONFLICT DO NOTHING;
