const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const jsonPath = path.join(root, "game-projects/data/projects.json");
const jsPath = path.join(root, "game-projects/data/projects.js");
const data = JSON.parse(fs.readFileSync(jsonPath, "utf8"));

const checkedAt = "2026-09-09";
const regions = {
  HK: {
    label: "香港",
    kind: "modern",
    locale: "hk",
    country: "HK",
    language: "zh",
  },
  TW: {
    label: "台湾",
    kind: "modern",
    locale: "tw",
    country: "TW",
    language: "zh",
  },
  KR: {
    label: "韩国",
    kind: "modern",
    locale: "kr",
    country: "KR",
    language: "ko",
  },
  SEA: {
    label: "东南亚",
    kind: "legacy",
    locale: "sg",
    country: "SG",
    language: "en",
    representativeCountry: "SG",
  },
};

// Each entry is a product that is confirmed or announced for Nintendo Switch
// or Nintendo Switch 2. Expected IDs deliberately point only to base games (or
// a clearly labelled bundle where the base game is still available). An empty
// ID list records a current official-directory check without claiming that the
// game was never released or will never be listed.
const products = [
  {
    projectId: "captain-tsubasa-2-world-fighters",
    query: { HK: "隊長小翼", TW: "隊長小翼", KR: "캡틴 츠바사 2", SEA: "CAPTAIN TSUBASA 2" },
    ids: { HK: ["70010000113638"], TW: ["70010000113638"], KR: ["70010000113637"], SEA: ["70010000113641"] },
  },
  {
    projectId: "one-piece-grand-gourmet",
    query: { HK: "ONE PIECE 海洋盛宴", TW: "ONE PIECE 海洋盛宴", KR: "원피스 그랜드 레스토랑", SEA: "ONE PIECE Grand Gourmet" },
    ids: {
      HK: ["70010000110968", "70010000110986"],
      TW: ["70010000110968", "70010000110986"],
      KR: ["70010000110969", "70010000110987"],
      SEA: ["70010000110970", "70010000110988"],
    },
  },
  {
    projectId: "my-hero-academia-alls-justice",
    query: { HK: "我的英雄學院 無盡正義", TW: "我的英雄學院 無盡正義", KR: "나의 히어로 아카데미아", SEA: "MY HERO ACADEMIA All's Justice" },
    ids: { HK: ["70010000103758"], TW: ["70010000103758"], KR: ["70010000103759"], SEA: ["70010000122388"] },
  },
  {
    projectId: "demon-slayer-hinokami-chronicles-2",
    query: { HK: "鬼滅之刃 火之神血風譚2", TW: "鬼滅之刃 火之神血風譚2", KR: "귀멸의 칼날 히노카미 혈풍담2", SEA: "Demon Slayer Hinokami Chronicles 2" },
    ids: { HK: ["70010000086955"], TW: ["70010000086955"], KR: ["70010000086958"], SEA: ["70010000107717"] },
  },
  {
    projectId: "hunter-x-hunter-nen-impact",
    query: { HK: "HUNTER×HUNTER NEN×IMPACT", TW: "HUNTER×HUNTER NEN×IMPACT", KR: "HUNTER×HUNTER NEN×IMPACT", SEA: "HUNTER×HUNTER NEN×IMPACT" },
    ids: { HK: ["70010000084030"], TW: ["70010000084030"], KR: ["70010000084029"], SEA: ["70010000108877"] },
  },
  {
    projectId: "dragon-ball-gekishin-squadra",
    query: { HK: "DRAGON BALL GEKISHIN SQUADRA", TW: "DRAGON BALL GEKISHIN SQUADRA", KR: "격신 스쿼드라", SEA: "DRAGON BALL GEKISHIN SQUADRA" },
    ids: { HK: ["70010000063787"], TW: [], KR: [], SEA: [] },
  },
  {
    projectId: "dragon-ball-fighterz",
    query: { HK: "FighterZ", TW: "FighterZ", KR: "드래곤볼 파이터즈", SEA: "DRAGON BALL FighterZ" },
    ids: { HK: ["70010000012963"], TW: [], KR: [], SEA: [] },
  },
  {
    projectId: "my-hero-ones-justice",
    query: { HK: "我的英雄學院 唯我正義", TW: "我的英雄學院 唯我正義", KR: "나의 히어로 원즈 저스티스", SEA: "MY HERO ONE'S JUSTICE" },
    ids: { HK: ["70010000012361"], TW: [], KR: [], SEA: [] },
  },
  {
    projectId: "jump-force",
    query: { HK: "JUMP FORCE", TW: "JUMP FORCE", KR: "점프 포스", SEA: "JUMP FORCE" },
    ids: { HK: [], TW: [], KR: [], SEA: [] },
  },
  {
    projectId: "dragon-ball-z-kakarot",
    query: { HK: "七龍珠Z 卡卡洛特", TW: "七龍珠Z 卡卡洛特", KR: "드래곤볼 Z 카카로트", SEA: "DRAGON BALL Z KAKAROT" },
    ids: { HK: ["70010000035340"], TW: [], KR: ["70010000035339"], SEA: [] },
  },
  {
    projectId: "demon-slayer-hinokami-chronicles",
    query: { HK: "鬼滅之刃 火之神血風譚", TW: "鬼滅之刃 火之神血風譚", KR: "귀멸의 칼날 히노카미 혈풍담", SEA: "Demon Slayer Hinokami Chronicles" },
    ids: { HK: ["70010000048561"], TW: ["70010000048561"], KR: ["70010000048382"], SEA: ["70010000109446"] },
  },
  {
    projectId: "jojo-all-star-battle-r",
    query: { HK: "JOJO的奇妙冒險 群星之戰", TW: "JOJO的奇妙冒險 群星之戰", KR: "죠죠 올 스타 배틀", SEA: "JoJo All-Star Battle R" },
    ids: { HK: ["70010000054239"], TW: ["70010000054239"], KR: [], SEA: ["70010000107701"] },
  },
  {
    projectId: "one-piece-odyssey",
    query: { HK: "ONE PIECE 時光旅詩", TW: "ONE PIECE 時光旅詩", KR: "원피스 오디세이", SEA: "ONE PIECE ODYSSEY" },
    ids: { HK: ["70010000063984"], TW: [], KR: [], SEA: [] },
  },
  {
    projectId: "jujutsu-kaisen-cursed-clash",
    query: { HK: "咒術迴戰 雙華亂舞", TW: "咒術迴戰 雙華亂舞", KR: "주술회전 전화향명", SEA: "Jujutsu Kaisen Cursed Clash" },
    ids: { HK: ["70010000062526"], TW: [], KR: ["70010000062525"], SEA: [] },
  },
  {
    projectId: "naruto-storm-connections",
    query: { HK: "NARUTO 終極風暴羈絆", TW: "NARUTO 終極風暴羈絆", KR: "나루티밋 스톰 커넥션즈", SEA: "NARUTO STORM CONNECTIONS" },
    ids: { HK: ["70010000056879"], TW: ["70010000056879"], KR: ["70010000056878"], SEA: ["70010000107974"] },
  },
  {
    projectId: "dragon-ball-sparking-zero",
    query: { HK: "Sparking! ZERO", TW: "Sparking! ZERO", KR: "드래곤볼 스파킹 제로", SEA: "DRAGON BALL Sparking ZERO" },
    ids: {
      HK: ["70010000092463", "70010000102647"],
      TW: ["70010000092463", "70010000102647"],
      KR: ["70010000092462", "70010000102735"],
      SEA: ["70010000112350", "70010000111935"],
    },
  },
  {
    projectId: "fairy-tail-2",
    query: { HK: "FAIRY TAIL 2", TW: "FAIRY TAIL 2", KR: "FAIRY TAIL 2", SEA: "FAIRY TAIL 2" },
    ids: { HK: ["70010000082888"], TW: ["70010000082888"], KR: [], SEA: ["70010000124063"] },
  },
  {
    projectId: "fate-extra-record",
    query: { HK: "Fate EXTRA Record", TW: "Fate EXTRA Record", KR: "Fate EXTRA Record", SEA: "Fate EXTRA Record" },
    ids: { HK: [], TW: [], KR: [], SEA: [] },
  },
  {
    projectId: "eminence-in-shadow-phantom-echoes",
    query: { HK: "The Eminence in Shadow Phantom Echoes", TW: "The Eminence in Shadow Phantom Echoes", KR: "섀도우 가든 팬텀 에코즈", SEA: "The Eminence in Shadow Phantom Echoes" },
    ids: { HK: [], TW: [], KR: [], SEA: [] },
  },
  {
    projectId: "kingdom-hearts-iv",
    query: { HK: "KINGDOM HEARTS IV", TW: "KINGDOM HEARTS IV", KR: "킹덤 하츠 IV", SEA: "KINGDOM HEARTS IV" },
    ids: { HK: ["70010000126664"], TW: ["70010000126664"], KR: [], SEA: ["70010000126833"] },
  },
  {
    projectId: "jujutsu-kaisen-rumble-survivaton",
    query: { HK: "Jujutsu Kaisen RUMBLE SURVIVATON", TW: "Jujutsu Kaisen RUMBLE SURVIVATON", KR: "주술회전 럼블 서바이바톤", SEA: "Jujutsu Kaisen RUMBLE SURVIVATON" },
    ids: { HK: [], TW: [], KR: [], SEA: [] },
  },
  {
    projectId: "attack-on-titan-2",
    query: { HK: "進擊的巨人２", TW: "進擊的巨人２", KR: "진격의 거인 2", SEA: "Attack on Titan 2" },
    ids: { HK: ["70010000009751"], TW: ["70010000103959"], KR: ["70070000006284"], SEA: [] },
    baseDateUnverifiedRegions: ["KR"],
  },
  {
    projectId: "attack-on-titan-3",
    query: { HK: "Attack on Titan 3", TW: "Attack on Titan 3", KR: "진격의 거인 3", SEA: "Attack on Titan 3" },
    ids: { HK: [], TW: [], KR: [], SEA: [] },
  },
  {
    projectId: "hatsune-miku-starry-party",
    query: { HK: "Hatsune Miku Starry Party", TW: "Hatsune Miku Starry Party", KR: "하츠네 미쿠 스타리 파티", SEA: "Hatsune Miku Starry Party" },
    ids: { HK: [], TW: [], KR: [], SEA: [] },
  },
  {
    projectId: "another-eden-begins",
    query: { HK: "Another Eden Begins", TW: "Another Eden Begins", KR: "Another Eden Begins", SEA: "Another Eden Begins" },
    ids: {
      HK: ["70010000105773", "70010000128639"],
      TW: ["70010000105773", "70010000128639"],
      KR: ["70010000105774"],
      SEA: ["70010000121182", "70010000128641"],
    },
  },
  {
    projectId: "professor-layton-new-world-of-steam",
    query: { HK: "Professor Layton New World of Steam", TW: "Professor Layton New World of Steam", KR: "레이튼 교수와 증기의 신세계", SEA: "Professor Layton New World of Steam" },
    ids: { HK: [], TW: [], KR: [], SEA: [] },
  },
  {
    projectId: "pokemon-winds-waves",
    query: { HK: "Pokémon Winds", TW: "Pokémon Winds", KR: "포켓몬 윈즈", SEA: "Pokemon Winds" },
    ids: { HK: [], TW: [], KR: [], SEA: [] },
  },
];

