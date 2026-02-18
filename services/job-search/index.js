// services/job-search/index.js
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const { scrapeJobs } = require("./puppeteer-scraper");
const { fetchJobsFromJSearch } = require("./jsearch-api");

const app = express();
const PORT = process.env.PORT_SCRAPER || 5002;
const POLL_INTERVAL_MS =
  parseInt(process.env.POLL_INTERVAL_MS, 10) || 60 * 1000;

app.use(cors());
app.use(express.json());

mongoose
  .connect(process.env.MONGO_URI, {
    dbName: process.env.MONGO_DB_NAME || "job-auto-agent",
  })
  .then(() => {
    console.log("✅ [Scraper] Connected to MongoDB");
    startPollingRegistrations();
  })
  .catch((err) => {
    console.error("❌ [Scraper] MongoDB connection error:", err.message);
    process.exit(1);
  });

// ─── Schemas ─────────────────────────────────────────────────────────
const registrationSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    name: String,
    email: String,
    roles: [String],
    locations: [String],
    jobType: String,
    platforms: [String],
    keywords: String,
    applicationFrequency: String,
    experience: String,
    expectedCtc: String,
    registrationLink: String,
    resumePath: String,
  },
  { timestamps: true }
);
const Registration =
  mongoose.models.Registration ||
  mongoose.model("Registration", registrationSchema);

const jobSchema = new mongoose.Schema(
  {
    title: { type: String, trim: true, required: true },
    company: { type: String, trim: true },
    location: { type: String, trim: true },
    url: { type: String, trim: true, required: true },
    platform: { type: String, required: true },
    description: { type: String, trim: true },
    employmentType: { type: String, trim: true },
    postedAtText: { type: String, trim: true },
  },
  { timestamps: true }
);
jobSchema.index({ url: 1, platform: 1 }, { unique: true });
const Job = mongoose.models.Job || mongoose.model("Job", jobSchema);

// ─── Core Scraping ────────────────────────────────────────────────────
async function doScrapeForRegistration(regDoc) {
  console.log("🔄 [Scraper] Scraping for Registration:", regDoc._id);

  const roles = Array.isArray(regDoc.roles) ? regDoc.roles : [];
  const locations = Array.isArray(regDoc.locations) ? regDoc.locations : [];
  const keywords = regDoc.keywords || "";
  let platforms = Array.isArray(regDoc.platforms)
    ? regDoc.platforms.map((p) => p.toLowerCase())
    : [];

  // Always include jsearch + linkedin
  platforms = Array.from(new Set([...platforms, "jsearch", "linkedin"]));

  if (!roles.length || !locations.length) {
    console.warn(
      "⚠️ [Scraper] Skipping (missing roles or locations):",
      regDoc._id
    );
    return;
  }

  console.log("🔎 [Scraper] Params:", {
    roles,
    locations,
    keywords,
    platforms,
    numPagesJSearch: 2,
  });

  let allListings = [];

  // 1️⃣ JSearch
  try {
    console.log("📄 [Scraper] Fetching JSearch...");
    const jResults = await fetchJobsFromJSearch({
      roles,
      locations,
      keywords, // comma string
      numPages: 2,
    });
    console.log(`✅ [Scraper] JSearch returned ${jResults.length} jobs`);
    allListings.push(...jResults);
  } catch (err) {
    console.error("❌ [Scraper] JSearch error:", err.message);
  }

  // 2️⃣ Puppeteer (LinkedIn, etc.)
  const puppeteerPlatforms = platforms.filter((p) => p !== "jsearch");
  if (puppeteerPlatforms.length) {
    try {
      console.log(
        `🤖 [Scraper] Puppeteer scraping: ${puppeteerPlatforms.join(", ")}`
      );
      const pResults = await scrapeJobs({
        roles,
        locations,
        platforms: puppeteerPlatforms,
        keywords,
      });
      console.log(`✅ [Scraper] Puppeteer returned ${pResults.length} jobs`);
      allListings.push(...pResults);
    } catch (err) {
      console.error("❌ [Scraper] Puppeteer error:", err.message);
    }
  }

  if (!allListings.length) {
    console.warn(`⚠️ [Scraper] No jobs for registration ${regDoc._id}`);
    return;
  }
  if (allListings.length < 10) {
    console.warn(
      `⚠️ [Scraper] Only ${allListings.length} jobs fetched; expected ≥10`
    );
  }

  // 3️⃣ Upsert into DB
  const ops = allListings
    .filter((j) => j.url && j.title && j.platform)
    .map((j) => ({
      updateOne: {
        filter: { url: j.url, platform: j.platform },
        update: {
          $set: {
            title: j.title,
            company: j.company || null,
            location: j.location || null,
            description: j.description || null,
            employmentType: j.employmentType || null,
            postedAtText: j.postedAtText || null,
          },
          $setOnInsert: { url: j.url, platform: j.platform },
        },
        upsert: true,
      },
    }));

  try {
    console.log(`💾 [Scraper] Writing ${ops.length} jobs to DB...`);
    const result = await Job.bulkWrite(ops, { ordered: false });
    console.log(
      `✅ [Scraper] Upserted=${result.upsertedCount}, Modified=${result.modifiedCount}`
    );
  } catch (err) {
    console.error("❌ [Scraper] DB bulkWrite error:", err.message);
  }
}

// ─── Polling ─────────────────────────────────────────────────────────
let lastPolledAt = new Date(0);

async function pollRegistrations() {
  try {
    const now = new Date();
    console.log(
      `👀 [Poll] Looking for regs updated after ${lastPolledAt.toISOString()}`
    );

    const updatedRegs = await Registration.find({
      updatedAt: { $gt: lastPolledAt },
    }).lean();

    const regsToProcess = updatedRegs.length
      ? updatedRegs
      : await Registration.find({}).lean();

    console.log(
      updatedRegs.length
        ? `🔔 [Poll] Found ${updatedRegs.length} updated registrations`
        : `🔕 [Poll] No updates; scraping all ${regsToProcess.length}`
    );

    for (const reg of regsToProcess) {
      await doScrapeForRegistration(reg);
    }

    lastPolledAt = now;
  } catch (err) {
    console.error("❌ [Poll] Error polling registrations:", err.message);
  }
}

function startPollingRegistrations() {
  pollRegistrations();
  setInterval(pollRegistrations, POLL_INTERVAL_MS);
}

// ─── Health Check & Start ───────────────────────────────────────────
app.get("/_health", (req, res) => res.send("🩺 Scraper alive"));

app.listen(PORT, () =>
  console.log(`🚀 [Scraper] Listening on http://localhost:${PORT}`)
);
