(() => {
  "use strict";

  const data = window.GAME_PROJECTS_DATA || {};
  const meta = data.meta || {};
  const projects = Array.isArray(data.projects) ? data.projects : [];
  const releases = Array.isArray(data.releases) ? data.releases : [];
  const rankSnapshots = Array.isArray(data.rankSnapshots) ? data.rankSnapshots : [];
  const projectById = new Map(projects.map((project) => [project.id, project]));

  const platformNames = {
    ios: "iOS", android: "Android", steam: "Steam", windows: "Windows PC",
    switch: "Nintendo Switch", playstation: "PlayStation", xbox: "Xbox",
    web: "网页游戏", wechat_minigame: "微信小游戏", douyin_minigame: "抖音小游戏",
  };
  const regionNames = {
    CN: "中国大陆", HK: "香港", TW: "台湾", JP: "日本", KR: "韩国",
    SEA: "东南亚", US: "美国", GLOBAL: "全球公告范围", ASIA: "亚洲公告范围",
  };
  const statusNames = {
    announced: "已公布", testing: "测试中", preregister: "预约中", upcoming: "即将上线",
    launched: "已上线", delayed: "延期", cancelled: "已取消", ended: "停止运营",
  };
  const metricNames = {
    free_rank: "免费游戏榜", grossing_rank: "畅销游戏榜", top_seller_rank: "畅销榜",
    concurrent_users: "同时在线", download_rank: "下载榜", physical_sales: "实体销量",
    review_count: "评价数", review_score: "好评率", revenue: "公开收入", store_award: "商店奖项",
  };
  const levelNames = {
    phenomenon: "现象级", strong: "强势", good: "表现良好",
    ordinary: "一般", insufficient: "数据不足",
  };

  const $ = (selector) => document.querySelector(selector);
  const elements = {
    generatedAt: $("#generated-at"),
    latestProjectDate: $("#latest-project-date"),
    startDate: $("#start-date-filter"),
    endDate: $("#end-date-filter"),
    dateRangeLabel: $("#date-range-label"),
    platform: $("#platform-filter"),
    region: $("#region-filter"),
    status: $("#status-filter"),
    ipType: $("#ip-type-filter"),
    product: $("#product-filter"),
    search: $("#search-filter"),
    reset: $("#reset-filters"),
    summary: $("#filter-summary"),
    kpiProjects: $("#kpi-projects"),
    kpiLaunched: $("#kpi-launched"),
    kpiUpcoming: $("#kpi-upcoming"),
    kpiReleases: $("#kpi-releases"),
    recentList: $("#recent-project-list"),
    recentEmpty: $("#recent-project-empty"),
    recentCount: $("#recent-project-count"),
    schedule: $("#release-schedule"),
    scheduleEmpty: $("#schedule-empty"),
    performanceProduct: $("#performance-product-filter"),
    steamPeakChart: $("#steam-peak-chart"),
    steamPeakEmpty: $("#steam-peak-empty"),
    performanceTierChart: $("#performance-tier-chart"),
    performanceTierEmpty: $("#performance-tier-empty"),
    performanceList: $("#performance-list"),
    performanceEmpty: $("#performance-empty"),
    tableBody: $("#project-table-body"),
    tableEmpty: $("#project-table-empty"),
    tableCount: $("#project-count"),
  };

  const isoDate = (value) => String(value || "").match(/\d{4}-\d{2}-\d{2}/)?.[0] || "";
  const generatedDate = isoDate(meta.generatedAt) || new Date().toISOString().slice(0, 10);
  const observedDates = [
    ...projects.flatMap((project) => [project.announcementDate, project.verifiedAt]),
    ...releases.flatMap((release) => [
      release.testStartDate, release.preregisterDate, release.plannedLaunchDate,
      release.actualLaunchDate, release.serviceEndDate, release.verifiedAt,
    ]),
    ...rankSnapshots.map((snapshot) => snapshot.date),
  ].map(isoDate).filter(Boolean).sort();
  const minimumDate = meta.coverageStart || observedDates[0] || "2018-01-01";
  const maximumDate = observedDates.at(-1) || generatedDate;
  const latestProjectDate = isoDate(meta.latestProjectDate) || generatedDate;
  const defaultEndDate = latestProjectDate > maximumDate ? maximumDate : latestProjectDate;
  const defaultStartObject = new Date(`${defaultEndDate}T00:00:00Z`);
  defaultStartObject.setUTCDate(defaultStartObject.getUTCDate() - Math.max(1, Number(meta.defaultWindowDays) || 90) + 1);
  const defaultStartDate = defaultStartObject.toISOString().slice(0, 10) < minimumDate
    ? minimumDate
    : defaultStartObject.toISOString().slice(0, 10);
  const today = generatedDate;
  const numberFormat = new Intl.NumberFormat("zh-CN");

  const state = {
    startDate: defaultStartDate,
    endDate: defaultEndDate,
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

  function allMilestones(project, projectReleases) {
    const milestones = [];
    const add = (dateValue, label, release) => {
      const date = isoDate(dateValue);
      if (date) milestones.push({ date, label, release });
    };
    add(project.announcementDate, "首次公布", null);
    for (const release of projectReleases) {
      add(release.testStartDate, "开始测试", release);
      add(release.preregisterDate, "开放预约", release);
      add(release.plannedLaunchDate, "计划上线", release);
      add(release.actualLaunchDate, "正式上线", release);
      add(release.serviceEndDate, "停止运营", release);
    }
    return milestones.sort((a, b) => a.date.localeCompare(b.date));
  }

  function milestoneInPeriod(project, projectReleases) {
    const milestones = allMilestones(project, projectReleases);
    if (!milestones.length) return true;
    return milestones.some(({ date }) => (!state.startDate || date >= state.startDate) && (!state.endDate || date <= state.endDate));
  }

  function textMatches(project, release) {
    if (!state.search) return true;
    const haystack = [
      project.productName, project.ipName, project.ipType, project.genre,
      project.developer, project.publisher, release?.store,
    ].join(" ").toLocaleLowerCase();
    return haystack.includes(state.search.toLocaleLowerCase());
  }

  function baseReleaseMatches(project, release) {
    const effectiveStatus = release?.status || project.status || "announced";
    return (state.platform === "all" || release?.platform === state.platform)
      && (state.region === "all" || release?.region === state.region)
      && (state.status === "all" || effectiveStatus === state.status)
      && (state.ipType === "all" || project.ipType === state.ipType)
      && (state.product === "all" || project.id === state.product)
      && textMatches(project, release);
  }

  function filteredRows() {
    const rows = [];
    for (const project of projects) {
      const projectReleases = releases.filter((release) => release.projectId === project.id);
      if (!projectReleases.length) {
        if (milestoneInPeriod(project, []) && baseReleaseMatches(project, null) && state.platform === "all" && state.region === "all") {
          rows.push({ project, release: null });
        }
        continue;
      }
      for (const release of projectReleases) {
        if (milestoneInPeriod(project, [release]) && baseReleaseMatches(project, release)) rows.push({ project, release });
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
    const regionCodes = [...new Set(releases.map((release) => release.region).filter(Boolean))].sort();
    const statuses = [...new Set([
      ...projects.map((project) => project.status),
      ...releases.map((release) => release.status),
    ].filter(Boolean))].sort();
    const ipTypes = [...new Set(projects.map((project) => project.ipType).filter(Boolean))].sort();
    appendOptions(elements.platform, platformCodes.map((code) => [code, platformNames[code] || code]));
    appendOptions(elements.region, regionCodes.map((code) => [code, regionNames[code] || code]));
    appendOptions(elements.status, statuses.map((status) => [status, statusNames[status] || status]));
    appendOptions(elements.ipType, ipTypes.map((type) => [type, type]));
    appendOptions(elements.product, projects
      .slice()
      .sort((a, b) => String(a.productName).localeCompare(String(b.productName), "zh-CN"))
      .map((project) => [project.id, project.productName]));
    elements.startDate.min = minimumDate;
    elements.startDate.max = maximumDate;
    elements.endDate.min = minimumDate;
    elements.endDate.max = maximumDate;
  }

  function syncControls() {
    elements.startDate.value = state.startDate;
    elements.endDate.value = state.endDate;
    elements.platform.value = state.platform;
    elements.region.value = state.region;
    elements.status.value = state.status;
    elements.ipType.value = state.ipType;
    elements.product.value = state.product;
    elements.search.value = state.search;
    elements.dateRangeLabel.textContent = `${state.startDate || "最早"} — ${state.endDate || "最新"}`;
  }

  function latestMilestone(project, projectReleases) {
    return allMilestones(project, projectReleases)
      .filter(({ date }) => (!state.startDate || date >= state.startDate) && (!state.endDate || date <= state.endDate))
      .at(-1) || null;
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
      const regionLabel = release ? regionNames[release.region] || release.region : "地区待公布";
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

  function renderSchedule(rows) {
    const scheduleRows = rows
      .filter(({ release }) => release && (isoDate(release.actualLaunchDate) || isoDate(release.plannedLaunchDate)))
      .map(({ project, release }) => ({
        project,
        release,
        date: isoDate(release.actualLaunchDate) || isoDate(release.plannedLaunchDate),
        actual: Boolean(isoDate(release.actualLaunchDate)),
      }))
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(0, 12);
    elements.scheduleEmpty.hidden = scheduleRows.length > 0;
    elements.schedule.innerHTML = scheduleRows.map(({ project, release, date, actual }) => `<div class="schedule-row">
      <time class="schedule-date" datetime="${escapeHtml(date)}">${escapeHtml(date)}</time>
      <div class="schedule-content"><strong>${escapeHtml(project.productName)}</strong><span>${escapeHtml(platformNames[release.platform] || release.platform)} · ${escapeHtml(regionNames[release.region] || release.region)} · ${actual ? "实际上线" : "计划上线"}</span></div>
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

  function renderPerformance(rows) {
    const visibleReleaseIds = new Set(rows.map(({ release }) => release?.id).filter(Boolean));
    const visibleProjectIds = [...new Set(rows.map(({ project }) => project.id))];
    appendOptions(elements.performanceProduct, visibleProjectIds.map((id) => [id, projectById.get(id)?.productName || id]));
    if (![...elements.performanceProduct.options].some((option) => option.value === state.performanceProduct)) {
      state.performanceProduct = "all";
    }
    elements.performanceProduct.value = state.performanceProduct;
    const snapshots = rankSnapshots
      .filter((snapshot) => visibleReleaseIds.has(snapshot.releaseId))
      .map((snapshot) => {
        const release = releases.find((item) => item.id === snapshot.releaseId);
        return { snapshot, release, project: projectById.get(release?.projectId) };
      })
      .filter(({ project }) => project && (state.performanceProduct === "all" || project.id === state.performanceProduct))
      .sort((a, b) => String(b.snapshot.date).localeCompare(String(a.snapshot.date)));
    renderSteamPeakChart(snapshots);
    renderPerformanceTierChart(snapshots);
    elements.performanceEmpty.hidden = snapshots.length > 0;
    elements.performanceList.innerHTML = snapshots.slice(0, 6).map(({ snapshot, release, project }) => {
      const level = snapshot.performanceLevel || "insufficient";
      return `<div class="performance-row">
        <div class="performance-product"><strong>${escapeHtml(project.productName)}</strong><span>${escapeHtml(platformNames[release.platform] || release.platform)} · ${escapeHtml(regionNames[release.region] || release.region)}</span></div>
        <div class="performance-metric"><strong>${escapeHtml(formatMetric(snapshot))}</strong><span>${escapeHtml(snapshot.scope || "平台公开榜单")} · ${escapeHtml(isoDate(snapshot.date) || "日期待补")}</span></div>
        <span class="status-chip ${level === "phenomenon" || level === "strong" ? "active" : level === "insufficient" ? "pending" : "ended"} performance-level">${escapeHtml(levelNames[level] || level)}</span>
      </div>`;
    }).join("");
  }

  function latestPerformanceForRelease(releaseId) {
    return rankSnapshots
      .filter((snapshot) => snapshot.releaseId === releaseId)
      .sort((a, b) => String(b.date).localeCompare(String(a.date)))[0] || null;
  }

  function renderTable(rows) {
    const sortedRows = rows.slice().sort((a, b) => {
      const aDate = isoDate(a.release?.actualLaunchDate) || isoDate(a.release?.plannedLaunchDate) || isoDate(a.project.announcementDate);
      const bDate = isoDate(b.release?.actualLaunchDate) || isoDate(b.release?.plannedLaunchDate) || isoDate(b.project.announcementDate);
      return bDate.localeCompare(aDate);
    });
    elements.tableCount.textContent = `${numberFormat.format(sortedRows.length)} 条`;
    elements.tableEmpty.hidden = sortedRows.length > 0;
    elements.tableBody.innerHTML = sortedRows.map(({ project, release }) => {
      const status = release?.status || project.status || "announced";
      const performance = release ? latestPerformanceForRelease(release.id) : null;
      return `<tr>
        <td><span class="table-primary">${escapeHtml(project.productName)}</span><span class="table-secondary">${escapeHtml(project.ipName)} · ${escapeHtml(project.ipType || "类型待补")}</span></td>
        <td><span class="table-primary">${escapeHtml(project.developer || "开发商待补")}</span><span class="table-secondary">发行：${escapeHtml(project.publisher || "待补")}</span></td>
        <td><div class="project-platforms"><span class="project-chip platform">${escapeHtml(release ? platformNames[release.platform] || release.platform : "平台待公布")}</span><span class="project-chip region">${escapeHtml(release ? regionNames[release.region] || release.region : "地区待公布")}</span></div><span class="table-secondary">${escapeHtml(release?.store || "渠道待确认")}</span></td>
        <td>${displayDate(project.announcementDate)}</td>
        <td>${displayDate(release?.plannedLaunchDate)}</td>
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
    const upcoming = rows.filter(({ release }) => release
      && !isoDate(release.actualLaunchDate)
      && isoDate(release.plannedLaunchDate)
      && isoDate(release.plannedLaunchDate) > today).length;
    elements.kpiProjects.textContent = numberFormat.format(uniqueProjects.size);
    elements.kpiLaunched.textContent = numberFormat.format(launched);
    elements.kpiUpcoming.textContent = numberFormat.format(upcoming);
    elements.kpiReleases.textContent = numberFormat.format(rows.filter(({ release }) => release).length);
  }

  function render() {
    const rows = filteredRows();
    renderKpis(rows);
    renderRecentProjects(rows);
    renderSchedule(rows);
    renderPerformance(rows);
    renderTable(rows);
    elements.summary.textContent = projects.length
      ? `当前筛选显示 ${new Set(rows.map(({ project }) => project.id)).size} 个项目、${rows.filter(({ release }) => release).length} 个地区平台版本。`
      : "当前筛选条件下没有可展示的项目；可调整项目动态期间或其他筛选条件。";
  }

  function updateStateAndRender() {
    state.startDate = elements.startDate.value;
    state.endDate = elements.endDate.value;
    if (state.startDate && state.endDate && state.startDate > state.endDate) {
      state.startDate = state.endDate;
      elements.startDate.value = state.startDate;
    }
    state.platform = elements.platform.value;
    state.region = elements.region.value;
    state.status = elements.status.value;
    state.ipType = elements.ipType.value;
    state.product = elements.product.value;
    state.search = elements.search.value.trim();
    state.performanceProduct = elements.performanceProduct.value;
    elements.dateRangeLabel.textContent = `${state.startDate || "最早"} — ${state.endDate || "最新"}`;
    render();
  }

  elements.generatedAt.textContent = formatGeneratedAt(meta.generatedAt);
  elements.latestProjectDate.textContent = meta.latestProjectDate || "等待首次导入";
  populateFilters();
  syncControls();
  render();

  for (const element of [
    elements.startDate, elements.endDate, elements.platform, elements.region,
    elements.status, elements.ipType, elements.product, elements.performanceProduct,
  ]) element.addEventListener("change", updateStateAndRender);
  elements.search.addEventListener("input", updateStateAndRender);
  elements.reset.addEventListener("click", () => {
    Object.assign(state, {
      startDate: defaultStartDate, endDate: defaultEndDate, platform: "all", region: "all",
      status: "all", ipType: "all", product: "all", search: "", performanceProduct: "all",
    });
    syncControls();
    render();
  });
})();