function visibleSearchUrl(region, definition, query) {
  if (definition.kind === "legacy") {
    return `https://www.nintendo.com/sg/games/switch/index.html?sfq=${encodeURIComponent(query)}`;
  }
  return `https://www.nintendo.com/${definition.locale}/software/switch?sfq=${encodeURIComponent(query)}&sftab=all`;
}

function productUrl(region, definition, storeId) {
  if (region === "HK") return `https://ec.nintendo.com/HK/zh/titles/${storeId}`;
  if (region === "TW") return `https://ec.nintendo.com/TW/zh/titles/${storeId}`;
  if (region === "KR") return `https://store.nintendo.co.kr/${storeId}`;
  return `https://ec.nintendo.com/SG/en/titles/${storeId}`;
}

async function fetchModern(definition, query) {
  const apiUrl = `https://www.nintendo.com/${definition.locale}/api/search?${new URLSearchParams({
    k: query,
    directory: "software",
    size: "100",
  })}`;
  const response = await fetch(apiUrl, {
    headers: { "user-agent": "Mozilla/5.0 AppleWebKit/537.36 Chrome/140 Safari/537.36" },
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const payload = await response.json();
  return Array.isArray(payload.items) ? payload.items : [];
}

async function fetchLegacy(query) {
  const apiUrl = `https://search.nintendo.jp/nintendo_soft_sg/search.json?${new URLSearchParams({
    q: query,
    limit: "400",
    page: "1",
  })}`;
  const response = await fetch(apiUrl, {
    headers: { "user-agent": "Mozilla/5.0 AppleWebKit/537.36 Chrome/140 Safari/537.36" },
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const payload = await response.json();
  return Array.isArray(payload.result?.items) ? payload.result.items : [];
}

function itemId(item) {
  return String(item.nsuid || item.id || "");
}

function itemTitle(item) {
  return String(item.title || "");
}

function itemHardware(item, definition) {
  if (definition.kind === "legacy") {
    return item.hard === "05_BEE" ? "Nintendo Switch 2" : "Nintendo Switch";
  }
  return String(item.hardwareCategory || "Nintendo Switch").replace(" Edition", "");
}

function itemReleaseDate(item, definition) {
  if (definition.kind === "legacy") {
    const match = String(item.sdate || "").match(/^(\d{4})\.(\d{1,2})\.(\d{1,2})$/);
    if (match) return `${match[1]}-${match[2].padStart(2, "0")}-${match[3].padStart(2, "0")}`;
    return "";
  }
  if (item.releaseDateUndecided) return "";
  return String(item.releaseDate || "").match(/^\d{4}-\d{2}-\d{2}/)?.[0] || "";
}

function rawReleaseDate(item, definition) {
  return definition.kind === "legacy" ? String(item.sdate || "") : String(item.releaseDate || "");
}

function fallbackPlannedDate(projectId) {
  const candidates = data.releases.filter((release) =>
    release.projectId === projectId
    && release.platform === "switch"
    && ["GLOBAL", "ASIA", "JP", "US"].includes(release.region));
  return candidates.find((release) => release.plannedLaunchDate)?.plannedLaunchDate || "";
}

async function auditProduct(product, region, definition) {
  const query = product.query[region];
  const expectedIds = product.ids[region] || [];
  const sourceUrl = visibleSearchUrl(region, definition, query);
  try {
    const items = definition.kind === "legacy"
      ? await fetchLegacy(query)
      : await fetchModern(definition, query);
    const expected = new Set(expectedIds);
    const matched = items.filter((item) => expected.has(itemId(item)));
    const listed = definition.kind === "legacy"
      ? matched.filter((item) => item.ssitu !== "not_found")
      : matched;
    if (!listed.length) {
      return {
        check: {
          projectId: product.projectId,
          platform: "switch",
          region,
          representativeCountry: definition.representativeCountry || region,
          availability: matched.length ? "delisted_store_page" : "not_listed_currently",
          checkedAt,
          sourceUrl,
          searchQuery: query,
          note: region === "SEA"
            ? "以新加坡 Nintendo 官方目录作为东南亚代表样本；当前未检索到已确认的基础游戏条目。商品页不存在不等于从未发行。"
            : "Nintendo 官方地区目录当前未检索到已确认的基础游戏条目；不等于从未发行。",
        },
      };
    }

    const project = data.projects.find((item) => item.id === product.projectId);
    const storeIds = listed.map(itemId);
    const storeTitles = listed.map(itemTitle);
    const hardware = [...new Set(listed.map((item) => itemHardware(item, definition)))];
    const baseDateUnverified = (product.baseDateUnverifiedRegions || []).includes(region);
    const launchDates = baseDateUnverified
      ? []
      : listed.map((item) => itemReleaseDate(item, definition)).filter(Boolean).sort();
    const launchDate = launchDates[0] || "";
    const fallbackDate = fallbackPlannedDate(product.projectId);
    const launched = launchDate ? launchDate <= checkedAt : project?.status === "launched";
    const plannedLaunchDate = launchDate
      || (launched ? "已上线（当地基础版首发日期待核验）" : fallbackDate);
    const actualLaunchDate = launched
      ? (launchDate || "已上线（当地基础版首发日期待核验）")
      : "";
    const status = launched ? "launched" : (plannedLaunchDate ? "upcoming" : "announced");
    const directSourceUrl = productUrl(region, definition, storeIds[0]);
    const regionalNote = region === "SEA"
      ? "以新加坡 Nintendo 官方目录及 eShop 作为东南亚代表样本。"
      : "Nintendo 官方地区目录与商品页核验。";
    const dateNote = baseDateUnverified
      ? "韩国当前条目为包含本体的 Final Battle 版本；仅用于确认当前可用，不以版本日期反推本体首发日期。"
      : "";
    return {
      check: {
        projectId: product.projectId,
        platform: "switch",
        region,
        representativeCountry: definition.representativeCountry || region,
        storeId: storeIds[0],
        storeIds,
        availability: "available",
        checkedAt,
        sourceUrl: directSourceUrl,
        searchSourceUrl: sourceUrl,
        searchQuery: query,
        note: [regionalNote, dateNote].filter(Boolean).join(" "),
      },
      release: {
        id: `${product.projectId}-${region.toLowerCase()}-switch`,
        projectId: product.projectId,
        platform: "switch",
        region,
        store: `Nintendo ${definition.label}官方目录（${hardware.join(" / ")}）`,
        storeId: storeIds[0],
        storeIds,
        representativeCountry: definition.representativeCountry || region,
        plannedLaunchDate,
        actualLaunchDate,
        status,
        storeAvailability: "available",
        availabilityCheckedAt: checkedAt,
        sourceUrl: directSourceUrl,
        searchSourceUrl: sourceUrl,
        verifiedAt: checkedAt,
        storeTitle: storeTitles[0],
        storeTitles,
        rawStoreReleaseDate: rawReleaseDate(listed[0], definition),
        rawStoreReleaseDates: listed.map((item) => rawReleaseDate(item, definition)),
        note: dateNote || regionalNote,
      },
    };
  } catch (error) {
    return {
      check: {
        projectId: product.projectId,
        platform: "switch",
        region,
        representativeCountry: definition.representativeCountry || region,
        availability: "check_failed",
        checkedAt,
        sourceUrl,
        searchQuery: query,
        note: `Nintendo 官方地区目录核验失败：${String(error.message || error).split("\n")[0]}`,
      },
    };
  }
}

async function main() {
  const jobs = [];
  for (const product of products) {
    for (const [region, definition] of Object.entries(regions)) {
      jobs.push([product, region, definition]);
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
  data.meta.schemaVersion = "1.8";
  data.meta.phase = 13;
  data.meta.generatedAt = "2026-09-09T12:16:00+09:00";
  data.meta.regionCoverage = {
    ...(data.meta.regionCoverage || {}),
    nintendoStoreAuditDate: checkedAt,
    nintendoAuditedRegions: Object.keys(regions),
    nintendoAuditedProducts: products.length,
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
