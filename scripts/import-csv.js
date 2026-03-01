#!/usr/bin/env node
/**
 * import-csv.js – One-off CSV import for Vacation Scheduler
 * ----------------------------------------------------------
 * Reads a CSV exported from another planning tool and writes
 * each participant + their available days into an existing
 * Firebase Realtime Database group.
 *
 * Prerequisites:
 *   1. A group already created in the app (you need its ID).
 *   2. Your .env.local in the project root (or set REACT_APP_FIREBASE_DATABASE_URL).
 *   3. Node 18+ (uses built-in fetch).
 *
 * Usage:
 *   node scripts/import-csv.js <path-to-csv> <groupId>
 *
 * Example:
 *   node scripts/import-csv.js ./data/friends.csv abc123-xxxx
 *
 * CSV format expected (first row = headers):
 *   Name,Email,Mon 1 Jun 2026,Tue 2 Jun 2026,...
 *   Each date cell: "Yes" | "If need be" | "No"
 *   "Yes" and "If need be" are both treated as AVAILABLE.
 *
 * No service-account key is required. The script uses the
 * Firebase REST API with your project's database URL, which
 * is publicly accessible for unauthenticated writes because
 * your database.rules.json allows it.
 */

'use strict';

const fs = require('fs');
const path = require('path');

// ─── 1. Load .env.local from project root ───────────────────────────────────
const envPath = path.resolve(__dirname, '..', '.env.local');
if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, 'utf8').split(/\r?\n/);
    for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) continue;
        const eqIdx = trimmed.indexOf('=');
        if (eqIdx === -1) continue;
        const key = trimmed.slice(0, eqIdx).trim();
        const val = trimmed.slice(eqIdx + 1).trim();
        if (!process.env[key]) process.env[key] = val;
    }
}

const DB_URL = process.env.REACT_APP_FIREBASE_DATABASE_URL;
if (!DB_URL) {
    console.error('❌  REACT_APP_FIREBASE_DATABASE_URL is not set.');
    console.error('    Make sure .env.local exists or export the variable before running.');
    process.exit(1);
}

// ─── 2. Simple CSV parser (no extra dependencies) ────────────────────────────
/**
 * Parses a CSV string into an array of objects keyed by the header row.
 * Handles quoted fields containing commas or newlines.
 */
function parseCsv(raw) {
    const rows = [];
    let row = [];
    let field = '';
    let inQuotes = false;

    for (let i = 0; i < raw.length; i++) {
        const ch = raw[i];
        const next = raw[i + 1];

        if (inQuotes) {
            if (ch === '"' && next === '"') { field += '"'; i++; }
            else if (ch === '"') { inQuotes = false; }
            else { field += ch; }
        } else {
            if (ch === '"') { inQuotes = true; }
            else if (ch === ',') { row.push(field); field = ''; }
            else if (ch === '\n' || (ch === '\r' && next === '\n')) {
                if (ch === '\r') i++;
                row.push(field); field = '';
                rows.push(row); row = [];
            } else { field += ch; }
        }
    }
    // last field / row
    row.push(field);
    if (row.some(f => f !== '')) rows.push(row);

    const headers = rows[0].map(h => h.trim());
    return rows.slice(1).map(r => {
        const obj = {};
        headers.forEach((h, i) => { obj[h] = (r[i] ?? '').trim(); });
        return obj;
    });
}

// ─── 3. Date header → ISO string ─────────────────────────────────────────────
const MONTH_MAP = {
    Jan: '01', Feb: '02', Mar: '03', Apr: '04', May: '05', Jun: '06',
    Jul: '07', Aug: '08', Sep: '09', Oct: '10', Nov: '11', Dec: '12',
};

/**
 * Converts "Mon 1 Jun 2026" → "2026-06-01"
 * Returns null if the header doesn't look like a date.
 */
function headerToIso(header) {
    // Expect: "<weekday> <day> <month-abbr> <year>"
    const parts = header.split(' ');
    if (parts.length !== 4) return null;
    const [, dayStr, monthAbbr, yearStr] = parts;
    const month = MONTH_MAP[monthAbbr];
    if (!month) return null;
    const day = dayStr.padStart(2, '0');
    return `${yearStr}-${month}-${day}`;
}

