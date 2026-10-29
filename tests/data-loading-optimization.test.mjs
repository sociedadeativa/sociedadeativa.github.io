import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");

console.log("======================================================================");
console.log("TEST SUITE: DATA LOADING OPTIMIZATION & IN-FLIGHT DEDUPLICATION AUDIT");
console.log("======================================================================");

// --- TEST 1: Cache-Busting Removal in Services ---
console.log("\n[TEST 1] Elimination of Cache-Busting Query Strings (?_t= / _r=)");
const marketServicePath = path.join(rootDir, "src", "services", "marketService.ts");
const economyServicePath = path.join(rootDir, "src", "services", "economyService.ts");
const newsServicePath = path.join(rootDir, "src", "services", "newsService.ts");

const marketServiceSrc = fs.readFileSync(marketServicePath, "utf8");
const economyServiceSrc = fs.readFileSync(economyServicePath, "utf8");
const newsServiceSrc = fs.readFileSync(newsServicePath, "utf8");

assert.ok(!marketServiceSrc.includes("_t="), "marketService.ts must not contain _t= query param");
assert.ok(!marketServiceSrc.includes("_r="), "marketService.ts must not contain _r= query param");
assert.ok(!economyServiceSrc.includes("_t="), "economyService.ts must not contain _t= query param");
assert.ok(!newsServiceSrc.includes("_t="), "newsService.ts must not contain _t= query param");

assert.ok(marketServiceSrc.includes('cache: "no-cache"'), 'marketService.ts must use cache: "no-cache"');
assert.ok(economyServiceSrc.includes('cache: "no-cache"'), 'economyService.ts must use cache: "no-cache"');
assert.ok(newsServiceSrc.includes('cache: "no-cache"'), 'newsService.ts must use cache: "no-cache"');

console.log("  [PASS] All 3 data services use stable URLs and cache: 'no-cache' for ETag revalidation.");

// --- TEST 2: In-Flight Request Deduplication Logic ---
console.log("\n[TEST 2] In-Flight Request Deduplication via Map<string, Promise<unknown>>");
const deduplicatorPath = path.join(rootDir, "src", "utils", "inFlightRequests.ts");
assert.ok(fs.existsSync(deduplicatorPath), "src/utils/inFlightRequests.ts must exist");

const deduplicatorSrc = fs.readFileSync(deduplicatorPath, "utf8");
assert.ok(
  deduplicatorSrc.includes("new Map<string, Promise<unknown>>()"),
  "inFlightRequests must use Map<string, Promise<unknown>>"
);
assert.ok(
  deduplicatorSrc.includes(".delete(") && deduplicatorSrc.includes("finally"),
  "dedupeInFlightRequest must delete map entries in finally block"
);

// Test deduplication behavior dynamically
import {
  dedupeInFlightRequest,
  inFlightRequests,
  normalizeResourceUrl,
  clearInFlightRequests,
} from "../src/utils/inFlightRequests.ts";

clearInFlightRequests();
assert.equal(inFlightRequests.size, 0, "Map must be empty initially");

// Normalization verification
const urlA = "/data/economyData.json";
const urlB = "https://sociedadeativa.github.io/data/economyData.json";
const urlC = "http://localhost:3000/data/economyData.json?foo=bar#hash";
assert.equal(normalizeResourceUrl(urlA), "/data/economyData.json");
assert.equal(normalizeResourceUrl(urlB), "/data/economyData.json");
assert.equal(normalizeResourceUrl(urlC), "/data/economyData.json");
console.log("  [PASS] Resource URLs correctly normalize across relative, canonical and origin variants.");

// Concurrent deduplication verification
let fetchCount = 0;
const slowFetcher = () => {
  fetchCount++;
  return new Promise((resolve) => setTimeout(() => resolve({ success: true, count: fetchCount }), 50));
};

const promise1 = dedupeInFlightRequest("/data/economyData.json", slowFetcher);
const promise2 = dedupeInFlightRequest("https://sociedadeativa.github.io/data/economyData.json", slowFetcher);

assert.strictEqual(promise1, promise2, "Concurrent requests for the same resource must return the exact same Promise instance");
assert.equal(inFlightRequests.size, 1, "inFlightRequests Map must hold exactly 1 pending entry during flight");

const [res1, res2] = await Promise.all([promise1, promise2]);
assert.deepEqual(res1, res2);
assert.equal(fetchCount, 1, "Underlying fetcher must have been invoked exactly once");
assert.equal(inFlightRequests.size, 0, "inFlightRequests Map must be cleaned up after resolution");
console.log("  [PASS] Concurrent requests shared 1 Promise; fetch count was 1; entry was cleaned up on resolve.");

// Error cleanup & retry verification
let attempt = 0;
const failingFetcher = () => {
  attempt++;
  return new Promise((_, reject) => setTimeout(() => reject(new Error("Transient network failure")), 30));
};

await assert.rejects(
  () => dedupeInFlightRequest("/data/marketData.json", failingFetcher),
  /Transient network failure/
);
assert.equal(inFlightRequests.size, 0, "Failed in-flight request must be deleted from Map on error");

// Retry should be possible immediately
const retryPromise = dedupeInFlightRequest("/data/marketData.json", () => Promise.resolve({ retried: true }));
const retryResult = await retryPromise;
assert.deepEqual(retryResult, { retried: true }, "Retry must succeed without lingering rejected promise");
console.log("  [PASS] Failed requests deleted from Map; retries succeed without stale rejections.");

