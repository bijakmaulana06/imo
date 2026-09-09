-- Apply once through the Supabase SQL editor / a privileged migration connection.
-- No NIM, access code, session token, or individual ballot is readable by browser roles.
begin;

create table if not exists public.voting_elections (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 1 and 160),
  year text not null check (char_length(year) between 1 and 20),
  status text not null default 'draft' check (status in ('draft', 'open', 'closed')),
  opens_at timestamptz,
  closes_at timestamptz,
  is_current boolean not null default false,
  created_at timestamptz not null default now(),
  check (opens_at is null or closes_at is null or closes_at > opens_at)
);
create unique index if not exists voting_one_current_election on public.voting_elections (is_current) where is_current;

create table if not exists public.voting_candidates (
  id uuid primary key default gen_random_uuid(),
  election_id uuid not null references public.voting_elections(id) on delete restrict,
  number integer not null check (number between 1 and 99),
  name text not null check (char_length(name) between 1 and 160),
  tagline text not null default '' check (char_length(tagline) <= 300),
  vision text not null default '' check (char_length(vision) <= 6000),
  mission text[] not null default '{}',
  photo_key text check (char_length(photo_key) <= 400),
  accent text not null default '#bfa276' check (accent ~ '^#[0-9A-Fa-f]{6}$'),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (election_id, number),
  unique (election_id, id)
);

create table if not exists public.voting_eligible_voters (
  id uuid primary key default gen_random_uuid(),
  election_id uuid not null references public.voting_elections(id) on delete restrict,
  nim_hash text not null check (nim_hash ~ '^[0-9a-f]{64}$'),
  access_code_hash text not null check (access_code_hash ~ '^[0-9a-f]{64}$'),
  nim_suffix text not null check (char_length(nim_suffix) >= 1 and char_length(nim_suffix) <= 16),
  enabled boolean not null default true,
  created_at timestamptz not null default now(),
  unique (election_id, nim_hash),
  unique (election_id, id)
);

create table if not exists public.voting_sessions (
  token_hash text primary key check (token_hash ~ '^[0-9a-f]{64}$'),
  election_id uuid not null,
  voter_id uuid not null,
  user_agent_hash text not null check (user_agent_hash ~ '^[0-9a-f]{64}$'),
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '15 minutes'),
  foreign key (election_id, voter_id) references public.voting_eligible_voters(election_id, id) on delete cascade,
  unique (election_id, voter_id),
  check (expires_at > created_at and expires_at <= created_at + interval '15 minutes')
);
create index if not exists voting_sessions_expiry_idx on public.voting_sessions (expires_at);

create table if not exists public.voting_votes (
  id uuid primary key default gen_random_uuid(),
  election_id uuid not null,
  voter_id uuid not null,
  candidate_id uuid not null,
  receipt uuid not null default gen_random_uuid() unique,
  created_at timestamptz not null default now(),
  foreign key (election_id, voter_id) references public.voting_eligible_voters(election_id, id) on delete restrict,
  foreign key (election_id, candidate_id) references public.voting_candidates(election_id, id) on delete restrict,
  -- This database constraint is the final guarantee against concurrent/double votes.
  unique (election_id, voter_id)
);
create index if not exists voting_votes_timeline_idx on public.voting_votes (election_id, created_at);

-- Aggregate totals are private to the authorized monitoring API.
create table if not exists public.voting_tallies (
  election_id uuid not null,
  candidate_id uuid not null,
  vote_count bigint not null default 0 check (vote_count >= 0),
  updated_at timestamptz not null default now(),
  primary key (election_id, candidate_id),
  foreign key (election_id, candidate_id) references public.voting_candidates(election_id, id) on delete restrict
);

-- A public invalidation signal contains no identities, candidate choices, or totals.
create table if not exists public.voting_updates (
  election_id uuid primary key references public.voting_elections(id) on delete cascade,
  updated_at timestamptz not null default now()
);

create table if not exists public.voting_admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.voting_rate_limits (
  key text primary key check (char_length(key) <= 240),
  hits integer not null default 1 check (hits >= 1),
  resets_at timestamptz not null
);
create index if not exists voting_rate_limits_expiry_idx on public.voting_rate_limits (resets_at);

