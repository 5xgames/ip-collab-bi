const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const jsonPath = path.join(root, "game-projects/data/projects.json");
const jsPath = path.join(root, "game-projects/data/projects.js");
const data = JSON.parse(fs.readFileSync(jsonPath, "utf8"));

const now = new Date();
const checkedAt = new Intl.DateTimeFormat("sv-SE", {
  timeZone: "Asia/Tokyo",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
}).format(now);

const targets = [
  { releaseId: "kj8-global-ios", platform: "ios", storeId: "6742088839", country: "us", bundleId: "jp.aktsk.games.kaiju-no8-the-game" },
  { releaseId: "kj8-global-android", platform: "android", storeId: "jp.aktsk.games.kaiju_no8_the_game", country: "US" },
  { releaseId: "dbgs-global-ios", platform: "ios", storeId: "6744439943", country: "us", bundleId: "jp.co.bandainamcoent.BNEI0418" },
  { releaseId: "dbgs-global-android", platform: "android", storeId: "com.bandainamcoent.dbgekishinsquadra", country: "US" },
  { releaseId: "dbgs-jp-ios", platform: "ios", storeId: "6744439943", country: "jp", bundleId: "jp.co.bandainamcoent.BNEI0418" },
  { releaseId: "dbgs-jp-android", platform: "android", storeId: "com.bandainamcoent.dbgekishinsquadra", country: "JP" },
  { releaseId: "p5x-global-ios", platform: "ios", storeId: "6736754647", country: "us", bundleId: "com.sega.persona5.the.phantomx.en" },
  { releaseId: "p5x-global-android", platform: "android", storeId: "com.sega.persona5.the.phantomx.en", country: "US" },
  { releaseId: "kbt-jp-android", platform: "android", storeId: "jp.kadokawa.gb.machisuba", country: "JP" },
  { releaseId: "mtcoe-jp-ios", platform: "ios", storeId: "6754311241", country: "jp", bundleId: "jp.gree-ent.mushoku" },
  { releaseId: "mtcoe-jp-android", platform: "android", storeId: "jp.gree_ent.mushoku", country: "JP" },
  { releaseId: "mhaus-global-ios", platform: "ios", storeId: "6758648051", country: "us", bundleId: "com.klab.heroaca.united.survival" },
  { releaseId: "mhaus-global-android", platform: "android", storeId: "com.klab.heroaca.united.survival", country: "US" },
  { releaseId: "iec-jp-ios", platform: "ios", storeId: "6756994116", country: "jp", bundleId: "jp.co.level5.inazumacross" },
  { releaseId: "iec-jp-android", platform: "android", storeId: "jp.co.level5.inazumacross", country: "JP" },
  { releaseId: "ssl-jp-ios", platform: "ios", storeId: "6746180100", country: "jp", bundleId: "jp.konami.suikoden.starleap" },
  { releaseId: "ssl-jp-android", platform: "android", storeId: "jp.konami.suikoden.starleap", country: "JP" },
];

async function fetchJson(url) {
  const response = await fetch(url, { headers: { "user-agent": "Mozilla/5.0 Chrome/140 Safari/537.36" } });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.json();
}

async function fetchHtml(url) {
  const response = await fetch(url, { headers: { "user-agent": "Mozilla/5.0 Chrome/140 Safari/537.36" } });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.text();
}

async function verifyTarget(target) {
  if (target.platform === "ios") {
    const lookupUrl = `https://itunes.apple.com/lookup?id=${target.storeId}&country=${target.country}`;
    const payload = await fetchJson(lookupUrl);
    const product = payload.results?.find((item) => String(item.trackId) === target.storeId);
    if (!product) throw new Error("app unavailable in lookup storefront");
    if (product.bundleId !== target.bundleId) throw new Error(`bundle id mismatch: ${product.bundleId || "missing"}`);
    return {
      ...target,
      storeProductName: product.trackName || "",
      storeUrl: product.trackViewUrl || `https://apps.apple.com/${target.country}/app/id${target.storeId}`,
      rawStoreReleaseDate: product.releaseDate || "",
      bundleId: product.bundleId,
    };
  }

  const storeUrl = `https://play.google.com/store/apps/details?id=${encodeURIComponent(target.storeId)}&hl=en&gl=${target.country}`;
  const html = await fetchHtml(storeUrl);
  if (!html.includes(target.storeId)) throw new Error("package id mismatch");
  const title = html.match(/<meta property="og:title" content="([^"]+)"/i)?.[1]
    ?.replace(/&amp;/g, "&")
    .replace(/ - Apps on Google Play$/, "") || "";
  return { ...target, storeProductName: title, storeUrl };
}

function generatedAt() {
  return new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Asia/Tokyo",
    dateStyle: "short",
    timeStyle: "medium",
  }).format(now).replace(" ", "T") + "+09:00";
}

(async () => {
  const results = [];
  for (const target of targets) {
    try {
      results.push(await verifyTarget(target));
    } catch (error) {
      results.push({ ...target, error: error.message });
    }
  }

  const successful = results.filter((result) => !result.error);
  const failed = results.filter((result) => result.error);
  const releaseById = new Map(data.releases.map((release) => [release.id, release]));
  for (const result of successful) {
    const release = releaseById.get(result.releaseId);
    if (!release) throw new Error(`release missing: ${result.releaseId}`);
    if (release.platform !== result.platform) throw new Error(`platform mismatch: ${result.releaseId}`);
    release.storeId = result.storeId;
    release.storeUrl = result.storeUrl;
    release.storeProductName = result.storeProductName;
    release.storeAvailability = "available";
    release.availabilityCheckedAt = checkedAt;
    if (result.bundleId) release.bundleId = result.bundleId;
    if (result.rawStoreReleaseDate) release.rawStoreReleaseDate = result.rawStoreReleaseDate;
  }

  data.meta.schemaVersion = "2.6";
  data.meta.phase = Math.max(Number(data.meta.phase) || 0, 22);
  data.meta.generatedAt = generatedAt();
  data.meta.regionCoverage = {
    ...(data.meta.regionCoverage || {}),
    mobileStoreIdentityAuditDate: checkedAt,
    mobileStoreIdentityTargets: targets.length,
    mobileStoreIdentityVerified: successful.length,
  };
  data.meta.performanceCoverage = {
    ...(data.meta.performanceCoverage || {}),
    mobileStoreCatalog: {
      verifiedAt: checkedAt,
      releases: successful.length,
      platforms: {
        ios: successful.filter((result) => result.platform === "ios").length,
        android: successful.filter((result) => result.platform === "android").length,
      },
      sources: ["Apple iTunes Search API", "Google Play product pages"],
      unavailable: failed.map(({ releaseId, platform, storeId, error }) => ({ releaseId, platform, storeId, reason: error })),
    },
  };

  const json = `${JSON.stringify(data, null, 2)}\n`;
  fs.writeFileSync(jsonPath, json);
  fs.writeFileSync(jsPath, `window.GAME_PROJECTS_DATA = ${json.trimEnd()};\n`);
  console.log(JSON.stringify({
    targets: targets.length,
    successful: successful.length,
    platforms: {
      ios: successful.filter((result) => result.platform === "ios").length,
      android: successful.filter((result) => result.platform === "android").length,
    },
    failed: failed.map(({ releaseId, storeId, error }) => ({ releaseId, storeId, error })),
  }, null, 2));
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
