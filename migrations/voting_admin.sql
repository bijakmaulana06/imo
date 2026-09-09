-- Apply after voting.sql. Every operation is authorized by the server's voting_admins allowlist.
begin;

create or replace function public.voting_manage_election(p_id uuid, p_config jsonb)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_id uuid; v_status text; v_active boolean;
begin
  -- Serialize current-election changes before locking individual election rows.
  perform pg_advisory_xact_lock(817263);
  v_status := coalesce(p_config->>'status', 'draft');
  v_active := coalesce((p_config->>'is_current')::boolean, false);
  if v_status not in ('draft','open','closed') then return jsonb_build_object('status','invalid'); end if;
  if p_id is null then
    if v_status <> 'draft' then return jsonb_build_object('status','incomplete'); end if;
    if v_active then update public.voting_elections set is_current = false where is_current; end if;
    insert into public.voting_elections (title,year,status,opens_at,closes_at,is_current)
    values (p_config->>'title',p_config->>'year','draft',(p_config->>'opens_at')::timestamptz,(p_config->>'closes_at')::timestamptz,v_active)
    returning id into v_id;
  else
    perform 1 from public.voting_elections where id=p_id for update;
    if not found then return jsonb_build_object('status','missing'); end if;
    if v_status = 'open' and ((select count(*) from public.voting_candidates where election_id=p_id and is_active) < 2
      or not exists (select 1 from public.voting_eligible_voters where election_id=p_id and enabled)) then
      return jsonb_build_object('status','incomplete');
    end if;
    if v_status = 'draft' and exists (select 1 from public.voting_votes where election_id=p_id) then
      return jsonb_build_object('status','locked');
    end if;
    if v_active then update public.voting_elections set is_current=false where is_current and id<>p_id; end if;
    update public.voting_elections set title=p_config->>'title',year=p_config->>'year',status=v_status,
      opens_at=(p_config->>'opens_at')::timestamptz,closes_at=(p_config->>'closes_at')::timestamptz,is_current=v_active where id=p_id;
    v_id := p_id;
  end if;
  return jsonb_build_object('status','ok','id',v_id);
end;
$$;

create or replace function public.voting_manage_candidate(p_id uuid, p_election_id uuid, p_candidate jsonb)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_election public.voting_elections%rowtype; v_id uuid; v_mission text[];
begin
  select * into v_election from public.voting_elections where id=p_election_id for update;
  if not found then return jsonb_build_object('status','missing'); end if;
  if v_election.status <> 'draft' or exists (select 1 from public.voting_votes where election_id=p_election_id) then
    return jsonb_build_object('status','locked');
  end if;
  select coalesce(array_agg(value),'{}'::text[]) into v_mission from jsonb_array_elements_text(p_candidate->'mission');
  if p_id is null then
    insert into public.voting_candidates (election_id,number,name,tagline,vision,mission,accent,is_active)
    values (p_election_id,(p_candidate->>'number')::integer,p_candidate->>'name',p_candidate->>'tagline',p_candidate->>'vision',v_mission,p_candidate->>'accent',(p_candidate->>'is_active')::boolean)
    returning id into v_id;
  else
    update public.voting_candidates set number=(p_candidate->>'number')::integer,name=p_candidate->>'name',
      tagline=p_candidate->>'tagline',vision=p_candidate->>'vision',mission=v_mission,accent=p_candidate->>'accent',is_active=(p_candidate->>'is_active')::boolean
      where id=p_id and election_id=p_election_id returning id into v_id;
    if not found then return jsonb_build_object('status','missing'); end if;
  end if;
  return jsonb_build_object('status','ok','id',v_id);
end;
$$;

create or replace function public.voting_import_voters(p_election_id uuid, p_voters jsonb)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_election public.voting_elections%rowtype; v_added integer;
begin
  select * into v_election from public.voting_elections where id=p_election_id for update;
  if not found then return jsonb_build_object('status','missing'); end if;
  if v_election.status <> 'draft' or exists (select 1 from public.voting_votes where election_id=p_election_id) then
    return jsonb_build_object('status','locked');
  end if;
  if jsonb_typeof(p_voters) <> 'array' or jsonb_array_length(p_voters) not between 1 and 10000 then
    return jsonb_build_object('status','invalid');
  end if;
  if exists (select 1 from jsonb_to_recordset(p_voters) as r(nim_hash text,access_code_hash text,nim_suffix text)
    join public.voting_eligible_voters v on v.election_id=p_election_id and v.nim_hash=r.nim_hash
    where v.access_code_hash <> r.access_code_hash) then return jsonb_build_object('status','duplicate'); end if;
  insert into public.voting_eligible_voters (election_id,nim_hash,access_code_hash,nim_suffix)
  select p_election_id,r.nim_hash,r.access_code_hash,r.nim_suffix
  from jsonb_to_recordset(p_voters) as r(nim_hash text,access_code_hash text,nim_suffix text)
  on conflict (election_id,nim_hash) do nothing;
  get diagnostics v_added = row_count;
  insert into public.voting_updates (election_id,updated_at) values(p_election_id,clock_timestamp())
  on conflict(election_id) do update set updated_at=excluded.updated_at;
  return jsonb_build_object('status','ok','added',v_added,'existing',jsonb_array_length(p_voters)-v_added);
end;
$$;

create or replace function public.voting_set_candidate_photo(p_candidate_id uuid,p_photo_key text)
returns boolean language plpgsql security definer set search_path = '' as $$
declare v_election_id uuid; v_status text;
begin
  select election_id into v_election_id from public.voting_candidates where id=p_candidate_id;
  if not found then return false; end if;
  select status into v_status from public.voting_elections where id=v_election_id for update;
  if v_status <> 'draft' or exists(select 1 from public.voting_votes where election_id=v_election_id) then return false; end if;
  update public.voting_candidates set photo_key=p_photo_key where id=p_candidate_id;
  return found;
end;
$$;

revoke all on function public.voting_manage_election(uuid,jsonb),public.voting_manage_candidate(uuid,uuid,jsonb),
  public.voting_import_voters(uuid,jsonb),public.voting_set_candidate_photo(uuid,text) from public,anon,authenticated;
grant execute on function public.voting_manage_election(uuid,jsonb),public.voting_manage_candidate(uuid,uuid,jsonb),
  public.voting_import_voters(uuid,jsonb),public.voting_set_candidate_photo(uuid,text) to service_role;
commit;
