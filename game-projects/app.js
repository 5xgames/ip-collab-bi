(() => {
  "use strict";

  const data = window.GAME_PROJECTS_DATA || {};
  const meta = data.meta || {};
  const projects = Array.isArray(data.projects) ? data.projects : [];
  const releases = Array.isArray(data.releases) ? data.releases : [];
  const rankSnapshots = Array.isArray(data.rankSnapshots) ? data.rankSnapshots : [];
  const regionChecks = Array.isArray(data.regionChecks) ? data.regionChecks : [];
  const projectById = new Map(projects.map((project) => [project.id, project]));
  const releaseById = new Map(releases.map((release) => [release.id, release]));

  const platformNames = {
    ios: "iOS", android: "Android", steam: "Steam", windows: "Windows PC",
    switch: "Nintendo Switch", playstation: "PlayStation", xbox: "Xbox",
    web: "网页游戏", wechat_minigame: "微信小游戏", douyin_minigame: "抖音小游戏",
  };
  const regionNames = {
    CN: "中国大陆", HK: "香港", TW: "台湾", JP: "日本", KR: "韩国",
    SEA: "东南亚", US: "美国", GLOBAL: "全球公告范围", ASIA: "亚洲公告范围",
  };
  const targetRegionCodes = Array.isArray(meta.targetRegions) && meta.targetRegions.length
    ? meta.targetRegions.filter((code) => regionNames[code] && !["GLOBAL", "ASIA"].includes(code))
    : ["JP", "CN", "HK", "TW", "KR", "SEA", "US"];
  const asiaRegionCodes = new Set(["JP", "CN", "HK", "TW", "KR", "SEA"]);
  const statusNames = {
    announced: "已公布", testing: "测试中", preregister: "预约中", upcoming: "即将上线",
    launched: "已上线", delayed: "延期", cancelled: "已取消", ended: "停止运营",
  };
  const metricNames = {
    free_rank: "免费游戏榜", grossing_rank: "畅销游戏榜", top_seller_rank: "畅销榜",
    concurrent_users: "历史在线峰值", average_concurrent_users: "月均同时在线",
    daily_active_users: "日活跃用户", active_users: "活跃用户",
    download_rank: "下载榜", physical_sales: "实体销量", unit_sales: "销量", estimated_sales: "销量估算",
    review_count: "评价数", review_score: "好评率", user_rating_5: "玩家评分", revenue: "公开收入", store_award: "商店奖项",
    estimated_downloads: "生命周期下载量估算", estimated_revenue: "生命周期收入估算",
  };
  const levelNames = {
    phenomenon: "现象级", strong: "强势", good: "表现良好",
    ordinary: "一般", insufficient: "数据不足",
  };
  const ipNameAliases = new Map([
    ["DRAGON BALL Z / 龙珠Z", "DRAGON BALL / 龙珠"],
  ]);

  const $ = (selector) => document.querySelector(selector);
  const elements = {
    generatedAt: $("#generated-at"),
    latestProjectDate: $("#latest-project-date"),
    projectStartDate: $("#project-start-date-filter"),
    projectEndDate: $("#project-end-date-filter"),
    projectDateRangeLabel: $("#project-date-range-label"),
    performanceStartDate: $("#performance-start-date-filter"),
    performanceEndDate: $("#performance-end-date-filter"),
    performanceDateRangeLabel: $("#performance-date-range-label"),
    platform: $("#platform-filter"),
    region: $("#region-filter"),
    status: $("#status-filter"),
    ipType: $("#ip-type-filter"),
    product: $("#product-filter"),
    search: $("#search-filter"),
    reset: $("#reset-filters"),
    summary: $("#filter-summary"),
    regionAudit: $("#region-audit-summary"),
    kpiProjects: $("#kpi-projects"),
    kpiLaunched: $("#kpi-launched"),
    kpiUpcoming: $("#kpi-upcoming"),
    kpiUpcomingDetail: $("#kpi-upcoming-detail"),
    kpiReleases: $("#kpi-releases"),
    recentList: $("#recent-project-list"),
    recentEmpty: $("#recent-project-empty"),
    recentCount: $("#recent-project-count"),
    ipActivitySummary: $("#ip-activity-summary"),
    ipActivityBody: $("#ip-activity-table-body"),
    ipActivityEmpty: $("#ip-activity-empty"),
    ipActivityCount: $("#ip-activity-count"),
    ipDrilldownStatus: $("#ip-drilldown-status"),
    ipDrilldownName: $("#ip-drilldown-name"),
    clearIpDrilldown: $("#clear-ip-drilldown"),
    schedule: $("#release-schedule"),
    scheduleEmpty: $("#schedule-empty"),
    performancePanel: $("#performance-panel"),
    performanceSectionNote: $("#performance-section-note"),
    performanceProduct: $("#performance-product-filter"),
    performanceOverviewView: $("#performance-overview-view"),
    productPerformanceView: $("#product-performance-view"),
    productPerformanceName: $("#product-performance-name"),
    productPerformanceScope: $("#product-performance-scope"),
    productPlatformTimelines: $("#product-platform-timelines"),
    clearPerformanceProduct: $("#clear-performance-product"),
    steamPeakChart: $("#steam-peak-chart"),
    steamPeakEmpty: $("#steam-peak-empty"),
    performanceTierChart: $("#performance-tier-chart"),
    performanceTierEmpty: $("#performance-tier-empty"),
    mobileMarketChart: $("#mobile-market-chart"),
    mobileMarketEmpty: $("#mobile-market-empty"),
    performanceDetailNote: $("#performance-detail-note"),
    performanceList: $("#performance-list"),
    performanceEmpty: $("#performance-empty"),
    performanceMethod: $("#performance-method"),
    tableBody: $("#project-table-body"),
    tableEmpty: $("#project-table-empty"),
    tableCount: $("#project-count"),
    footerSource: $("#footer-source"),
  };

  const isoDate = (value) => String(value || "").match(/\d{4}-\d{2}-\d{2}/)?.[0] || "";
  const dateBounds = (value) => {
    const exactDate = isoDate(value);
    if (exactDate) return { start: exactDate, end: exactDate };
    const textValue = String(value || "");
    const year = textValue.match(/20\d{2}/)?.[0];
    if (!year) return null;
    if (/上半年/.test(textValue)) return { start: `${year}-01-01`, end: `${year}-06-30` };
    if (/下半年/.test(textValue)) return { start: `${year}-07-01`, end: `${year}-12-31` };
    if (/春/.test(textValue)) return { start: `${year}-03-01`, end: `${year}-05-31` };
    if (/夏/.test(textValue)) return { start: `${year}-06-01`, end: `${year}-08-31` };
    if (/秋/.test(textValue)) return { start: `${year}-09-01`, end: `${year}-11-30` };
    if (/冬|年末/.test(textValue)) return { start: `${year}-12-01`, end: `${year}-12-31` };
    return { start: `${year}-01-01`, end: `${year}-12-31` };
  };
  const generatedDate = isoDate(meta.generatedAt) || new Date().toISOString().slice(0, 10);
  const projectDateValues = [
    ...projects.flatMap((project) => [project.announcementDate, project.latestUpdateDate, project.verifiedAt]),
    ...releases.flatMap((release) => [
      release.testStartDate, release.preregisterDate, release.plannedLaunchDate,
      release.actualLaunchDate, release.serviceEndDate, release.verifiedAt,
    ]),
  ];
  const projectObservedDates = projectDateValues.flatMap((value) => {
    const bounds = dateBounds(value);
    return bounds ? [bounds.start, bounds.end] : [];
  }).sort();
  const performanceObservedDates = rankSnapshots.map((snapshot) => isoDate(snapshot.date)).filter(Boolean).sort();
  const projectMinimumDate = meta.coverageStart || projectObservedDates[0] || "2018-01-01";
  const projectMaximumDate = projectObservedDates.at(-1) || generatedDate;
  const performanceMinimumDate = performanceObservedDates[0] || projectMinimumDate;
  const performanceMaximumDate = performanceObservedDates.at(-1) || generatedDate;
  const defaultPerformanceEndDate = performanceMaximumDate;
  const defaultPerformanceStartObject = new Date(`${defaultPerformanceEndDate}T00:00:00Z`);
  defaultPerformanceStartObject.setUTCDate(defaultPerformanceStartObject.getUTCDate() - Math.max(1, Number(meta.defaultWindowDays) || 90) + 1);
  const defaultPerformanceStartDate = defaultPerformanceStartObject.toISOString().slice(0, 10) < performanceMinimumDate
    ? performanceMinimumDate
    : defaultPerformanceStartObject.toISOString().slice(0, 10);
  const today = generatedDate;
  const numberFormat = new Intl.NumberFormat("zh-CN");

  const state = {
    projectStartDate: projectMinimumDate,
    projectEndDate: projectMaximumDate,
    performanceStartDate: defaultPerformanceStartDate,
    performanceEndDate: defaultPerformanceEndDate,
    platform: "all",
    region: "all",
    status: "all",
    ipType: "all",
    product: "all",
    search: "",
    performanceProduct: "all",
    selectedIp: "all",
  };

  function escapeHtml(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function formatGeneratedAt(value) {
    if (!value) return "项目库等待首次导入";
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return `数据生成 ${value}`;
    return `数据结构更新 ${new Intl.DateTimeFormat("zh-CN", {
      timeZone: "Asia/Tokyo", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit",
    }).format(parsed)}（日本时间）`;
  }

  function displayDate(value, emptyLabel = "待确认") {
    const date = isoDate(value);
    if (!date) return `<span class="project-date-note">${escapeHtml(value || emptyLabel)}</span>`;
    const note = String(value).replace(date, "").trim();
    return `<time class="project-date" datetime="${escapeHtml(date)}">${escapeHtml(date)}</time>${note ? `<span class="project-date-note">${escapeHtml(note)}</span>` : ""}`;
  }

  function statusClass(status) {
    if (["testing", "preregister", "upcoming"].includes(status)) return "active";
    if (["announced", "delayed"].includes(status)) return "pending";
    if (["cancelled", "ended"].includes(status)) return "unread";
    return "ended";
  }

  function releaseRegionMatch(release) {
    if (!release) return null;
    if (state.region === "all") {
      return {
        displayRegion: release.region,
        quality: ["GLOBAL", "ASIA"].includes(release.region) ? "announcement_scope" : "verified",
      };
    }
    if (release.region === state.region) return { displayRegion: state.region, quality: "verified" };
    if (release.region === "GLOBAL") {
      return { displayRegion: state.region, quality: "announcement_scope", scopeLabel: "全球公告覆盖 · 待逐区确认" };
    }
    if (release.region === "ASIA" && asiaRegionCodes.has(state.region)) {
      return { displayRegion: state.region, quality: "announcement_scope", scopeLabel: "亚洲公告覆盖 · 待逐区确认" };
    }
    return null;
  }

  function displayedRegion(release, regionMatch = releaseRegionMatch(release)) {
    if (!release || !regionMatch) return { label: "地区待公布", scopeLabel: "" };
    return {
      label: regionNames[regionMatch.displayRegion] || regionMatch.displayRegion,
      scopeLabel: regionMatch.scopeLabel || "",
    };
  }

  function allMilestones(project, projectReleases) {
    const milestones = [];
    const add = (dateValue, label, release) => {
      const date = isoDate(dateValue);
      if (date) milestones.push({ date, label, release });
    };
    add(project.announcementDate, "首次公布", null);
    add(project.latestUpdateDate, project.latestUpdateLabel || "最近动态", null);
    for (const release of projectReleases) {
      add(release.testStartDate, "开始测试", release);
      add(release.preregisterDate, "开放预约", release);
      add(release.plannedLaunchDate, "计划上线", release);
      add(release.actualLaunchDate, "正式上线", release);
      add(release.serviceEndDate, "停止运营", release);
    }
    return milestones.sort((a, b) => a.date.localeCompare(b.date));
  }

  function projectDateMatches(project, projectReleases) {
    if (state.product !== "all") return true;
    const values = [project.announcementDate, project.latestUpdateDate];
    for (const release of projectReleases) {
      values.push(
        release.testStartDate,
        release.preregisterDate,
        release.plannedLaunchDate,
        release.actualLaunchDate,
        release.serviceEndDate,
      );
    }
    const ranges = values.map(dateBounds).filter(Boolean);
    if (!ranges.length) return true;
    return ranges.some(({ start, end }) => (
      (!state.projectStartDate || end >= state.projectStartDate)
      && (!state.projectEndDate || start <= state.projectEndDate)
    ));
  }

  function textMatches(project, release) {
    if (!state.search) return true;
    const haystack = [
      project.productName, project.ipName, project.ipType, project.genre,
      project.developer, project.publisher, release?.store,
    ].join(" ").toLocaleLowerCase();
    return haystack.includes(state.search.toLocaleLowerCase());
  }

  function baseReleaseMatches(project, release, { ignoreRegion = false } = {}) {
    const effectiveStatus = release?.status || project.status || "announced";
    return (state.platform === "all" || release?.platform === state.platform)
      && (ignoreRegion || state.region === "all" || release?.region === state.region)
      && (state.status === "all" || effectiveStatus === state.status)
      && (state.ipType === "all" || project.ipType === state.ipType)
      && (state.product === "all" || project.id === state.product)
      && textMatches(project, release);
  }

  function filteredRows() {
    return collectFilteredRows(false);
  }

  function collectFilteredRows(ignoreProjectDate) {
    const rows = [];
    for (const project of projects) {
      const projectReleases = releases.filter((release) => release.projectId === project.id);
      if (!projectReleases.length) {
        if ((ignoreProjectDate || projectDateMatches(project, [])) && baseReleaseMatches(project, null) && state.platform === "all" && state.region === "all") {
          rows.push({ project, release: null });
        }
        continue;
      }
      const exactPlatforms = new Set(projectReleases
        .filter((release) => state.region !== "all" && release.region === state.region)
        .map((release) => release.platform));
      for (const release of projectReleases) {
        const regionMatch = releaseRegionMatch(release);
        if (!regionMatch) continue;
        if (regionMatch.quality === "announcement_scope" && exactPlatforms.has(release.platform)) continue;
        if ((ignoreProjectDate || projectDateMatches(project, [release])) && baseReleaseMatches(project, release, { ignoreRegion: true })) {
          rows.push({ project, release, regionMatch });
        }
      }
    }
    return rows;
  }

  function appendOptions(select, entries) {
    const current = select.value;
    const first = select.options[0];
    select.replaceChildren(first);
    for (const [value, label] of entries) {
      const option = document.createElement("option");
      option.value = value;
      option.textContent = label;
      select.append(option);
    }
    if ([...select.options].some((option) => option.value === current)) select.value = current;
  }

  function populateFilters() {
    const platformCodes = [...new Set(releases.map((release) => release.platform).filter(Boolean))].sort();
    const statuses = [...new Set([
      ...projects.map((project) => project.status),
      ...releases.map((release) => release.status),
    ].filter(Boolean))].sort();
    const ipTypes = [...new Set(projects.map((project) => project.ipType).filter(Boolean))].sort();
    appendOptions(elements.platform, platformCodes.map((code) => [code, platformNames[code] || code]));
    appendOptions(elements.region, targetRegionCodes.map((code) => [code, regionNames[code] || code]));
    appendOptions(elements.status, statuses.map((status) => [status, statusNames[status] || status]));
    appendOptions(elements.ipType, ipTypes.map((type) => [type, type]));
    appendOptions(elements.product, projects
      .slice()
      .sort((a, b) => String(a.productName).localeCompare(String(b.productName), "zh-CN"))
      .map((project) => [project.id, project.productName]));
    elements.projectStartDate.min = projectMinimumDate;
    elements.projectStartDate.max = projectMaximumDate;
    elements.projectEndDate.min = projectMinimumDate;
    elements.projectEndDate.max = projectMaximumDate;
    elements.performanceStartDate.min = performanceMinimumDate;
    elements.performanceStartDate.max = performanceMaximumDate;
    elements.performanceEndDate.min = performanceMinimumDate;
    elements.performanceEndDate.max = performanceMaximumDate;
  }

  function syncControls() {
    elements.projectStartDate.value = state.projectStartDate;
    elements.projectEndDate.value = state.projectEndDate;
    elements.performanceStartDate.value = state.performanceStartDate;
    elements.performanceEndDate.value = state.performanceEndDate;
    elements.platform.value = state.platform;
    elements.region.value = state.region;
    elements.status.value = state.status;
    elements.ipType.value = state.ipType;
    elements.product.value = state.product;
    elements.search.value = state.search;
    elements.projectDateRangeLabel.textContent = state.product === "all"
      ? `${state.projectStartDate || "最早"} — ${state.projectEndDate || "最晚计划"}`
      : "已选产品 · 完整生命周期";
    elements.performanceDateRangeLabel.textContent = `${state.performanceStartDate || "最早"} — ${state.performanceEndDate || "最新"}`;
  }

  function latestMilestone(project, projectReleases) {
    return allMilestones(project, projectReleases).at(-1) || null;
  }

  function renderRecentProjects(rows) {
    const groupedProjects = new Map();
    for (const { project, release } of rows) {
      if (!groupedProjects.has(project.id)) groupedProjects.set(project.id, { project, releases: [] });
      if (release) groupedProjects.get(project.id).releases.push(release);
    }
    const uniqueProjects = [...groupedProjects.values()]
      .map(({ project, releases: filteredReleases }) => ({ project, filteredReleases, milestone: latestMilestone(project, filteredReleases) }))
      .sort((a, b) => String(b.milestone?.date || "").localeCompare(String(a.milestone?.date || "")))
      .slice(0, 9);
    elements.recentCount.textContent = `${uniqueProjects.length} 项`;
    elements.recentEmpty.hidden = uniqueProjects.length > 0;
    elements.recentList.innerHTML = uniqueProjects.map(({ project, filteredReleases, milestone }) => {
      const release = milestone?.release || filteredReleases[0];
      const effectiveStatus = release?.status || project.status || "announced";
      const platformLabel = release ? platformNames[release.platform] || release.platform : "平台待公布";
      const regionInfo = displayedRegion(release);
      const regionLabel = regionInfo.scopeLabel ? `${regionInfo.label}（${regionInfo.scopeLabel}）` : regionInfo.label;
      return `<article class="recent-project-card">
        <div class="recent-card-top">
          <div class="recent-card-title"><strong>${escapeHtml(project.productName)}</strong><span>${escapeHtml(project.ipName)} · ${escapeHtml(project.ipType || "IP类型待核验")}</span></div>
          <span class="status-chip ${statusClass(effectiveStatus)}">${escapeHtml(statusNames[effectiveStatus] || effectiveStatus)}</span>
        </div>
        <p class="recent-card-summary">${escapeHtml(project.summary || "项目内容待补充")}</p>
        <div class="recent-card-footer"><span>${escapeHtml(platformLabel)} · ${escapeHtml(regionLabel)}</span><span>${escapeHtml(milestone?.label || "最近核验")} <time>${escapeHtml(milestone?.date || "待确认")}</time></span></div>
      </article>`;
    }).join("");
  }

  function canonicalIpName(project) {
    return ipNameAliases.get(project.ipName) || project.ipName || "IP 待确认";
  }

  function gapFromDate(date) {
    if (!date) return { days: Number.POSITIVE_INFINITY, label: "上线日期待补" };
    const start = new Date(`${date}T00:00:00Z`);
    const end = new Date(`${today}T00:00:00Z`);
    const days = Math.max(0, Math.floor((end - start) / 86400000));
    if (days < 31) return { days, label: `${Math.max(1, days)} 天` };
    if (days < 365) return { days, label: `${Math.floor(days / 30)} 个月` };
    return { days, label: `${(days / 365.25).toFixed(1)} 年` };
  }

  function renderIpActivity(periodRows, lifecycleRows) {
    const activeFutureStatuses = new Set(["announced", "testing", "preregister", "upcoming"]);
    const groups = new Map();
    const ensureGroup = (project) => {
      const ipName = canonicalIpName(project);
      if (!groups.has(ipName)) groups.set(ipName, {
        ipName, projects: new Map(), releases: new Map(), periodProjects: new Set(),
      });
      return groups.get(ipName);
    };
    for (const { project, release } of lifecycleRows) {
      const group = ensureGroup(project);
      group.projects.set(project.id, project);
      if (release) group.releases.set(release.id, release);
    }
    for (const { project } of periodRows) ensureGroup(project).periodProjects.add(project.id);

    const activityRows = [...groups.values()].map((group) => {
      const groupProjects = [...group.projects.values()];
      const groupReleases = [...group.releases.values()];
      const launchedProjects = new Set();
      const upcomingProjects = new Map();
      const launchMoments = [];
      for (const project of groupProjects) {
        if (["launched", "ended"].includes(project.status)) launchedProjects.add(project.id);
      }
      for (const release of groupReleases) {
        const project = projectById.get(release.projectId);
        const actualDate = isoDate(release.actualLaunchDate);
        if (actualDate && actualDate <= today) {
          launchedProjects.add(release.projectId);
          launchMoments.push({ date: actualDate, productName: project?.productName || release.projectId });
        }
        const status = release.status || project?.status || "announced";
        if (actualDate || !activeFutureStatuses.has(status)) continue;
        const plannedTiming = String(release.plannedLaunchDate || "").trim();
        const bounds = dateBounds(plannedTiming);
        if (bounds && bounds.end < today) continue;
        const previous = upcomingProjects.get(release.projectId);
        const candidate = {
          productName: project?.productName || release.projectId,
          timing: plannedTiming || "时间待定",
          sortKey: bounds?.start || "9999-12-31",
        };
        if (!previous || candidate.sortKey < previous.sortKey) upcomingProjects.set(release.projectId, candidate);
      }
      launchMoments.sort((a, b) => b.date.localeCompare(a.date));
      const nextProjects = [...upcomingProjects.values()].sort((a, b) => a.sortKey.localeCompare(b.sortKey));
      const lastLaunch = launchMoments[0] || null;
      const gap = gapFromDate(lastLaunch?.date);
      return {
        ...group,
        totalCount: group.projects.size,
        periodCount: group.periodProjects.size,
        launchedCount: launchedProjects.size,
        upcomingCount: upcomingProjects.size,
        lastLaunch,
        gap,
        nextProject: nextProjects[0] || null,
        inactive: Boolean(lastLaunch) && gap.days >= 365 * 3 && upcomingProjects.size === 0,
      };
    }).sort((a, b) => b.periodCount - a.periodCount
      || b.totalCount - a.totalCount
      || b.upcomingCount - a.upcomingCount
      || a.ipName.localeCompare(b.ipName, "zh-CN"));

    if (state.selectedIp !== "all" && !activityRows.some((row) => row.ipName === state.selectedIp)) {
      state.selectedIp = "all";
      state.performanceProduct = "all";
    }

    elements.ipActivityCount.textContent = `${numberFormat.format(activityRows.length)} 个 IP`;
    elements.ipActivityEmpty.hidden = activityRows.length > 0;
    elements.ipActivityBody.innerHTML = activityRows.map((row) => {
      const selected = row.ipName === state.selectedIp;
      return `<tr${selected ? ' class="is-selected"' : ""}>
      <td><button type="button" class="ip-activity-select" data-ip-name="${escapeHtml(row.ipName)}" aria-pressed="${selected}">${escapeHtml(row.ipName)}</button>${row.inactive ? '<span class="ip-activity-flag">近 3 年无新作计划</span>' : ""}</td>
      <td><strong class="ip-activity-number">${escapeHtml(numberFormat.format(row.totalCount))}</strong></td>
      <td><strong class="ip-activity-number${row.periodCount ? " active" : ""}">${escapeHtml(numberFormat.format(row.periodCount))}</strong></td>
      <td>${escapeHtml(numberFormat.format(row.launchedCount))}</td>
      <td>${row.upcomingCount ? `<span class="status-chip active">${escapeHtml(numberFormat.format(row.upcomingCount))} 项</span>` : '<span class="table-secondary">暂无</span>'}</td>
      <td>${row.lastLaunch
        ? `<time class="project-date" datetime="${escapeHtml(row.lastLaunch.date)}">${escapeHtml(row.lastLaunch.date)}</time><span class="table-secondary">${escapeHtml(row.lastLaunch.productName)} · 距今 ${escapeHtml(row.gap.label)}</span>`
        : '<span class="table-secondary">尚无已核验上线日期</span>'}</td>
      <td>${row.nextProject
        ? `<span class="table-primary">${escapeHtml(row.nextProject.productName)}</span><span class="table-secondary">${escapeHtml(row.nextProject.timing)}</span>`
        : '<span class="table-secondary">暂无已公布项目</span>'}</td>
    </tr>`;
    }).join("");

    const hasSelectedIp = state.selectedIp !== "all";
    elements.ipDrilldownStatus.hidden = !hasSelectedIp;
    elements.ipDrilldownName.textContent = hasSelectedIp ? state.selectedIp : "";

    const top = activityRows[0];
    const upcomingIpCount = activityRows.filter((row) => row.upcomingCount > 0).length;
    const upcomingProjectCount = activityRows.reduce((total, row) => total + row.upcomingCount, 0);
    const longestInactive = activityRows.filter((row) => row.inactive).sort((a, b) => b.gap.days - a.gap.days)[0];
    elements.ipActivitySummary.innerHTML = activityRows.length ? `<div>
      <span>项目收录最多</span><strong>${escapeHtml(top.ipName)}</strong><small>${escapeHtml(numberFormat.format(top.totalCount))} 个项目</small>
    </div><div>
      <span>未来已有计划</span><strong>${escapeHtml(numberFormat.format(upcomingIpCount))} 个 IP</strong><small>${escapeHtml(numberFormat.format(upcomingProjectCount))} 个已公布项目</small>
    </div><div>
      <span>最长空窗且无新作</span><strong>${escapeHtml(longestInactive?.ipName || "暂无可判定 IP")}</strong><small>${longestInactive ? `距最近上线 ${escapeHtml(longestInactive.gap.label)}` : "需补充更多历史上线日期"}</small>
    </div>` : "";
    return activityRows;
  }

  function renderSchedule(rows) {
    const activeFutureStatuses = new Set(["announced", "testing", "preregister", "upcoming"]);
    const timingSortKey = (value) => {
      const exactDate = isoDate(value);
      if (exactDate) return exactDate;
      const textValue = String(value || "");
      const year = textValue.match(/20\d{2}/)?.[0];
      if (!year) return "9999-12-31";
      if (/上半年|春/.test(textValue)) return `${year}-04-01`;
      if (/下半年|秋|年末|冬/.test(textValue)) return `${year}-10-01`;
      return `${year}-07-01`;
    };
    const scheduleCandidates = rows
      .filter(({ project, release }) => release && (
        isoDate(release.actualLaunchDate)
        || String(release.plannedLaunchDate || "").trim()
        || activeFutureStatuses.has(release.status || project.status)
      ))
      .map(({ project, release }) => ({
        project,
        release,
        timing: isoDate(release.actualLaunchDate) || String(release.plannedLaunchDate || "").trim() || "时间待定",
        sortKey: timingSortKey(release.actualLaunchDate || release.plannedLaunchDate),
        actual: Boolean(String(release.actualLaunchDate || "").trim()),
        future: !isoDate(release.actualLaunchDate) && activeFutureStatuses.has(release.status || project.status),
      }));
    const groupedSchedule = new Map();
    for (const item of scheduleCandidates) {
      const key = `${item.project.id}:${item.timing}:${item.actual}`;
      if (!groupedSchedule.has(key)) groupedSchedule.set(key, { ...item, platforms: new Set(), regions: new Set() });
      groupedSchedule.get(key).platforms.add(platformNames[item.release.platform] || item.release.platform);
      const regionInfo = displayedRegion(item.release);
      groupedSchedule.get(key).regions.add(regionInfo.scopeLabel ? `${regionInfo.label}（${regionInfo.scopeLabel}）` : regionInfo.label);
    }
    const scheduleRows = [...groupedSchedule.values()]
      .sort((a, b) => Number(b.future) - Number(a.future) || a.sortKey.localeCompare(b.sortKey) || a.project.productName.localeCompare(b.project.productName, "zh-CN"))
      .slice(0, 16);
    elements.scheduleEmpty.hidden = scheduleRows.length > 0;
    elements.schedule.innerHTML = scheduleRows.map(({ project, platforms, regions, timing, actual }) => `<div class="schedule-row">
      ${isoDate(timing)
        ? `<time class="schedule-date" datetime="${escapeHtml(isoDate(timing))}">${escapeHtml(timing)}</time>`
        : `<span class="schedule-date">${escapeHtml(timing)}</span>`}
      <div class="schedule-content"><strong>${escapeHtml(project.productName)}</strong><span>${escapeHtml([...platforms].join(" / "))} · ${escapeHtml([...regions].join(" / "))} · ${actual ? "实际上线" : "计划上线"}</span></div>
    </div>`).join("");
  }

  function formatMetric(snapshot) {
    if (snapshot.display) return snapshot.display;
    const name = metricNames[snapshot.metricType] || snapshot.metricType || "平台指标";
    if (Number.isFinite(Number(snapshot.rank))) return `${name} 第 ${numberFormat.format(Number(snapshot.rank))} 名`;
    if (Number.isFinite(Number(snapshot.value))) {
      const suffix = snapshot.metricType === "review_score" ? "%" : "";
      return `${name} ${numberFormat.format(Number(snapshot.value))}${suffix}`;
    }
    return `${name} 数据待补`;
  }

  const performanceLevels = ["phenomenon", "strong", "good", "ordinary"];
  const performanceWeights = { phenomenon: 4, strong: 3, good: 2, ordinary: 1, insufficient: 0 };

  function dateInPerformancePeriod(value) {
    const date = isoDate(value);
    return Boolean(date)
      && (!state.performanceStartDate || date >= state.performanceStartDate)
      && (!state.performanceEndDate || date <= state.performanceEndDate);
  }

  function aggregateSnapshotMatches(snapshot, project) {
    const applicablePlatforms = Array.isArray(snapshot.platforms) ? snapshot.platforms : [];
    return dateInPerformancePeriod(snapshot.date)
      && (state.platform === "all" || applicablePlatforms.includes(state.platform))
      && (state.region === "all" || snapshot.region === state.region)
      && (state.status === "all" || (project.status || "announced") === state.status)
      && (state.ipType === "all" || project.ipType === state.ipType)
      && (state.product === "all" || project.id === state.product)
      && textMatches(project, null);
  }

  function performanceEntries() {
    return rankSnapshots.map((snapshot) => {
      if (snapshot.releaseId) {
        const release = releaseById.get(snapshot.releaseId);
        const project = projectById.get(release?.projectId);
        if (!release || !project || !dateInPerformancePeriod(snapshot.date) || !baseReleaseMatches(project, release)
          || (state.selectedIp !== "all" && canonicalIpName(project) !== state.selectedIp)) return null;
        return { snapshot, release, project, aggregate: false };
      }
      if (snapshot.projectId) {
        const project = projectById.get(snapshot.projectId);
        if (!project || !aggregateSnapshotMatches(snapshot, project)
          || (state.selectedIp !== "all" && canonicalIpName(project) !== state.selectedIp)) return null;
        return { snapshot, release: null, project, aggregate: true };
      }
      return null;
    }).filter(Boolean);
  }

  function renderSteamPeakChart(entries) {
    const peakByProject = new Map();
    for (const entry of entries) {
      const value = Number(entry.snapshot.value);
      if (entry.snapshot.metricType !== "concurrent_users" || !Number.isFinite(value) || value <= 0) continue;
      const previous = peakByProject.get(entry.project.id);
      if (!previous || value > Number(previous.snapshot.value)) peakByProject.set(entry.project.id, entry);
    }
    const peaks = [...peakByProject.values()]
      .sort((a, b) => Number(b.snapshot.value) - Number(a.snapshot.value))
      .slice(0, 8);
    elements.steamPeakEmpty.hidden = peaks.length > 0;
    elements.steamPeakChart.hidden = peaks.length === 0;
    if (!peaks.length) {
      elements.steamPeakChart.innerHTML = "";
      elements.steamPeakChart.setAttribute("aria-label", "当前筛选范围没有可比较的 Steam 历史同时在线峰值");
      return;
    }
    const maximum = Math.max(...peaks.map(({ snapshot }) => Number(snapshot.value)));
    const chartLabel = peaks.map(({ project, snapshot }) => `${project.productName} ${numberFormat.format(Number(snapshot.value))} 人`).join("；");
    elements.steamPeakChart.setAttribute("aria-label", `Steam 历史同时在线峰值排行榜：${chartLabel}`);
    elements.steamPeakChart.innerHTML = `${peaks.map(({ project, snapshot }) => {
      const value = Number(snapshot.value);
      const width = Math.max(8, Math.log10(value + 1) / Math.log10(maximum + 1) * 100);
      const level = performanceLevels.includes(snapshot.performanceLevel) ? snapshot.performanceLevel : "ordinary";
      return `<div class="steam-peak-row">
        <div class="steam-peak-label"><button type="button" class="performance-product-select" data-performance-project-id="${escapeHtml(project.id)}">${escapeHtml(project.productName)}</button><span>${escapeHtml(project.ipName)}</span></div>
        <div class="steam-peak-track" aria-hidden="true"><span class="steam-peak-fill level-${escapeHtml(level)}" style="width:${width.toFixed(2)}%"></span></div>
        <strong class="steam-peak-value">${escapeHtml(numberFormat.format(value))}</strong>
      </div>`;
    }).join("")}
      <div class="steam-peak-axis" aria-hidden="true"><span>1</span><span>条长为对数比例</span><span>${escapeHtml(numberFormat.format(maximum))}</span></div>`;
  }

  function renderPerformanceTierChart(entries) {
    const bestByProject = new Map();
    for (const entry of entries) {
      const level = entry.snapshot.performanceLevel || "insufficient";
      if (!performanceLevels.includes(level)) continue;
      const previous = bestByProject.get(entry.project.id);
      if (!previous || performanceWeights[level] > performanceWeights[previous.snapshot.performanceLevel || "insufficient"]) {
        bestByProject.set(entry.project.id, entry);
      }
    }
    const counts = Object.fromEntries(performanceLevels.map((level) => [level, 0]));
    for (const { snapshot } of bestByProject.values()) counts[snapshot.performanceLevel] += 1;
    const total = bestByProject.size;
    elements.performanceTierEmpty.hidden = total > 0;
    elements.performanceTierChart.hidden = total === 0;
    if (!total) {
      elements.performanceTierChart.innerHTML = "";
      elements.performanceTierChart.setAttribute("aria-label", "当前筛选范围没有已分级的产品");
      return;
    }
    elements.performanceTierChart.setAttribute("aria-label", `产品表现等级分布，共 ${total} 项：${performanceLevels.map((level) => `${levelNames[level]} ${counts[level]} 项`).join("；")}`);
    elements.performanceTierChart.innerHTML = `<div class="performance-tier-stack" aria-hidden="true">
      ${performanceLevels.filter((level) => counts[level] > 0).map((level) => `<span class="tier-segment level-${escapeHtml(level)}" style="flex-grow:${counts[level]}"></span>`).join("")}
    </div>
    <div class="performance-tier-total"><strong>${escapeHtml(numberFormat.format(total))}</strong><span>个有公开表现的产品</span></div>
    <div class="performance-tier-legend">
      ${performanceLevels.map((level) => `<div><span class="tier-dot level-${escapeHtml(level)}" aria-hidden="true"></span><span>${escapeHtml(levelNames[level])}</span><strong>${escapeHtml(numberFormat.format(counts[level]))}</strong></div>`).join("")}
    </div>`;
  }

  function renderMobileMarketChart(entries) {
    const mobileMetrics = new Set(["estimated_downloads", "estimated_revenue"]);
    const latestByProjectMetric = new Map();
    for (const entry of entries) {
      if (!entry.aggregate || !mobileMetrics.has(entry.snapshot.metricType)) continue;
      const key = `${entry.project.id}:${entry.snapshot.metricType}`;
      const previous = latestByProjectMetric.get(key);
      if (!previous || String(entry.snapshot.date).localeCompare(String(previous.snapshot.date)) > 0) {
        latestByProjectMetric.set(key, entry);
      }
    }
    const grouped = new Map();
    for (const entry of latestByProjectMetric.values()) {
      if (!grouped.has(entry.project.id)) grouped.set(entry.project.id, { project: entry.project, metrics: {} });
      grouped.get(entry.project.id).metrics[entry.snapshot.metricType] = entry.snapshot;
    }
    const products = [...grouped.values()].sort((a, b) => {
      const aBest = Math.max(...Object.values(a.metrics).map((snapshot) => performanceWeights[snapshot.performanceLevel] || 0));
      const bBest = Math.max(...Object.values(b.metrics).map((snapshot) => performanceWeights[snapshot.performanceLevel] || 0));
      return bBest - aBest || a.project.productName.localeCompare(b.project.productName, "zh-CN");
    });
    elements.mobileMarketEmpty.hidden = products.length > 0;
    elements.mobileMarketChart.hidden = products.length === 0;
    if (!products.length) {
      elements.mobileMarketChart.innerHTML = "";
      elements.mobileMarketChart.setAttribute("aria-label", "当前筛选范围没有可比较的手游市场估算");
      return;
    }
    const labels = { estimated_downloads: "下载量", estimated_revenue: "收入" };
    elements.mobileMarketChart.setAttribute("aria-label", `手游生命周期市场估算：${products.map(({ project, metrics }) => `${project.productName}，${Object.values(metrics).map(formatMetric).join("，")}`).join("；")}`);
    elements.mobileMarketChart.innerHTML = products.map(({ project, metrics }) => `<article class="mobile-market-product">
      <div class="mobile-market-product-title"><button type="button" class="performance-product-select" data-performance-project-id="${escapeHtml(project.id)}">${escapeHtml(project.productName)}</button><span>${escapeHtml(project.ipName)}</span></div>
      <div class="mobile-market-metrics">
        ${["estimated_downloads", "estimated_revenue"].map((metricType) => {
          const snapshot = metrics[metricType];
          if (!snapshot) return `<div class="mobile-market-metric muted"><span>${escapeHtml(labels[metricType])}</span><div class="mobile-market-track" aria-hidden="true"></div><strong>待补</strong></div>`;
          const level = performanceLevels.includes(snapshot.performanceLevel) ? snapshot.performanceLevel : "ordinary";
          const width = (performanceWeights[level] / 4) * 100;
          return `<div class="mobile-market-metric"><span>${escapeHtml(labels[metricType])}</span><div class="mobile-market-track" aria-hidden="true"><i class="level-${escapeHtml(level)}" style="width:${width}%"></i></div><strong>${escapeHtml(formatMetric(snapshot).replace(/^AppMagic\s*/, ""))}</strong></div>`;
        }).join("")}
      </div>
    </article>`).join("");
  }

  function performancePlatformLabel(snapshot, release) {
    if (release) return `${platformNames[release.platform] || release.platform} · ${regionNames[release.region] || release.region}`;
    const platforms = (snapshot.platforms || []).map((platform) => platformNames[platform] || platform).join(" + ") || "跨平台";
    const region = snapshot.region === "GLOBAL" ? "全球汇总估算" : regionNames[snapshot.region] || snapshot.region || "汇总范围";
    return `${platforms} · ${region}`;
  }

  const compactNumberFormat = new Intl.NumberFormat("zh-CN", { notation: "compact", maximumFractionDigits: 1 });
  const salesMetrics = ["unit_sales", "estimated_sales", "physical_sales"];
  const productPlatformGroups = [
    {
      id: "steam", title: "Steam", note: "销量与玩家活跃度分别观察，不与其他平台换算", platforms: ["steam"],
      charts: [
        { id: "steam-sales", title: "销量走势", note: "官方公开值与第三方累计销量估算分别成线", metrics: salesMetrics, unit: "份" },
        { id: "steam-activity", title: "玩家活跃走势", note: "DAU、活跃用户与月均同时在线分别成线", metrics: ["daily_active_users", "active_users", "average_concurrent_users"], unit: "人" },
        { id: "steam-peak", title: "历史在线峰值", note: "全历史最高同时在线，仅作规模参照", metrics: ["concurrent_users"], unit: "人", optional: true },
      ],
    },
    {
      id: "console", title: "主机平台", note: "Nintendo Switch、PlayStation 与 Xbox 分平台、分地区呈现", platforms: ["switch", "playstation", "xbox"],
      charts: [
        { id: "console-sales", title: "销量走势", note: "官方公开值、实体销量与第三方累计估算分别成线", metrics: salesMetrics, unit: "份" },
        { id: "console-reviews", title: "用户评分走势", note: "官方商店玩家星级；PlayStation 为全球口径，Xbox 按商店地区", metrics: ["user_rating_5"], unit: "/5", fixedMax: 5 },
        { id: "console-review-count", title: "评分人数走势", note: "与玩家星级分开呈现，用于判断样本规模", metrics: ["review_count"], unit: "人", optional: true },
      ],
    },
    {
      id: "mobile", title: "手游双商店", note: "App Store 与 Google Play 的榜单名次分别成线，越接近第 1 名越好", platforms: ["ios", "android"],
      charts: [
        { id: "mobile-download-rank", title: "下载榜排名", note: "iOS 免费游戏榜 / Google Play 下载榜", metrics: ["free_rank", "download_rank"], unit: "名", rank: true },
        { id: "mobile-grossing-rank", title: "畅销榜排名", note: "iOS / Google Play 游戏畅销榜", metrics: ["grossing_rank"], unit: "名", rank: true },
        { id: "mobile-downloads", title: "生命周期下载规模", note: "第三方市场估算，仅作补充", metrics: ["estimated_downloads"], unit: "次", optional: true },
        { id: "mobile-revenue", title: "生命周期收入规模", note: "第三方市场估算，仅作补充", metrics: ["estimated_revenue"], unit: "美元", currency: true, optional: true },
      ],
    },
    {
      id: "pc", title: "Windows PC", note: "非 Steam PC 渠道按可获得的销量与活跃数据呈现", platforms: ["windows"],
      charts: [
        { id: "pc-sales", title: "销量走势", note: "公开销量或可信区间估算", metrics: salesMetrics, unit: "份" },
        { id: "pc-activity", title: "活跃用户走势", note: "日活与活跃用户分别成线", metrics: ["daily_active_users", "active_users", "concurrent_users"], unit: "人" },
      ],
    },
    {
      id: "web", title: "网页与小游戏", note: "网页、微信小游戏与抖音小游戏按各平台原生指标呈现", platforms: ["web", "wechat_minigame", "douyin_minigame"],
      charts: [
        { id: "web-popularity", title: "下载 / 人气榜排名", note: "平台榜单名次，越接近第 1 名越好", metrics: ["free_rank", "download_rank"], unit: "名", rank: true },
        { id: "web-grossing", title: "畅销榜排名", note: "平台畅销或销售榜名次", metrics: ["grossing_rank", "top_seller_rank"], unit: "名", rank: true },
      ],
    },
  ];

  function snapshotPlatforms(entry) {
    if (entry.release?.platform) return [entry.release.platform];
    if (Array.isArray(entry.snapshot.platforms)) return entry.snapshot.platforms;
    return entry.snapshot.platform ? [entry.snapshot.platform] : [];
  }

  function numericSnapshotValue(snapshot) {
    if (Number.isFinite(Number(snapshot.rank))) return Number(snapshot.rank);
    return Number.isFinite(Number(snapshot.value)) ? Number(snapshot.value) : null;
  }

  function chartValueLabel(value, chart) {
    if (chart.rank) return `第 ${numberFormat.format(value)} 名`;
    if (chart.percent) return `${numberFormat.format(value)}%`;
    if (chart.currency) return `US$${compactNumberFormat.format(value)}`;
    return `${compactNumberFormat.format(value)}${chart.unit || ""}`;
  }

  function niceChartMaximum(value) {
    if (!Number.isFinite(value) || value <= 0) return 1;
    const power = 10 ** Math.floor(Math.log10(value));
    const normalized = value / power;
    const multiplier = [1, 2, 5, 10].find((step) => normalized <= step) || 10;
    return multiplier * power;
  }

  function timelineEntriesForChart(entries, group, chart) {
    const platformSet = new Set(group.platforms);
    return entries.map((entry) => {
      const date = isoDate(entry.snapshot.date);
      const value = numericSnapshotValue(entry.snapshot);
      const platforms = snapshotPlatforms(entry);
      if (!date || value === null || !chart.metrics.includes(entry.snapshot.metricType)
        || !platforms.some((platform) => platformSet.has(platform))) return null;
      const platformLabel = platforms.map((platform) => platformNames[platform] || platform).join(" + ") || "跨平台";
      const regionCode = entry.release?.region || entry.snapshot.region;
      const regionLabel = regionCode === "GLOBAL" ? "全球汇总" : regionNames[regionCode] || regionCode || "范围待确认";
      return {
        ...entry, date, value,
        seriesKey: `${platforms.join("+")}:${regionCode || "scope"}:${entry.snapshot.metricType}`,
        seriesLabel: `${platformLabel} · ${regionLabel} · ${metricNames[entry.snapshot.metricType] || entry.snapshot.metricType}`,
      };
    }).filter(Boolean);
  }

  function renderMetricTimelineChart(entries, group, chart) {
    const chartEntries = timelineEntriesForChart(entries, group, chart);
    const heading = `<div class="product-metric-heading"><div><strong>${escapeHtml(chart.title)}</strong><span>${escapeHtml(chart.note)}</span></div><span>${escapeHtml(numberFormat.format(chartEntries.length))} 个数据点</span></div>`;
    if (!chartEntries.length) {
      const platformSet = new Set(group.platforms);
      const unrankedEntries = entries
        .filter((entry) => String(entry.snapshot.rankStatus || "").startsWith("not_in_top_")
          && chart.metrics.includes(entry.snapshot.metricType)
          && snapshotPlatforms(entry).some((platform) => platformSet.has(platform)));
      const latestUnrankedBySeries = new Map();
      for (const entry of unrankedEntries) {
        const key = `${snapshotPlatforms(entry).join("+")}:${entry.release?.region || entry.snapshot.region || "scope"}:${entry.snapshot.metricType}`;
        const previous = latestUnrankedBySeries.get(key);
        if (!previous || String(entry.snapshot.date).localeCompare(String(previous.snapshot.date)) > 0) {
          latestUnrankedBySeries.set(key, entry);
        }
      }
      const latestUnranked = [...latestUnrankedBySeries.values()]
        .sort((a, b) => snapshotPlatforms(a).join("+").localeCompare(snapshotPlatforms(b).join("+")));
      const emptyMessage = latestUnranked.length
        ? `最新公开榜单快照：${latestUnranked.map((entry) => `${isoDate(entry.snapshot.date)} ${formatMetric(entry.snapshot)}`).join("；")}。`
        : "该指标的历史时间序列待补；不会使用其他平台数据代替。";
      return `<article class="product-metric-card is-empty">${heading}<div class="product-chart-empty">${escapeHtml(emptyMessage)}</div></article>`;
    }

    const seriesMap = new Map();
    for (const entry of chartEntries) {
      if (!seriesMap.has(entry.seriesKey)) seriesMap.set(entry.seriesKey, { label: entry.seriesLabel, points: [] });
      seriesMap.get(entry.seriesKey).points.push(entry);
    }
    const series = [...seriesMap.values()].map((item) => ({
      ...item,
      points: item.points.sort((a, b) => a.date.localeCompare(b.date)),
    }));
    const allDates = [...new Set(chartEntries.map((entry) => entry.date))].sort();
    const allTimes = allDates.map((date) => new Date(`${date}T00:00:00Z`).getTime());
    const minTime = Math.min(...allTimes);
    const maxTime = Math.max(...allTimes);
    const values = chartEntries.map((entry) => entry.value);
    const plot = { width: 640, height: 220, left: 66, right: 16, top: 18, bottom: 46 };
    const plotWidth = plot.width - plot.left - plot.right;
    const plotHeight = plot.height - plot.top - plot.bottom;
    const yMinimum = chart.rank ? 1 : 0;
    const yMaximum = chart.fixedMax || (chart.percent ? 100 : chart.rank
      ? Math.max(10, niceChartMaximum(Math.max(...values)))
      : niceChartMaximum(Math.max(...values)));
    const xPosition = (date) => {
      if (minTime === maxTime) return plot.left + plotWidth / 2;
      const time = new Date(`${date}T00:00:00Z`).getTime();
      return plot.left + ((time - minTime) / (maxTime - minTime)) * plotWidth;
    };
    const yPosition = (value) => {
      const ratio = (value - yMinimum) / Math.max(1, yMaximum - yMinimum);
      return chart.rank ? plot.top + ratio * plotHeight : plot.top + (1 - ratio) * plotHeight;
    };
    const yTicks = [...new Set([yMinimum, chart.rank ? Math.round((yMinimum + yMaximum) / 2) : yMaximum / 2, yMaximum])];
    const xTicks = allDates.length <= 3
      ? allDates
      : [allDates[0], allDates[Math.floor((allDates.length - 1) / 2)], allDates.at(-1)];
    const grid = yTicks.map((tick) => {
      const y = yPosition(tick);
      return `<line x1="${plot.left}" y1="${y.toFixed(2)}" x2="${plot.width - plot.right}" y2="${y.toFixed(2)}" class="product-chart-gridline"></line><text x="${plot.left - 9}" y="${(y + 4).toFixed(2)}" text-anchor="end" class="product-chart-axis-label">${escapeHtml(chart.rank ? `#${numberFormat.format(tick)}` : chartValueLabel(tick, chart))}</text>`;
    }).join("");
    const dateLabels = xTicks.map((date, index) => {
      const anchor = index === 0 && xTicks.length > 1 ? "start" : index === xTicks.length - 1 && xTicks.length > 1 ? "end" : "middle";
      return `<text x="${xPosition(date).toFixed(2)}" y="${plot.height - 16}" text-anchor="${anchor}" class="product-chart-axis-label">${escapeHtml(date)}</text>`;
    }).join("");
    const paths = series.map((item, index) => {
      const path = item.points.map((point, pointIndex) => `${pointIndex ? "L" : "M"} ${xPosition(point.date).toFixed(2)} ${yPosition(point.value).toFixed(2)}`).join(" ");
      const line = item.points.length > 1 ? `<path d="${path}" class="product-series-line series-tone-${index % 5}"></path>` : "";
      const points = item.points.map((point) => `<circle cx="${xPosition(point.date).toFixed(2)}" cy="${yPosition(point.value).toFixed(2)}" r="5" class="product-series-point series-tone-${index % 5}"><title>${escapeHtml(`${item.label} · ${point.date} · ${chartValueLabel(point.value, chart)}`)}</title></circle>`).join("");
      return `${line}${points}`;
    }).join("");
    const accessibleSummary = series.map((item) => `${item.label}：${item.points.map((point) => `${point.date} ${chartValueLabel(point.value, chart)}`).join("、")}`).join("；");
    const legend = series.map((item, index) => {
      const latest = item.points.at(-1);
      return `<div class="product-series-legend-row"><span class="product-series-swatch series-tone-${index % 5}" aria-hidden="true"></span><span>${escapeHtml(item.label)}</span><strong>${escapeHtml(chartValueLabel(latest.value, chart))}</strong><time>${escapeHtml(latest.date)}</time></div>`;
    }).join("");
    return `<article class="product-metric-card">${heading}<svg class="product-time-chart" viewBox="0 0 ${plot.width} ${plot.height}" role="img" aria-label="${escapeHtml(`${chart.title}：${accessibleSummary}`)}"><title>${escapeHtml(`${chart.title}，${accessibleSummary}`)}</title>${grid}<line x1="${plot.left}" y1="${plot.top + plotHeight}" x2="${plot.width - plot.right}" y2="${plot.top + plotHeight}" class="product-chart-axis"></line>${paths}${dateLabels}</svg><div class="product-series-legend">${legend}</div></article>`;
  }

  function renderProductPlatformTimelines(projectId, entries) {
    const project = projectById.get(projectId);
    if (!project) {
      elements.productPlatformTimelines.innerHTML = '<div class="product-platform-empty">未找到该产品的项目记录。</div>';
      return;
    }
    const matchingReleases = releases.filter((release) => release.projectId === projectId
      && releaseRegionMatch(release)
      && baseReleaseMatches(project, release, { ignoreRegion: true }));
    const relevantPlatforms = new Set(matchingReleases.map((release) => release.platform));
    for (const entry of entries) for (const platform of snapshotPlatforms(entry)) relevantPlatforms.add(platform);
    const groups = productPlatformGroups.filter((group) => group.platforms.some((platform) => relevantPlatforms.has(platform)));
    const platformLabels = [...relevantPlatforms].map((platform) => platformNames[platform] || platform);
    elements.productPerformanceName.textContent = project.productName;
    elements.productPerformanceScope.textContent = `${project.ipName} · ${platformLabels.join(" / ") || "平台待确认"} · ${state.performanceStartDate || "最早"} 至 ${state.performanceEndDate || "最新"}`;
    if (!groups.length) {
      elements.productPlatformTimelines.innerHTML = '<div class="product-platform-empty">当前筛选范围尚未确认该产品的平台版本。</div>';
      return;
    }
    elements.productPlatformTimelines.innerHTML = groups.map((group) => {
      const groupEntries = entries.filter((entry) => snapshotPlatforms(entry).some((platform) => group.platforms.includes(platform)));
      const charts = group.charts.filter((chart) => !chart.optional || timelineEntriesForChart(groupEntries, group, chart).length > 0);
      const groupPlatformLabels = group.platforms.filter((platform) => relevantPlatforms.has(platform)).map((platform) => platformNames[platform] || platform);
      return `<section class="product-platform-section" aria-labelledby="product-platform-${escapeHtml(group.id)}"><div class="product-platform-heading"><div><span>${escapeHtml(groupPlatformLabels.join(" / ") || group.title)}</span><h3 id="product-platform-${escapeHtml(group.id)}">${escapeHtml(group.title)}</h3><p>${escapeHtml(group.note)}</p></div><strong>${escapeHtml(numberFormat.format(groupEntries.length))} 条已核验记录</strong></div><div class="product-metric-grid">${charts.map((chart) => renderMetricTimelineChart(groupEntries, group, chart)).join("")}</div></section>`;
    }).join("");
  }

  function renderPerformance() {
    const allEntries = performanceEntries();
    const candidateRows = collectFilteredRows(true).filter(({ project }) => state.selectedIp === "all" || canonicalIpName(project) === state.selectedIp);
    const visibleProjectIds = [...new Set(candidateRows.map(({ project }) => project.id))];
    elements.performanceProduct.options[0].textContent = state.selectedIp === "all" ? "筛选期全部产品" : "当前 IP 全部产品";
    appendOptions(elements.performanceProduct, visibleProjectIds
      .sort((a, b) => (projectById.get(a)?.productName || a).localeCompare(projectById.get(b)?.productName || b, "zh-CN"))
      .map((id) => [id, projectById.get(id)?.productName || id]));
    if (![...elements.performanceProduct.options].some((option) => option.value === state.performanceProduct)) {
      state.performanceProduct = "all";
    }
    elements.performanceProduct.value = state.performanceProduct;
    const selectedProjectId = state.performanceProduct !== "all"
      ? state.performanceProduct
      : state.product !== "all" ? state.product : "all";
    const snapshots = allEntries
      .filter(({ project }) => selectedProjectId === "all" || project.id === selectedProjectId)
      .sort((a, b) => String(b.snapshot.date).localeCompare(String(a.snapshot.date)));
    const productSelected = selectedProjectId !== "all";
    elements.performanceOverviewView.hidden = productSelected;
    elements.productPerformanceView.hidden = !productSelected;
    elements.performanceSectionNote.textContent = productSelected
      ? "按平台拆分该产品的重要指标；销量、活跃、口碑与商店榜单不跨平台混算。"
      : "保留平台原始指标，再转换为可比较的表现等级。";
    elements.performanceDetailNote.textContent = productSelected
      ? "展示所选产品在当前表现期间内最近核验的 6 条原始记录"
      : "展示当前筛选内最近核验的 6 条记录";
    elements.performanceMethod.innerHTML = productSelected
      ? "<strong>产品视图口径：</strong>每张图只比较同平台、同单位指标；Steam 重点观察销量与活跃，主机重点观察销量与用户口碑，手游分别观察 App Store 与 Google Play 的下载榜和畅销榜。榜单纵轴越接近第 1 名越好；累计值只按核验日期显示，不视为当日新增。"
      : "<strong>分级口径：</strong>Steam 历史同时在线峰值 ≥100,000 为“现象级”，≥20,000 为“强势”，≥5,000 为“表现良好”；手游收入依次采用 ≥US$50M、≥US$20M、≥US$5M，手游下载量依次采用 ≥10M、≥5M、≥1M。AppMagic 免费公开区间仅表示下限，页面保留“&gt;”；不同平台指标不直接混算。";
    if (productSelected) {
      renderProductPlatformTimelines(selectedProjectId, snapshots);
    } else {
      renderSteamPeakChart(snapshots);
      renderPerformanceTierChart(snapshots);
      renderMobileMarketChart(snapshots);
    }
    elements.performanceEmpty.hidden = snapshots.length > 0;
    elements.performanceList.innerHTML = snapshots.slice(0, 6).map(({ snapshot, release, project }) => {
      const level = snapshot.performanceLevel || "insufficient";
      return `<div class="performance-row">
        <div class="performance-product"><button type="button" class="performance-product-select" data-performance-project-id="${escapeHtml(project.id)}">${escapeHtml(project.productName)}</button><span>${escapeHtml(performancePlatformLabel(snapshot, release))}</span></div>
        <div class="performance-metric"><strong>${escapeHtml(formatMetric(snapshot))}</strong><span>${escapeHtml(snapshot.scope || "平台公开榜单")} · ${escapeHtml(isoDate(snapshot.date) || "日期待补")}</span></div>
        <span class="status-chip ${level === "phenomenon" || level === "strong" ? "active" : level === "insufficient" ? "pending" : "ended"} performance-level">${escapeHtml(levelNames[level] || level)}</span>
      </div>`;
    }).join("");
  }

  function latestPerformanceForRelease(release) {
    const byDateAndLevel = (a, b) => String(b.date).localeCompare(String(a.date))
      || (performanceWeights[b.performanceLevel] || 0) - (performanceWeights[a.performanceLevel] || 0);
    const exact = rankSnapshots
      .filter((snapshot) => snapshot.releaseId === release.id)
      .sort(byDateAndLevel)[0];
    if (exact) return exact;
    if (release.region !== "GLOBAL" || !["ios", "android"].includes(release.platform)) return null;
    return rankSnapshots
      .filter((snapshot) => snapshot.projectId === release.projectId
        && snapshot.region === "GLOBAL"
        && Array.isArray(snapshot.platforms)
        && snapshot.platforms.includes(release.platform))
      .sort(byDateAndLevel)[0] || null;
  }

  function renderTable(rows) {
    const sortedRows = rows.slice().sort((a, b) => {
      const aDate = isoDate(a.release?.actualLaunchDate) || isoDate(a.release?.plannedLaunchDate) || isoDate(a.project.announcementDate);
      const bDate = isoDate(b.release?.actualLaunchDate) || isoDate(b.release?.plannedLaunchDate) || isoDate(b.project.announcementDate);
      return bDate.localeCompare(aDate);
    });
    elements.tableCount.textContent = `${numberFormat.format(sortedRows.length)} 条`;
    elements.tableEmpty.hidden = sortedRows.length > 0;
    elements.tableBody.innerHTML = sortedRows.map(({ project, release, regionMatch }) => {
      const status = release?.status || project.status || "announced";
      const scopedOnly = state.region !== "all" && regionMatch?.quality === "announcement_scope";
      const performance = release && !scopedOnly ? latestPerformanceForRelease(release) : null;
      const regionInfo = displayedRegion(release, regionMatch);
      return `<tr>
        <td><span class="table-primary">${escapeHtml(project.productName)}</span><span class="table-secondary">${escapeHtml(project.ipName)} · ${escapeHtml(project.ipType || "类型待补")}</span></td>
        <td><span class="table-primary">${escapeHtml(project.developer || "开发商待补")}</span><span class="table-secondary">发行：${escapeHtml(project.publisher || "待补")}</span></td>
        <td><div class="project-platforms"><span class="project-chip platform">${escapeHtml(release ? platformNames[release.platform] || release.platform : "平台待公布")}</span><span class="project-chip region">${escapeHtml(regionInfo.label)}</span>${regionInfo.scopeLabel ? `<span class="project-chip pending">${escapeHtml(regionInfo.scopeLabel)}</span>` : ""}</div><span class="table-secondary">${escapeHtml(release?.store || "渠道待确认")}</span></td>
        <td>${displayDate(project.announcementDate)}</td>
        <td>${displayDate(release?.plannedLaunchDate, ["announced", "testing", "preregister", "upcoming"].includes(status) ? "时间待定" : "待确认")}</td>
        <td>${displayDate(release?.actualLaunchDate, "尚未上线")}</td>
        <td><span class="status-chip ${statusClass(status)}">${escapeHtml(statusNames[status] || status)}</span></td>
        <td>${performance ? `<span class="table-primary">${escapeHtml(formatMetric(performance))}</span><span class="table-secondary">${escapeHtml(levelNames[performance.performanceLevel] || "表现等级待评估")}</span>` : '<span class="project-chip pending">榜单待补</span>'}</td>
      </tr>`;
    }).join("");
  }

  function renderKpis(rows) {
    const uniqueProjects = new Map(rows.map(({ project }) => [project.id, project]));
    const launched = [...uniqueProjects.values()].filter((project) => {
      const projectReleases = rows.filter((row) => row.project.id === project.id).map((row) => row.release).filter(Boolean);
      return project.status === "launched" || projectReleases.some((release) => isoDate(release.actualLaunchDate) && isoDate(release.actualLaunchDate) <= today);
    }).length;
    const activeFutureStatuses = new Set(["announced", "testing", "preregister", "upcoming"]);
    const upcomingProjects = new Map();
    for (const { project, release } of rows) {
      if (!release) continue;
      const plannedDate = isoDate(release.plannedLaunchDate);
      const effectiveStatus = release.status || project.status || "announced";
      if (isoDate(release.actualLaunchDate) || !activeFutureStatuses.has(effectiveStatus)) continue;
      const previous = upcomingProjects.get(project.id);
      const candidate = { project, release, plannedDate, plannedTiming: String(release.plannedLaunchDate || "").trim() };
      if (!previous
        || (plannedDate && !previous.plannedDate)
        || (plannedDate && previous.plannedDate && plannedDate < previous.plannedDate)
        || (!plannedDate && candidate.plannedTiming && !previous.plannedDate && !previous.plannedTiming)) {
        upcomingProjects.set(project.id, candidate);
      }
    }
    const nextUpcoming = [...upcomingProjects.values()]
      .filter(({ plannedDate }) => plannedDate && plannedDate >= today)
      .sort((a, b) => a.plannedDate.localeCompare(b.plannedDate))[0];
    const undatedUpcoming = [...upcomingProjects.values()].filter(({ plannedTiming }) => !plannedTiming).length;
    elements.kpiProjects.textContent = numberFormat.format(uniqueProjects.size);
    elements.kpiLaunched.textContent = numberFormat.format(launched);
    elements.kpiUpcoming.textContent = numberFormat.format(upcomingProjects.size);
    elements.kpiUpcomingDetail.textContent = nextUpcoming
      ? `${nextUpcoming.project.productName} · ${nextUpcoming.plannedDate}${undatedUpcoming ? `；另有 ${undatedUpcoming} 项日期待定` : ""}`
      : `含年份窗口及日期待定的已公布项目${undatedUpcoming ? `（${undatedUpcoming} 项日期待定）` : ""}`;
    elements.kpiReleases.textContent = numberFormat.format(rows.filter(({ release }) => release).length);
  }

  function renderRegionAudit() {
    const checks = regionChecks.filter((check) => {
      const project = projectById.get(check.projectId);
      if (!project) return false;
      return (state.platform === "all" || check.platform === state.platform)
        && (state.region === "all" || check.region === state.region)
        && (state.product === "all" || check.projectId === state.product)
        && (state.ipType === "all" || project.ipType === state.ipType)
        && textMatches(project, null);
    });
    if (!checks.length) {
      elements.regionAudit.innerHTML = `<div class="region-audit-empty">当前筛选范围尚无结构化地区商店核验；不等同于确认未发行。</div>`;
      return;
    }
    const count = (...availability) => checks.filter((check) => availability.includes(check.availability)).length;
    const auditedRegions = new Set(checks.map((check) => check.region));
    const marketLabel = state.region === "all"
      ? `已核验 ${auditedRegions.size} 个地区`
      : regionNames[state.region] || state.region;
    const auditedPlatforms = [...new Set(checks.map((check) => platformNames[check.platform] || check.platform))].sort();
    const platformLabel = auditedPlatforms.join(" / ");
    const auditScopeLabel = state.region === "CN"
      ? "版号、国服 / 国行与大陆官方发行渠道"
      : state.region === "SEA"
        ? "东南亚目前以新加坡为代表样本"
        : state.region === "all"
          ? "含大陆版号 / 国行核验；东南亚以新加坡为代表样本"
          : "来自官方地区商店";
    elements.regionAudit.innerHTML = `<div class="region-audit-title"><span>地区商店核验进度</span><strong>${escapeHtml(marketLabel)} · ${escapeHtml(platformLabel)}</strong><small>${escapeHtml(auditScopeLabel)}</small></div>
      <div><span>检查记录</span><strong>${escapeHtml(numberFormat.format(checks.length))}</strong></div>
      <div><span>当前可用</span><strong>${escapeHtml(numberFormat.format(count("available")))}</strong></div>
      <div><span>历史已停售</span><strong>${escapeHtml(numberFormat.format(count("delisted_store_page")))}</strong></div>
      <div><span>当前未上架 / 未检索到</span><strong>${escapeHtml(numberFormat.format(count("not_available_currently", "not_listed_currently", "check_failed")))}</strong></div>`;
  }

  function render() {
    const rows = filteredRows();
    const lifecycleRows = collectFilteredRows(true);
    renderKpis(rows);
    renderRegionAudit();
    renderRecentProjects(rows);
    renderIpActivity(rows, lifecycleRows);
    const downstreamRows = state.selectedIp === "all"
      ? rows
      : rows.filter(({ project }) => canonicalIpName(project) === state.selectedIp);
    renderSchedule(downstreamRows);
    renderPerformance();
    renderTable(downstreamRows);
    elements.summary.textContent = rows.length
      ? `当前筛选显示 ${new Set(rows.map(({ project }) => project.id)).size} 个项目、${rows.filter(({ release }) => release).length} 个地区平台记录。${state.region === "all" ? "“全球/亚洲”仅表示公告范围。" : `其中 ${rows.filter(({ regionMatch }) => regionMatch?.quality === "verified").length} 条已逐区核验，${rows.filter(({ regionMatch }) => regionMatch?.quality === "announcement_scope").length} 条为公告覆盖待逐区确认。`}${state.product === "all" ? "" : " 已选择单一产品，项目时间范围不限制其完整生命周期。"}`
      : "当前筛选条件下没有可展示的项目；可调整产品、平台、地区或其他项目筛选条件。";
  }

  function updateStateAndRender() {
    state.projectStartDate = elements.projectStartDate.value;
    state.projectEndDate = elements.projectEndDate.value;
    if (state.projectStartDate && state.projectEndDate && state.projectStartDate > state.projectEndDate) {
      state.projectStartDate = state.projectEndDate;
      elements.projectStartDate.value = state.projectStartDate;
    }
    state.performanceStartDate = elements.performanceStartDate.value;
    state.performanceEndDate = elements.performanceEndDate.value;
    if (state.performanceStartDate && state.performanceEndDate && state.performanceStartDate > state.performanceEndDate) {
      state.performanceStartDate = state.performanceEndDate;
      elements.performanceStartDate.value = state.performanceStartDate;
    }
    state.platform = elements.platform.value;
    state.region = elements.region.value;
    state.status = elements.status.value;
    state.ipType = elements.ipType.value;
    state.product = elements.product.value;
    state.search = elements.search.value.trim();
    state.performanceProduct = elements.performanceProduct.value;
    elements.projectDateRangeLabel.textContent = state.product === "all"
      ? `${state.projectStartDate || "最早"} — ${state.projectEndDate || "最晚计划"}`
      : "已选产品 · 完整生命周期";
    elements.performanceDateRangeLabel.textContent = `${state.performanceStartDate || "最早"} — ${state.performanceEndDate || "最新"}`;
    render();
  }

  elements.generatedAt.textContent = formatGeneratedAt(meta.generatedAt);
  elements.latestProjectDate.textContent = meta.latestProjectDate || "等待首次导入";
  elements.footerSource.textContent = `持续补全历史与未来项目：当前收录 ${numberFormat.format(projects.length)} 个真实项目、${numberFormat.format(releases.length)} 个地区平台版本；地区采用七市场口径，公告覆盖、官方商店检查与逐区核验数据严格区分。`;
  populateFilters();
  syncControls();
  render();

  for (const element of [
    elements.projectStartDate, elements.projectEndDate,
    elements.performanceStartDate, elements.performanceEndDate,
    elements.platform, elements.region,
    elements.status, elements.ipType, elements.product, elements.performanceProduct,
  ]) element.addEventListener("change", updateStateAndRender);
  elements.search.addEventListener("input", updateStateAndRender);
  elements.ipActivityBody.addEventListener("click", (event) => {
    if (!(event.target instanceof Element)) return;
    const button = event.target.closest(".ip-activity-select");
    if (!button) return;
    const ipName = button.dataset.ipName;
    state.selectedIp = state.selectedIp === ipName ? "all" : ipName;
    state.performanceProduct = "all";
    render();
  });
  elements.clearIpDrilldown.addEventListener("click", () => {
    state.selectedIp = "all";
    state.performanceProduct = "all";
    render();
  });
  elements.performancePanel.addEventListener("click", (event) => {
    if (!(event.target instanceof Element)) return;
    const button = event.target.closest(".performance-product-select");
    if (!button) return;
    const projectId = button.dataset.performanceProjectId;
    if (!projectById.has(projectId)) return;
    state.performanceProduct = projectId;
    render();
  });
  elements.clearPerformanceProduct.addEventListener("click", () => {
    state.product = "all";
    state.performanceProduct = "all";
    syncControls();
    render();
  });
  elements.reset.addEventListener("click", () => {
    Object.assign(state, {
      projectStartDate: projectMinimumDate, projectEndDate: projectMaximumDate,
      performanceStartDate: defaultPerformanceStartDate, performanceEndDate: defaultPerformanceEndDate,
      platform: "all", region: "all",
      status: "all", ipType: "all", product: "all", search: "", performanceProduct: "all", selectedIp: "all",
    });
    syncControls();
    render();
  });
})();
