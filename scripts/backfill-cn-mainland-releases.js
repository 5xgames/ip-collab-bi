const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const jsonPath = path.join(root, "game-projects/data/projects.json");
const jsPath = path.join(root, "game-projects/data/projects.js");
const data = JSON.parse(fs.readFileSync(jsonPath, "utf8"));

const checkedAt = "2026-09-09";
const nppaIndexUrl = "https://www.nppa.gov.cn/bsfw/jggs/yxspjg/index.html";
const nppaApprovalChangeUrl = "https://www.nppa.gov.cn/bsfw/jggs/yxspjg/yxspbgxx/202401/t20240126_830423.html";
const p5xLaunchUrl = "https://www.wanmei.com/radionews/gamevideo/game/gameanimation/20240412/249861.shtml";
const p5xAppStoreUrl = "https://apps.apple.com/cn/app/id6466264792";
const p5xSteamChinaUrl = "https://store.steamchina.com/app/3604320/";

const platformLabels = {
  ios: "中国大陆 App Store",
  android: "中国大陆官方安卓渠道",
  windows: "中国大陆官方 PC 客户端 / WeGame",
  steam: "蒸汽平台",
  switch: "国行 Nintendo Switch",
  playstation: "国行 PlayStation",
  xbox: "国行 Xbox",
  web: "中国大陆网页版本",
  wechat_minigame: "微信小游戏",
  douyin_minigame: "抖音小游戏",
};

function steamChinaSearchUrl(productName) {
  return `https://store.steamchina.com/search/?term=${encodeURIComponent(productName)}`;
}

function appStoreSearchUrl(productName) {
  return `https://itunes.apple.com/search?${new URLSearchParams({
    term: productName,
    country: "cn",
    entity: "software",
    limit: "20",
  })}`;
}

function sourceForPlatform(platform, productName) {
  if (platform === "steam") return steamChinaSearchUrl(productName);
  if (platform === "ios") return appStoreSearchUrl(productName);
  return nppaIndexUrl;
}

function negativeNote(platform) {
  if (platform === "steam") {
    return "已核验蒸汽平台当前目录、国家新闻出版署审批公示及公开的中国大陆发行信息，未确认该同名产品的正式大陆版本；商品名本地化或后续上架仍需持续复核。";
  }
  if (platform === "ios") {
    return "已核验中国大陆 App Store 当前目录、国家新闻出版署审批公示及公开的中国大陆发行信息，未确认该同名产品的正式大陆版本；当前未检索到不等于从未发行。";
  }
  if (["switch", "playstation", "xbox"].includes(platform)) {
    return "已核验国家新闻出版署进口网络游戏审批公示及公开的国行发行信息，未确认该同名产品的正式国行版本；不包含海外版光盘、跨区账号或非国行商店。";
  }
  return "已核验国家新闻出版署审批公示、官方产品页及公开的中国大陆发行信息，未确认该同名产品的正式大陆版本；当前未核验到不等于从未发行。";
}

