begin;
alter table public.voting_eligible_voters add column if not exists voter_name text check (voter_name is null or char_length(btrim(voter_name)) between 1 and 160);
create or replace function public.voting_import_named_voters(p_election_id uuid, p_voters jsonb)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_status text; v_added integer; v_updated integer;
begin
  select status into v_status from public.voting_elections where id=p_election_id for update;
  if not found then return jsonb_build_object('status','missing'); end if;
  if v_status <> 'draft' or exists(select 1 from public.voting_votes where election_id=p_election_id) then return jsonb_build_object('status','locked'); end if;
  if jsonb_typeof(p_voters) is distinct from 'array' then return jsonb_build_object('status','invalid'); end if;
  if jsonb_array_length(p_voters) not between 1 and 10000 then return jsonb_build_object('status','invalid'); end if;
  if exists(select 1 from jsonb_to_recordset(p_voters) r(nim_hash text,voter_name text) where r.voter_name is null or char_length(btrim(r.voter_name)) not between 1 and 160) then return jsonb_build_object('status','invalid'); end if;
  if exists(select 1 from jsonb_to_recordset(p_voters) r(nim_hash text,voter_name text) join public.voting_eligible_voters v on v.election_id=p_election_id and v.nim_hash=r.nim_hash where v.voter_name is not null and v.voter_name<>r.voter_name) then return jsonb_build_object('status','name_conflict'); end if;
  update public.voting_eligible_voters v set voter_name=r.voter_name from jsonb_to_recordset(p_voters) r(nim_hash text,voter_name text) where v.election_id=p_election_id and v.nim_hash=r.nim_hash and v.voter_name is null;
  get diagnostics v_updated = row_count;
  insert into public.voting_eligible_voters(election_id,nim_hash,access_code_hash,nim_suffix,voter_name)
  select p_election_id,r.nim_hash,r.access_code_hash,r.nim_suffix,r.voter_name from jsonb_to_recordset(p_voters) r(nim_hash text,access_code_hash text,nim_suffix text,voter_name text) on conflict(election_id,nim_hash) do nothing;
  get diagnostics v_added = row_count;
  insert into public.voting_updates(election_id,updated_at) values(p_election_id,clock_timestamp()) on conflict(election_id) do update set updated_at=excluded.updated_at;
  return jsonb_build_object('status','ok','added',v_added,'updated',v_updated,'existing',jsonb_array_length(p_voters)-v_added-v_updated);
end;
$$;
create or replace function public.voting_session_name(p_token_hash text,p_user_agent_hash text)
returns text language sql stable security definer set search_path = '' as $$
  select v.voter_name from public.voting_sessions s join public.voting_eligible_voters v on v.id=s.voter_id and v.election_id=s.election_id
  where s.token_hash=p_token_hash and s.user_agent_hash=p_user_agent_hash and s.expires_at>clock_timestamp() and v.enabled;
$$;
revoke all on function public.voting_import_named_voters(uuid,jsonb),public.voting_session_name(text,text) from public,anon,authenticated;
grant execute on function public.voting_import_named_voters(uuid,jsonb),public.voting_session_name(text,text) to service_role;
commit;
