create table public.pdf_template_variants (
  id uuid primary key default gen_random_uuid(),
  template_id uuid not null references public.pdf_templates(id) on delete cascade,
  name text not null,
  file_url text not null,
  file_key text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_pdf_template_variants_template_id on public.pdf_template_variants(template_id);

create trigger set_pdf_template_variants_updated_at
  before update on public.pdf_template_variants
  for each row execute function set_updated_at();

create table public.pdf_template_field_overrides (
  id uuid primary key default gen_random_uuid(),
  variant_id uuid not null references public.pdf_template_variants(id) on delete cascade,
  field_id uuid not null references public.pdf_template_fields(id) on delete cascade,
  font_family text,
  font_size integer,
  font_source text,
  font_variant text,
  uploaded_font_key text,
  font_id uuid references public.pdf_fonts(id) on delete set null,
  text_color text,
  display_label text,
  is_enabled boolean,
  multiline boolean,
  date_format text,
  level_format text,
  custom_default_value text,
  custom_overridable boolean,
  qr_dots_color text,
  qr_bg_color text,
  qr_dots_type text,
  qr_corners_type text,
  qr_corners_color text,
  unique(variant_id, field_id)
);

create index idx_pdf_template_field_overrides_variant_id on public.pdf_template_field_overrides(variant_id);
create index idx_pdf_template_field_overrides_field_id on public.pdf_template_field_overrides(field_id);

alter table public.certificate_claims
  add column pdf_template_variant_id uuid references public.pdf_template_variants(id) on delete set null;
