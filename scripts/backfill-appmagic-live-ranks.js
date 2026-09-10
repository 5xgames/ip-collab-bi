const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const jsonPath = path.join(root, "game-projects/data/projects.json");
const jsPath = path.join(root, "game-projects/data/projects.js");
const data = JSON.parse(fs.readFileSync(jsonPath, "utf8"));

const checkedAt = "2026-09-10";
const snapshotHour = "15:00";
const sourceUrl = "https://appmagic.rocks/top-charts/live-store-rankings?category=209&country=JP";
const launchSourceUrl = "https://p5x.jp/news/details/000088eqwmuspx.html";
const products = [
  {
    projectId: "kaiju-no-8-the-game",
    storeId: "jp.aktsk.games.kaiju_no8_the_game",
    sourceProductName: "怪獣８号 THE GAME",
  },
  {
    projectId: "dragon-ball-gekishin-squadra",
    storeId: "com.bandainamcoent.dbgekishinsquadra",
    sourceProductName: "ドラゴンボール ゲキシン スクアドラ",
  },
  {
    projectId: "persona-5-the-phantom-x",
    storeId: "com.sega.persona5.the.phantomx.jp",
    sourceProductName: "P5X ペルソナ５: The Phantom X",
    grossingRank: 85,
  },
  {
    projectId: "mushoku-tensei-chronicle-of-echoes",
    storeId: "jp.gree_ent.mushoku",
    sourceProductName: "無職転生〜異世界行ったら本気だす〜クロニクル・オブ・エコーズ",
  },
  {
    projectId: "my-hero-academia-united-survival",
    storeId: "com.klab.heroaca.united.survival",
    sourceProductName: "MHA: UNITED SURVIVAL",
  },
  {
    projectId: "inazuma-eleven-cross",
    storeId: "jp.co.level5.inazumacross",
    sourceProductName: "イナズマイレブン クロス",
  },
  {
    projectId: "suikoden-star-leap",
    storeId: "jp.konami.suikoden.starleap",
    sourceProductName: "幻想水滸伝 STAR LEAP",
    freeRank: 52,
    grossingRank: 26,
  },
];

function generatedAt() {
  return new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Asia/Tokyo",
    dateStyle: "short",
    timeStyle: "medium",
  }).format(new Date()).replace(" ", "T") + "+09:00";
}

function upsertRelease(release) {
  const index = data.releases.findIndex((item) => item.id === release.id);
  if (index >= 0) data.releases[index] = { ...data.releases[index], ...release };
  else data.releases.push(release);
}

function snapshotFor(product, metricType, rank) {
  const chartName = metricType === "free_rank" ? "免费游戏榜" : "游戏畅销榜";
  const base = {
    projectId: product.projectId,
    platforms: ["android"],
    region: "JP",
    date: checkedAt,
    metricType,
    source: "AppMagic",
    sourceUrl,
    storeId: product.storeId,
    sourceProductName: product.sourceProductName,
    scope: `日本 Google Play ${chartName} Top 200；AppMagic ${snapshotHour}（日本时间）实时榜快照`,
    snapshotHour,
    timeZone: "Asia/Tokyo",
    verifiedAt: checkedAt,
    performanceLevel: "insufficient",
  };
  if (Number.isFinite(rank)) {
    return {
      ...base,
      rank,
      display: `日本 Google Play ${chartName}第 ${rank} 名`,
    };
  }
  return {
    ...base,
    rankStatus: "not_in_top_200",
    display: `日本 Google Play ${chartName}未入 Top 200`,
  };
}

const projectIds = new Set(data.projects.map((project) => project.id));
for (const product of products) {
  if (!projectIds.has(product.projectId)) throw new Error(`project missing: ${product.projectId}`);
}

