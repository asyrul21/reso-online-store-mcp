#!/usr/bin/env node
/**
 * Converts a local env file to a single-line JSON string for use as a GitHub Secret.
 *
 * Usage (from your app repo root):
 *   node scripts/generate-env-stringified-json.js --app
 *     Reads .env.production  → writes generated/APP_ENV_JSON.txt
 *     Paste the output as the APP_ENV_JSON GitHub Secret.
 *
 *   node scripts/generate-env-stringified-json.js --db
 *     Reads .db.env.production → writes generated/DB_ENV_JSON.txt
 *     Paste the output as the DB_ENV_JSON GitHub Secret.
 *
 * The generated/ folder is git-ignored. Never commit its contents.
 */

const fs = require('fs');
const path = require('path');

// --- 0. Parse flag ---
const flag = process.argv[2];

const CONFIG = {
  '--app': {
    envFile: '.env.production',
    outputFile: 'APP_ENV_JSON.txt',
    secretName: 'APP_ENV_JSON',
  },
  '--db': {
    envFile: '.db.env.production',
    outputFile: 'DB_ENV_JSON.txt',
    secretName: 'DB_ENV_JSON',
  },
};

if (!flag || !CONFIG[flag]) {
  console.error('Usage:');
  console.error('  node scripts/generate-env-stringified-json.js --app   (app env vars)');
  console.error('  node scripts/generate-env-stringified-json.js --db    (DB credentials)');
  process.exit(1);
}

const { envFile, outputFile, secretName } = CONFIG[flag];

const ENV_FILE = path.resolve(process.cwd(), envFile);
const OUTPUT_DIR = path.resolve(process.cwd(), 'generated');
const OUTPUT_FILE = path.join(OUTPUT_DIR, outputFile);

// --- 1. Read env file ---
if (!fs.existsSync(ENV_FILE)) {
  console.error(`ERROR: ${envFile} not found in the current directory.`);
  console.error('');
  if (flag === '--app') {
    console.error('Create it first:');
    console.error('  cp .env.example .env.production');
    console.error('  # then fill in all production values');
  } else {
    console.error('Create it first:');
    console.error('  cp .db.env.example .db.env.production');
    console.error('  # then fill in username, password, dbName');
  }
  process.exit(1);
}

const raw = fs.readFileSync(ENV_FILE, 'utf8');

// --- 2. Parse key=value pairs (skip blank lines and comments) ---
const env = {};
for (const line of raw.split('\n')) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#')) continue;
  const eqIndex = trimmed.indexOf('=');
  if (eqIndex === -1) continue;
  const key = trimmed.slice(0, eqIndex).trim();
  const value = trimmed.slice(eqIndex + 1).trim();
  env[key] = value;
}

if (Object.keys(env).length === 0) {
  console.error(`ERROR: ${envFile} is empty or contains no valid key=value pairs.`);
  process.exit(1);
}

// --- 3. Stringify ---
const json = JSON.stringify(env);

// --- 4. Write output ---
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

fs.writeFileSync(OUTPUT_FILE, json, 'utf8');

console.log(`✓ Generated ${OUTPUT_FILE}`);
console.log('');
console.log('Next step:');
console.log(`  Open generated/${outputFile}, copy the entire contents,`);
console.log(`  and paste it as the ${secretName} secret in GitHub:`);
console.log('  Settings → Secrets and variables → Actions → New repository secret');
