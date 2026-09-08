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
    concurrent_users: "同时在线", download_rank: "下载榜", physical_sales: "实体销量",
    review_count: "评价数", review_score: "好评率", revenue: "公开收入", store_award: "商店奖项",
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
    schedule: $("#release-schedule"),
    scheduleEmpty: $("#schedule-empty"),
    performanceProduct: $("#performance-product-filter"),
    steamPeakChart: $("#steam-peak-chart"),
    steamPeakEmpty: $("#steam-peak-empty"),
    performanceTierChart: $("#performance-tier-chart"),
    performanceTierEmpty: $("#performance-tier-empty"),
    mobileMarketChart: $("#mobile-market-chart"),
    mobileMarketEmpty: $("#mobile-market-empty"),
    performanceList: $("#performance-list"),
    performanceEmpty: $("#performance-empty"),
    tableBody: $("#project-table-body"),
    tableEmpty: $("#project-table-empty"),
    tableCount: $("#project-count"),
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
  const latestProjectDate = isoDate(meta.latestProjectDate) || generatedDate;
  const defaultPerformanceEndDate = latestProjectDate > performanceMaximumDate ? performanceMaximumDate : latestProjectDate;
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

    elements.ipActivityCount.textContent = `${numberFormat.format(activityRows.length)} 个 IP`;
    elements.ipActivityEmpty.hidden = activityRows.length > 0;
    elements.ipActivityBody.innerHTML = activityRows.map((row) => `<tr>
      <td><span class="table-primary">${escapeHtml(row.ipName)}</span>${row.inactive ? '<span class="ip-activity-flag">近 3 年无新作计划</span>' : ""}</td>
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
    </tr>`).join("");

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
        actual: Boolean(isoDate(release.actualLaunchDate)),
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
        if (!release || !project || !dateInPerformancePeriod(snapshot.date) || !baseReleaseMatches(project, release)) return null;
        return { snapshot, release, project, aggregate: false };
      }
      if (snapshot.projectId) {
        const project = projectById.get(snapshot.projectId);
        if (!project || !aggregateSnapshotMatches(snapshot, project)) return null;
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
        <div class="steam-peak-label"><strong>${escapeHtml(project.productName)}</strong><span>${escapeHtml(project.ipName)}</span></div>
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
      <div class="mobile-market-product-title"><strong>${escapeHtml(project.productName)}</strong><span>${escapeHtml(project.ipName)}</span></div>
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

  function renderPerformance() {
    const allEntries = performanceEntries();
    const visibleProjectIds = [...new Set(allEntries.map(({ project }) => project.id))];
    appendOptions(elements.performanceProduct, visibleProjectIds
      .sort((a, b) => (projectById.get(a)?.productName || a).localeCompare(projectById.get(b)?.productName || b, "zh-CN"))
      .map((id) => [id, projectById.get(id)?.productName || id]));
    if (![...elements.performanceProduct.options].some((option) => option.value === state.performanceProduct)) {
      state.performanceProduct = "all";
    }
    elements.performanceProduct.value = state.performanceProduct;
    const snapshots = allEntries
      .filter(({ project }) => state.performanceProduct === "all" || project.id === state.performanceProduct)
      .sort((a, b) => String(b.snapshot.date).localeCompare(String(a.snapshot.date)));
    renderSteamPeakChart(snapshots);
    renderPerformanceTierChart(snapshots);
    renderMobileMarketChart(snapshots);
    elements.performanceEmpty.hidden = snapshots.length > 0;
    elements.performanceList.innerHTML = snapshots.slice(0, 6).map(({ snapshot, release, project }) => {
      const level = snapshot.performanceLevel || "insufficient";
      return `<div class="performance-row">
        <div class="performance-product"><strong>${escapeHtml(project.productName)}</strong><span>${escapeHtml(performancePlatformLabel(snapshot, release))}</span></div>
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
    const count = (availability) => checks.filter((check) => check.availability === availability).length;
    const marketLabel = state.region === "all" ? "首批四地区" : regionNames[state.region] || state.region;
    elements.regionAudit.innerHTML = `<div class="region-audit-title"><span>地区商店核验进度</span><strong>${escapeHtml(marketLabel)} · Steam</strong><small>${state.region === "SEA" || state.region === "all" ? "东南亚本批次以新加坡为代表样本" : "来自官方地区商店"}</small></div>
      <div><span>检查记录</span><strong>${escapeHtml(numberFormat.format(checks.length))}</strong></div>
      <div><span>当前可用</span><strong>${escapeHtml(numberFormat.format(count("available")))}</strong></div>
      <div><span>历史已停售</span><strong>${escapeHtml(numberFormat.format(count("delisted_store_page")))}</strong></div>
      <div><span>当前不可用</span><strong>${escapeHtml(numberFormat.format(count("not_available_currently")))}</strong></div>`;
  }

  function render() {
    const rows = filteredRows();
    const lifecycleRows = collectFilteredRows(true);
    renderKpis(rows);
    renderRegionAudit();
    renderRecentProjects(rows);
    renderIpActivity(rows, lifecycleRows);
    renderSchedule(rows);
    renderPerformance();
    renderTable(rows);
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
  elements.reset.addEventListener("click", () => {
    Object.assign(state, {
      projectStartDate: projectMinimumDate, projectEndDate: projectMaximumDate,
      performanceStartDate: defaultPerformanceStartDate, performanceEndDate: defaultPerformanceEndDate,
      platform: "all", region: "all",
      status: "all", ipType: "all", product: "all", search: "", performanceProduct: "all",
    });
    syncControls();
    render();
  });
})();
