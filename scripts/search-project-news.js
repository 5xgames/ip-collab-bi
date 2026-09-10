#!/usr/bin/env node

const args = process.argv.slice(2);
const compact = args.includes("--compact");
const titlesOnly = args.includes("--titles-only");
const limitArg = args.find((arg) => arg.startsWith("--limit="));
const limit = Math.max(1, Number(limitArg?.slice("--limit=".length)) || 50);
const query = args.filter((arg) => !arg.startsWith("--")).join(" ").trim();

if (!query) {
  console.error("Usage: node scripts/search-project-news.js <query>");
  process.exit(1);
}

const stripTags = (value = "") => String(value)
  .replace(/<[^>]+>/g, "")
  .replace(/<!\[CDATA\[|\]\]>/g, "")
  .replace(/&quot;/g, '"')
  .replace(/&#x27;|&#39;/g, "'")
  .replace(/&lt;/g, "<")
  .replace(/&gt;/g, ">")
  .replace(/&amp;/g, "&")
  .replace(/&nbsp;/g, " ")
  .replace(/\s+/g, " ")
  .trim();

function collectResults(root) {
  const results = [];
  const seen = new Set();

  function walk(value) {
    if (!value || typeof value !== "object") return;
    if (value.url && value.title && !seen.has(value.url)) {
      seen.add(value.url);
      if (!/(?:^|\/\/)(?:[^/]+\.)?yahoo\.co\.jp\//.test(value.url)) {
        results.push({
          title: stripTags(value.title),
          description: stripTags(value.description),
          url: value.url,
        });
      }
    }
    for (const child of Object.values(value)) walk(child);
  }

  walk(root);
  return results;
}

async function searchYahoo() {
  const url = new URL("https://search.yahoo.co.jp/search");
  url.searchParams.set("p", query);
  const response = await fetch(url, {
    headers: { "user-agent": "Mozilla/5.0 Chrome/140 Safari/537.36" },
  });
  if (!response.ok) throw new Error(`Yahoo Search HTTP ${response.status}`);
  const html = await response.text();
  const marker = '<script id="__NEXT_DATA__" type="application/json">';
  const start = html.indexOf(marker);
  const end = html.indexOf("</script>", start);
  if (start < 0 || end < 0) throw new Error("Yahoo Search result payload not found");
  const payload = JSON.parse(html.slice(start + marker.length, end));
  const pageData = payload?.props?.pageProps?.initialProps?.pageData;
  if (!pageData) throw new Error("Yahoo Search page data not found");
  return collectResults(pageData);
}

async function searchGoogleNewsRss() {
  const url = new URL("https://news.google.com/rss/search");
  url.searchParams.set("hl", "ja");
  url.searchParams.set("gl", "JP");
  url.searchParams.set("ceid", "JP:ja");
  url.searchParams.set("q", query);
  const response = await fetch(url, {
    headers: { "user-agent": "Mozilla/5.0 Chrome/140 Safari/537.36" },
  });
  if (!response.ok) throw new Error(`Google News Search HTTP ${response.status}`);
  const xml = await response.text();
  return [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)].map((match) => {
    const item = match[1];
    const field = (name) => stripTags(item.match(new RegExp(`<${name}>([\\s\\S]*?)<\\/${name}>`))?.[1]);
    return {
      title: field("title"),
      description: field("description"),
      url: field("link"),
      source: stripTags(item.match(/<source[^>]*>([\s\S]*?)<\/source>/)?.[1]),
      publishedAt: field("pubDate"),
    };
  }).filter((result) => result.title && result.url);
}

(async () => {
  let results;
  let provider = "Yahoo Japan";
  try {
    results = await searchYahoo();
  } catch (error) {
    provider = "Google News RSS fallback";
    results = await searchGoogleNewsRss();
  }
  const limitedResults = results.slice(0, limit);
  const outputResults = titlesOnly
    ? limitedResults.map(({ title, source, publishedAt }) => ({ title, source, publishedAt }))
    : compact
    ? limitedResults.map(({ title, url, source, publishedAt }) => ({ title, url, source, publishedAt }))
    : limitedResults;
  console.log(JSON.stringify({ provider, query, results: outputResults }, null, 2));
})().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
