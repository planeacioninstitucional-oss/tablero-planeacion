-- =============================================
-- MIGRACIÓN: Agregar campo "archivado"
-- Ejecutar en el SQL Editor de Supabase
-- =============================================

ALTER TABLE public.responsabilidades
ADD COLUMN IF NOT EXISTS archivado BOOLEAN DEFAULT FALSE;
