-- The public form needs to know whether the club may still take registrations.
create or replace function public.get_public_form(p_slug text)
returns jsonb language sql stable security definer set search_path = '' as $$
  select jsonb_build_object(
    'club', jsonb_build_object(
      'slug', c.slug, 'name', c.name, 'short_name', c.short_name, 'sport_key', c.sport_key,
      'logo_path', c.logo_path, 'colours', c.colours, 'theme_default', c.theme_default,
      'public_page', c.public_page, 'suburb', c.suburb, 'state', c.state,
      'instagram_handle', c.instagram_handle, 'website', c.website, 'is_demo', c.is_demo,
      'timezone', c.timezone, 'contact_email', c.contact_email, 'contact_phone', c.contact_phone,
      'vocabulary', coalesce(s.vocabulary, '{}'::jsonb) || coalesce(c.settings -> 'vocabulary', '{}'::jsonb)
    ),
    'form', (select jsonb_build_object('id', f.id, 'version', f.version, 'intro', f.intro,
                'collection_notice', f.collection_notice, 'fields', f.fields, 'consents', f.consents)
             from public.form_templates f where f.club_id = c.id and f.is_active),
    'season', (select jsonb_build_object('id', se.id, 'name', se.name, 'starts_on', se.starts_on,
                'fee_cents', se.fee_cents, 'fee_label', se.fee_label, 'registration_open', se.registration_open,
                'age_rule_mode', se.age_rule_mode, 'age_cutoff_date', se.age_cutoff_date,
                'divisions', (select coalesce(jsonb_agg(jsonb_build_object('name', d.name, 'sort', d.sort,
                    'born_from', d.born_from, 'born_to', d.born_to, 'min_age', d.min_age, 'max_age', d.max_age, 'gender', d.gender)
                    order by d.sort), '[]'::jsonb) from public.divisions d where d.season_id = se.id))
               from public.seasons se where se.club_id = c.id and se.is_current),
    'billing', (select jsonb_build_object('status', sub.status, 'trial_ends_at', sub.trial_ends_at)
                from public.subscriptions sub where sub.club_id = c.id)
  )
  from public.clubs c
  left join public.sports s on s.key = c.sport_key
  where c.slug = lower(p_slug) and c.status = 'active';
$$;
