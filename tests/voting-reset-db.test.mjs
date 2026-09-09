import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { randomUUID } from 'node:crypto';
import { pathToFileURL } from 'node:url';

test('reset is scoped, restricted, atomic and safe to retry', async () => {
  const { PGlite } = await import(pathToFileURL(process.env.VOTING_PGLITE_MODULE || `${process.cwd()}/scratch/reset-test/node_modules/@electric-sql/pglite/dist/index.js`).href);
  const db = new PGlite();
  const election = randomUUID(), other = randomUUID(), admin = randomUUID(), outsider = randomUUID(), candidate = randomUUID(), voter = randomUUID(), request = randomUUID();
  const otherCandidate = randomUUID(), otherVoter = randomUUID();
  const value = async (sql, args = []) => Object.values((await db.query(sql,args)).rows[0])[0];
  const reset = (actor = admin, count = 1, title = 'Test election', key = request) => value('select public.voting_reset_election($1,$2,$3,$4,$5)', [election,actor,key,count,title]);
  try {
    await db.exec('create role anon; create role authenticated; create role service_role bypassrls; create schema auth; create table auth.users(id uuid primary key);');
    await db.exec(readFileSync(new URL('../migrations/voting.sql',import.meta.url),'utf8'));
    await db.exec(readFileSync(new URL('../migrations/voting_reset.sql',import.meta.url),'utf8'));
    await db.query('insert into auth.users values($1),($2)',[admin,outsider]);
    await db.query('insert into public.voting_admins(user_id) values($1)',[admin]);
    await db.query("insert into public.voting_elections(id,title,year,status) values($1,'Test election','2026','open'),($2,'Other election','2026','closed')",[election,other]);
    await db.query("insert into public.voting_candidates(id,election_id,number,name,photo_key) values($1,$2,1,'Candidate','photo.webp')",[candidate,election]);
    await db.query("insert into public.voting_eligible_voters(id,election_id,nim_hash,access_code_hash,nim_suffix) values($1,$2,repeat('a',64),repeat('b',64),'1234')",[voter,election]);
    await db.query('insert into public.voting_votes(election_id,voter_id,candidate_id) values($1,$2,$3)',[election,voter,candidate]);
    await db.query('insert into public.voting_tallies(election_id,candidate_id,vote_count) values($1,$2,1)',[election,candidate]);
    await db.query("insert into public.voting_sessions(token_hash,election_id,voter_id,user_agent_hash) values(repeat('c',64),$1,$2,repeat('d',64))",[election,voter]);
    assert.equal((await reset(outsider)).status,'forbidden');
    assert.equal((await reset()).status,'open');
    await db.query("update public.voting_elections set status='closed' where id=$1",[election]);
    assert.equal((await reset(admin,0)).status,'stale');
    assert.equal((await reset(admin,1,'Wrong title')).status,'confirmation');
    assert.equal(Number(await value('select count(*) from public.voting_votes')),1);
    await db.query("insert into public.voting_candidates(id,election_id,number,name) values($1,$2,1,'Other candidate')",[otherCandidate,other]);
    await db.query("insert into public.voting_eligible_voters(id,election_id,nim_hash,access_code_hash,nim_suffix) values($1,$2,repeat('e',64),repeat('f',64),'5678')",[otherVoter,other]);
    await db.query('insert into public.voting_votes(election_id,voter_id,candidate_id) values($1,$2,$3)',[other,otherVoter,otherCandidate]);
    assert.equal(await value("select has_function_privilege('anon','public.voting_reset_election(uuid,uuid,uuid,bigint,text)','execute')"),false);
    assert.equal(await value("select has_function_privilege('authenticated','public.voting_reset_election(uuid,uuid,uuid,bigint,text)','execute')"),false);
    const result = await reset();assert.equal(result.status,'ok');assert.equal(result.removedVotes,1);
    for (const table of ['voting_votes','voting_sessions','voting_tallies']) assert.equal(Number(await value(`select count(*) from public.${table} where election_id=$1`,[election])),0);
    assert.equal(Number(await value('select count(*) from public.voting_votes where election_id=$1',[other])),1);
    assert.equal(await value('select status from public.voting_elections where id=$1',[election]),'draft');
    assert.equal(await value('select status from public.voting_elections where id=$1',[other]),'closed');
    assert.equal(Number(await value('select count(*) from public.voting_eligible_voters where election_id=$1',[election])),1);
    assert.equal(await value('select photo_key from public.voting_candidates where id=$1',[candidate]),'photo.webp');
    await db.query('insert into public.voting_votes(election_id,voter_id,candidate_id) values($1,$2,$3)',[election,voter,candidate]);
    assert.equal((await reset()).alreadyReset,true);
    assert.equal(Number(await value('select count(*) from public.voting_votes where election_id=$1',[election])),1,'Retry must not delete subsequent ballots');
    assert.equal(Number(await value('select count(*) from public.voting_reset_audit')),1);
  } finally { await db.close(); }
});