// ─── 4. Availability interpretation ─────────────────────────────────────────
function isAvailable(cell) {
    const v = cell.trim().toLowerCase();
    return v === 'yes' || v === 'if need be';
}

// ─── 5. Unique ID (crypto.randomUUID is built-in in Node 15+) ───────────────
function newId() {
    return require('crypto').randomUUID();
}

// ─── 6. Firebase REST write ──────────────────────────────────────────────────
/**
 * PUT /groups/<groupId>/participants/<participantId>.json
 * Uses Node 18's built-in fetch.
 */
async function writeParticipant(groupId, participantId, data) {
    const url = `${DB_URL.replace(/\/$/, '')}/groups/${groupId}/participants/${participantId}.json`;
    const res = await fetch(url, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });
    if (!res.ok) {
        const text = await res.text();
        throw new Error(`HTTP ${res.status}: ${text}`);
    }
    return res.json();
}

// ─── 7. Main ─────────────────────────────────────────────────────────────────
async function main() {
    const [csvPath, groupId] = process.argv.slice(2);

    if (!csvPath || !groupId) {
        console.error('Usage: node scripts/import-csv.js <path-to-csv> <groupId>');
        process.exit(1);
    }

    const resolvedCsv = path.resolve(csvPath);
    if (!fs.existsSync(resolvedCsv)) {
        console.error(`❌  CSV file not found: ${resolvedCsv}`);
        process.exit(1);
    }

    const raw = fs.readFileSync(resolvedCsv, 'utf8');
    const records = parseCsv(raw);

    if (records.length === 0) {
        console.error('❌  CSV appears to be empty or has no data rows.');
        process.exit(1);
    }

    // All headers after "Name" and "Email" are treated as date columns
    const allHeaders = Object.keys(records[0]);
    const dateHeaders = allHeaders.slice(2);

    // Validate that date headers parse correctly
    const dateMap = {}; // header string → ISO date string
    for (const h of dateHeaders) {
        const iso = headerToIso(h);
        if (iso) dateMap[h] = iso;
        // silently skip columns that don't look like dates
    }

    console.log(`\n📂  CSV        : ${resolvedCsv}`);
    console.log(`🔗  Group ID   : ${groupId}`);
    console.log(`📅  Date cols  : ${Object.keys(dateMap).length}`);
    console.log(`👥  Participants: ${records.length}\n`);

    let successCount = 0;
    let failCount = 0;

    for (const row of records) {
        const name = (row['Name'] || '').trim();
        const email = (row['Email'] || '').trim();

        if (!name) {
            console.warn('  ⚠️  Skipping row with empty name.');
            failCount++;
            continue;
        }

        // Collect dates this participant is available
        const availableDays = Object.entries(dateMap)
            .filter(([header]) => isAvailable(row[header] || ''))
            .map(([, iso]) => iso);

        const participantId = newId();
        const payload = {
            id: participantId,
            name,
            email,
            duration: availableDays.length > 0 ? 3 : 1, // sensible default
            blockType: 'flexible',
            availableDays,
            createdAt: new Date().toISOString(),
        };

        try {
            await writeParticipant(groupId, participantId, payload);
            console.log(`  ✅  ${name.padEnd(20)} → ${availableDays.length} available day(s)`);
            successCount++;
        } catch (err) {
            console.error(`  ❌  ${name}: ${err.message}`);
            failCount++;
        }
    }

    console.log(`\n─────────────────────────────────────`);
    console.log(`✅  Imported : ${successCount}`);
    if (failCount > 0) console.log(`❌  Failed   : ${failCount}`);
    console.log(`─────────────────────────────────────`);
    console.log(`\n🎉  Done! Open the app and navigate to group ${groupId} to see the results.\n`);
}

main().catch(err => {
    console.error('❌  Unexpected error:', err);
    process.exit(1);
});