const confirmedP5xReleases = [
  {
    id: "p5x-cn-ios",
    projectId: "persona-5-the-phantom-x",
    platform: "ios",
    region: "CN",
    store: "中国大陆 App Store",
    storeId: "6466264792",
    plannedLaunchDate: "2024-04-12",
    actualLaunchDate: "2024-04-12",
    status: "launched",
    storeAvailability: "available",
    availabilityCheckedAt: checkedAt,
    approvalNumber: "国新出审[2023]1415号",
    approvalDate: "2023-08-25",
    approvalCategory: "移动、客户端",
    isbn: "978-7-498-12586-6",
    rawStoreReleaseDate: "2024-04-09T07:00:00Z",
    sourceUrl: p5xAppStoreUrl,
    launchSourceUrl: p5xLaunchUrl,
    approvalSourceUrl: nppaApprovalChangeUrl,
    verifiedAt: checkedAt,
    note: "完美世界公告确认 2024-04-12 全平台公测；App Store 的初始上架时间为 2024-04-09，正式公测日作为实际上线口径。",
  },
  {
    id: "p5x-cn-android",
    projectId: "persona-5-the-phantom-x",
    platform: "android",
    region: "CN",
    store: "中国大陆官方安卓客户端",
    plannedLaunchDate: "2024-04-12",
    actualLaunchDate: "2024-04-12",
    status: "launched",
    storeAvailability: "available",
    availabilityCheckedAt: checkedAt,
    approvalNumber: "国新出审[2023]1415号",
    approvalDate: "2023-08-25",
    approvalCategory: "移动、客户端",
    isbn: "978-7-498-12586-6",
    sourceUrl: p5xLaunchUrl,
    officialSiteUrl: "https://p5x.wanmei.com/",
    approvalSourceUrl: nppaApprovalChangeUrl,
    verifiedAt: checkedAt,
    note: "完美世界官方公测公告与官网安卓下载入口核验。",
  },
  {
    id: "p5x-cn-windows",
    projectId: "persona-5-the-phantom-x",
    platform: "windows",
    region: "CN",
    store: "中国大陆官方 PC 客户端",
    plannedLaunchDate: "2024-04-12",
    actualLaunchDate: "2024-04-12",
    status: "launched",
    storeAvailability: "available",
    availabilityCheckedAt: checkedAt,
    approvalNumber: "国新出审[2023]1415号",
    approvalDate: "2023-08-25",
    approvalChangeDate: "2024-01-25",
    approvalCategory: "移动、客户端",
    isbn: "978-7-498-12586-6",
    sourceUrl: p5xLaunchUrl,
    officialSiteUrl: "https://p5x.wanmei.com/",
    approvalSourceUrl: nppaApprovalChangeUrl,
    verifiedAt: checkedAt,
    note: "2024-01-25 审批变更信息确认增报客户端；完美世界官方公告确认 2024-04-12 全平台公测。",
  },
  {
    id: "p5x-cn-steamchina",
    projectId: "persona-5-the-phantom-x",
    platform: "steam",
    region: "CN",
    store: "蒸汽平台",
    storeId: "3604320",
    plannedLaunchDate: "2025-04-25",
    actualLaunchDate: "2025-04-25",
    status: "launched",
    storeAvailability: "available",
    availabilityCheckedAt: checkedAt,
    approvalNumber: "国新出审[2023]1415号",
    approvalCategory: "移动、客户端",
    isbn: "978-7-498-12586-6",
    sourceUrl: p5xSteamChinaUrl,
    approvalSourceUrl: nppaApprovalChangeUrl,
    verifiedAt: checkedAt,
    note: "蒸汽平台官方商品页确认 2025-04-25 上线；该条仅代表蒸汽平台版本，不以国际 Steam 页面替代。",
  },
];

