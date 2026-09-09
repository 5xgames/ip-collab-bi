const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const jsonPath = path.join(root, "game-projects/data/projects.json");
const jsPath = path.join(root, "game-projects/data/projects.js");
const data = JSON.parse(fs.readFileSync(jsonPath, "utf8"));

const checkedAt = "2026-09-09";
const regions = {
  HK: { locale: "en-hk", label: "香港", timeZone: "Asia/Hong_Kong" },
  TW: { locale: "zh-tw", label: "台湾", timeZone: "Asia/Taipei" },
  KR: { locale: "ko-kr", label: "韩国", timeZone: "Asia/Seoul" },
  SEA: { locale: "en-sg", label: "东南亚", timeZone: "Asia/Singapore", representativeCountry: "SG" },
};

// Product IDs are the base-game entries returned by Xbox's own search pages.
// Legacy products without a releaseDate remain valid availability evidence, but
// their local launch date is left explicitly unverified instead of inferred.
const products = [
  ["echoes-of-aincrad", "9NN493BKMM4Q"],
  ["captain-tsubasa-2-world-fighters", "9N8TN15X157T"],
  ["my-hero-academia-alls-justice", "9P183CW04582"],
  ["bleach-rebirth-of-souls", "9PJK7WPHWM8L"],
  ["demon-slayer-hinokami-chronicles-2", "9NCV4N00N94J"],
  ["dragon-ball-fighterz", "BZRK5C951KK7"],
  ["my-hero-ones-justice", "BVFF56S7PXFJ"],
  ["one-piece-world-seeker", "BP95H7BN67D4"],
  ["dragon-ball-z-kakarot", "BT5X0XGCWGD6"],
  ["demon-slayer-hinokami-chronicles", "9PHW7BZS9P7Z"],
  ["jojo-all-star-battle-r", "9P4811KBD5R9"],
  ["one-piece-odyssey", "9PND6XZTCZWT"],
  ["jujutsu-kaisen-cursed-clash", "9N1T03Q2J6NH"],
  ["naruto-storm-connections", "9NM8JFMGVCVB"],
  ["sand-land", "9PGCVR1C0MZH"],
  ["dragon-ball-sparking-zero", "9N7XMJJHNFC3"],
  ["attack-on-titan-wings-of-freedom", "C3QWVTZ6HTCB"],
  ["attack-on-titan-2", "C596V0P64DD6"],
  ["attack-on-titan-3", "9MT4F57F7CVW"],
  ["gundam-rogue-orbit", "9PND4CGSV9SX"],
  ["kingdom-hearts-iv", "9P8LNZ7X5GVP"],
  ["dragon-ball-xenoverse-3", "9N30KLM8JP2S"],
  ["jujutsu-kaisen-rumble-survivaton", "9P5R86XXRVDD"],
];

function parsePreloadedState(html) {
  const marker = "window.__PRELOADED_STATE__ = ";
  const start = html.indexOf(marker);
  if (start < 0) return null;
  const jsonStart = start + marker.length;
  let depth = 0;
  let inString = false;
  let escaped = false;
  for (let index = jsonStart; index < html.length; index += 1) {
    const char = html[index];
    if (inString) {
      if (escaped) escaped = false;
      else if (char === "\\") escaped = true;
      else if (char === '"') inString = false;
      continue;
    }
    if (char === '"') inString = true;
    else if (char === "{") depth += 1;
    else if (char === "}" && (depth -= 1) === 0) {
      return JSON.parse(html.slice(jsonStart, index + 1));
    }
  }
  return null;
}

