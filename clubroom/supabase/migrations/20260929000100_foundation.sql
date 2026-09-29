-- Clubroom foundation: extensions, enums, helper schema.
-- Every club-owned table carries club_id and is covered by RLS (see 000400_policies.sql).

create extension if not exists pgcrypto with schema extensions;
create extension if not exists citext with schema extensions;

-- Helper functions live here so PostgREST never exposes them directly.
create schema if not exists app;
revoke all on schema app from public;
grant usage on schema app to authenticated, anon, service_role;

create type public.club_role as enum ('admin', 'coach', 'parent', 'player');
create type public.membership_status as enum ('invited', 'active', 'removed');
create type public.club_status as enum ('onboarding', 'active', 'suspended', 'closed');
create type public.person_kind as enum ('player', 'guardian', 'staff');
create type public.age_rule_mode as enum ('birth_year', 'age_at_date');
create type public.registration_source as enum ('public_form', 'admin', 'import');
create type public.registration_status as enum ('new', 'reviewed', 'placed', 'withdrawn');
create type public.event_kind as enum ('game', 'training', 'other');
create type public.availability_status as enum ('in', 'out', 'unknown');
create type public.fee_status as enum ('owing', 'partial', 'paid', 'waived');
create type public.payment_method as enum ('cash', 'bank', 'card', 'stripe', 'other');
create type public.task_status as enum ('open', 'done');
create type public.submission_kind as enum ('incident', 'complaint', 'suggestion', 'absence', 'medical_update');
create type public.submission_status as enum ('new', 'in_progress', 'closed');
create type public.clearance_kind as enum ('wwcc');
create type public.subscription_status as enum ('trialing', 'active', 'past_due', 'cancelled', 'unpaid', 'paused');
create type public.plan_key as enum ('starter', 'club', 'association');
create type public.theme_pref as enum ('dark', 'light', 'system');

-- updated_at maintenance
create or replace function app.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;
