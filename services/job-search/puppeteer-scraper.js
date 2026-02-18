// services/job-search/puppeteer-scraper.js
require("dotenv").config();
const puppeteer = require("puppeteer-extra");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
const UserAgent = require("user-agents");

puppeteer.use(StealthPlugin());

const MAX_PAGES = 5;
const NAV_DELAY = 2000;
const TIMEOUT_MS = 45000;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function configurePage(page) {
  await page.setUserAgent(new UserAgent().toString());
  await page.setExtraHTTPHeaders({ "Accept-Language": "en-US,en;q=0.9" });
  await page.setRequestInterception(true);
  page.on("request", (req) => {
    const url = req.url();
    if (
      url.includes("gstatic.com") ||
      url.includes("google-analytics") ||
      url.endsWith(".png") ||
      url.endsWith(".jpg")
    ) {
      return req.abort();
    }
    req.continue();
  });
}

async function tryLinkedInLogin(browser) {
  try {
    const page = await browser.newPage();
    await configurePage(page);
    await page.goto("https://www.linkedin.com/login", {
      waitUntil: "networkidle0",
      timeout: TIMEOUT_MS,
    });
    await page.type("#username", process.env.LINKEDIN_EMAIL, { delay: 100 });
    await page.type("#password", process.env.LINKEDIN_PASSWORD, { delay: 100 });
    await Promise.all([
      page.click("button[type=submit]"),
      page.waitForNavigation({
        waitUntil: "networkidle0",
        timeout: TIMEOUT_MS,
      }),
    ]);
    await page.close();
  } catch {
    // silently ignore
  }
}

function buildUrl(platform, query, pageIdx) {
  const q = encodeURIComponent(query);
  switch (platform) {
    case "LinkedIn":
      return `https://www.linkedin.com/jobs/search?keywords=${q}&start=${
        pageIdx * 25
      }`;
    case "Google":
      return `https://www.google.com/search?q=${q}&start=${pageIdx * 10}`;
    case "Naukri":
      const slug = encodeURIComponent(
        query.replace(/[^\w ]/g, "").replace(/ +/g, "-")
      );
      return `https://www.naukri.com/${slug}-jobs-${pageIdx + 1}`;
    case "AngelList":
      return `https://angel.co/jobs?keywords=${q}&page=${pageIdx + 1}`;
    default:
      return null;
  }
}

const scrapers = {
  LinkedIn: async (page) => {
    await page.waitForSelector(".jobs-search__results-list li", {
      timeout: TIMEOUT_MS,
    });
    return page.$$eval(".jobs-search__results-list li", (cards) =>
      cards.map((c) => ({
        title: c.querySelector("h3")?.innerText.trim() || "",
        company: c.querySelector("h4")?.innerText.trim() || "",
        location:
          c.querySelector(".job-search-card__location")?.innerText.trim() || "",
        url: c.querySelector("a.base-card__full-link")?.href,
        platform: "LinkedIn",
      }))
    );
  },

  Google: async (page) => {
    await page.waitForSelector("div#search, div.g", {
      timeout: TIMEOUT_MS,
    });
    return page.$$eval("div.g", (cards) =>
      cards.map((c) => ({
        title: c.querySelector("h3")?.innerText.trim() || "",
        snippet: c.querySelector(".IsZvec")?.innerText.trim() || "",
        url: c.querySelector("a")?.href,
        platform: "Google",
      }))
    );
  },

  Naukri: async (page) => {
    await page.waitForSelector("article.jobTuple", {
      timeout: TIMEOUT_MS,
    });
    return page.$$eval("article.jobTuple", (cards) =>
      cards.map((c) => ({
        title: c.querySelector("h2")?.innerText.trim() || "",
        company:
          c.querySelector(".companyInfo .subTitle")?.innerText.trim() || "",
        location: c.querySelector(".location")?.innerText.trim() || "",
        url: c.querySelector("a")?.href,
        platform: "Naukri",
      }))
    );
  },

  AngelList: async (page) => {
    await page.waitForSelector(".styles_module__jobCard", {
      timeout: TIMEOUT_MS,
    });
    return page.$$eval(".styles_module__jobCard", (cards) =>
      cards.map((c) => ({
        title:
          c.querySelector(".styles_module__jobTitle")?.innerText.trim() || "",
        company:
          c.querySelector(".styles_module__company")?.innerText.trim() || "",
        location:
          c.querySelector(".styles_module__location")?.innerText.trim() || "",
        url: c.querySelector("a")?.href,
        platform: "AngelList",
      }))
    );
  },
};

async function paginate(browser, platform, query) {
  const out = [];
  const scraper = scrapers[platform];
  if (!scraper) return out;

  for (let idx = 0; idx < MAX_PAGES; idx++) {
    let page;
    try {
      page = await browser.newPage();
      await configurePage(page);
      const url = buildUrl(platform, query, idx);
      if (!url) break;
      await page.goto(url, { waitUntil: "networkidle0", timeout: TIMEOUT_MS });
      await sleep(NAV_DELAY);
      const items = await scraper(page);
      if (items.length === 0) break;
      out.push(...items);
    } catch {
      // ignore page errors
    } finally {
      if (page) await page.close();
    }
  }
  return out;
}

exports.scrapeJobs = async ({ roles, locations, platforms, keywords }) => {
  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  if (platforms.includes("LinkedIn")) {
    await tryLinkedInLogin(browser);
  }

  const query = [...roles, ...locations, keywords].join(" ");
  let all = [];
  for (const plat of platforms) {
    if (!scrapers[plat]) continue;
    all.push(...(await paginate(browser, plat, query)));
  }

  await browser.close();

  // single success log:
  console.log(`✅ Scraped ${all.length} jobs across ${platforms.join(", ")}`);
  return all;
};
