import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { randomUUID } from 'node:crypto';
import { pathToFileURL } from 'node:url';

test('reset voters removes voters atomically and rejects open elections or elections with votes', async () => {
  const { PGlite } = await import(pathToFileURL(process.env.VOTING_PGLITE_MODULE || `${process.cwd()}/scratch/reset-test/node_modules/@electric-sql/pglite/dist/index.js`).href);
  const db = new PGlite();
  const election = randomUUID(), admin = randomUUID(), outsider = randomUUID(), candidate = randomUUID(), voter1 = randomUUID(), voter2 = randomUUID();
  const value = async (sql, args = []) => Object.values((await db.query(sql, args)).rows[0])[0];
  const resetVoters = (actor = admin, el = election) => value('select public.voting_reset_voters($1, $2)', [el, actor]);

  try {
    await db.exec('create role anon; create role authenticated; create role service_role bypassrls; create schema auth; create table auth.users(id uuid primary key);');
    await db.exec(readFileSync(new URL('../migrations/voting.sql', import.meta.url), 'utf8'));
    await db.exec(readFileSync(new URL('../migrations/voting_reset_voters.sql', import.meta.url), 'utf8'));

    await db.query('insert into auth.users values($1), ($2)', [admin, outsider]);
    await db.query('insert into public.voting_admins(user_id) values($1)', [admin]);
    await db.query("insert into public.voting_elections(id, title, year, status) values($1, 'Pemilihan Uji', '2026', 'open')", [election]);
    await db.query("insert into public.voting_candidates(id, election_id, number, name) values($1, $2, 1, 'Kandidat 1')", [candidate, election]);
    await db.query("insert into public.voting_eligible_voters(id, election_id, nim_hash, access_code_hash, nim_suffix) values($1, $2, repeat('1', 64), repeat('a', 64), '1111'), ($3, $2, repeat('2', 64), repeat('b', 64), '2222')", [voter1, election, voter2]);

    // 1. Forbidden for outsider
    assert.equal((await resetVoters(outsider)).status, 'forbidden');

    // 2. Cannot reset if election is open
    assert.equal((await resetVoters(admin)).status, 'open');

    // Set status to draft
    await db.query("update public.voting_elections set status = 'draft' where id = $1", [election]);

    // Insert a vote to test has_votes guard
    await db.query('insert into public.voting_votes(election_id, voter_id, candidate_id) values($1, $2, $3)', [election, voter1, candidate]);
    assert.equal((await resetVoters(admin)).status, 'has_votes');

    // Remove the vote
    await db.query('delete from public.voting_votes where election_id = $1', [election]);

    // Check voters count before reset
    assert.equal(Number(await value('select count(*) from public.voting_eligible_voters where election_id = $1', [election])), 2);

    // 3. Reset voters succeeds
    const res = await resetVoters(admin);
    assert.equal(res.status, 'ok');
    assert.equal(res.removedVoters, 2);

    // Check voters count after reset is 0
    assert.equal(Number(await value('select count(*) from public.voting_eligible_voters where election_id = $1', [election])), 0);

    // Candidate is preserved
    assert.equal(Number(await value('select count(*) from public.voting_candidates where election_id = $1', [election])), 1);

    // Permissions check
    assert.equal(await value("select has_function_privilege('anon', 'public.voting_reset_voters(uuid, uuid)', 'execute')"), false);
    assert.equal(await value("select has_function_privilege('authenticated', 'public.voting_reset_voters(uuid, uuid)', 'execute')"), false);
  } finally {
    await db.close();
  }
});
