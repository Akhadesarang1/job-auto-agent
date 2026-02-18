require("dotenv").config();
const { MongoClient } = require("mongodb");
const puppeteer = require("puppeteer-extra");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
const logger = require("./utils/logger");
const formFiller = require("./utils/formFiller");

puppeteer.use(StealthPlugin());

const { LINKEDIN_EMAIL, LINKEDIN_PASSWORD, MONGODB_URI } = process.env;

const DB_NAME = "job-auto-agent";
const JOBS_COLLECTION = "jobs";
const FORM_COLLECTION = "form";
const APPLICATIONS_COLLECTION = "applications";

// Random human-like delay
function humanDelay(min = 1000, max = 3000) {
  const ms = Math.floor(Math.random() * (max - min + 1)) + min;
  return new Promise((res) => setTimeout(res, ms));
}

// Retry-capable navigation
async function safeGoto(page, url, retries = 2) {
  for (let i = 0; i <= retries; i++) {
    try {
      await page.goto(url, {
        waitUntil: "networkidle2",
        timeout: 120000, // 2 minutes
      });
      return true;
    } catch (err) {
      logger.warn(
        `⚠️ Navigation failed (attempt ${i + 1}/${retries + 1}): ${url}`
      );
      await humanDelay(2000, 5000);
    }
  }
  return false;
}

async function runLinkedInBot() {
  logger.info("🚀 Starting LinkedIn Auto-Apply Bot");

  // 1. Connect to MongoDB
  const client = new MongoClient(MONGODB_URI);
  await client.connect();
  logger.success("🗄️ Connected to MongoDB");

  const db = client.db(DB_NAME);
  const jobsCol = db.collection(JOBS_COLLECTION);
  const formCol = db.collection(FORM_COLLECTION);
  const appsCol = db.collection(APPLICATIONS_COLLECTION);

  // 2. Load user profile
  const profile = await formCol.findOne({});
  if (!profile) throw new Error(`No user profile in '${FORM_COLLECTION}'`);
  logger.info(`👤 Profile loaded: ${profile.fullName}`);

  // 3. Fetch all jobs with a URL
  const jobs = await jobsCol
    .find({ url: { $exists: true, $ne: null } })
    .toArray();
  logger.info(`📦 Found ${jobs.length} job(s) to process`);
  if (jobs.length === 0) {
    await client.close();
    return;
  }

  // 4. Launch Puppeteer with stealth & slowMo
  const browser = await puppeteer.launch({
    headless: false,
    slowMo: 80,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-blink-features=AutomationControlled",
    ],
  });
  const [page] = await browser.pages();
  await page.setViewport({ width: 1280, height: 800 });
  await page.setUserAgent(
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) " +
      "AppleWebKit/537.36 (KHTML, like Gecko) " +
      "Chrome/114.0.0.0 Safari/537.36"
  );
  page.setDefaultNavigationTimeout(120000);
  logger.success("🌐 Browser ready (headless:false, slowMo:80)");

  // 5. Log in to LinkedIn
  logger.info("🔐 Logging in to LinkedIn");
  await page.goto("https://www.linkedin.com/login", {
    waitUntil: "networkidle2",
  });
  await formFiller.typeHuman(page, "input#username", LINKEDIN_EMAIL);
  await humanDelay();
  await formFiller.typeHuman(page, "input#password", LINKEDIN_PASSWORD);
  await humanDelay();
  await page.click('button[type="submit"]');

  // Detect checkpoint or captcha
  try {
    await page.waitForSelector('nav[aria-label="Primary"]', { timeout: 60000 });
    logger.success("🔓 Logged in to LinkedIn");
  } catch {
    if (await page.$('input[name="username"]')) {
      logger.error("🚫 Login blocked: checkpoint or captcha encountered.");
      await page.screenshot({ path: "login-blocked.png" });
      await browser.close();
      await client.close();
      return;
    }
    logger.warn("⚠️ Login confirmation selector not found; continuing anyway");
  }

  // 6. Iterate and apply (up to 5)
  let appliedCount = 0;
  for (const job of jobs) {
    if (appliedCount >= 5) break;
    const { _id, url, title = "", company = "" } = job;

    // Only LinkedIn jobs
    if (!url.includes("linkedin.com/jobs")) {
      logger.warn(`⏭ Skipping non-LinkedIn URL: ${url}`);
      continue;
    }

    // Navigate with retry
    const ok = await safeGoto(page, url, 3);
    if (!ok) {
      logger.error(`❌ Could not navigate to ${url}`);
      continue;
    }
    await humanDelay();

    // Wait for job details container
    const details = await page.$("section.jobs-details-top-card");
    if (!details) {
      logger.warn("⚠️ Job details section not found; skipping");
      continue;
    }

    // Retry Easy Apply flow up to 2 times
    let appliedThis = false;
    for (let attempt = 0; attempt < 2 && !appliedThis; attempt++) {
      try {
        const btn = await page.$(".jobs-apply-button");
        if (!btn) {
          logger.warn("⏭ Easy Apply button not found; skipping");
          break;
        }

        await page.evaluate((el) => el.scrollIntoView(), btn);
        await humanDelay();
        await btn.click();
        logger.info("📝 Easy Apply modal opened");
        await humanDelay();

        // Upload resume
        const fileInput = await page.$('input[type="file"]');
        if (fileInput) {
          await formFiller.uploadResume(
            page,
            'input[type="file"]',
            profile.resumeFileName
          );
          logger.info("📄 Resume uploaded");
          await humanDelay();
        }

        // Fill phone if field present
        const phoneField = await page.$('input[name="phoneNumber"]');
        if (phoneField && profile.phone) {
          await formFiller.typeHuman(
            page,
            'input[name="phoneNumber"]',
            profile.phone
          );
          logger.info("📞 Phone filled");
          await humanDelay();
        }

        // Fill cover letter if present
        const coverField = await page.$('textarea[name="coverLetter"]');
        if (coverField) {
          const coverText = `Dear Hiring Team,

I’m excited to apply for the ${title}${
            company ? ` at ${company}` : ""
          }. With my skills in ${profile.skills.join(
            ", "
          )}, I believe I’d excel in this role.

Best regards,
${profile.fullName}`;
          await formFiller.typeHuman(
            page,
            'textarea[name="coverLetter"]',
            coverText
          );
          logger.info("✍️ Cover letter filled");
          await humanDelay();
        }

        // Submit
        const submitBtn = await page.$(
          'button[aria-label="Submit application"]'
        );
        if (!submitBtn) {
          logger.warn("⚠️ Submit button not found; retrying");
          throw new Error("Submit button missing");
        }
        await page.evaluate((el) => el.scrollIntoView(), submitBtn);
        await humanDelay();
        await submitBtn.click();
        logger.success(`✅ Submitted application for: ${url}`);
        await humanDelay();

        // Record in applications
        await appsCol.insertOne({
          jobId: _id,
          url,
          title,
          company,
          appliedAt: new Date(),
        });
        appliedCount++;
        appliedThis = true;
      } catch (err) {
        logger.warn(
          `⚠️ Attempt ${attempt + 1} failed for ${url}: ${err.message}`
        );
        await humanDelay(2000, 4000);
      }
    } // retry loop
  } // jobs loop

  // 7. Teardown
  await browser.close();
  await client.close();
  logger.success(`🎯 Completed ${appliedCount} application(s)`);
}

module.exports = runLinkedInBot;