function localDate(iso, timeZone) {
  if (!iso) return "";
  const match = iso.match(/^(\d{4})-(\d{2})-(\d{2})T00:00:00/);
  if (match) return `${match[1]}-${match[2]}-${match[3]}`;
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date(iso));
  const byType = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${byType.year}-${byType.month}-${byType.day}`;
}

function platformLabel(availableOn) {
  const labels = {
    XboxOne: "Xbox One",
    XboxSeriesX: "Xbox Series X|S",
    PC: "Windows PC",
    XCloud: "Xbox Cloud Gaming",
  };
  return [...new Set((availableOn || []).map((value) => labels[value]).filter(Boolean))].join(" / ") || "Xbox";
}

function fallbackPlannedDate(projectId) {
  const candidates = data.releases.filter((release) =>
    release.projectId === projectId
    && release.platform === "xbox"
    && ["GLOBAL", "ASIA", "JP", "US"].includes(release.region));
  return candidates.find((release) => release.plannedLaunchDate)?.plannedLaunchDate || "";
}

async function auditProduct(projectId, storeId, region, definition) {
  const sourceUrl = `https://www.xbox.com/${definition.locale}/games/store/x/${storeId}`;
  try {
    const response = await fetch(sourceUrl, {
      redirect: "follow",
      headers: { "user-agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/140 Safari/537.36" },
    });
    const html = await response.text();
    const state = parsePreloadedState(html);
    const product = state?.core2?.products?.productSummaries?.[storeId];
    const isBaseGame = response.ok
      && product
      && product.productFamily === "Games"
      && Array.isArray(product.availableOn)
      && product.availableOn.some((value) => value.startsWith("Xbox"));
    if (!isBaseGame) {
      return {
        check: {
          projectId,
          platform: "xbox",
          region,
          representativeCountry: definition.representativeCountry || region,
          storeId,
          availability: "not_listed_currently",
          checkedAt,
          sourceUrl,
          note: region === "SEA" ? "以新加坡 Xbox 商店作为东南亚代表样本；官方基础游戏商品页当前未返回。" : "Xbox 官方基础游戏商品页当前未返回。",
        },
      };
    }

    const project = data.projects.find((item) => item.id === projectId);
    const launchDate = localDate(product.releaseDate, definition.timeZone);
    const launched = launchDate ? launchDate <= checkedAt : project?.status === "launched";
    const plannedLaunchDate = launchDate || (launched ? "已上线（当地首发日期待核验）" : fallbackPlannedDate(projectId));
    const actualLaunchDate = launched ? (launchDate || "已上线（当地首发日期待核验）") : "";
    const status = launched ? "launched" : (launchDate || plannedLaunchDate ? "upcoming" : "announced");
    return {
      check: {
        projectId,
        platform: "xbox",
        region,
        representativeCountry: definition.representativeCountry || region,
        storeId,
        availability: "available",
        checkedAt,
        sourceUrl,
        note: region === "SEA" ? "以新加坡 Xbox 官方商店作为东南亚代表样本。" : "Xbox 官方地区商品页核验。",
      },
      release: {
        id: `${projectId}-${region.toLowerCase()}-xbox`,
        projectId,
        platform: "xbox",
        region,
        store: `Xbox Store ${definition.label}（${platformLabel(product.availableOn)}）`,
        storeId,
        representativeCountry: definition.representativeCountry || region,
        plannedLaunchDate,
        actualLaunchDate,
        status,
        storeAvailability: "available",
        availabilityCheckedAt: checkedAt,
        sourceUrl,
        verifiedAt: checkedAt,
        storeTitle: product.title,
        rawStoreReleaseDate: product.releaseDate || "",
      },
    };
  } catch (error) {
    return {
      check: {
        projectId,
        platform: "xbox",
        region,
        representativeCountry: definition.representativeCountry || region,
        storeId,
        availability: "check_failed",
        checkedAt,
        sourceUrl,
        note: `核验失败：${String(error.message || error).split("\n")[0]}`,
      },
    };
  }
}

async function main() {
  const jobs = [];
  for (const [projectId, storeId] of products) {
    for (const [region, definition] of Object.entries(regions)) {
      jobs.push([projectId, storeId, region, definition]);
    }
  }
  const results = [];
  let cursor = 0;
  async function worker() {
    while (cursor < jobs.length) {
      const job = jobs[cursor++];
      results.push(await auditProduct(...job));
    }
  }
  await Promise.all(Array.from({ length: 8 }, worker));

  const releaseById = new Map(data.releases.map((release) => [release.id, release]));
  const checkByKey = new Map((data.regionChecks || []).map((check) => [
    `${check.projectId}:${check.platform}:${check.region}:${check.checkedAt}`,
    check,
  ]));
  for (const result of results) {
    const check = result.check;
    checkByKey.set(`${check.projectId}:${check.platform}:${check.region}:${check.checkedAt}`, check);
    if (result.release) releaseById.set(result.release.id, result.release);
  }
  data.releases = [...releaseById.values()];
  data.regionChecks = [...checkByKey.values()].sort((a, b) =>
    a.projectId.localeCompare(b.projectId)
    || a.platform.localeCompare(b.platform)
    || a.region.localeCompare(b.region)
    || a.checkedAt.localeCompare(b.checkedAt));
  data.meta.schemaVersion = "1.7";
  data.meta.phase = 12;
  data.meta.generatedAt = "2026-09-09T12:15:00+09:00";
  data.meta.regionCoverage = {
    ...(data.meta.regionCoverage || {}),
    xboxStoreAuditDate: checkedAt,
    xboxAuditedRegions: Object.keys(regions),
    xboxAuditedProducts: products.length,
    seaRepresentativeCountry: "SG",
  };

  const json = `${JSON.stringify(data, null, 2)}\n`;
  fs.writeFileSync(jsonPath, json);
  fs.writeFileSync(jsPath, `window.GAME_PROJECTS_DATA = ${json.trimEnd()};\n`);
  const availability = results.reduce((counts, result) => {
    const key = result.check.availability;
    counts[key] = (counts[key] || 0) + 1;
    return counts;
  }, {});
  console.log(JSON.stringify({
    auditedProducts: products.length,
    checksAdded: results.length,
    releasesAddedOrUpdated: results.filter((result) => result.release).length,
    availability,
    totalReleases: data.releases.length,
    totalRegionChecks: data.regionChecks.length,
  }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
