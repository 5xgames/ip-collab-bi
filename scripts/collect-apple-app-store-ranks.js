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
const trackedProducts = [
  { projectId: "kaiju-no-8-the-game", storeId: "6742088839" },
  { projectId: "dragon-ball-gekishin-squadra", storeId: "6744439943" },
  { projectId: "persona-5-the-phantom-x", storeId: "6502942931" },
  { projectId: "mushoku-tensei-chronicle-of-echoes", storeId: "6754311241" },
  { projectId: "my-hero-academia-united-survival", storeId: "6758648051" },
  { projectId: "inazuma-eleven-cross", storeId: "6756994116" },
  { projectId: "suikoden-star-leap", storeId: "6746180100" },
  { projectId: "hololive-dreams", storeId: "6756641135" },
  { projectId: "pokemon-champions", storeId: "6741503079" },
  { projectId: "torneko-wonder-dungeon-remaster", storeId: "6757778100", metrics: ["grossing_rank"] },
  { projectId: "kingdom-hadou", storeId: "6737974657" },
  { projectId: "chiikawa-pocket", storeId: "6596745408" },
  { projectId: "madoka-magia-exedra", storeId: "6480167901" },
  { projectId: "digimon-up", storeId: "6756247422" },
  { projectId: "muvluv-girls-garden", storeId: "6755509352" },
  { projectId: "tokyo-revengers-unlimited", storeId: "6698853161" },
  { projectId: "dragon-quest-smash-grow", storeId: "6747736697" },
  { projectId: "yowamushi-pedal-resonance-pedaism", storeId: "6758927408" },
  { projectId: "cardcaptor-sakura-memory-key-jp", storeId: "6754003671" },
  { projectId: "oshi-no-ko-puzzle-star", storeId: "6744346921" },
  { projectId: "haikyu-touch-and-connect", storeId: "6755984289" },
  { projectId: "hells-paradise-paradise-battle", storeId: "6633416886" },
  { projectId: "date-a-live-love-limit-break", storeId: "6756353331" },
  { projectId: "outcast-restaurant-order-rush", storeId: "6754670632" },
  { projectId: "sakamoto-days-dangerous-puzzle", storeId: "6737511323" },
  { projectId: "hunter-x-hunter-nen-survivor", storeId: "6753738566" },
  { projectId: "gintama-smartphone-battle-chronicle", storeId: "6749658164" },
  { projectId: "captain-tsubasa-my-golden-xi", storeId: "6761321358" },
  { projectId: "wind-breaker-rebel-heroes", storeId: "6670387532" },
  { projectId: "sakamoto-days-mission-rogue-dawn", storeId: "6756270200", launchDate: "2026-09-11" },
];
const products = trackedProducts.filter((product) => !product.launchDate || product.launchDate <= checkedAt);
const feeds = [
  {
    metricType: "grossing_rank",
    label: "日本 App Store 游戏畅销榜",
    url: "https://itunes.apple.com/jp/rss/topgrossingapplications/limit=200/genre=6014/json",
  },
  {
    metricType: "free_rank",
    label: "日本 App Store 免费游戏榜",
    url: "https://itunes.apple.com/jp/rss/topfreeapplications/limit=200/genre=6014/json",
  },
];

function dateInTokyo(value) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return checkedAt;
  return new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(parsed);
}

async function readFeed(definition) {
  const response = await fetch(definition.url, { headers: { "user-agent": "Mozilla/5.0 Chrome/140 Safari/537.36" } });
  if (!response.ok) throw new Error(`${definition.metricType}: HTTP ${response.status}`);
  const payload = await response.json();
  const entries = Array.isArray(payload.feed?.entry) ? payload.feed.entry : [];
  if (!entries.length) throw new Error(`${definition.metricType}: empty feed`);
  return {
    ...definition,
    feedUpdatedAt: payload.feed?.updated?.label || "",
    snapshotDate: dateInTokyo(payload.feed?.updated?.label),
    entries,
  };
}

function generatedAt() {
  return new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Asia/Tokyo",
    dateStyle: "short",
    timeStyle: "medium",
  }).format(now).replace(" ", "T") + "+09:00";
}