alter table public.voting_elections enable row level security;
alter table public.voting_candidates enable row level security;
alter table public.voting_eligible_voters enable row level security;
alter table public.voting_sessions enable row level security;
alter table public.voting_votes enable row level security;
alter table public.voting_tallies enable row level security;
alter table public.voting_updates enable row level security;
alter table public.voting_admins enable row level security;
alter table public.voting_rate_limits enable row level security;

revoke all on public.voting_elections, public.voting_candidates, public.voting_eligible_voters,
  public.voting_sessions, public.voting_votes, public.voting_tallies, public.voting_updates, public.voting_admins,
  public.voting_rate_limits from public, anon, authenticated, service_role;

grant select, insert, update, delete on public.voting_elections, public.voting_candidates,
  public.voting_eligible_voters, public.voting_admins to service_role;
grant select, delete on public.voting_sessions to service_role;
grant select on public.voting_votes, public.voting_tallies to service_role;
grant select on public.voting_updates to anon, authenticated, service_role;
drop policy if exists voting_tallies_public_read on public.voting_tallies;
drop policy if exists voting_updates_public_read on public.voting_updates;
create policy voting_updates_public_read on public.voting_updates for select to anon, authenticated using (true);

create or replace function public.voting_publish_update()
returns trigger language plpgsql security definer set search_path = '' as $$
declare v_election_id uuid;
begin
  if tg_table_name = 'voting_elections' then v_election_id := new.id;
  elsif tg_op = 'DELETE' then v_election_id := old.election_id;
  else v_election_id := new.election_id;
  end if;
  insert into public.voting_updates (election_id, updated_at) values (v_election_id, clock_timestamp())
  on conflict (election_id) do update set updated_at = excluded.updated_at;
  return null;
end;
$$;
revoke all on function public.voting_publish_update() from public, anon, authenticated;
drop trigger if exists voting_election_updated on public.voting_elections;
create trigger voting_election_updated after insert or update on public.voting_elections
for each row execute function public.voting_publish_update();
drop trigger if exists voting_candidate_updated on public.voting_candidates;
create trigger voting_candidate_updated after insert or update or delete on public.voting_candidates
for each row execute function public.voting_publish_update();
insert into public.voting_updates (election_id) select id from public.voting_elections on conflict do nothing;

-- Fixed windows use a single upsert, so limits work across server instances.
create or replace function public.voting_rate_limit(p_key text, p_limit integer, p_window_seconds integer)
returns boolean language plpgsql security definer set search_path = '' as $$
declare v_hits integer;
begin
  if char_length(p_key) > 240 or p_limit < 1 or p_limit > 100000 or p_window_seconds < 1 or p_window_seconds > 86400 then
    return false;
  end if;
  insert into public.voting_rate_limits as r (key, hits, resets_at)
  values (p_key, 1, clock_timestamp() + make_interval(secs => p_window_seconds))
  on conflict (key) do update set
    hits = case when r.resets_at <= clock_timestamp() then 1 else least(r.hits + 1, 100001) end,
    resets_at = case when r.resets_at <= clock_timestamp() then clock_timestamp() + make_interval(secs => p_window_seconds) else r.resets_at end
  returning hits into v_hits;
  -- Bound abandoned limiter rows without requiring an external scheduler.
  delete from public.voting_rate_limits where key in
    (select key from public.voting_rate_limits where resets_at < clock_timestamp() - interval '1 day' limit 100 for update skip locked);
  return v_hits <= p_limit;
end;
$$;

create or replace function public.voting_start_session(
  p_election_id uuid, p_nim_hash text, p_access_code_hash text, p_token_hash text, p_user_agent_hash text
)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  v_election public.voting_elections%rowtype;
  v_voter public.voting_eligible_voters%rowtype;
  v_receipt uuid;
  v_expires timestamptz;
