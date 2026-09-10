const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const jsonPath = path.join(root, "game-projects/data/projects.json");
const jsPath = path.join(root, "game-projects/data/projects.js");
const data = JSON.parse(fs.readFileSync(jsonPath, "utf8"));

const now = new Date();
const verifiedAt = new Intl.DateTimeFormat("sv-SE", {
  timeZone: "Asia/Tokyo",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
}).format(now);
const projectById = new Map(data.projects.map((project) => [project.id, project]));
const sourceNames = {
  playstation: "PlayStation Store",
  xbox: "Xbox Store",
};

function chooseRelease(platform, projectId) {
  const candidates = data.releases.filter((release) => release.platform === platform
    && release.projectId === projectId
    && release.storeId
    && String(release.sourceUrl || "").includes(platform === "playstation" ? "store.playstation.com" : "xbox.com"));
  const preference = { US: 0, JP: 1, HK: 2, TW: 3, KR: 4, SEA: 5 };
  return candidates.sort((a, b) => (preference[a.region] ?? 99) - (preference[b.region] ?? 99))[0] || null;
}

function platformTargets(platform) {
  const projectIds = [...new Set(data.releases
    .filter((release) => release.platform === platform && release.storeId)
    .map((release) => release.projectId))];
  return projectIds.map((projectId) => ({
    platform,
    projectId,
    release: chooseRelease(platform, projectId),
  })).filter((target) => target.release);
}

async function mapWithConcurrency(items, limit, worker) {
  const results = new Array(items.length);
  let nextIndex = 0;
  async function run() {
    while (nextIndex < items.length) {
      const index = nextIndex++;
      try {
        results[index] = await worker(items[index]);
      } catch (error) {
        results[index] = { ...items[index], error: error.message };
      }
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, run));
  return results;
}