(async () => {
  const projectIds = new Set(data.projects.map((project) => project.id));
  for (const product of products) {
    if (!projectIds.has(product.projectId)) throw new Error(`project missing: ${product.projectId}`);
  }

  const observations = [];
  const coverage = [];
  for (const definition of feeds) {
    const feed = await readFeed(definition);
    const rankById = new Map(feed.entries.map((entry, index) => [String(entry.id?.attributes?.["im:id"] || ""), {
      rank: index + 1,
      sourceProductName: entry["im:name"]?.label || "",
    }]));
    const ranked = [];
    const unranked = [];
    for (const product of products.filter((item) => !item.metrics || item.metrics.includes(feed.metricType))) {
      const match = rankById.get(product.storeId);
      if (!match) {
        unranked.push(product.projectId);
        observations.push({
          projectId: product.projectId,
          platforms: ["ios"],
          region: "JP",
          date: feed.snapshotDate,
          metricType: feed.metricType,
          rankStatus: "not_in_top_100",
          source: "Apple App Store RSS",
          sourceUrl: feed.url,
          storeId: product.storeId,
          display: `${feed.label}未入 Top ${feed.entries.length}`,
          scope: `${feed.label} Top ${feed.entries.length}；Apple RSS 当前榜单快照`,
          feedUpdatedAt: feed.feedUpdatedAt,
          verifiedAt: checkedAt,
          performanceLevel: "insufficient",
        });
        continue;
      }
      ranked.push(product.projectId);
      observations.push({
        projectId: product.projectId,
        platforms: ["ios"],
        region: "JP",
        date: feed.snapshotDate,
        metricType: feed.metricType,
        rank: match.rank,
        source: "Apple App Store RSS",
        sourceUrl: feed.url,
        storeId: product.storeId,
        sourceProductName: match.sourceProductName,
        display: `${feed.label}第 ${match.rank} 名`,
        scope: `${feed.label} Top ${feed.entries.length}；Apple RSS 当前榜单快照`,
        feedUpdatedAt: feed.feedUpdatedAt,
        verifiedAt: checkedAt,
        performanceLevel: "insufficient",
      });
    }
    coverage.push({
      metricType: feed.metricType,
      snapshotDate: feed.snapshotDate,
      feedUpdatedAt: feed.feedUpdatedAt,
      positions: feed.entries.length,
      ranked,
      unranked,
      sourceUrl: feed.url,
    });
  }

  const refreshedKeys = new Set(observations.map((snapshot) => [
    snapshot.projectId,
    snapshot.region,
    snapshot.date,
    snapshot.metricType,
    snapshot.platforms.join(","),
  ].join("|")));
  data.rankSnapshots = (data.rankSnapshots || []).filter((snapshot) => {
    if (snapshot.source !== "Apple App Store RSS") return true;
    const key = [snapshot.projectId, snapshot.region, snapshot.date, snapshot.metricType, (snapshot.platforms || []).join(",")].join("|");
    return !refreshedKeys.has(key);
  });
  data.rankSnapshots.push(...observations);
  data.rankSnapshots.sort((a, b) => String(a.date || "").localeCompare(String(b.date || ""))
    || String(a.projectId || a.releaseId || "").localeCompare(String(b.projectId || b.releaseId || ""))
    || String(a.metricType || "").localeCompare(String(b.metricType || "")));

  data.meta.schemaVersion = "2.9";
  data.meta.phase = Math.max(Number(data.meta.phase) || 0, 27);
  data.meta.generatedAt = generatedAt();
  data.meta.performanceCoverage = {
    ...(data.meta.performanceCoverage || {}),
    appleAppStoreRanks: {
      verifiedAt: checkedAt,
      market: "JP",
      platform: "ios",
      chartCategory: "games",
      trackedProjects: products.length,
      snapshotsAdded: observations.length,
      feeds: coverage,
      note: "Apple RSS 当前公开接口实际返回 Top 100；未出现的产品保存为未入 Top 100 状态，不推断其精确名次。该接口不提供历史回溯，脚本每日运行后累积时间序列。",
    },
  };

  const json = `${JSON.stringify(data, null, 2)}\n`;
  fs.writeFileSync(jsonPath, json);
  fs.writeFileSync(jsPath, `window.GAME_PROJECTS_DATA = ${json.trimEnd()};\n`);
  console.log(JSON.stringify({ observations: observations.map(({ projectId, metricType, rank }) => ({ projectId, metricType, rank })), coverage }, null, 2));
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
