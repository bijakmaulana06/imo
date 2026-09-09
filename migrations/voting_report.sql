begin;
-- One statement gives the report a consistent snapshot, including its full timeline.
create or replace function public.voting_report_snapshot(p_election_id uuid)
returns jsonb language sql stable security definer set search_path = '' as $$
  select jsonb_build_object(
    'title', e.title, 'year', e.year, 'status', e.status, 'generatedAt', statement_timestamp(),
    'eligibleVoters', (select count(*) from public.voting_eligible_voters where election_id=e.id and enabled),
    'totalVotes', (select count(*) from public.voting_votes where election_id=e.id),
    'candidates', coalesce((select jsonb_agg(jsonb_build_object('number',c.number,'name',c.name,'votes',
      (select count(*) from public.voting_votes v where v.candidate_id=c.id and v.election_id=e.id)) order by c.number)
      from public.voting_candidates c where c.election_id=e.id), '[]'::jsonb),
    'timeline', coalesce((select jsonb_agg(jsonb_build_object('time',h.hour,'votes',h.votes) order by h.hour)
      from (select date_trunc('hour',v.created_at) as hour, count(*) as votes from public.voting_votes v where v.election_id=e.id group by 1) h), '[]'::jsonb)
  ) from public.voting_elections e where e.id=p_election_id;
$$;
revoke all on function public.voting_report_snapshot(uuid) from public, anon, authenticated;
grant execute on function public.voting_report_snapshot(uuid) to service_role;
commit;
