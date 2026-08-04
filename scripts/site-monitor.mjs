import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';

const repoRoot = process.cwd();
const configPath = process.env.SITE_MONITOR_CONFIG
  ? path.resolve(process.env.SITE_MONITOR_CONFIG)
  : path.join(repoRoot, 'config', 'site-monitor.json');
const stateDir = process.env.SITE_MONITOR_STATE_DIR
  ? path.resolve(process.env.SITE_MONITOR_STATE_DIR)
  : path.join(repoRoot, '.site-monitor');
const statePath = path.join(stateDir, 'state.json');
const reportDir = process.env.SITE_MONITOR_REPORT_DIR
  ? path.resolve(process.env.SITE_MONITOR_REPORT_DIR)
  : path.join(repoRoot, 'site-monitor-reports');

function escapeHtml(value = '') {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function hash(value) {
  return crypto.createHash('sha256').update(value).digest('hex');
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function normalizeWhitespace(value = '') {
  return value.replace(/\s+/g, ' ').trim();
}

function stripHtml(value = '') {
  return normalizeWhitespace(
    value
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, ' ')
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, ' ')
      .replace(/<[^>]+>/g, ' ')
  );
}

function xmlDecode(value = '') {
  return value
    .replaceAll('&lt;', '<')
    .replaceAll('&gt;', '>')
    .replaceAll('&quot;', '"')
    .replaceAll('&#39;', "'")
    .replaceAll('&amp;', '&');
}

function extractTag(block, tagName) {
  const regex = new RegExp(`<${tagName}\\b[^>]*>([\\s\\S]*?)<\\/${tagName}>`, 'i');
  const match = block.match(regex);
  return match ? xmlDecode(normalizeWhitespace(stripHtml(match[1]))) : '';
}

function extractAttr(tag, attrName) {
  const regex = new RegExp(`${attrName}="([^"]+)"`, 'i');
  const match = tag.match(regex);
  return match ? xmlDecode(match[1]) : '';
}

function isoNow() {
  return new Date().toISOString();
}

async function readJson(filePath, fallback) {
  try {
    const raw = await fs.readFile(filePath, 'utf8');
    return JSON.parse(raw);
  } catch (error) {
    if (error && error.code === 'ENOENT') {
      return fallback;
    }
    throw error;
  }
}

async function ensureDir(dirPath) {
  await fs.mkdir(dirPath, { recursive: true });
}

async function loadConfig() {
  const config = await readJson(configPath, null);
  if (!config) {
    throw new Error(`Missing config file at ${configPath}. Copy config/site-monitor.example.json to config/site-monitor.json and customize it.`);
  }
  if (!Array.isArray(config.phrases) || config.phrases.length === 0) {
    throw new Error('Config must include at least one phrase.');
  }
  if (!Array.isArray(config.sites) || config.sites.length === 0) {
    throw new Error('Config must include at least one site.');
  }
  return config;
}

async function fetchWithRetry(url, options, retryConfig) {
  let lastError;
  for (let attempt = 0; attempt <= retryConfig.maxRetries; attempt += 1) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), retryConfig.timeoutMs);
    try {
      const response = await fetch(url, { ...options, signal: controller.signal });
      if (!response.ok) {
        throw new Error(`Request failed with ${response.status} ${response.statusText}`);
      }
      return await response.text();
    } catch (error) {
      lastError = error;
      if (attempt < retryConfig.maxRetries) {
        await sleep(retryConfig.retryDelayMs * (attempt + 1));
      }
    } finally {
      clearTimeout(timeout);
    }
  }
  throw lastError;
}

function buildMatcher(phrases) {
  return phrases.map((phrase) => ({
    phrase,
    normalized: phrase.toLowerCase()
  }));
}

function findPhraseMatches(text, matchers) {
  const haystack = text.toLowerCase();
  return matchers
    .filter((matcher) => haystack.includes(matcher.normalized))
    .map((matcher) => matcher.phrase);
}

function parseRssItems(xmlText) {
  const matches = xmlText.match(/<item\b[\s\S]*?<\/item>/gi) || [];
  return matches.map((itemXml) => ({
    title: extractTag(itemXml, 'title'),
    link: extractTag(itemXml, 'link'),
    snippet: extractTag(itemXml, 'description') || extractTag(itemXml, 'content:encoded'),
    timestamp: extractTag(itemXml, 'pubDate') || extractTag(itemXml, 'dc:date')
  }));
}

