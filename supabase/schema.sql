-- ============================================================================
-- TRANSPORTE EXPRESO 38 S.R.L. — ESQUEMA POSTGRESQL PARA SUPABASE
-- ============================================================================
-- Instrucciones de integración:
-- 1. Abra su proyecto en https://supabase.com/dashboard
-- 2. Vaya a "SQL Editor" -> "New query"
-- 3. Pegue este script completo y presione "Run"
-- ============================================================================

-- 1. Función para actualizar automáticamente la columna updated_at
create or replace function public.set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- 2. Tabla principal de Cotizaciones B2B (public.cotizaciones)
create table if not exists public.cotizaciones (
  id bigint generated always as identity primary key,
  codigo_referencia text not null unique,
  nombre_contacto text not null,
  empresa text not null,
  email text not null,
  telefono text not null,
  provincia_origen text not null,
  localidad_origen text not null,
  destino_region text not null,
  destino_etiqueta text not null,
  localidad_destino text not null,
  tipo_carga text not null,
  peso_toneladas numeric(6, 2) not null check (peso_toneladas > 0 and peso_toneladas <= 120),
  fecha_estimada date null,
  observaciones text null,
  corredor_sugerido text not null default 'Red Troncal Nacional',
  distancia_estimada_km integer not null default 0 check (distancia_estimada_km >= 0),
  sla_estimado text not null default '24 a 72 hs',
  estado text not null default 'pendiente' check (
    estado in ('pendiente', 'en_revision', 'cotizado', 'en_transito', 'completado', 'cancelado')
  ),
  email_notificado boolean not null default false,
  origen_solicitud text not null default 'web_b2b',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.cotizaciones is 'Solicitudes de cotización de transporte nacional e internacional Mercosur de Transporte Expreso 38 SRL.';

-- 3. Índices de rendimiento (B-Tree) siguiendo buenas prácticas de Supabase Postgres
create index if not exists idx_cotizaciones_created_at on public.cotizaciones (created_at desc);
create index if not exists idx_cotizaciones_estado on public.cotizaciones (estado);
create index if not exists idx_cotizaciones_email on public.cotizaciones (lower(email));
create index if not exists idx_cotizaciones_destino_region on public.cotizaciones (destino_region);

-- 4. Trigger automático para updated_at
drop trigger if exists trg_cotizaciones_updated_at on public.cotizaciones;
create trigger trg_cotizaciones_updated_at
before update on public.cotizaciones
for each row
execute function public.set_updated_at();

-- 5. Permisos para Data API de Supabase (PostgREST)
grant usage on schema public to anon, authenticated, service_role;
grant select, insert, update, delete on table public.cotizaciones to service_role;
grant insert on table public.cotizaciones to anon, authenticated;

-- 6. Seguridad a Nivel de Filas (Row Level Security - RLS)
alter table public.cotizaciones enable row level security;

-- Política 1: Permitir inserción de nuevas solicitudes desde el backend o cliente público con validación básica
drop policy if exists "Permitir creacion de cotizaciones B2B" on public.cotizaciones;
create policy "Permitir creacion de cotizaciones B2B"
on public.cotizaciones
for insert
to anon, authenticated
with check (
  char_length(trim(nombre_contacto)) >= 2
  and char_length(trim(empresa)) >= 2
  and position('@' in email) > 1
  and peso_toneladas > 0
);

-- Política 2: Lectura y administración restringida a operadores autenticados con rol admin en app_metadata
-- (Nota: El backend con SUPABASE_SERVICE_ROLE_KEY tiene acceso administrativo completo automáticamente)
drop policy if exists "Operadores admin pueden leer cotizaciones" on public.cotizaciones;
create policy "Operadores admin pueden leer cotizaciones"
on public.cotizaciones
for select
to authenticated
using (
  coalesce((select auth.jwt() -> 'app_metadata' ->> 'role'), '') = 'admin'
);

drop policy if exists "Operadores admin pueden actualizar cotizaciones" on public.cotizaciones;
create policy "Operadores admin pueden actualizar cotizaciones"
on public.cotizaciones
for update
to authenticated
using (
  coalesce((select auth.jwt() -> 'app_metadata' ->> 'role'), '') = 'admin'
)
with check (
  coalesce((select auth.jwt() -> 'app_metadata' ->> 'role'), '') = 'admin'
);

