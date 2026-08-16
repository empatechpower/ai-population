#!/usr/bin/env node
/**
 * One-off migration: copy the shared reference/content data out of Bubble's
 * Data API into Firestore. User accounts and per-user content (protocols,
 * meals, community posts, etc.) are intentionally NOT migrated — users are
 * signing up fresh in Firebase.
 *
 * Usage:
 *   BUBBLE_BASE_URL=... BUBBLE_API_TOKEN=... FIREBASE_SERVICE_ACCOUNT_PATH=... \
 *     node scripts/migrate-bubble-to-firebase.js [--dry-run] [--only=femalejob,malejob]
 *
 * Env vars:
 *   BUBBLE_BASE_URL              e.g. https://your-app.bubbleapps.io/version-test/api/1.1
 *   BUBBLE_API_TOKEN             the API token ("Private key") from Bubble's
 *                                Settings -> API -> API Token section
 *   FIREBASE_SERVICE_ACCOUNT_PATH  path to a service-account JSON key (Firebase Console ->
 *                                Project settings -> Service accounts -> Generate new key)
 *
 * Flags:
 *   --dry-run        fetch from Bubble and log counts, but don't write to Firebase
 *   --only=a,b,c     only migrate these Bubble types (comma-separated, see TYPE_MAP below)
 *
 * IMPORTANT — in Bubble's Settings -> API, make sure femalejob, malejob, pregnancyfood,
 * WeekDetail, and RecoveryDetail are all checked under "Public API endpoints" (Data API),
 * or their /obj/<type> endpoints will 404.
 */

const fs = require("fs");
const path = require("path");
const admin = require("firebase-admin");

// ---- config ----------------------------------------------------------

const BUBBLE_BASE_URL = process.env.BUBBLE_BASE_URL;
const BUBBLE_API_TOKEN = process.env.BUBBLE_API_TOKEN;
const SERVICE_ACCOUNT_PATH = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;

if (!BUBBLE_BASE_URL || !BUBBLE_API_TOKEN || !SERVICE_ACCOUNT_PATH) {
  console.error(
    "Missing env vars. Required: BUBBLE_BASE_URL, BUBBLE_API_TOKEN, FIREBASE_SERVICE_ACCOUNT_PATH",
  );
  process.exit(1);
}

// Bubble Data API type -> Firestore collection name.
// These are the only types that aren't tied to a specific user account.
const TYPE_MAP = {
  femalejob: "femaleJobs",
  malejob: "maleJobs",
  pregnancyfood: "pregnancyFoods",
  weekdetail: "weekDetails",
  recoverydetail: "recoveryDetails",
};

const PAGE_SIZE = 100;
const FIRESTORE_BATCH_LIMIT = 400; // stay under Firestore's 500-write batch cap

const args = process.argv.slice(2);
const DRY_RUN = args.includes("--dry-run");
const ONLY = (args.find((a) => a.startsWith("--only=")) || "")
  .replace("--only=", "")
  .split(",")
  .filter(Boolean);

// ---- Firebase init -----------------------------------------------------

const serviceAccount = JSON.parse(
  fs.readFileSync(path.resolve(SERVICE_ACCOUNT_PATH), "utf8"),
);
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();

// ---- Bubble fetch helpers -----------------------------------------------

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function fetchBubblePage(type, cursor) {
  const url = `${BUBBLE_BASE_URL}/obj/${type}?limit=${PAGE_SIZE}&cursor=${cursor}`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${BUBBLE_API_TOKEN}` },
  });
  if (!res.ok) {
    throw new Error(
      `Bubble "${type}" fetch failed: ${res.status} ${await res.text()}`,
    );
  }
  const data = await res.json();
  return data.response; // { results, remaining, cursor, count }
}

async function fetchAllFromBubble(type) {
  const all = [];
  let cursor = 0;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const { results, remaining } = await fetchBubblePage(type, cursor);
    all.push(...results);
    cursor += results.length;
    if (results.length === 0 || remaining === 0) break;
    await sleep(150); // be polite to Bubble's rate limiter
  }
  return all;
}

// ---- Record shaping -------------------------------------------------------

// Keep Bubble's _id as the Firestore document id, in case anything ever
// needs to cross-reference these reference records by their original id.
function toFirestoreDoc(record) {
  const { _id, ...rest } = record;
  return { id: _id, data: rest };
}

// ---- Firestore write ------------------------------------------------------

async function writeCollection(collectionName, docs) {
  for (let i = 0; i < docs.length; i += FIRESTORE_BATCH_LIMIT) {
    const chunk = docs.slice(i, i + FIRESTORE_BATCH_LIMIT);
    const batch = db.batch();
    for (const { id, data } of chunk) {
      batch.set(db.collection(collectionName).doc(id), data, { merge: true });
    }
    if (!DRY_RUN) await batch.commit();
    console.log(
      `  wrote ${Math.min(i + FIRESTORE_BATCH_LIMIT, docs.length)}/${docs.length} to "${collectionName}"${DRY_RUN ? " (dry run)" : ""}`,
    );
  }
}

// ---- Main -------------------------------------------------------------

async function main() {
  const types = Object.keys(TYPE_MAP).filter(
    (t) => ONLY.length === 0 || ONLY.includes(t),
  );

  console.log(
    `Migrating types: ${types.join(", ")}${DRY_RUN ? " [DRY RUN]" : ""}`,
  );

  for (const bubbleType of types) {
    const collection = TYPE_MAP[bubbleType];
    console.log(`\nFetching "${bubbleType}" from Bubble...`);
    const records = await fetchAllFromBubble(bubbleType);
    console.log(`  found ${records.length} records`);

    const docs = records.map(toFirestoreDoc);
    await writeCollection(collection, docs);
  }

  console.log("\nDone.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
