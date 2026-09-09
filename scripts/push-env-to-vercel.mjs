#!/usr/bin/env node
/**
 * Utility script to push all variables from .env.local to Vercel.
 * Usage:
 *   node scripts/push-env-to-vercel.mjs [--token <vercel-token>] [--project <project-name>]
 */

import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const envFile = resolve(rootDir, '.env.local');

if (!existsSync(envFile)) {
  console.error('.env.local tidak ditemukan di direktori root.');
  process.exit(1);
}

// Parse command line args
const args = process.argv.slice(2);
let vercelToken = process.env.VERCEL_TOKEN || '';
let projectName = '';

for (let i = 0; i < args.length; i++) {
  if (args[i] === '--token' && args[i + 1]) {
    vercelToken = args[++i];
  } else if (args[i] === '--project' && args[i + 1]) {
    projectName = args[++i];
  }
}

function parseEnvFile(content) {
  const result = [];
  const lines = content.split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    let val = trimmed.slice(eqIdx + 1).trim();

    // Strip outer quotes if present
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    result.push({ key, value: val });
  }
  return result;
}

const envEntries = parseEnvFile(readFileSync(envFile, 'utf8'));
console.log(`Ditemukan ${envEntries.length} variabel di .env.local.`);

function addEnvToVercel(key, value) {
  return new Promise((res, rej) => {
    const cliArgs = ['vercel', 'env', 'add', key, 'production,preview,development', '--force', '--yes'];
    if (vercelToken) {
      cliArgs.push('--token', vercelToken);
    }
    if (projectName) {
      cliArgs.push('--project', projectName);
    }

    const proc = spawn('cmd.exe', ['/c', 'npx', ...cliArgs], {
      cwd: rootDir,
      stdio: ['pipe', 'pipe', 'pipe']
    });

    let stdout = '';
    let stderr = '';

    proc.stdout.on('data', (d) => { stdout += d.toString(); });
    proc.stderr.on('data', (d) => { stderr += d.toString(); });

    proc.on('close', (code) => {
      if (code === 0) {
        res(stdout);
      } else {
        rej(new Error(stderr || stdout || `Exited with code ${code}`));
      }
    });

    // Write value to stdin and close
    proc.stdin.write(value);
    proc.stdin.end();
  });
}

async function run() {
  console.log('Mulai sinkronisasi variabel ke Vercel (target: production, preview, development)...');
  let successCount = 0;
  let failCount = 0;

  for (const { key, value } of envEntries) {
    process.stdout.write(`- Mengirim ${key}... `);
    try {
      await addEnvToVercel(key, value);
      console.log('BERHASIL');
      successCount++;
    } catch (err) {
      console.log(`GAGAL: ${err.message.trim().replace(/\n/g, ' ')}`);
      failCount++;
    }
  }

  console.log(`\nSelesai! Berhasil: ${successCount}, Gagal: ${failCount}`);
}

run();
