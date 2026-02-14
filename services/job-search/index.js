// services/job-search/index.js
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const { scrapeJobs } = require("./puppeteer-scraper");
const { fetchJobsFromJSearch } = require("./jsearch-api");

const app = express();
const PORT = process.env.PORT_SCRAPER || 5002;

app.use(cors());
app.use(express.json());

// Connect to MongoDB
mongoose
  .connect(process.env.MONGO_URI, {
    dbName: process.env.MONGO_DB_NAME || "job-auto-agent",
  })
  .then(() => {
    console.log(
      "🔍 DB connected:",
      process.env.MONGO_DB_NAME || "job-auto-agent"
    );
  })
  .catch((err) => {
    console.error("❌ MongoDB connection error:", err.message);
    process.exit(1);
  });

// Mongoose Job Schema
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
  {
    timestamps: true,
  }
);

jobSchema.index({ url: 1, platform: 1 }, { unique: true });
const Job = mongoose.model("Job", jobSchema);

// POST /api/scrape - only runs when main server calls
app.post("/api/scrape", async (req, res) => {
  const {
    roles,
    locations,
    platforms,
    keywords,
    numPagesJSearch = 1,
  } = req.body;

  if (!roles?.length || !locations?.length || !platforms?.length) {
    return res.status(400).json({
      error: "Missing 'roles', 'locations', or 'platforms'.",
    });
  }

  let allListings = [];
  const puppeteerPlatforms = [];

  for (const platform of platforms) {
    if (platform.toLowerCase() === "jsearch") {
      try {
        const jsearchResults = await fetchJobsFromJSearch({
          roles,
          locations,
          keywords,
          numPages: parseInt(numPagesJSearch, 10) || 1,
        });
        allListings.push(...jsearchResults);
      } catch (err) {
        console.error("❌ JSearch error:", err.message);
      }
    } else {
      puppeteerPlatforms.push(platform);
    }
  }

  if (puppeteerPlatforms.length > 0) {
    try {
      const puppeteerResults = await scrapeJobs({
        roles,
        locations,
        platforms: puppeteerPlatforms,
        keywords,
      });
      allListings.push(...puppeteerResults);
    } catch (err) {
      console.error("❌ Puppeteer scrape error:", err.message);
    }
  }

  if (allListings.length === 0) {
    return res.json({
      message: "No job listings found.",
      count: 0,
      newlyAdded: 0,
      updated: 0,
      listings: [],
    });
  }

  const operations = allListings
    .filter((job) => job.url && job.platform && job.title)
    .map((job) => ({
      updateOne: {
        filter: { url: job.url, platform: job.platform },
        update: {
          $set: {
            title: job.title,
            company: job.company || null,
            location: job.location || null,
            description: job.description || null,
            employmentType: job.employmentType || null,
            postedAtText: job.postedAtText || null,
          },
          $setOnInsert: {
            url: job.url,
            platform: job.platform,
          },
        },
        upsert: true,
      },
    }));

  try {
    const result = await Job.bulkWrite(operations, { ordered: false });
    res.json({
      message: "Scrape and save complete.",
      totalFetched: allListings.length,
      validForSave: operations.length,
      newlyAdded: result.upsertedCount || 0,
      updated: result.modifiedCount || 0,
    });
  } catch (err) {
    console.error("❌ DB write error:", err);
    res.status(500).json({
      error: "Database error",
      details: err.message,
    });
  }
});

// GET /api/jobs - fetch jobs from DB
app.get("/api/jobs", async (req, res) => {
  try {
    const {
      platform,
      title,
      company,
      location,
      limit = 20,
      page = 1,
      sortBy = "createdAt",
      order = "desc",
    } = req.query;

    const query = {};
    if (platform) query.platform = platform;
    if (title) query.title = { $regex: title, $options: "i" };
    if (company) query.company = { $regex: company, $options: "i" };
    if (location) query.location = { $regex: location, $options: "i" };

    const sortOrder = order === "asc" ? 1 : -1;
    const jobs = await Job.find(query)
      .sort({ [sortBy]: sortOrder })
      .skip((parseInt(page) - 1) * parseInt(limit))
      .limit(parseInt(limit));

    const total = await Job.countDocuments(query);
    res.json({
      jobs,
      currentPage: parseInt(page),
      totalPages: Math.ceil(total / limit),
      totalJobs: total,
    });
  } catch (err) {
    console.error("❌ Fetch error:", err);
    res
      .status(500)
      .json({ error: "Failed to fetch jobs", details: err.message });
  }
});

app.listen(PORT, () =>
  console.log(`🚀 Job-search listening on http://localhost:${PORT}`)
);
