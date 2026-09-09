import test from "node:test";
import assert from "node:assert/strict";
import { createHash, randomBytes, randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import { pathToFileURL } from "node:url";
import { generateAccessCode, hashAccessCode, hashNim } from "../lib/voting/crypto.mjs";

let PGlite;
try {
  ({ PGlite } = await import(process.env.VOTING_PGLITE_MODULE ? pathToFileURL(process.env.VOTING_PGLITE_MODULE).href : "@electric-sql/pglite"));
} catch (error) {
  if (process.env.VOTING_PGLITE_MODULE) throw error;
}

test("PostgreSQL migration: grants, eligibility, sessions, atomic vote, receipts and private totals", { skip: !PGlite && "Install optional @electric-sql/pglite or set VOTING_PGLITE_MODULE; never uses remote DB." }, async (t) => {
  const db = new PGlite();
  const secret = "test-only-secret-not-for-deployment-123456789";
  const agent = createHash("sha256").update("test browser").digest("hex");
  const wrongAgent = createHash("sha256").update("other browser").digest("hex");
  const token = () => createHash("sha256").update(randomBytes(32)).digest("hex");
  const electionId = randomUUID(), otherElectionId = randomUUID();
  const firstCandidate = randomUUID(), secondCandidate = randomUUID(), otherCandidate = randomUUID();
  const voterId = randomUUID(), secondVoterId = randomUUID();
  const code = generateAccessCode(), secondCode = generateAccessCode();
  const nimHash = hashNim("00123456", secret), secondNimHash = hashNim("00123457", secret);
  const accessHash = hashAccessCode(code, secret), secondAccessHash = hashAccessCode(secondCode, secret);
  const call = async (name, params) => (await db.query(`select public.${name}(${params.map((_, i) => `$${i + 1}`).join(",")}) as result`, params)).rows[0].result;
  const scalar = async (sql, params = []) => Object.values((await db.query(sql, params)).rows[0])[0];
  const start = (nim = nimHash, access = accessHash, session = token()) => call("voting_start_session", [electionId, nim, access, session, agent]);
  try {
    await db.exec(`
      create role anon;
      create role authenticated;
      create role service_role bypassrls;
      create schema auth;
      create table auth.users (id uuid primary key);
      create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
      grant usage on schema public to anon, authenticated, service_role;
    `);
    await db.exec(readFileSync(new URL("../migrations/voting.sql", import.meta.url), "utf8"));
    await db.exec(readFileSync(new URL("../migrations/voting_admin.sql", import.meta.url), "utf8"));

    await t.test("admin transactions enforce readiness, idempotent import, and live-election locks", async () => {
      const config = { title: "Admin test", year: "2026", status: "draft", is_current: false };
      const created = await call("voting_manage_election", [null, config]);
      assert.equal(created.status, "ok");
      const managedId = created.id;
      assert.equal((await call("voting_manage_election", [managedId, { ...config, status: "open" }])).status, "incomplete");
      const candidate = { number: 1, name: "Admin candidate", tagline: "Test", vision: "Test", mission: ["Test"], accent: "#c5b28c", is_active: true };
      const first = await call("voting_manage_candidate", [null, managedId, candidate]);
      await call("voting_manage_candidate", [null, managedId, { ...candidate, number: 2 }]);
      const voter = { nim_hash: nimHash, access_code_hash: accessHash, nim_suffix: "3456" };
      assert.equal((await call("voting_import_voters", [managedId, [voter]])).added, 1);
      const retry = await call("voting_import_voters", [managedId, [voter]]);
      assert.equal(retry.added, 0); assert.equal(retry.existing, 1);
      assert.equal((await call("voting_import_voters", [managedId, [{ ...voter, access_code_hash: secondAccessHash }]])).status, "duplicate");
      assert.equal((await call("voting_manage_election", [managedId, { ...config, status: "open" }])).status, "ok");
      assert.equal((await call("voting_manage_candidate", [first.id, managedId, candidate])).status, "locked");
      assert.equal((await call("voting_import_voters", [managedId, [voter]])).status, "locked");
      assert.equal(await call("voting_set_candidate_photo", [first.id, "voting/test.webp"]), false);
      for (const role of ["anon", "authenticated"]) {
        await db.exec(`set role ${role}`);
        await assert.rejects(call("voting_manage_election", [managedId, config]), (error) => error.code === "42501");
        await assert.rejects(call("voting_import_voters", [managedId, [voter]]), (error) => error.code === "42501");
        await db.exec("reset role");
      }
    });

    await t.test("migration reapplies without duplicate objects", async () => {
      await db.exec(readFileSync(new URL("../migrations/voting.sql", import.meta.url), "utf8"));
    });

    await db.query("insert into voting_elections (id,title,year,status,is_current) values ($1,'Test election','2026','draft',true),($2,'Other election','2026','open',false)", [electionId, otherElectionId]);
    await db.query("insert into voting_candidates (id,election_id,number,name) values ($1,$2,1,'First'),($3,$2,2,'Second'),($4,$5,1,'Other')", [firstCandidate, electionId, secondCandidate, otherCandidate, otherElectionId]);
    await db.query("insert into voting_eligible_voters (id,election_id,nim_hash,access_code_hash,nim_suffix) values ($1,$2,$3,$4,'3456'),($5,$2,$6,$7,'3457')", [voterId, electionId, nimHash, accessHash, secondVoterId, secondNimHash, secondAccessHash]);

    await t.test("browser roles cannot read voter identities, sessions, ballots, totals or execute privileged RPCs", async () => {
      for (const role of ["anon", "authenticated"]) {
        await db.exec(`set role ${role}`);
        for (const table of ["voting_eligible_voters", "voting_sessions", "voting_votes", "voting_tallies", "voting_admins"]) {
          await assert.rejects(db.query(`select * from public.${table}`), (error) => error.code === "42501");
        }
        await assert.rejects(start(), (error) => error.code === "42501");
        await assert.rejects(call("voting_monitor_snapshot", [electionId]), (error) => error.code === "42501");
        const updates = await db.query("select * from public.voting_updates");
        assert.deepEqual(Object.keys(updates.rows[0]).sort(), ["election_id", "updated_at"]);
        await db.exec("reset role");
      }
    });

    await t.test("eligibility and opening status are enforced in PostgreSQL", async () => {
      assert.equal((await start(hashNim("99999999", secret))).status, "invalid");
      assert.equal((await start(nimHash, hashAccessCode(generateAccessCode(), secret))).status, "invalid");
      assert.equal((await start()).status, "closed");
      await db.query("update voting_elections set status='open',opens_at=now()+interval '1 hour' where id=$1", [electionId]);
      assert.equal((await start()).status, "closed");
      await db.query("update voting_elections set opens_at=null where id=$1", [electionId]);
      await db.query("update voting_eligible_voters set enabled=false where id=$1", [voterId]);
      assert.equal((await start()).status, "invalid");
      await db.query("update voting_eligible_voters set enabled=true where id=$1", [voterId]);
    });

    let activeToken;
    await t.test("new sessions invalidate older sessions and bind User-Agent", async () => {
      const oldToken = token(); activeToken = token();
      assert.equal((await start(nimHash, accessHash, oldToken)).status, "ok");
      assert.equal((await start(nimHash, accessHash, activeToken)).status, "ok");
      assert.equal((await call("voting_session_info", [oldToken, agent])).status, "expired");
      assert.equal((await call("voting_session_info", [activeToken, wrongAgent])).status, "expired");
      assert.equal((await call("voting_session_info", [activeToken, agent])).status, "ok");
      assert.equal(Number(await scalar("select count(*) from voting_sessions where voter_id=$1", [voterId])), 1);
    });

    await t.test("foreign-election and inactive candidates cannot receive a vote", async () => {
      assert.equal((await call("voting_cast_vote", [electionId, otherCandidate, activeToken, agent])).status, "candidate");
      await db.query("update voting_candidates set is_active=false where id=$1", [secondCandidate]);
      assert.equal((await call("voting_cast_vote", [electionId, secondCandidate, activeToken, agent])).status, "candidate");
      await db.query("update voting_candidates set is_active=true where id=$1", [secondCandidate]);
      assert.equal(Number(await scalar("select count(*) from voting_votes")), 0);
    });

    let receipt;
    await t.test("burst duplicate requests have one ballot, one tally, and one immutable receipt", async () => {
      // PGlite serializes its connection: verifies retry/idempotency and constraints, not real lock contention.
      const results = await Promise.all(Array.from({ length: 20 }, (_, index) => call("voting_cast_vote", [electionId, index % 2 ? secondCandidate : firstCandidate, activeToken, agent])));
      assert.ok(results.every((result) => result.status === "ok"));
      assert.equal(new Set(results.map((result) => result.receipt)).size, 1);
      receipt = results[0].receipt;
      assert.equal(Number(await scalar("select count(*) from voting_votes where voter_id=$1", [voterId])), 1);
      assert.equal(Number(await scalar("select sum(vote_count) from voting_tallies where election_id=$1", [electionId])), 1);
      assert.equal(await scalar("select candidate_id from voting_votes where voter_id=$1", [voterId]), firstCandidate);
      await assert.rejects(db.query("insert into voting_votes (election_id,voter_id,candidate_id) values ($1,$2,$3)", [electionId, voterId, secondCandidate]), (error) => error.code === "23505");
    });

    await t.test("service role can use voting RPC but cannot insert/update ballots directly", async () => {
      await db.exec("set role service_role");
      assert.equal((await call("voting_cast_vote", [electionId, firstCandidate, activeToken, agent])).receipt, receipt);
      await assert.rejects(db.query("insert into voting_votes (election_id,voter_id,candidate_id) values ($1,$2,$3)", [electionId, secondVoterId, secondCandidate]), (error) => error.code === "42501");
      await assert.rejects(db.query("update voting_votes set candidate_id=$1", [secondCandidate]), (error) => error.code === "42501");
      await db.exec("reset role");
    });

    await t.test("closing blocks new votes but permits receipt recovery without recounting", async () => {
      const secondToken = token();
      assert.equal((await start(secondNimHash, secondAccessHash, secondToken)).status, "ok");
      await db.query("update voting_elections set status='closed' where id=$1", [electionId]);
      assert.equal((await call("voting_cast_vote", [electionId, secondCandidate, secondToken, agent])).status, "closed");
      assert.equal((await start()).receipt, receipt);
      const snapshot = await call("voting_monitor_snapshot", [electionId]);
      assert.equal(Number(snapshot.total_votes), 1);
      assert.equal(Number(snapshot.eligible_voters), 2);
      assert.equal(snapshot.timeline.length, 24);
      assert.equal(Number(snapshot.results.reduce((sum, row) => sum + Number(row.votes), 0)), 1);
      assert.ok(!JSON.stringify(snapshot).includes(nimHash));
      assert.ok(!JSON.stringify(snapshot).includes(voterId));
    });

    await t.test("rate limiter denies the first request beyond a fixed-window limit", async () => {
      for (let i = 0; i < 6; i++) assert.equal(await call("voting_rate_limit", ["test:identity", 6, 900]), true);
      assert.equal(await call("voting_rate_limit", ["test:identity", 6, 900]), false);
    });
  } finally { await db.close(); }
});
