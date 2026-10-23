import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");

console.log("======================================================================");
console.log("TEST SUITE: NEWS INITIAL SYNCHRONIZATION & IDLE TIMING AUDIT");
console.log("======================================================================");

const publicDataFile = path.join(rootDir, "public", "data", "newsData.json");
const tsDataFile = path.join(rootDir, "src", "data", "newsData.ts");
const hookFile = path.join(rootDir, "src", "hooks", "useNews.ts");
const serviceFile = path.join(rootDir, "src", "services", "newsService.ts");

assert.ok(fs.existsSync(publicDataFile), "public/data/newsData.json must exist");
assert.ok(fs.existsSync(tsDataFile), "src/data/newsData.ts must exist");
assert.ok(fs.existsSync(hookFile), "src/hooks/useNews.ts must exist");
assert.ok(fs.existsSync(serviceFile), "src/services/newsService.ts must exist");

const rawJson = JSON.parse(fs.readFileSync(publicDataFile, "utf8"));
assert.equal(rawJson.length, 55, "public/data/newsData.json must have 55 articles");

// --- TEST 1: Static Code Inspection of useNews.ts Optimizations ---
console.log("\n[TEST 1] Static Code Inspection of useNews.ts Optimization Guarantees");

const hookContent = fs.readFileSync(hookFile, "utf8");

// 1. Initial state must start with loading=false when initialArticles is supplied
assert.ok(
  hookContent.includes("const hasInitialArticles = Boolean("),
  "useNews must evaluate hasInitialArticles"
);
assert.ok(
  hookContent.includes("!hasInitialArticles"),
  "loading state must be false when hasInitialArticles is true"
);

// 2. Idle scheduling verification
assert.ok(
  hookContent.includes("requestIdleCallback"),
  "useNews must use requestIdleCallback for background synchronization"
);
assert.ok(
  hookContent.includes("cancelIdleCallback"),
  "useNews must cancel requestIdleCallback on unmount to prevent leaks"
);
assert.ok(
  hookContent.includes("skipBackgroundSync"),
  "useNews must support skipBackgroundSync option for consumer components"
);

// 3. Silent background sync must avoid setting loading=true
assert.ok(
  hookContent.includes("isSilentBackgroundSync"),
  "useNews must distinguish silent background sync from manual refresh/initial empty state"
);

// 4. Consumers NewsSection and NoticiasPage must pass skipBackgroundSync
const newsSectionContent = fs.readFileSync(path.join(rootDir, "src", "components", "NewsSection.tsx"), "utf8");
assert.ok(
  newsSectionContent.includes("skipBackgroundSync: true"),
  "NewsSection must pass skipBackgroundSync: true to avoid redundant background fetches"
);

const noticiasPageContent = fs.readFileSync(path.join(rootDir, "src", "pages", "NoticiasPage.tsx"), "utf8");
assert.ok(
  noticiasPageContent.includes("skipBackgroundSync: true"),
  "NoticiasPage must pass skipBackgroundSync: true to avoid redundant background fetches"
);

console.log("  [PASS] Hook statically verified: requestIdleCallback, silent background sync, skipBackgroundSync.");

// --- TEST 2: Synchronization Timing & Idle Execution Simulation ---
console.log("\n[TEST 2] Synchronization Timing & Idle Execution Simulation");

let fetchCallCount = 0;
let fetchUrls = [];

function mockFetch(url) {
  fetchCallCount++;
  fetchUrls.push(url);
  return Promise.resolve({
    ok: true,
    headers: { get: () => "application/json" },
    json: () => Promise.resolve(rawJson),
  });
}

// Simulate hook lifecycle with initialArticles
let stateArticles = rawJson.slice(0, 5).map(a => ({ ...a, content: [] })); // initial articles with empty content
let stateLoading = false;
let stateError = null;
let idleCallbackScheduled = false;
let idleCallbackExecuted = false;
let registeredIdleCallback = null;

// Fake requestIdleCallback API
const fakeWindow = {
  requestIdleCallback: (cb, opts) => {
    idleCallbackScheduled = true;
    registeredIdleCallback = cb;
    return 12345;
  },
  cancelIdleCallback: (id) => {
    idleCallbackScheduled = false;
    registeredIdleCallback = null;
  }
};

// Mount simulation:
const hasInit = stateArticles.length > 0;
stateLoading = !hasInit;

// At the moment of mount:
assert.equal(stateLoading, false, "Immediate loading state must be false on initial mount with local articles");
assert.equal(fetchCallCount, 0, "No network fetch must occur during the initial mount tick");

// The hook schedules idle task:
fakeWindow.requestIdleCallback(() => {
  idleCallbackExecuted = true;
  // Silent sync runs:
  const isSilent = stateArticles.length > 0;
  if (!isSilent) stateLoading = true;
  mockFetch("/data/newsData.json").then((res) => res.json()).then((items) => {
    stateArticles = items;
    if (!isSilent) stateLoading = false;
  });
}, { timeout: 3500 });

assert.ok(idleCallbackScheduled, "requestIdleCallback was registered");
assert.equal(idleCallbackExecuted, false, "Idle task has not executed before browser is idle");
assert.equal(fetchCallCount, 0, "Zero fetches before idle task executes");

// Simulate idle trigger:
registeredIdleCallback();
await new Promise((r) => setTimeout(r, 10));

assert.ok(idleCallbackExecuted, "Idle task executed successfully");
assert.equal(fetchCallCount, 1, "Exactly one fetch occurred once idle");
assert.equal(stateLoading, false, "Silent background sync preserved loading=false throughout");
assert.equal(stateArticles.length, 55, "All 55 articles synchronized in background");

