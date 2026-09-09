const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const jsonPath = path.join(root, "game-projects/data/projects.json");
const jsPath = path.join(root, "game-projects/data/projects.js");
const data = JSON.parse(fs.readFileSync(jsonPath, "utf8"));

const checkedAt = "2026-09-09";
const regions = {
  JP: { locale: "ja-jp", label: "日本", dateOrder: "YMD" },
  US: { locale: "en-us", label: "美国", dateOrder: "MDY" },
  HK: { locale: "en-hk", label: "香港" },
  TW: { locale: "zh-hant-tw", label: "台湾" },
  KR: { locale: "ko-kr", label: "韩国" },
  SEA: { locale: "en-sg", label: "东南亚", representativeCountry: "SG" },
};

// Product IDs were resolved from PlayStation's own regional search pages.
// Edition pages are used only when they include the base game and launched on
// the same date. Expansion-only and later upgrade pages are intentionally
// excluded so they do not overwrite the original game's launch date.
const products = [
  ["bleach-rebirth-of-souls", { default: "HP0700-PPSA02167_00-BLEACHROFS000000", JP: "JP0700-PPSA02166_00-BLEACHROFS000000", US: "UP0700-PPSA03639_00-BLEACHROFS000000", SEA: "JP0700-PPSA02166_00-BLEACHROFS000000" }],
  ["captain-tsubasa-2-world-fighters", { default: "JP0700-PPSA22728_00-MAINGAME00000000" }],
  ["demon-slayer-hinokami-chronicles", { default: "HP0177-PPSA03170_00-HINOKAMI00000000", JP: "JP3372-PPSA03043_00-HINOKAMI00000000", US: "UP0177-PPSA03489_00-HINOKAMI00000000", KR: "HP0177-PPSA03457_00-HINOKAMI00000000" }],
  ["demon-slayer-hinokami-chronicles-2", { default: "HP0177-PPSA25427_00-HINOKAMI20000000", JP: "JP3372-PPSA17067_00-HINOKAMI20000000", US: "HP0177-PPSA25427_00-HINOKAMI20000000", KR: "HP0177-PPSA25428_00-HINOKAMI20000000" }],
  ["dragon-ball-sparking-zero", { default: "HP0700-PPSA15208_00-DRAGONBALLSPARK0", JP: "JP0700-PPSA15207_00-DRAGONBALLSPARK0", US: "UP0700-PPSA15211_00-DRAGONBALLSPARK0", SEA: "JP0700-PPSA15207_00-DRAGONBALLSPARK0" }],
  ["echoes-of-aincrad", { default: "JP0700-PPSA22969_00-SWORDARTONLINEV0" }],
  ["fairy-tail-2", { default: "EP4108-PPSA24062_00-FAIRYTAIL2DDXSP0", JP: "JP0106-PPSA24060_00-APPFT20000000000", KR: "HP0106-PPSA24061_00-APPFT20000000000" }],
  ["hunter-x-hunter-nen-impact", { default: "JP0036-PPSA24274_00-0000000000000000", JP: "JP0540-PPSA15788_00-0991707950553306" }],
  ["jojo-all-star-battle-r", { default: "HP0700-PPSA02258_00-JASBRMAINGAME000", JP: "JP0700-PPSA01745_00-JASBRMAINGAME000", US: "UP0700-PPSA04220_00-JASBRMAINGAME000", SEA: "JP0700-PPSA01745_00-JASBRMAINGAME000" }],
  ["jujutsu-kaisen-cursed-clash", { default: "HP0700-PPSA09534_00-JJKCVSX400000000", JP: "JP0700-PPSA09533_00-JJKCVSX400000000", US: "UP0700-PPSA09536_00-JJKCVSX400000000", SEA: "JP0700-PPSA09533_00-JJKCVSX400000000" }],
  ["my-hero-ones-justice", { default: "HP0700-CUSA12082_00-ASIAPLACEHOLDER0", JP: "JP0700-CUSA11524_00-HEROGAME00000000", US: "UP0700-CUSA12048_00-HEROGAME00000000", SEA: "EP0700-CUSA12399_00-ASIAPLACEHOLDER0" }],
  ["my-hero-academia-alls-justice", { default: "HP0700-PPSA26173_00-MAINGAME00000000", JP: "JP0700-PPSA26172_00-MAINGAME00000000", US: "UP0700-PPSA26175_00-MAINGAME00000000", SEA: "JP0700-PPSA26172_00-MAINGAME00000000" }],
  ["naruto-storm-connections", { default: "HP0700-PPSA06979_00-NARUTOUNSA000000", JP: "JP0700-PPSA06978_00-NARUTOUNSA000000", US: "UP0700-PPSA06981_00-NARUTOUNSA000000", SEA: "JP0700-PPSA06978_00-NARUTOUNSA000000" }],
  ["one-piece-world-seeker", { default: "HP0700-CUSA14016_00-ASIAFULLGAME0000", JP: "JP0700-CUSA10951_00-OPWSK00APPLI0000", US: "UP0700-CUSA11205_00-OPWSK00APPLI0000", SEA: "EP0700-CUSA14054_00-ASIAFULLGAME0000" }],
  ["sand-land", { default: "HP0700-PPSA08573_00-SANDLMAINGAME000", JP: "JP0700-PPSA08572_00-SANDLMAINGAME000", US: "UP0700-PPSA08575_00-SANDLMAINGAME000", SEA: "JP0700-CUSA34695_00-SANDLMAINGAME000" }],
];

