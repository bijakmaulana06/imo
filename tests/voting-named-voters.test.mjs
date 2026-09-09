import test from 'node:test';
import assert from 'node:assert/strict';
import * as XLSX from 'xlsx';
import { readFileSync } from 'node:fs';
import { parseNamedVoterExcel, validateNamedVoter } from '../lib/voting/admin-input.mjs';
import { PGlite } from '../scratch/reset-test/node_modules/@electric-sql/pglite/dist/index.js';

function workbook(rows) { const wb=XLSX.utils.book_new();XLSX.utils.book_append_sheet(wb,XLSX.utils.aoa_to_sheet(rows),'Pemilih');return XLSX.write(wb,{type:'array',bookType:'xlsx'}); }
test('manual and Excel preserve NIM and pair names with the correct row',()=>{
 assert.deepEqual(parseNamedVoterExcel(workbook([['NIM','NAMA'],['001234','Alya Pratama'],['AB-01',' Bima  Saputra ']])),[{nim:'001234',name:'Alya Pratama'},{nim:'AB-01',name:'Bima Saputra'}]);
 assert.throws(()=>parseNamedVoterExcel(workbook([['NIM','NAMA'],['001234','']])));
 assert.throws(()=>parseNamedVoterExcel(workbook([['NIM','NAMA'],['','Alya']])));
 assert.throws(()=>parseNamedVoterExcel(workbook([['NIM','NAMA'],['ab','Alya'],['AB','Bima']])));
 assert.throws(()=>parseNamedVoterExcel(workbook([['NIM'],['001234']])));
 assert.deepEqual(validateNamedVoter({nim:' 001234 ',name:'Alya'}),{nim:'001234',name:'Alya'});
});
test('named imports are idempotent and names require a valid bound session',async()=>{
 const db=new PGlite();const e='11111111-1111-4111-8111-111111111111';
 try{
  await db.exec('create role anon;create role authenticated;create role service_role bypassrls;create schema auth;create table auth.users(id uuid primary key);');
  for(const file of ['voting.sql','voting_voter_names.sql','voting_report.sql'])await db.exec(readFileSync(new URL('../migrations/'+file,import.meta.url),'utf8'));
  await db.query("insert into voting_elections(id,title,year)values($1,'Test','2026')",[e]);
  const voter={nim_hash:'a'.repeat(64),access_code_hash:'b'.repeat(64),nim_suffix:'1234',voter_name:'Nama Rahasia'};
  const call=async(v=voter)=>(await db.query('select voting_import_named_voters($1,$2) as result',[e,JSON.stringify([v])])).rows[0].result;
  assert.equal((await call()).added,1);assert.equal((await call()).existing,1);
  assert.equal((await call({...voter,voter_name:'Nama Salah'})).status,'name_conflict');
  await db.query('update voting_eligible_voters set voter_name=null where election_id=$1',[e]);assert.equal((await call()).updated,1);
  await db.query("insert into voting_sessions(token_hash,election_id,voter_id,user_agent_hash) select repeat('c',64),election_id,id,repeat('d',64) from voting_eligible_voters where election_id=$1",[e]);
  const name=async(agent='d')=>(await db.query('select voting_session_name($1,$2) as name',['c'.repeat(64),agent.repeat(64)])).rows[0].name;
  assert.equal(await name(),'Nama Rahasia');assert.equal(await name('e'),null);
  assert.equal((await db.query("select has_function_privilege('anon','voting_session_name(text,text)','execute') as allowed")).rows[0].allowed,false);
  const report=(await db.query('select voting_report_snapshot($1) as report',[e])).rows[0].report;assert.ok(!JSON.stringify(report).includes('Nama Rahasia'));
  await db.query("update voting_elections set status='open' where id=$1",[e]);assert.equal((await call()).status,'locked');
 }finally{await db.close();}
});