async function fetchHtml(url) {
  const response = await fetch(url, {
    redirect: "follow",
    headers: { "user-agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/140 Safari/537.36" },
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.text();
}

function parsePlayStationRating(html) {
  const summary = html.match(/"starRating":\{"__typename":"StarRating","averageRating":([0-9.]+),"totalRatingsCount":([0-9]+)\}/);
  const title = html.match(/<title>([^<]+)<\/title>/i)?.[1]
    ?.replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
  if (summary) return { rating: Number(summary[1]), count: Number(summary[2]), sourceProductName: title || "" };
  for (const marker of html.matchAll(/"starRating":\{/g)) {
    const snippet = html.slice(marker.index, marker.index + 2400);
    const rating = Number(snippet.match(/"averageRating":([0-9.]+)/)?.[1]);
    const count = Number(snippet.match(/"totalRatingsCount":([0-9]+)/)?.[1]);
    if (Number.isFinite(rating) && Number.isFinite(count) && count > 0) {
      return { rating, count, sourceProductName: title || "" };
    }
  }
  throw new Error("rating unavailable");
}

function parseXboxRating(html) {
  for (const match of html.matchAll(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)) {
    try {
      const json = JSON.parse(match[1]);
      const nodes = Array.isArray(json?.["@graph"]) ? json["@graph"] : [json];
      const product = nodes.find((node) => node?.aggregateRating?.ratingValue && node?.aggregateRating?.ratingCount);
      if (!product) continue;
      return {
        rating: Number(product.aggregateRating.ratingValue),
        count: Number(product.aggregateRating.ratingCount),
        sourceProductName: product.name || "",
      };
    } catch {
      // Ignore unrelated malformed JSON-LD blocks and continue to the next one.
    }
  }
  throw new Error("rating unavailable");
}

async function fetchTarget(target) {
  const html = await fetchHtml(target.release.sourceUrl);
  if (!html.includes(String(target.release.storeId))) throw new Error("store id mismatch");
  const parsed = target.platform === "playstation" ? parsePlayStationRating(html) : parseXboxRating(html);
  if (!Number.isFinite(parsed.rating) || parsed.rating <= 0 || parsed.rating > 5
    || !Number.isFinite(parsed.count) || parsed.count <= 0) throw new Error("invalid rating payload");
  return { ...target, ...parsed };
}

function generatedAt() {
  return new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Asia/Tokyo",
    dateStyle: "short",
    timeStyle: "medium",
  }).format(now).replace(" ", "T") + "+09:00";
}

(async () => {
  const targets = [...platformTargets("playstation"), ...platformTargets("xbox")];
  const results = await mapWithConcurrency(targets, 5, fetchTarget);
  const successful = results.filter((result) => Number.isFinite(result.rating));
  const failed = results.filter((result) => result.error);
  const refreshed = new Set(successful.map((result) => `${result.platform}:${result.projectId}`));

  data.rankSnapshots = (data.rankSnapshots || []).filter((snapshot) => !(
    [sourceNames.playstation, sourceNames.xbox].includes(snapshot.source)
    && ["user_rating_5", "review_count"].includes(snapshot.metricType)
    && snapshot.date === verifiedAt
    && (snapshot.platforms || []).some((platform) => refreshed.has(`${platform}:${snapshot.projectId}`))
  ));

  const counts = { playstation: 0, xbox: 0 };
  for (const result of successful) {
    const globalRating = result.platform === "playstation";
    const region = globalRating ? "GLOBAL" : result.release.region;
    const regionLabel = globalRating ? "全球玩家评分" : `${result.release.region} 商店用户评分`;
    const common = {
      projectId: result.projectId,
      platforms: [result.platform],
      region,
      date: verifiedAt,
      source: sourceNames[result.platform],
      sourceUrl: result.release.sourceUrl,
      storeId: result.release.storeId,
      sourceProductName: result.sourceProductName || projectById.get(result.projectId)?.productName || "",
      verifiedAt,
      performanceLevel: "insufficient",
    };
    data.rankSnapshots.push({
      ...common,
      metricType: "user_rating_5",
      value: result.rating,
      ratingCount: result.count,
      display: `${sourceNames[result.platform]} ${regionLabel} ${result.rating.toFixed(2)}/5（${new Intl.NumberFormat("en-US").format(result.count)} 人评分）`,
      scope: `${regionLabel}；截至 ${verifiedAt}`,
    });
    data.rankSnapshots.push({
      ...common,
      metricType: "review_count",
      value: result.count,
      display: `${sourceNames[result.platform]} ${regionLabel}人数 ${new Intl.NumberFormat("en-US").format(result.count)}`,
      scope: `${regionLabel}人数；截至 ${verifiedAt}`,
    });
    counts[result.platform] += 1;
  }

  data.rankSnapshots.sort((a, b) => String(a.date || "").localeCompare(String(b.date || ""))
    || String(a.projectId || a.releaseId || "").localeCompare(String(b.projectId || b.releaseId || ""))
    || String(a.metricType || "").localeCompare(String(b.metricType || "")));
  data.meta.schemaVersion = "2.5";
  data.meta.phase = Math.max(Number(data.meta.phase) || 0, 21);
  data.meta.generatedAt = generatedAt();
  data.meta.performanceCoverage = {
    ...(data.meta.performanceCoverage || {}),
    consoleStoreRatings: {
      verifiedAt,
      metric: "store_user_rating_out_of_5_and_rating_count",
      projects: counts,
      snapshots: successful.length * 2,
      sources: sourceNames,
      note: "PlayStation 页面标注为全球玩家评分；Xbox 采用对应地区商店评分。",
      unavailable: failed.map(({ platform, projectId, release, error }) => ({
        platform,
        projectId,
        storeId: release?.storeId || "",
        reason: error,
      })),
    },
  };

  const json = `${JSON.stringify(data, null, 2)}\n`;
  fs.writeFileSync(jsonPath, json);
  fs.writeFileSync(jsPath, `window.GAME_PROJECTS_DATA = ${json.trimEnd()};\n`);

  console.log(JSON.stringify({
    targets: targets.length,
    successful: counts,
    snapshotsAdded: successful.length * 2,
    failed: failed.map(({ platform, projectId, release, error }) => ({
      platform,
      projectId,
      storeId: release?.storeId || "",
      error,
    })),
  }, null, 2));
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