begin
  select * into v_election from public.voting_elections where id = p_election_id for share;
  if not found then return jsonb_build_object('status', 'unavailable'); end if;
  -- Verify voter solely by registered and active NIM
  select * into v_voter from public.voting_eligible_voters
  where election_id = p_election_id and nim_hash = p_nim_hash and enabled
  for update;
  if not found then return jsonb_build_object('status', 'invalid'); end if;
  select receipt into v_receipt from public.voting_votes where election_id = p_election_id and voter_id = v_voter.id;
  -- A voter can recover their receipt after closing; an uncast voter cannot begin a closed election.
  if v_receipt is null and (v_election.status <> 'open'
    or (v_election.opens_at is not null and clock_timestamp() < v_election.opens_at)
    or (v_election.closes_at is not null and clock_timestamp() >= v_election.closes_at)) then
    return jsonb_build_object('status', 'closed');
  end if;
  v_expires := clock_timestamp() + interval '15 minutes';
  delete from public.voting_sessions where election_id = p_election_id and voter_id = v_voter.id;
  delete from public.voting_sessions where token_hash in
    (select token_hash from public.voting_sessions where expires_at <= clock_timestamp() limit 100 for update skip locked);
  insert into public.voting_sessions (token_hash, election_id, voter_id, user_agent_hash, created_at, expires_at)
  values (p_token_hash, p_election_id, v_voter.id, p_user_agent_hash, v_expires - interval '15 minutes', v_expires);
  return jsonb_build_object('status', 'ok', 'election_id', p_election_id, 'nim_suffix', v_voter.nim_suffix, 'expires_at', v_expires,
    'has_voted', v_receipt is not null, 'receipt', v_receipt);
end;
$$;

