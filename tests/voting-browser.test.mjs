import test from 'node:test';
import assert from 'node:assert/strict';
import puppeteer from 'puppeteer-core';
import {existsSync,mkdirSync,writeFileSync} from 'node:fs';
import {join} from 'node:path';
import {tmpdir} from 'node:os';

// Only browser fixtures are modified. No NIM, candidate or vote is written to Supabase.
test('voting browser: ballot, receipt recovery, mobile layout and admin controls', {timeout:150000}, async () => {
  const path=process.env.VOTING_BROWSER_PATH || ['C:/Program Files/Google/Chrome/Application/chrome.exe','C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'].find(existsSync);
  const browser=await puppeteer.launch({executablePath:path,headless:true,acceptInsecureCerts:true,args:['--enable-unsafe-swiftshader']});
  const base=process.env.VOTING_TEST_URL || 'https://localhost:3000';
  const page=await browser.newPage();
  const errors=[]; page.on('pageerror',error=>errors.push(error.message));
  const id='17b59c7f-960b-4da4-8f5e-a31e66d26548';
  const candidateId='27b59c7f-960b-4da4-8f5e-a31e66d26548';
  const election={id,title:'Pemilihan Uji Browser',year:'2026',status:'open',opensAt:null,closesAt:null};
  const candidate={id:candidateId,electionId:id,number:1,name:'Kandidat Uji Browser',tagline:'Gagasan untuk angkatan',vision:'Semua suara didengar',mission:['Forum terbuka','Kolaborasi angkatan'],photoUrl:null,accent:'#c5b28c'};
  let verified=false, voted=false, sentVotes=0, rejectCode=true, adminPosts=0;
  const receipt='47b59c7f-960b-4da4-8f5e-a31e66d26548';
  const session=()=>({verified,electionId:id,nimMasked:'••••3456',expiresAt:new Date(Date.now()+900000).toISOString(),hasVoted:voted,...(voted?{receipt}:{})});
  const adminElection={id,title:election.title,year:'2026',status:'draft',opens_at:null,closes_at:null,is_current:true};
  await page.setRequestInterception(true);
  page.on('request',async request=>{
    const url=new URL(request.url()); const respond=(body,status=200)=>request.respond({status,contentType:'application/json',body:JSON.stringify(body)});
    if(url.pathname==='/api/site-config') return respond({});
    if(url.pathname==='/api/voting/election') return respond({configured:true,election,candidates:[candidate]});
    if(url.pathname==='/api/voting/session'){
      if(request.method()==='POST'){
        assert.equal(request.headers()['x-voting-request'],'1');
        if(rejectCode){rejectCode=false;return respond({error:'NIM atau kode akses tidak valid.'},401);}
        verified=true;
      }
      return respond(session());
    }
    if(url.pathname==='/api/voting/vote'){
      assert.equal(request.headers()['x-voting-request'],'1');
      assert.equal(JSON.parse(request.postData()).candidateId,candidateId);
      sentVotes++;voted=true;
      // Commit succeeds, but its response is lost. The UI must recover via session.
      return respond({error:'Respons terputus setelah commit.'},503);
    }
    if(url.pathname==='/api/voting/admin'){
      if(request.method()==='POST'){adminPosts++;return respond({status:'ok',id,added:2,existing:0});}
      return respond({elections:[adminElection],election:adminElection,candidates:[],eligibleVoters:0,totalVotes:0});
    }
    return request.continue();
  });
  const button=(text)=>page.locator('button::-p-text('+text+')');
  try{
    await page.emulateMediaFeatures([{name:'prefers-reduced-motion',value:'reduce'}]);
    await page.setViewport({width:1440,height:1000,deviceScaleFactor:1});
    await page.goto(base+'/voting',{waitUntil:'networkidle2'});
    await button('Pilih kandidat').click();
    await page.waitForSelector('dialog[open] input[name="nim"]');
    await page.type('input[name="nim"]','00123456');
    await page.type('input[name="access-code"]','A'.repeat(32));
    await button('Verifikasi & lanjutkan').click();
    await page.waitForFunction(()=>document.querySelector('[role="alert"]')?.textContent.includes('tidak valid'));
    await button('Verifikasi & lanjutkan').click();
    await page.waitForFunction(()=>document.querySelector('dialog')?.textContent.includes('Satu komitmen.'));
    assert.equal(await page.$eval('dialog button[class*="primaryButton"]',el=>el.disabled),true);
    await page.click('dialog input[type="checkbox"]');
    await button('Kirim suara saya').click();
    await page.waitForFunction(()=>document.querySelector('dialog code')!==null);
    assert.equal(await page.$eval('dialog code',el=>el.textContent),receipt);
    assert.equal(sentVotes,1);
    await button('Kembali ke perjalanan').click();
    await button('Pilih kandidat').click();
    await page.waitForSelector('dialog code');
    assert.equal(sentVotes,1);
    await page.keyboard.press('Escape');
    await page.setViewport({width:390,height:844});
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
    await page.goto(base+'/admin/voting',{waitUntil:'networkidle2'});
    await page.waitForFunction(()=>document.body.textContent.includes('Pengaturan pemilihan'));
    mkdirSync('scratch/voting-ui-qa',{recursive:true});
    await page.screenshot({path:'scratch/voting-ui-qa/admin-mobile.png',fullPage:true});
    await page.setViewport({width:1440,height:1000});
    await page.screenshot({path:'scratch/voting-ui-qa/admin-desktop.png',fullPage:true});
    await page.setViewport({width:390,height:844});
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
    await button('Tambah kandidat').click();
    await page.type('input[name="name"]','Kandidat Form Uji');
    await button('Simpan kandidat').click();
    await page.waitForFunction(()=>document.body.textContent.includes('Perubahan berhasil disimpan.'));
    const folder=join(tmpdir(),'imo-voting-browser-fixture');mkdirSync(folder,{recursive:true});
    const input=join(folder,'voters.csv');writeFileSync(input,'Daftar pemilih\nTahun 2026\nnim\nBARIS INI DILEWATI\n00123456\n00123457\n');
    await (await page.$('input[accept=".csv,text/csv"]')).uploadFile(input);
    await page.waitForFunction(()=>document.body.textContent.includes('2 NIM siap diimpor.'));
    assert.equal(await page.$$eval('button',els=>els.find(el=>el.textContent.includes('Impor ke pemilihan')).disabled),true);
    const cdp=await page.createCDPSession();await cdp.send('Browser.setDownloadBehavior',{behavior:'allow',downloadPath:folder});
    await button('Unduh kode akses pribadi').click();
    await page.locator('label::-p-text(Saya sudah menyimpan file)').click();
    await button('Impor ke pemilihan').click();
    await page.waitForFunction(()=>document.body.textContent.includes('2 NIM ditambahkan'));
    assert.equal(adminPosts,2);
    assert.deepEqual(errors,[]);
  }finally{await browser.close();}
});
