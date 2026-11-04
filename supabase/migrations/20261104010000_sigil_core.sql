-- Sigil core schema. All access goes through the sigil_app role from server code; anon and authenticated
-- get nothing (RLS on, no policy for them). Personal fields never live here at rest: seals and shares are
-- ciphertext; a pending confirm request holds the claim only until the registrar decides, then it is wiped.

create table public.orgs (
  id text primary key,                 -- did:web:...
  slug text unique not null,
  name text not null,
  kind text not null check (kind in ('college','employer','committee')),
  domain text,
  tier text not null default 'B' check (tier in ('A','B','C')),
  state text not null default 'active' check (state in ('active','suspended','merged','renamed','closed','derecognised','fake')),
  state_since timestamptz,
  custodian text,
  manifest jsonb not null default '[]',
  final_status_version int,
  public_key text not null,
  enc_private_key text not null,       -- AES-GCM under SIGIL_MASTER_KEY
  access_code_hash text,               -- scrypt; null = no console login
  sample boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.status_lists (
  org_id text primary key references public.orgs(id),
  bits bytea not null,
  version int not null default 1,
  next_index int not null default 0,
  published jsonb,                     -- last signed { body, sig }
  published_at timestamptz
);

create table public.trust_list (
  id int primary key default 1 check (id = 1),
  list jsonb not null,
  updated_at timestamptz not null default now()
);

create table public.wallets (
  id uuid primary key default gen_random_uuid(),
  sign_pub text unique not null,       -- holder ES256 public key (spki, base64url)
  ecdh_pub text not null,              -- seals are encrypted to this key
  created_at timestamptz not null default now()
);

create table public.used_nonces (
  nonce text primary key,
  expires_at timestamptz not null
);

create table public.requests (
  id uuid primary key default gen_random_uuid(),
  wallet_id uuid not null references public.wallets(id) on delete cascade,
  org_id text not null references public.orgs(id),
  kind text not null,
  fields jsonb,                        -- wiped when decided
  state text not null default 'pending' check (state in ('pending','approved','declined')),
  decided_at timestamptz,
  created_at timestamptz not null default now()
);
create index on public.requests (org_id, state);
create index on public.requests (wallet_id);

create table public.seals (
  id uuid primary key default gen_random_uuid(),
  wallet_id uuid references public.wallets(id) on delete cascade,  -- null until a bulk claim link is opened
  org_id text not null references public.orgs(id),
  request_id uuid references public.requests(id),
  kind text not null,
  status_idx int not null,
  header_id text not null,
  ciphertext text not null,            -- only the holder can open this
  label text,                          -- issuer's own reference, never a name (roll or batch tag)
  revoked_at timestamptz,
  revoke_reason text,
  created_at timestamptz not null default now()
);
create index on public.seals (wallet_id);
create index on public.seals (org_id);

create table public.shares (
  id text primary key,
  wallet_id uuid not null references public.wallets(id) on delete cascade,
  ciphertext text not null,            -- key lives in the link fragment, never sent to us
  shown text[] not null default '{}',  -- field names only, for the receipt
  expires_at timestamptz not null,
  stopped_at timestamptz,
  created_at timestamptz not null default now()
);
create index on public.shares (wallet_id);

create table public.receipts (
  id uuid primary key default gen_random_uuid(),
  share_id text not null references public.shares(id) on delete cascade,
  verdict text not null,
  viewer text not null,                -- salted hash, not an IP
  viewed_at timestamptz not null default now()
);
create index on public.receipts (share_id);

create table public.cert_index (
  sha256 text primary key,
  org_id text not null references public.orgs(id),
  code text,
  kind text not null,
  added_at timestamptz not null default now()
);

create table public.audit_log (
  seq bigint generated always as identity primary key,
  at timestamptz not null default now(),
  actor text not null,
  action text not null,
  target text,
  prev_hash text not null,
  hash text not null
);

do $$
declare t text;
begin
  foreach t in array array['orgs','status_lists','trust_list','wallets','used_nonces','requests','seals','shares','receipts','cert_index','audit_log']
  loop
    execute format('alter table public.%I enable row level security', t);
    execute format('grant select, insert, update, delete on public.%I to sigil_app', t);
    execute format('create policy sigil_app_all on public.%I for all to sigil_app using (true) with check (true)', t);
  end loop;
end $$;

grant usage on schema public to sigil_app;
grant usage, select on all sequences in schema public to sigil_app;
-- The audit log is append only, even for the app.
revoke update, delete on public.audit_log from sigil_app;