create or replace function public.voting_session_info(p_token_hash text, p_user_agent_hash text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_result jsonb;
begin
  select jsonb_build_object('status', 'ok', 'election_id', s.election_id, 'nim_suffix', e.nim_suffix, 'expires_at', s.expires_at,
    'has_voted', v.receipt is not null, 'receipt', v.receipt) into v_result
  from public.voting_sessions s
  join public.voting_eligible_voters e on e.id = s.voter_id and e.election_id = s.election_id and e.enabled
  left join public.voting_votes v on v.voter_id = s.voter_id and v.election_id = s.election_id
  where s.token_hash = p_token_hash and s.user_agent_hash = p_user_agent_hash and s.expires_at > clock_timestamp();
  return coalesce(v_result, jsonb_build_object('status', 'expired'));
end;
$$;

create or replace function public.voting_cast_vote(
  p_election_id uuid, p_candidate_id uuid, p_token_hash text, p_user_agent_hash text
)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  v_session public.voting_sessions%rowtype;
  v_election public.voting_elections%rowtype;
  v_voter public.voting_eligible_voters%rowtype;
  v_receipt uuid;
begin
  select * into v_session from public.voting_sessions
  where token_hash = p_token_hash and election_id = p_election_id and user_agent_hash = p_user_agent_hash and expires_at > clock_timestamp();
  if not found then return jsonb_build_object('status', 'expired'); end if;

  -- Consistent lock order with session issuance prevents competing sessions/votes from racing.
  select * into v_election from public.voting_elections where id = p_election_id for share;
  if not found then return jsonb_build_object('status', 'unavailable'); end if;
  select * into v_voter from public.voting_eligible_voters where id = v_session.voter_id and election_id = p_election_id and enabled for update;
  if not found then return jsonb_build_object('status', 'expired'); end if;
  perform 1 from public.voting_sessions where token_hash = p_token_hash and user_agent_hash = p_user_agent_hash
    and election_id = p_election_id and expires_at > clock_timestamp() for update;
  if not found then return jsonb_build_object('status', 'expired'); end if;

  select receipt into v_receipt from public.voting_votes where election_id = p_election_id and voter_id = v_voter.id;
  if v_receipt is not null then
    -- Idempotent retries return only a receipt, never the selected candidate.
    return jsonb_build_object('status', 'ok', 'receipt', v_receipt);
  end if;
  if v_election.status <> 'open'
    or (v_election.opens_at is not null and clock_timestamp() < v_election.opens_at)
    or (v_election.closes_at is not null and clock_timestamp() >= v_election.closes_at) then
    return jsonb_build_object('status', 'closed');
  end if;
  perform 1 from public.voting_candidates where id = p_candidate_id and election_id = p_election_id and is_active for share;
  if not found then return jsonb_build_object('status', 'candidate'); end if;
  -- Locks can wait; recheck expiry/time at the actual write boundary.
  if v_session.expires_at <= clock_timestamp() then return jsonb_build_object('status', 'expired'); end if;
  if v_election.closes_at is not null and clock_timestamp() >= v_election.closes_at then
    return jsonb_build_object('status', 'closed');
  end if;

  insert into public.voting_votes (election_id, voter_id, candidate_id, created_at)
  values (p_election_id, v_voter.id, p_candidate_id, clock_timestamp())
  returning receipt into v_receipt;
  insert into public.voting_tallies (election_id, candidate_id, vote_count, updated_at)
  values (p_election_id, p_candidate_id, 1, clock_timestamp())
  on conflict (election_id, candidate_id) do update set
    vote_count = public.voting_tallies.vote_count + 1, updated_at = excluded.updated_at;
  insert into public.voting_updates (election_id, updated_at) values (p_election_id, clock_timestamp())
  on conflict (election_id) do update set updated_at = excluded.updated_at;
  return jsonb_build_object('status', 'ok', 'receipt', v_receipt);
end;
$$;

-- Admin endpoint calls this after Auth getUser() + voting_admins allowlist verification.
-- It returns hourly counts with zero-filled gaps for the last 24 hours, never individual votes.
create or replace function public.voting_monitor_snapshot(p_election_id uuid)
returns jsonb language sql stable security definer set search_path = '' as $$
  select jsonb_build_object(
    'eligible_voters', (select count(*) from public.voting_eligible_voters where election_id = p_election_id and enabled),
    'total_votes', (select count(*) from public.voting_votes where election_id = p_election_id),
    'results', coalesce((select jsonb_agg(jsonb_build_object('candidate_id', c.id, 'votes', coalesce(t.vote_count, 0)) order by c.number)
      from public.voting_candidates c left join public.voting_tallies t on t.election_id = c.election_id and t.candidate_id = c.id
      where c.election_id = p_election_id), '[]'::jsonb),
    'timeline', (select jsonb_agg(jsonb_build_object('time', hours.hour, 'votes', coalesce(counts.votes, 0)) order by hours.hour)
      from generate_series(date_trunc('hour', now()) - interval '23 hours', date_trunc('hour', now()), interval '1 hour') as hours(hour)
      left join (select date_trunc('hour', created_at) as hour, count(*) as votes from public.voting_votes
        where election_id = p_election_id and created_at >= date_trunc('hour', now()) - interval '23 hours'
        group by date_trunc('hour', created_at)) counts using (hour)),
    'updated_at', now()
  );
$$;

-- SECURITY DEFINER functions must never retain PostgreSQL's default PUBLIC execution grant.
revoke all on function public.voting_rate_limit(text, integer, integer) from public, anon, authenticated;
revoke all on function public.voting_start_session(uuid, text, text, text, text) from public, anon, authenticated;
revoke all on function public.voting_session_info(text, text) from public, anon, authenticated;
revoke all on function public.voting_cast_vote(uuid, uuid, text, text) from public, anon, authenticated;
revoke all on function public.voting_monitor_snapshot(uuid) from public, anon, authenticated;
grant execute on function public.voting_rate_limit(text, integer, integer) to service_role;
grant execute on function public.voting_start_session(uuid, text, text, text, text) to service_role;
grant execute on function public.voting_session_info(text, text) to service_role;
grant execute on function public.voting_cast_vote(uuid, uuid, text, text) to service_role;
grant execute on function public.voting_monitor_snapshot(uuid) to service_role;

-- Publish only an invalidation signal. No totals or choices are sent to browser roles.
do $$
begin
  if exists (
    select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'voting_tallies'
  ) then
    alter publication supabase_realtime drop table public.voting_tallies;
  end if;
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') and not exists (
    select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'voting_updates'
  ) then
    alter publication supabase_realtime add table public.voting_updates;
  end if;
end;
$$;

commit;