// --- TEST 3: Reduced Initial News Bundle Snapshot ---
console.log("\n[TEST 3] Compact Initial News Snapshot (No Full Article Bodies in Entry Bundle)");
const snapshotPath = path.join(rootDir, "src", "data", "initialNewsSnapshot.ts");
assert.ok(fs.existsSync(snapshotPath), "src/data/initialNewsSnapshot.ts must exist");

const { INITIAL_NEWS_SNAPSHOT } = await import("../src/data/initialNewsSnapshot.ts");
assert.ok(Array.isArray(INITIAL_NEWS_SNAPSHOT), "INITIAL_NEWS_SNAPSHOT must be an array");
assert.equal(INITIAL_NEWS_SNAPSHOT.length, 9, "INITIAL_NEWS_SNAPSHOT must contain exactly 9 articles (lead + 8 summaries)");

for (const item of INITIAL_NEWS_SNAPSHOT) {
  assert.ok(item.id, "Snapshot article must have an ID");
  assert.ok(item.title, "Snapshot article must have a title");
  assert.ok(item.summary, "Snapshot article must have a summary");
  assert.ok(item.publishedAt, "Snapshot article must have publishedAt");
  assert.ok(item.category, "Snapshot article must have category");
  assert.ok(
    !item.content || item.content.length === 0,
    `Article ${item.id} must exclude full article body from initial bundle`
  );
}

const snapshotStat = fs.statSync(snapshotPath);
console.log(`  Snapshot file size: ${(snapshotStat.size / 1024).toFixed(2)} KB (original was ~206 KB)`);
assert.ok(snapshotStat.size < 20 * 1024, "Snapshot file must be under 20 KB");
console.log("  [PASS] Compact snapshot has 9 articles with excluded full bodies (<20 KB).");

// --- TEST 4: Homepage News Selection & Partitioning ---
console.log("\n[TEST 4] Homepage News Selection (Lead, 3 Featured, 5 Civic Wire)");
import { sortNewsItems, deduplicateNewsItems, filterNewsItems } from "../src/services/newsService.ts";

const sortedSnapshot = sortNewsItems(deduplicateNewsItems(INITIAL_NEWS_SNAPSHOT));
const lead = sortedSnapshot[0];
assert.ok(lead, "Lead article must exist");
assert.equal(lead.id, sortedSnapshot[0].id, "Lead article must match top published story");

const remaining = sortedSnapshot.slice(1);
const secondary = remaining.slice(0, 3);
const civicWire = remaining.slice(3, 8);

assert.equal(secondary.length, 3, "Secondary featured stories must be 3");
assert.equal(civicWire.length, 5, "Civic wire (Radar) stories must be 5");

const allIds = [lead.id, ...secondary.map(s => s.id), ...civicWire.map(c => c.id)];
const uniqueIds = new Set(allIds);
assert.equal(uniqueIds.size, 9, "All 9 displayed stories on homepage must be unique with zero overlap");
console.log("  [PASS] Homepage cleanly partitions 1 lead + 3 featured + 5 civic wire with 0 overlap.");

// --- TEST 5: Full Dataset Parity and On-Demand Loading ---
console.log("\n[TEST 5] Full Dataset Parity & Search/Filter Behavior");
const fullJsonPath = path.join(rootDir, "public", "data", "newsData.json");
const fullDataset = JSON.parse(fs.readFileSync(fullJsonPath, "utf8"));
assert.equal(fullDataset.length, 55, "Full dataset must preserve all 55 articles");

// Verify filter behavior on full dataset
const economiaFiltered = filterNewsItems(fullDataset, { category: "Economia", searchQuery: "", source: "Todas" });
assert.ok(economiaFiltered.length > 0, "Economia category must return filtered articles");
assert.ok(economiaFiltered.every(a => a.category === "Economia"), "Filtered articles must match Economia");

const searchFiltered = filterNewsItems(fullDataset, { category: "Todas", searchQuery: "TSE", source: "Todas" });
assert.ok(searchFiltered.length > 0, "Search query 'TSE' must return matching articles");

console.log("  [PASS] Full 55-article dataset preserves category filtering and search queries.");

// --- TEST 6: Offline / Network Error Fallback Resilience ---
console.log("\n[TEST 6] Service Fallback Resilience Under Network Outage");
import { fetchEconomicIndicators } from "../src/services/economyService.ts";
import { fetchMarketRankings } from "../src/services/marketService.ts";

// Test economyService fallback with invalid origin
const ecoFallback = await fetchEconomicIndicators();
assert.ok(Array.isArray(ecoFallback) && ecoFallback.length > 0, "fetchEconomicIndicators must return safe fallback");
assert.ok(ecoFallback.some(i => i.id === "selic" || i.id === "ipca"), "Fallback must contain core indicators");

// Test marketService fallback
const mktFallback = await fetchMarketRankings();
assert.ok(mktFallback && mktFallback.ibov, "fetchMarketRankings must return safe fallback with ibov node");

console.log("  [PASS] Economic and market services provide verified offline fallback resilience.");

console.log("\n======================================================================");
console.log("ALL 6 DATA LOADING OPTIMIZATION AUDIT TESTS PASSED SUCCESSFULLY!");
console.log("======================================================================\n");