function parseAtomEntries(xmlText) {
  const matches = xmlText.match(/<entry\b[\s\S]*?<\/entry>/gi) || [];
  return matches.map((entryXml) => {
    const linkTag = entryXml.match(/<link\b[^>]*href="[^"]+"[^>]*\/?>(?:<\/link>)?/i)?.[0] || '';
    return {
      title: extractTag(entryXml, 'title'),
      link: extractAttr(linkTag, 'href'),
      snippet: extractTag(entryXml, 'summary') || extractTag(entryXml, 'content'),
      timestamp: extractTag(entryXml, 'updated') || extractTag(entryXml, 'published')
    };
  });
}

function parseHtmlPage(htmlText, site) {
  const title = htmlText.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] || site.name;
  const snippet = stripHtml(htmlText).slice(0, 1200);
  return [{
    title: normalizeWhitespace(xmlDecode(title)),
    link: site.url,
    snippet,
    timestamp: ''
  }];
}

async function collectSiteMatches(site, matchers, defaults) {
  if (!site.allowed) {
    return {
      site: site.name,
      skipped: true,
      reason: 'Site is not marked allowed for automated collection.'
    };
  }

  const body = await fetchWithRetry(site.url, {
    headers: {
      'user-agent': defaults.userAgent,
      accept: site.type === 'html'
        ? 'text/html,application/xhtml+xml'
        : 'application/rss+xml, application/atom+xml, application/xml, text/xml'
    }
  }, defaults);

  const items = site.type === 'rss'
    ? parseRssItems(body)
    : site.type === 'atom'
      ? parseAtomEntries(body)
      : parseHtmlPage(body, site);

  return items
    .map((item) => {
      const searchable = [item.title, item.snippet].filter(Boolean).join(' ');
      const phrases = findPhraseMatches(searchable, matchers);
      if (phrases.length === 0) {
        return null;
      }
      return {
        site: site.name,
        phrase: phrases.join(', '),
        title: item.title || site.name,
        link: item.link || site.url,
        snippet: (item.snippet || '').slice(0, 280),
        timestamp: item.timestamp || '',
        id: hash(`${site.name}|${item.link || site.url}|${phrases.join('|')}|${item.title || ''}`)
      };
    })
    .filter(Boolean)
    .slice(0, site.maxItems || defaults.maxItems);
}

