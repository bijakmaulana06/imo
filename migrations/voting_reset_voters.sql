-- Function to reset/delete eligible voters for an election
-- Only allowed when election is not 'open' and has 0 votes in voting_votes.

create or replace function public.voting_reset_voters(
  p_election_id uuid,
  p_admin_id uuid default null
) returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  v_election public.voting_elections%rowtype;
  v_vote_count bigint;
  v_voter_count bigint;
begin
  -- 1. Check admin permission if admin_id is provided
  if p_admin_id is not null and not exists(select 1 from public.voting_admins where user_id = p_admin_id) then
    return jsonb_build_object('status', 'forbidden');
  end if;

  -- 2. Lock election record
  select * into v_election from public.voting_elections where id = p_election_id for update;
  if not found then
    return jsonb_build_object('status', 'missing');
  end if;

  -- 3. Check if voting is currently open
  if v_election.status = 'open' then
    return jsonb_build_object('status', 'open');
  end if;

  -- 4. Check if there are votes cast for this election
  select count(*) into v_vote_count from public.voting_votes where election_id = p_election_id;
  if v_vote_count > 0 then
    return jsonb_build_object('status', 'has_votes', 'voteCount', v_vote_count);
  end if;

  -- 5. Count existing eligible voters
  select count(*) into v_voter_count from public.voting_eligible_voters where election_id = p_election_id;

  -- 6. Delete any active sessions for this election
  delete from public.voting_sessions where election_id = p_election_id;

  -- 7. Delete all eligible voters for this election
  delete from public.voting_eligible_voters where election_id = p_election_id;

  return jsonb_build_object('status', 'ok', 'removedVoters', v_voter_count);
end;
$$;

revoke all on function public.voting_reset_voters(uuid, uuid) from public, anon, authenticated;
grant execute on function public.voting_reset_voters(uuid, uuid) to service_role;