function main() {
  const p5xProject = data.projects.find((project) => project.id === "persona-5-the-phantom-x");
  if (p5xProject) {
    p5xProject.developer = "Perfect World Games（黑羽工作室）";
    p5xProject.publisher = "Perfect World Games";
    p5xProject.announcementDate = "2023-03-21";
    p5xProject.cnSourceUrl = p5xLaunchUrl;
  }

  const releaseById = new Map(data.releases.map((release) => [release.id, release]));
  for (const release of confirmedP5xReleases) releaseById.set(release.id, release);
  data.releases = [...releaseById.values()];

  const checkByKey = new Map((data.regionChecks || []).map((check) => [
    `${check.projectId}:${check.platform}:${check.region}:${check.checkedAt}`,
    check,
  ]));

  for (const project of data.projects) {
    const platforms = new Set(data.releases
      .filter((release) => release.projectId === project.id)
      .map((release) => release.platform));
    if (project.id === "persona-5-the-phantom-x") platforms.add("windows");

    for (const platform of platforms) {
      const confirmed = confirmedP5xReleases.find((release) =>
        release.projectId === project.id && release.platform === platform);
      const check = confirmed
        ? {
            projectId: project.id,
            platform,
            region: "CN",
            availability: "available",
            checkedAt,
            store: confirmed.store,
            storeId: confirmed.storeId || "",
            approvalNumber: confirmed.approvalNumber,
            approvalCategory: confirmed.approvalCategory,
            sourceUrl: confirmed.sourceUrl,
            approvalSourceUrl: nppaApprovalChangeUrl,
            note: confirmed.note,
          }
        : {
            projectId: project.id,
            platform,
            region: "CN",
            availability: "not_listed_currently",
            checkedAt,
            store: platformLabels[platform] || "中国大陆正式发行渠道",
            sourceUrl: sourceForPlatform(platform, project.productName),
            approvalSourceUrl: nppaIndexUrl,
            searchQuery: project.productName,
            note: negativeNote(platform),
          };
      checkByKey.set(`${check.projectId}:${check.platform}:${check.region}:${check.checkedAt}`, check);
    }
  }

  data.regionChecks = [...checkByKey.values()].sort((a, b) =>
    a.projectId.localeCompare(b.projectId)
    || a.platform.localeCompare(b.platform)
    || a.region.localeCompare(b.region)
    || a.checkedAt.localeCompare(b.checkedAt));

  const snapshotKey = (snapshot) => [
    snapshot.releaseId || snapshot.projectId,
    snapshot.date,
    snapshot.metricType,
    snapshot.scope,
  ].join(":");
  const snapshotByKey = new Map((data.rankSnapshots || []).map((snapshot) => [snapshotKey(snapshot), snapshot]));
  const p5xSteamChinaSnapshots = [
    {
      releaseId: "p5x-cn-steamchina",
      date: checkedAt,
      metricType: "review_score",
      value: 38,
      display: "蒸汽平台好评率 38%（多半差评）",
      scope: "蒸汽平台用户评测（585 条）",
      source: "蒸汽平台",
      sourceUrl: p5xSteamChinaUrl,
      performanceLevel: "ordinary",
    },
    {
      releaseId: "p5x-cn-steamchina",
      date: checkedAt,
      metricType: "review_count",
      value: 585,
      display: "蒸汽平台用户评测 585 条",
      scope: "好评率 38%（多半差评）",
      source: "蒸汽平台",
      sourceUrl: p5xSteamChinaUrl,
      performanceLevel: "ordinary",
    },
  ];
  for (const snapshot of p5xSteamChinaSnapshots) snapshotByKey.set(snapshotKey(snapshot), snapshot);
  data.rankSnapshots = [...snapshotByKey.values()];

  data.meta.schemaVersion = "1.9";
  data.meta.phase = 14;
  data.meta.generatedAt = "2026-09-09T15:40:00+09:00";
  data.meta.regionCoverage = {
    ...(data.meta.regionCoverage || {}),
    chinaMainlandAuditDate: checkedAt,
    chinaMainlandAuditedProducts: data.projects.length,
    chinaMainlandAuditedProjectPlatforms: [...checkByKey.values()].filter((check) =>
      check.region === "CN" && check.checkedAt === checkedAt).length,
    chinaMainlandConfirmedProducts: 1,
    chinaMainlandSources: [
      "国家新闻出版署游戏审批与变更公示",
      "中国大陆 App Store",
      "蒸汽平台",
      "游戏官方中国大陆运营网站与发行公告",
    ],
  };

  const json = `${JSON.stringify(data, null, 2)}\n`;
  fs.writeFileSync(jsonPath, json);
  fs.writeFileSync(jsPath, `window.GAME_PROJECTS_DATA = ${json.trimEnd()};\n`);
  console.log(JSON.stringify({
    confirmedReleasesAddedOrUpdated: confirmedP5xReleases.length,
    mainlandChecks: data.regionChecks.filter((check) => check.region === "CN").length,
    totalReleases: data.releases.length,
    totalRegionChecks: data.regionChecks.length,
    totalRankSnapshots: data.rankSnapshots.length,
  }, null, 2));
}

main();