function buildHtmlReport(summary, results, generatedAt) {
  const rows = results.map((item) => `<tr><td>${escapeHtml(item.site)}</td><td>${escapeHtml(item.phrase)}</td><td><a href="${escapeHtml(item.link)}">${escapeHtml(item.title)}</a></td><td>${escapeHtml(item.snippet)}</td><td>${escapeHtml(item.timestamp || generatedAt)}</td></tr>`).join('\n');
  const skipped = summary.skipped.map((item) => `<li>${escapeHtml(item.site)}: ${escapeHtml(item.reason)}</li>`).join('\n');
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Morning site monitoring report</title>
</head>
<body>
  <h1>Morning site monitoring report</h1>
  <p>Generated at ${escapeHtml(generatedAt)}</p>
  <p>${summary.newMatches} new match(es), ${summary.totalMatches} total current match(es).</p>
  ${summary.previousRunAt ? `<p>Previous run: ${escapeHtml(summary.previousRunAt)}</p>` : ''}
  ${skipped ? `<h2>Skipped sites</h2><ul>${skipped}</ul>` : ''}
  <table border="1" cellspacing="0" cellpadding="6">
    <thead><tr><th>Source</th><th>Phrase</th><th>Title</th><th>Snippet</th><th>Timestamp</th></tr></thead>
    <tbody>${rows || '<tr><td colspan="5">No matches found.</td></tr>'}</tbody>
  </table>
</body>
</html>`;
}

function buildTextReport(summary, results, generatedAt) {
  const lines = [
    'Morning site monitoring report',
    `Generated at: ${generatedAt}`,
    `Previous run: ${summary.previousRunAt || 'none'}`,
    `New matches: ${summary.newMatches}`,
    `Total matches: ${summary.totalMatches}`,
    ''
  ];
  if (summary.skipped.length > 0) {
    lines.push('Skipped sites:');
    for (const item of summary.skipped) {
      lines.push(`- ${item.site}: ${item.reason}`);
    }
    lines.push('');
  }
  if (results.length === 0) {
    lines.push('No matches found.');
    return lines.join('\n');
  }
  for (const item of results) {
    lines.push(`- [${item.site}] ${item.phrase}`);
    lines.push(`  Title: ${item.title}`);
    lines.push(`  Link: ${item.link}`);
    lines.push(`  Snippet: ${item.snippet}`);
    lines.push(`  Timestamp: ${item.timestamp || generatedAt}`);
    lines.push('');
  }
  return lines.join('\n');
}

async function maybeSendEmail(config, textReport, htmlReport) {
  if (!config.delivery?.email?.enabled) {
    return false;
  }

  const apiKey = process.env.RESEND_API_KEY;
  const to = config.delivery.email.to;
  const from = config.delivery.email.from;
  if (!apiKey || !from || !Array.isArray(to) || to.length === 0) {
    throw new Error('Email delivery is enabled, but RESEND_API_KEY, delivery.email.from, or delivery.email.to is not configured.');
  }

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      authorization: 'Bearer ' + apiKey,
      'content-type': 'application/json'
    },
    body: JSON.stringify({
      from,
      to,
      subject: config.delivery.email.subject || 'Morning site monitoring report',
      text: textReport,
      html: htmlReport
    })
  });

  if (!response.ok) {
    throw new Error(`Email delivery failed with ${response.status} ${response.statusText}`);
  }
  return true;
}

async function main() {
  const config = await loadConfig();
  const defaults = {
    ...config.defaults,
    maxRetries: config.defaults?.maxRetries ?? 2,
    retryDelayMs: config.defaults?.retryDelayMs ?? 1000,
    timeoutMs: config.defaults?.timeoutMs ?? 15000,
    maxItems: config.defaults?.maxItems ?? 20
  };
  const generatedAt = isoNow();
  const matchers = buildMatcher(config.phrases);
  const state = await readJson(statePath, { seenIds: [], lastRunAt: null });
  const seenIds = new Set(state.seenIds || []);
  const allResults = [];
  const skipped = [];

  for (const site of config.sites) {
    try {
      const siteResults = await collectSiteMatches(site, matchers, defaults);
      if (Array.isArray(siteResults)) {
        allResults.push(...siteResults);
      } else if (siteResults?.skipped) {
        skipped.push(siteResults);
      }
    } catch (error) {
      skipped.push({
        site: site.name,
        reason: error instanceof Error ? error.message : String(error)
      });
    }
  }

  const uniqueResults = allResults.filter((item, index, list) => list.findIndex((entry) => entry.id === item.id) === index);
  const newResults = uniqueResults.filter((item) => !seenIds.has(item.id));
  const updatedSeenIds = [...seenIds, ...newResults.map((item) => item.id)].slice(-5000);

  const summary = {
    newMatches: newResults.length,
    totalMatches: uniqueResults.length,
    skipped,
    previousRunAt: state.lastRunAt || null
  };

  const htmlReport = buildHtmlReport(summary, newResults, generatedAt);
  const textReport = buildTextReport(summary, newResults, generatedAt);

  await ensureDir(stateDir);
  await ensureDir(reportDir);
  await fs.writeFile(statePath, JSON.stringify({ seenIds: updatedSeenIds, lastRunAt: generatedAt }, null, 2));
  await fs.writeFile(path.join(reportDir, 'latest-report.html'), htmlReport, 'utf8');
  await fs.writeFile(path.join(reportDir, 'latest-report.txt'), textReport, 'utf8');
  await fs.writeFile(path.join(reportDir, 'latest-report.json'), JSON.stringify({ generatedAt, summary, results: newResults }, null, 2));

  const emailSent = await maybeSendEmail(config, textReport, htmlReport);
  console.log(JSON.stringify({ generatedAt, summary, emailSent, reportDir }, null, 2));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.stack : error);
  process.exitCode = 1;
});
