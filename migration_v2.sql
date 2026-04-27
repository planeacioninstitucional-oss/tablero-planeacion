-- =============================================
-- MIGRACIÓN: Eliminar estado "En Proceso"
-- Ejecutar en el SQL Editor de Supabase
-- =============================================

-- 1. Migrar todos los registros 'En Proceso' → 'Pendiente'
UPDATE public.responsabilidades
SET estado = 'Pendiente'
WHERE estado = 'En Proceso';

-- 2. Quitar la restricción antigua
ALTER TABLE public.responsabilidades
  DROP CONSTRAINT IF EXISTS responsabilidades_estado_check;

-- 3. Crear la restricción nueva sin 'En Proceso'
ALTER TABLE public.responsabilidades
  ADD CONSTRAINT responsabilidades_estado_check
  CHECK (estado IN ('Pendiente', 'Completado', 'Vencido'));

-- =============================================
-- STORAGE: Crear bucket "galeria" para imágenes
-- =============================================

-- Crear el bucket público
INSERT INTO storage.buckets (id, name, public)
VALUES ('galeria', 'galeria', TRUE)
ON CONFLICT (id) DO NOTHING;

-- Política: cualquier usuario autenticado puede ver las imágenes
CREATE POLICY "Authenticated can view galeria"
ON storage.objects FOR SELECT
USING (bucket_id = 'galeria' AND auth.role() = 'authenticated');

-- Política: jefes pueden subir imágenes
CREATE POLICY "Jefes can upload galeria"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'galeria' AND
  auth.role() = 'authenticated' AND
  EXISTS (SELECT 1 FROM public.perfiles WHERE id = auth.uid() AND rol = 'jefe')
);

-- Política: jefes pueden eliminar imágenes
CREATE POLICY "Jefes can delete galeria"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'galeria' AND
  EXISTS (SELECT 1 FROM public.perfiles WHERE id = auth.uid() AND rol = 'jefe')
);