function decodeHtml(value) {
  return String(value || "")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function parseDisplayedDate(html, dateOrder = "DMY") {
  const raw = decodeHtml((html.match(/data-qa="gameInfo#releaseInformation#releaseDate-value"[^>]*>([^<]+)/) || [])[1] || "");
  const numbers = raw.match(/\d+/g)?.map(Number) || [];
  if (numbers.length < 3) return "";
  let year;
  let month;
  let day;
  if (numbers[0] > 1900 || dateOrder === "YMD") [year, month, day] = numbers;
  else if (numbers[2] > 1900 && dateOrder === "MDY") [month, day, year] = numbers;
  else if (numbers[2] > 1900) [day, month, year] = numbers;
  else return "";
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function parsePlatforms(html) {
  const raw = (html.match(/"platforms":\[(.*?)\]/) || [])[1] || "";
  const values = [...raw.matchAll(/"([^"]+)"/g)].map((match) => match[1]);
  return [...new Set(values)].join(" / ") || "PlayStation";
}

function parseTitle(html) {
  return decodeHtml((html.match(/<title>([^<]+)<\/title>/i) || [])[1] || "").trim();
}

async function fetchProductPage(sourceUrl, storeId) {
  let lastResponse;
  let lastHtml = "";
  for (let attempt = 0; attempt < 3; attempt += 1) {
    lastResponse = await fetch(sourceUrl, {
      redirect: "follow",
      headers: { "user-agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/140 Safari/537.36" },
    });
    lastHtml = await lastResponse.text();
    const hasProductData = lastHtml.includes(`\"sku\":\"${storeId}\"`)
      || lastHtml.includes('data-qa="mfe-game-title#name"');
    if (lastResponse.ok && hasProductData && lastHtml.includes(storeId)) break;
  }
  return { response: lastResponse, html: lastHtml };
}

async function auditProduct(projectId, storeId, region, definition) {
  const sourceUrl = `https://store.playstation.com/${definition.locale}/product/${storeId}`;
  try {
    const { response, html } = await fetchProductPage(sourceUrl, storeId);
    const title = parseTitle(html);
    const isProductPage = response.ok
      && (html.includes(`\"sku\":\"${storeId}\"`) || html.includes('data-qa="mfe-game-title#name"'))
      && html.includes(storeId)
      && !/access denied|page not found|找不到頁面|페이지를 찾을 수/i.test(title);
    if (!isProductPage) {
      return {
        check: {
          projectId,
          platform: "playstation",
          region,
          representativeCountry: definition.representativeCountry || region,
          storeId,
          availability: "not_listed_currently",
          checkedAt,
          sourceUrl,
          note: region === "SEA" ? "以新加坡 PlayStation Store 作为东南亚代表样本；官方商品页当前不可用。" : "PlayStation 官方地区商品页当前不可用。",
        },
      };
    }
    const actualLaunchDate = parseDisplayedDate(html, definition.dateOrder) || "已上线（当地首发日期待核验）";
    const platforms = parsePlatforms(html);
    return {
      check: {
        projectId,
        platform: "playstation",
        region,
        representativeCountry: definition.representativeCountry || region,
        storeId,
        availability: "available",
        checkedAt,
        sourceUrl,
        note: region === "SEA" ? "以新加坡 PlayStation Store 作为东南亚代表样本。" : "PlayStation 官方地区商品页核验。",
      },
      release: {
        id: `${projectId}-${region.toLowerCase()}-playstation`,
        projectId,
        platform: "playstation",
        region,
        store: `PlayStation Store ${definition.label}（${platforms}）`,
        storeId,
        representativeCountry: definition.representativeCountry || region,
        plannedLaunchDate: actualLaunchDate,
        actualLaunchDate,
        status: "launched",
        storeAvailability: "available",
        availabilityCheckedAt: checkedAt,
        sourceUrl,
        verifiedAt: checkedAt,
        storeTitle: title,
      },
    };
  } catch (error) {
    return {
      check: {
        projectId,
        platform: "playstation",
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
  for (const [projectId, storeIds] of products) {
    for (const [region, definition] of Object.entries(regions)) {
      const storeId = storeIds[region] || storeIds.default;
      jobs.push([projectId, storeId, region, definition]);
    }
  }
  const results = [];
  const concurrency = 8;
  let cursor = 0;
  async function worker() {
    while (cursor < jobs.length) {
      const job = jobs[cursor++];
      results.push(await auditProduct(...job));
    }
  }
  await Promise.all(Array.from({ length: concurrency }, worker));

  const releaseById = new Map(data.releases.map((release) => [release.id, release]));
  const playstationByComposite = new Map();
  for (const release of data.releases) {
    if (release.platform !== "playstation") continue;
    const key = `${release.projectId}:${release.region}`;
    if (!playstationByComposite.has(key)) playstationByComposite.set(key, release);
  }
  const checkByKey = new Map((data.regionChecks || []).map((check) => [
    `${check.projectId}:${check.platform}:${check.region}:${check.checkedAt}`,
    check,
  ]));
  for (const result of results) {
    const check = result.check;
    checkByKey.set(`${check.projectId}:${check.platform}:${check.region}:${check.checkedAt}`, check);
    if (result.release) {
      const compositeKey = `${result.release.projectId}:${result.release.region}`;
      const current = playstationByComposite.get(compositeKey);
      if (current) {
        for (const [id, release] of releaseById) {
          if (release.platform === "playstation"
            && release.projectId === result.release.projectId
            && release.region === result.release.region) releaseById.delete(id);
        }
        result.release = {
          ...current,
          ...result.release,
          id: current.id,
          plannedLaunchDate: current.plannedLaunchDate || result.release.plannedLaunchDate,
          actualLaunchDate: current.actualLaunchDate || result.release.actualLaunchDate,
        };
      }
      releaseById.set(result.release.id, result.release);
      playstationByComposite.set(compositeKey, result.release);
    }
  }
  data.releases = [...releaseById.values()];
  data.regionChecks = [...checkByKey.values()].sort((a, b) =>
    a.projectId.localeCompare(b.projectId)
    || a.platform.localeCompare(b.platform)
    || a.region.localeCompare(b.region)
    || a.checkedAt.localeCompare(b.checkedAt));
  data.meta.schemaVersion = "2.3";
  data.meta.phase = 18;
  data.meta.generatedAt = "2026-09-09T19:30:00+09:00";
  data.meta.regionCoverage = {
    ...(data.meta.regionCoverage || {}),
    playstationStoreAuditDate: checkedAt,
    playstationAuditedRegions: Object.keys(regions),
    playstationAuditedProducts: products.length,
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