upsertRelease({
  id: "p5x-jp-android",
  projectId: "persona-5-the-phantom-x",
  platform: "android",
  region: "JP",
  store: "Google Play 日本 (com.sega.persona5.the.phantomx.jp)",
  storeId: "com.sega.persona5.the.phantomx.jp",
  storeUrl: "https://play.google.com/store/apps/details?id=com.sega.persona5.the.phantomx.jp&hl=ja&gl=JP",
  storeProductName: "P5X ペルソナ５: The Phantom X",
  storeAvailability: "available",
  availabilityCheckedAt: checkedAt,
  plannedLaunchDate: "2025-06-26",
  actualLaunchDate: "2025-06-26",
  status: "launched",
  sourceUrl: launchSourceUrl,
  verifiedAt: checkedAt,
});

const observations = products.flatMap((product) => [
  snapshotFor(product, "free_rank", product.freeRank),
  snapshotFor(product, "grossing_rank", product.grossingRank),
]);
const refreshedKeys = new Set(observations.map((snapshot) => [
  snapshot.projectId,
  snapshot.region,
  snapshot.date,
  snapshot.metricType,
  snapshot.platforms.join(","),
].join("|")));
data.rankSnapshots = (data.rankSnapshots || []).filter((snapshot) => {
  if (snapshot.source !== "AppMagic") return true;
  const key = [
    snapshot.projectId,
    snapshot.region,
    snapshot.date,
    snapshot.metricType,
    (snapshot.platforms || []).join(","),
  ].join("|");
  return !refreshedKeys.has(key);
});
data.rankSnapshots.push(...observations);
data.rankSnapshots.sort((a, b) => String(a.date || "").localeCompare(String(b.date || ""))
  || String(a.projectId || a.releaseId || "").localeCompare(String(b.projectId || b.releaseId || ""))
  || String(a.metricType || "").localeCompare(String(b.metricType || "")));

data.meta.schemaVersion = "2.8";
data.meta.phase = Math.max(Number(data.meta.phase) || 0, 24);
data.meta.generatedAt = generatedAt();
data.meta.regionCoverage = {
  ...(data.meta.regionCoverage || {}),
  mobileStoreIdentityAuditDate: checkedAt,
  mobileStoreIdentityTargets: 18,
  mobileStoreIdentityVerified: 18,
};
data.meta.performanceCoverage = {
  ...(data.meta.performanceCoverage || {}),
  mobileStoreCatalog: {
    ...(data.meta.performanceCoverage?.mobileStoreCatalog || {}),
    verifiedAt: checkedAt,
    releases: 18,
    platforms: { ios: 8, android: 10 },
  },
  appMagicGooglePlayRanks: {
    verifiedAt: checkedAt,
    market: "JP",
    platform: "android",
    chartCategory: "games",
    snapshotHour,
    timeZone: "Asia/Tokyo",
    positions: 200,
    trackedProjects: products.length,
    snapshotsAdded: observations.length,
    ranked: observations.filter((snapshot) => Number.isFinite(snapshot.rank)).map((snapshot) => ({
      projectId: snapshot.projectId,
      metricType: snapshot.metricType,
      rank: snapshot.rank,
    })),
    unranked: observations.filter((snapshot) => snapshot.rankStatus === "not_in_top_200").map((snapshot) => ({
      projectId: snapshot.projectId,
      metricType: snapshot.metricType,
    })),
    sourceUrl,
    note: "AppMagic 日本 Google Play 游戏免费榜与畅销榜 15:00 实时快照，范围为 Top 200；未出现的目标产品保存为未入 Top 200 状态，不推断其精确名次。该页面不作为历史回溯接口，后续采集按快照日累积时间序列。",
  },
};

const json = `${JSON.stringify(data, null, 2)}\n`;
fs.writeFileSync(jsonPath, json);
fs.writeFileSync(jsPath, `window.GAME_PROJECTS_DATA = ${json.trimEnd()};\n`);
console.log(JSON.stringify({
  release: "p5x-jp-android",
  observations: observations.length,
  ranked: observations.filter((snapshot) => Number.isFinite(snapshot.rank)).length,
  unranked: observations.filter((snapshot) => snapshot.rankStatus === "not_in_top_200").length,
}, null, 2));
