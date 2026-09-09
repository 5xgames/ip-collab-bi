const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const jsonPath = path.join(root, "game-projects/data/projects.json");
const jsPath = path.join(root, "game-projects/data/projects.js");
const data = JSON.parse(fs.readFileSync(jsonPath, "utf8"));

const checkedAt = "2026-09-09";
const regionDefinitions = {
  JP: { cc: "jp", label: "日本", storeLabel: "Steam 日本商店" },
  US: { cc: "us", label: "美国", storeLabel: "Steam 美国商店" },
  HK: { cc: "hk", label: "香港", storeLabel: "Steam 香港商店" },
  TW: { cc: "tw", label: "台湾", storeLabel: "Steam 台湾商店" },
  KR: { cc: "kr", label: "韩国", storeLabel: "Steam 韩国商店" },
  SEA: { cc: "sg", label: "东南亚", storeLabel: "Steam 新加坡商店（东南亚代表市场）", representativeCountry: "SG" },
};

const products = [
  [449800, "attack-on-titan-wings-of-freedom", "aot1", "2016-08-26"],
  [601050, "attack-on-titan-2", "aot2", "已上线（当地首发日期待核验）"],
  [678950, "dragon-ball-fighterz", "dbfz", "2018-01-26"],
  [748360, "my-hero-ones-justice", "mhoj", "2018-10-25"],
  [755500, "one-piece-world-seeker", "opws", "2019-03-14"],
  [814000, "one-piece-odyssey", "opodyssey", "2023-01-12"],
  [816020, "jump-force", "jump-force", "2019-02-14"],
  [851850, "dragon-ball-z-kakarot", "dbzk", "2020-01-16"],
  [1020790, "naruto-storm-connections", "narutoc", "2023-11-16"],
  [1372110, "jojo-all-star-battle-r", "jojoasbr", "2022-09-01"],
  [1490890, "demon-slayer-hinokami-chronicles", "dshc", "2021-10-15"],
  [1689620, "bleach-rebirth-of-souls", "bleach", "2025-03-20"],
  [1790600, "dragon-ball-sparking-zero", "dbsz", "2024-10-10"],
  [1877020, "jujutsu-kaisen-cursed-clash", "jjkcc", "2024-02-01"],
  [1979440, "sand-land", "sandland", "2024-04-25"],
  [2072560, "dragon-ball-gekishin-squadra", "dbgs", "2025-09-09"],
  [2172910, "captain-tsubasa-2-world-fighters", "ct2", "2026-08-27"],
  [2244210, "echoes-of-aincrad", "eoa", "2026-07-09"],
  [2362050, "my-hero-academia-alls-justice", "mhaaj", "2026-02-05"],
  [2456420, "hunter-x-hunter-nen-impact", "hxh", "2025-07-16"],
  [2928600, "demon-slayer-hinokami-chronicles-2", "ds2", "2025-08-05"],
  [3002850, "fairy-tail-2", "ft2", "2024-12-11"],
  [3061570, "persona-5-the-phantom-x", "p5x", "2025-06-26"],
  [3393070, "kaiju-no-8-the-game", "kj8", "2025-09-30"],
];

const unavailable = new Set([
  "449800:JP", "748360:JP", "755500:JP", "816020:JP", "1020790:JP",
  "449800:KR",
  "3061570:HK", "3061570:TW", "3061570:KR", "3061570:SEA",
]);
const delisted = new Set(["816020:US", "816020:HK", "816020:TW", "816020:KR", "816020:SEA"]);
const free = new Set([
  "2072560:HK", "2072560:TW", "2072560:KR", "2072560:SEA",
  "3393070:HK", "3393070:TW", "3393070:KR", "3393070:SEA",
]);

const releaseIds = new Set(data.releases.map((release) => release.id));
const checksByKey = new Map((data.regionChecks || []).map((check) => [
  `${check.projectId}:${check.platform}:${check.region}:${check.checkedAt}`,
  check,
]));

for (const [appid, projectId, prefix, actualLaunchDate] of products) {
  for (const [region, definition] of Object.entries(regionDefinitions)) {
    const resultKey = `${appid}:${region}`;
    const sourceUrl = `https://store.steampowered.com/app/${appid}/?cc=${definition.cc}`;
    const availability = unavailable.has(resultKey)
      ? "not_available_currently"
      : delisted.has(resultKey)
        ? "delisted_store_page"
        : "available";
    const check = {
      projectId,
      platform: "steam",
      region,
      representativeCountry: definition.representativeCountry || region,
      storeId: String(appid),
      availability,
      checkedAt,
      sourceUrl,
      note: region === "SEA" ? "本批次以新加坡 Steam 商店作为东南亚代表样本。" : "Steam 官方地区商店接口核验。",
    };
    checksByKey.set(`${projectId}:steam:${region}:${checkedAt}`, check);
    if (availability === "not_available_currently") continue;
    const id = `${prefix}-${region.toLowerCase()}-steam`;
    if (releaseIds.has(id)) continue;
    data.releases.push({
      id,
      projectId,
      platform: "steam",
      region,
      store: `${definition.storeLabel} (App ${appid})${availability === "delisted_store_page" ? " · 已停售" : ""}`,
      storeId: String(appid),
      representativeCountry: definition.representativeCountry || region,
      plannedLaunchDate: actualLaunchDate,
      actualLaunchDate,
      status: "launched",
      storeAvailability: availability === "available" ? (free.has(resultKey) ? "free_to_play" : "available") : "delisted",
      availabilityCheckedAt: checkedAt,
      sourceUrl,
      verifiedAt: checkedAt,
    });
    releaseIds.add(id);
  }
}

data.regionChecks = [...checksByKey.values()].sort((a, b) =>
  a.projectId.localeCompare(b.projectId)
  || a.platform.localeCompare(b.platform)
  || a.region.localeCompare(b.region)
  || a.checkedAt.localeCompare(b.checkedAt));
data.meta.schemaVersion = "2.0";
data.meta.phase = 15;
data.meta.generatedAt = "2026-09-09T17:15:00+09:00";
data.meta.regionCoverage = {
  ...(data.meta.regionCoverage || {}),
  model: "seven_core_markets",
  steamStoreAuditDate: checkedAt,
  steamAuditedRegions: Object.keys(regionDefinitions),
  steamAuditedProducts: products.length,
  seaRepresentativeCountry: "SG",
};

const json = `${JSON.stringify(data, null, 2)}\n`;
fs.writeFileSync(jsonPath, json);
fs.writeFileSync(jsPath, `window.GAME_PROJECTS_DATA = ${json.trimEnd()};\n`);

console.log(JSON.stringify({
  releases: data.releases.length,
  regionChecks: data.regionChecks.length,
  addedRegionalSteamReleases: data.releases.filter((release) =>
    release.platform === "steam"
    && ["HK", "TW", "KR", "SEA"].includes(release.region)
    && release.verifiedAt === checkedAt).length,
}, null, 2));
