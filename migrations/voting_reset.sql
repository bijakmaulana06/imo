begin;
create table if not exists public.voting_reset_audit (
  request_id uuid primary key,
  election_id uuid not null references public.voting_elections(id),
  admin_id uuid not null references auth.users(id),
  removed_votes bigint not null,
  created_at timestamptz not null default clock_timestamp()
);
alter table public.voting_reset_audit enable row level security;
revoke all on public.voting_reset_audit from public, anon, authenticated, service_role;
grant select on public.voting_reset_audit to service_role;

create or replace function public.voting_reset_election(
  p_election_id uuid, p_admin_id uuid, p_request_id uuid, p_expected_votes bigint, p_title text
) returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  v_election public.voting_elections%rowtype;
  v_audit public.voting_reset_audit%rowtype;
  v_count bigint;
begin
  if not exists(select 1 from public.voting_admins where user_id = p_admin_id) then
    return jsonb_build_object('status', 'forbidden');
  end if;
  -- Same lock order as cast_vote: election first, then sessions/ballots.
  select * into v_election from public.voting_elections where id = p_election_id for update;
  if not found then return jsonb_build_object('status', 'missing'); end if;
  select * into v_audit from public.voting_reset_audit where request_id = p_request_id;
  if found then
    if v_audit.election_id <> p_election_id or v_audit.admin_id <> p_admin_id then
      return jsonb_build_object('status', 'invalid');
    end if;
    return jsonb_build_object('status', 'ok', 'removedVotes', v_audit.removed_votes, 'alreadyReset', true);
  end if;
  if v_election.status = 'open' then return jsonb_build_object('status', 'open'); end if;
  if p_title is distinct from v_election.title then return jsonb_build_object('status', 'confirmation'); end if;
  select count(*) into v_count from public.voting_votes where election_id = p_election_id;
  if v_count is distinct from p_expected_votes then return jsonb_build_object('status', 'stale'); end if;
  delete from public.voting_sessions where election_id = p_election_id;
  delete from public.voting_votes where election_id = p_election_id;
  delete from public.voting_tallies where election_id = p_election_id;
  update public.voting_elections set status = 'draft', opens_at = null, closes_at = null where id = p_election_id;
  insert into public.voting_reset_audit(request_id, election_id, admin_id, removed_votes)
    values(p_request_id, p_election_id, p_admin_id, v_count);
  return jsonb_build_object('status', 'ok', 'removedVotes', v_count, 'alreadyReset', false);
end;
$$;
revoke all on function public.voting_reset_election(uuid,uuid,uuid,bigint,text) from public, anon, authenticated;
grant execute on function public.voting_reset_election(uuid,uuid,uuid,bigint,text) to service_role;
commit;
