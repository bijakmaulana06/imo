import test from 'node:test';
import assert from 'node:assert/strict';
import puppeteer from 'puppeteer-core';
import { existsSync, mkdirSync } from 'node:fs';

// UI-only fixtures: never send test votes or imports to the production database.
test('candidate profile, swipe verification and voting, interactive monitor', { timeout: 150000 }, async () => {
  const executablePath = process.env.VOTING_BROWSER_PATH || ['C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'].find(existsSync);
  const browser = await puppeteer.launch({ executablePath, headless: true, acceptInsecureCerts: true, args: ['--enable-unsafe-swiftshader'] });
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  const base = process.env.VOTING_TEST_URL || 'https://localhost:3000';
  const election = { id: '17b59c7f-960b-4da4-8f5e-a31e66d26548', title: 'Pemilihan Interaksi', year: '2026', status: 'open', opensAt: null, closesAt: null };
  const candidates = ['Alya Pratama', 'Bima Saputra'].map((name, i) => ({ id: `candidate-${i}`, electionId: election.id, number: i + 1, name, tagline: 'Bersama, setiap gagasan berarti.', vision: 'Angkatan yang saling mendengar dan tumbuh bersama.', mission: ['Membuka forum aspirasi angkatan.', 'Membangun kolaborasi yang terbuka.'], photoUrl: null, accent: '#c5b28c' }));
  let verified = false, voted = false, verificationPosts = 0, votePosts = 0, updated = false;
  const receipt = '47b59c7f-960b-4da4-8f5e-a31e66d26548';
  await page.setRequestInterception(true);
  page.on('request', request => {
    const path = new URL(request.url()).pathname;
    const respond = (body, status = 200) => request.respond({ status, contentType: 'application/json', body: JSON.stringify(body) });
    if (path === '/api/site-config') return respond({});
    if (path === '/api/voting/election') return respond({ configured: true, election, candidates });
    if (path === '/api/voting/session') {
      if (request.method() === 'DELETE') verified = false;
      if (request.method() === 'POST') {
        verificationPosts++; assert.equal(JSON.parse(request.postData()).nim, '00123456');
        if (verificationPosts === 1) return respond({ error: 'Verifikasi ditolak untuk uji ulang.' }, 401);
        verified = true;
      }
      return respond({ verified, voterName: verified ? "Pemilih Uji" : undefined, electionId: election.id, expiresAt: new Date(Date.now() + 900000).toISOString(), nimMasked: '••••3456', hasVoted: voted, ...(voted ? { receipt } : {}) });
    }
    if (path === '/api/voting/vote') {
      votePosts++; voted = true;
      assert.equal(JSON.parse(request.postData()).candidateId, candidates[0].id);
      assert.equal(request.headers()['x-voting-request'], '1');
      return respond({ error: 'Lost response after commit' }, 503);
    }
    if (path === '/api/voting/monitor') return respond({ election, candidates, eligibleVoters: 100, totalVotes: updated ? 50 : 40, results: [{ candidateId: candidates[0].id, votes: updated ? 30 : 10 }, { candidateId: candidates[1].id, votes: updated ? 20 : 30 }], timeline: [{ time: '2026-09-08T01:00:00Z', votes: 10 }, { time: '2026-09-08T02:00:00Z', votes: 30 }], updatedAt: new Date().toISOString() });
    if (path.startsWith('/api/voting/')) return respond({ error: 'Fixture forbids other operations' }, 403);
    return request.continue();
  });
  const button = text => page.locator(`button::-p-text(${text})`);
  async function swipe(label, fraction, touch = false, cancel = false) {
    const selector = `button[aria-label="${label}"]`;
    await page.$eval(selector, el => el.scrollIntoView({ block: 'center' }));
    const geometry = await page.$eval(selector, el => {
      const r = el.getBoundingClientRect();
      return { x: r.x + r.width / 2, y: r.y + r.height / 2, travel: el.parentElement.clientWidth - el.offsetWidth - 12 };
    });
    if (touch) {
      const cdp = await page.createCDPSession();
      await cdp.send('Emulation.setTouchEmulationEnabled', { enabled: true });
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: geometry.x, y: geometry.y, id: 1 }] });
      for (let i = 1; i <= 14; i++) await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: geometry.x + geometry.travel * fraction * i / 14, y: geometry.y, id: 1 }] });
      assert.equal(votePosts, 0, 'Reaching the end without releasing must not cast a vote');
      await cdp.send('Input.dispatchTouchEvent', { type: cancel ? 'touchCancel' : 'touchEnd', touchPoints: [] });
      await cdp.detach();
      return;
    }
    await page.mouse.move(geometry.x, geometry.y);
    await page.mouse.down();
    await page.mouse.move(geometry.x + geometry.travel * fraction, geometry.y, { steps: 14 });
    await page.mouse.up();
  }
  try {
    await page.setViewport({ width: 1440, height: 1000 });
    await page.goto(base + '/voting', { waitUntil: 'networkidle2' });
    await page.evaluate(() => window.scrollTo({ top: innerHeight * .95, behavior: 'instant' }));
    await page.waitForFunction(() => Number(getComputedStyle(document.querySelector('[class*="heroWords"]')).opacity) < .15);
    assert.ok(Math.abs(await page.$eval('[class*="heroSticky"]', el => el.getBoundingClientRect().top)) < 2, 'Hero scene stays pinned while scroll advances its depth');
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
    await page.waitForFunction(() => Number(getComputedStyle(document.querySelector('[class*="heroWords"]')).opacity) > .95);
    assert.equal(await page.$$eval('button', buttons => buttons.some(el => el.textContent.includes('Pilih kandidat') || el.getAttribute('aria-label')?.startsWith('Pilih '))), false);
    const portrait = 'button[aria-label="Lihat profil Alya Pratama"]';
    await page.waitForSelector('[class*="afterCandidates"]');
    assert.equal(await page.$eval('[class*="afterCandidates"]', el => el.previousElementSibling?.querySelector('button[aria-label="Lihat profil Bima Saputra"]') !== null), true, 'Voting entry follows the second candidate immediately');
    await page.locator(portrait).click();
    await page.waitForSelector('dialog[open] #profile-title');
    assert.equal(await page.$$eval('dialog button', buttons => buttons.some(el => el.textContent.includes('Pilih kandidat'))), false);
    await page.waitForFunction(() => document.querySelector('dialog[open]')?.getBoundingClientRect().width > 500);
    mkdirSync('scratch/voting-ui-qa', { recursive: true });
    await page.screenshot({ path: 'scratch/voting-ui-qa/profile-interactive-desktop.png' });
    await page.keyboard.press('Escape');
    await page.waitForFunction(() => !document.querySelector('dialog[open]'));
    assert.equal(await page.evaluate(() => document.activeElement?.getAttribute('aria-label')), 'Lihat profil Alya Pratama');
    await page.locator(portrait).click();
    await button('Kembali ke kandidat').click();
    await page.waitForFunction(() => !document.querySelector('dialog[open]'));
    await page.locator('button[aria-label="Masuk ruang pemilihan"]').click();
    await page.waitForSelector('dialog[open] input[name="nim"]');
    assert.equal(await page.$('button[aria-label="Pilih Alya Pratama"]'), null);
    await page.type('input[name="nim"]', '00123456');
    // A click or short swipe must never submit either request.
    await page.locator('button[aria-label="Geser untuk verifikasi"]').click();
    assert.equal(verificationPosts, 0);
    await swipe('Geser untuk verifikasi', .4);
    assert.equal(verificationPosts, 0);
    await page.waitForFunction(() => Math.abs(new DOMMatrix(getComputedStyle(document.querySelector('button[aria-label="Geser untuk verifikasi"]')).transform).m41) < 1);
    // Accessible alternative requires two separate keyboard activations.
    await page.focus('button[aria-label="Geser untuk verifikasi"]');
    await page.keyboard.press('Enter');
    assert.equal(verificationPosts, 0);
    await page.keyboard.press('Enter');
    await page.waitForFunction(() => document.querySelector('[role="alert"]')?.textContent.includes('Verifikasi ditolak'));
    await swipe('Geser untuk verifikasi', 1);
    await page.waitForSelector('[class*="voterName"]');
    assert.equal(await page.$eval('[class*="voterName"]', el => el.textContent), 'Pemilih Uji');
    assert.equal(await page.$('button[aria-label="Pilih Alya Pratama"]'), null, 'Name confirmation must precede candidate choice');
    await button('Ya, ini nama saya').click();
    await page.waitForSelector('button[aria-label="Pilih Alya Pratama"]');
    assert.equal(await page.$('button[aria-label="Geser untuk kirim suara"]'), null);
    assert.equal(verificationPosts, 2);
    await button('Gunakan NIM lain').click();
    await page.waitForSelector('input[name="nim"]');
    assert.equal(await page.$('button[aria-label="Pilih Alya Pratama"]'), null);
    await page.type('input[name="nim"]', '00123456');
    await swipe('Geser untuk verifikasi', 1);
    await button('Ya, ini nama saya').click();
    await page.waitForSelector('button[aria-label="Pilih Bima Saputra"]');
    await page.locator('button[aria-label="Pilih Bima Saputra"]').click();
    await page.waitForSelector('button[aria-label="Geser untuk kirim suara"]');
    assert.equal(votePosts, 0);
    await button('Kembali ke daftar kandidat').click();
    await page.locator('button[aria-label="Pilih Alya Pratama"]').click();
    await page.waitForSelector('button[aria-label="Geser untuk kirim suara"]');
    assert.equal(verificationPosts, 3);
    await swipe('Geser untuk kirim suara', .5);
    assert.equal(votePosts, 0);
    await page.waitForFunction(() => Math.abs(new DOMMatrix(getComputedStyle(document.querySelector('button[aria-label="Geser untuk kirim suara"]')).transform).m41) < 1);
    await page.setViewport({ width: 390, height: 844 });
    await swipe('Geser untuk kirim suara', 1, true, true);
    assert.equal(votePosts, 0);
    await page.waitForFunction(() => Math.abs(new DOMMatrix(getComputedStyle(document.querySelector('button[aria-label="Geser untuk kirim suara"]')).transform).m41) < 1);
    await page.screenshot({ path: 'scratch/voting-ui-qa/swipe-mobile.png' });
    await swipe('Geser untuk kirim suara', 1, true);
    await page.waitForSelector('dialog code');
    assert.equal(await page.$eval('dialog code', el => el.textContent), receipt);
    assert.equal(votePosts, 1);
    await button('Kembali ke perjalanan').click();
    await page.locator('button[aria-label="Masuk ruang pemilihan"]').click();
    await page.waitForSelector('dialog code');
    assert.equal(await page.$('button[aria-label="Pilih Alya Pratama"]'), null);
    assert.equal(votePosts, 1);
    await button('Kembali ke perjalanan').click();
    await page.goto(base + '/voting/monitor', { waitUntil: 'networkidle2' });
    await page.waitForSelector('button[aria-controls="result-candidate-0"]');
    await button('Suara terbanyak').click();
    assert.equal(await page.$eval('ol button', el => el.getAttribute('aria-controls')), 'result-candidate-1');
    await page.locator('button[aria-controls="result-candidate-1"]').click();
    await page.waitForSelector('#result-candidate-1');
    await page.locator('svg [role="button"][aria-label="09.00 WIB: 30 suara"]').click();
    await page.waitForFunction(() => document.querySelector('[class*="chartReadout"]')?.textContent.includes('30'));
    updated = true;
    await button('Perbarui').click();
    await page.waitForFunction(() => document.querySelector('ol button')?.getAttribute('aria-controls') === 'result-candidate-0');
    await page.waitForFunction(() => document.querySelector('[class*="totalNumber"] [aria-hidden="true"]')?.textContent === '50' && [...document.querySelectorAll('ol>li')].every(el => getComputedStyle(el).opacity === '1'));
    await page.evaluate(() => { document.activeElement?.blur(); window.scrollTo({ top: 0, behavior: 'instant' }); });
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
    await page.screenshot({ path: 'scratch/voting-ui-qa/monitor-interactive-mobile.png', fullPage: true });
    await page.setViewport({ width: 1440, height: 1000 });
    await page.screenshot({ path: 'scratch/voting-ui-qa/monitor-interactive-desktop.png', fullPage: true });
    await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }]);
    await page.goto(base + '/voting', { waitUntil: 'networkidle2' });
    await page.setViewport({ width: 390, height: 844 });
    await page.locator(portrait).click();
    await page.waitForSelector('dialog[open] #profile-title');
    assert.equal(await page.$eval('dialog', el => el.scrollWidth > el.clientWidth), false);
    await page.screenshot({ path: 'scratch/voting-ui-qa/profile-interactive-mobile.png' });
    await page.keyboard.press('Escape');
    assert.deepEqual(errors, []);
  } finally { await browser.close(); }
});