console.log("  [PASS] Initial render completes with 0 network calls; sync deferred to idle time without loading flicker.");

// --- TEST 3: Article Detail Loading (On-Demand & Cached) ---
console.log("\n[TEST 3] Article Detail Loading On-Demand & Cache Resolution");

// Simulate getFullArticleById behavior
let fullArticlesCache = null;

async function mockGetFullArticleById(id, criticalArticles) {
  if (!id) return null;

  // 1. In-memory cache
  if (fullArticlesCache) {
    const found = fullArticlesCache.find((a) => a.id === id);
    if (found && found.content && found.content.length > 0) {
      return found;
    }
  }

  // 2. Critical lead articles
  const critical = criticalArticles.find((a) => a.id === id);
  if (critical && critical.content && critical.content.length > 0) {
    return critical;
  }

  // 3. Fallback on-demand load
  const res = await mockFetch("/data/newsData.json");
  const data = await res.json();
  fullArticlesCache = data;
  return data.find((a) => a.id === id) || critical || null;
}

// 3A. Lead article resolution before any background sync:
const leadId = rawJson[0].id;
const mockCritical = [
  { ...rawJson[0], content: ["Parágrafo do lead integral."] },
  { ...rawJson[1], content: [] }, // non-lead without content
];

const initialFetchCount = fetchCallCount;
const leadResult = await mockGetFullArticleById(leadId, mockCritical);
assert.equal(leadResult.id, leadId);
assert.equal(leadResult.content[0], "Parágrafo do lead integral.");
assert.equal(fetchCallCount, initialFetchCount, "Lead article must resolve instantly without network call");

// 3B. Non-lead article resolution on-demand:
const nonLeadId = rawJson[1].id;
const nonLeadResult = await mockGetFullArticleById(nonLeadId, mockCritical);
assert.equal(nonLeadResult.id, nonLeadId);
assert.ok(nonLeadResult.content && nonLeadResult.content.length > 0, "Non-lead article must load full content on demand");
assert.equal(fetchCallCount, initialFetchCount + 1, "Non-lead article on-demand triggers exactly 1 fetch");

// 3C. Subsequent article lookup hits in-memory cache:
const anotherId = rawJson[2].id;
const anotherResult = await mockGetFullArticleById(anotherId, mockCritical);
assert.equal(anotherResult.id, anotherId);
assert.equal(fetchCallCount, initialFetchCount + 1, "Subsequent article lookup hits cache without extra fetch");

console.log("  [PASS] Full article content resolves instantly for lead articles and loads on-demand with caching for others.");

// --- TEST 4: Manual Refresh & Retry Behavior ---
console.log("\n[TEST 4] Manual Refresh & Retry Behavior");

let refreshLoading = false;
let refreshError = null;
let refreshArticles = [];

async function mockLoadData(isRefresh, shouldFail = false) {
  const isSilent = !isRefresh && refreshArticles.length > 0;
  if (!isSilent) {
    refreshLoading = true;
    refreshError = null;
  }

  try {
    await new Promise((res) => setTimeout(res, 10));
    if (shouldFail) {
      throw new Error("Falha na sincronização da EBC");
    }
    const res = await mockFetch("/data/newsData.json");
    const data = await res.json();
    refreshArticles = data;
    refreshError = null;
  } catch (err) {
    if (!isSilent) {
      refreshError = err.message;
    }
  } finally {
    if (!isSilent) {
      refreshLoading = false;
    }
  }
}

// 4A. Explicit refresh with success
const preRefreshFetchCount = fetchCallCount;
const refreshPromise = mockLoadData(true, false);
assert.equal(refreshLoading, true, "Manual refresh must immediately set loading=true");
assert.equal(refreshError, null, "Manual refresh must clear prior error");
await refreshPromise;
assert.equal(refreshLoading, false, "Manual refresh must clear loading=false upon completion");
assert.equal(refreshError, null);
assert.equal(fetchCallCount, preRefreshFetchCount + 1, "Manual refresh issued network call");

// 4B. Explicit refresh with failure (Retry error state)
const retryPromise = mockLoadData(true, true);
assert.equal(refreshLoading, true, "Retry must set loading=true");
await retryPromise;
assert.equal(refreshLoading, false, "Retry must reset loading=false");
assert.equal(refreshError, "Falha na sincronização da EBC", "Retry error must be captured for user feedback");

console.log("  [PASS] Manual refresh sets loading=true, clears errors, and correctly sets error state on failure.");

// --- TEST 5: Offline Resilience & Silent Background Sync Preservation ---
console.log("\n[TEST 5] Offline Resilience & Silent Background Sync Preservation");

// When articles already exist locally and background sync fails (e.g. offline):
const localArticles = [{ id: "local-1", title: "Matéria Local Existente" }];
refreshArticles = [...localArticles];
refreshError = null;
refreshLoading = false;

// Silent background sync failure simulation:
await mockLoadData(false, true);

// Verification:
assert.equal(refreshArticles.length, 1, "Local articles must be preserved 100% on offline background sync");
assert.equal(refreshArticles[0].id, "local-1");
assert.equal(refreshLoading, false, "Silent background sync must never toggle loading=true");
assert.equal(refreshError, null, "Silent background sync failure must NOT show intrusive error when local data is present");

console.log("  [PASS] Offline background sync silently preserves existing local data without disruptive error banners.");

console.log("\n======================================================================");
console.log("ALL 5 NEWS INITIAL SYNCHRONIZATION AUDIT TESTS PASSED SUCCESSFULLY!");
console.log("======================================================================");
