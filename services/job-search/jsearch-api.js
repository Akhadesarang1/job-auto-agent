// services/job-search/jsearch-api.js
require("dotenv").config();
const axios = require("axios");

const JSEARCH_API_HOST = process.env.RAPIDAPI_JSEARCH_HOST;
const JSEARCH_API_KEY = process.env.RAPIDAPI_KEY;

if (!JSEARCH_API_HOST || !JSEARCH_API_KEY) {
  console.warn(
    "⚠️ JSearch API host or key not found in .env. JSearch API will not be available."
  );
}

/**
 * Transforms a job object from JSearch API to our internal format.
 */
function transformJSearchJob(apiJob) {
  let location = apiJob.job_city || "";
  if (apiJob.job_state) {
    location += (location ? ", " : "") + apiJob.job_state;
  }
  if (apiJob.job_country) {
    location += (location ? ", " : "") + apiJob.job_country;
  }

  return {
    title: apiJob.job_title?.trim() || "N/A",
    company: apiJob.employer_name?.trim() || "N/A",
    location: location.trim() || "N/A",
    url:
      apiJob.job_apply_link ||
      `https://www.google.com/search?q=${encodeURIComponent(
        apiJob.job_title + " " + apiJob.employer_name
      )}`,
    platform: "JSearch",
    description: apiJob.job_description,
    employmentType: apiJob.job_employment_type,
    postedAtText: apiJob.job_posted_at_datetime_utc,
  };
}

/**
 * Fetches jobs from the JSearch API, restricted to India only.
 *
 * @param {object} params
 * @param {string[]} params.roles
 * @param {string[]} params.locations
 * @param {string}   params.keywords    // comma-separated string
 * @param {number}   params.numPages    // how many pages to fetch per location
 * @returns {Promise<object[]>}
 */
async function fetchJobsFromJSearch({
  roles = [],
  locations = [],
  keywords = "",
  numPages = 1,
}) {
  if (!JSEARCH_API_HOST || !JSEARCH_API_KEY) {
    console.log("JSearch API not configured. Skipping JSearch.");
    return [];
  }

  // Split comma/space-separated keywords into tokens:
  const keywordTokens = keywords
    .split(/[,\s]+/)
    .filter((tok) => tok.trim().length);

  const allJobs = [];

  for (const loc of locations) {
    // Build search query per-location
    const queryParts = [...roles, loc, ...keywordTokens];
    const searchQuery = queryParts.join(" ");

    const options = {
      method: "GET",
      url: `https://${JSEARCH_API_HOST}/search`,
      params: {
        query: searchQuery,
        page: "1",
        num_pages: String(numPages),
        country: "in", // force India only
      },
      headers: {
        "X-RapidAPI-Key": JSEARCH_API_KEY,
        "X-RapidAPI-Host": JSEARCH_API_HOST,
      },
    };

    console.log(
      `📞 JSearch API: "${searchQuery}" (pages=${numPages}, country=in)`
    );
    try {
      const response = await axios.request(options);
      const data = response.data?.data;
      if (Array.isArray(data) && data.length) {
        const jobs = data.map(transformJSearchJob);
        console.log(`👍 JSearch returned ${jobs.length} jobs for "${loc}"`);
        allJobs.push(...jobs);
      } else {
        console.log(`⚠️ JSearch returned 0 jobs for "${loc}"`);
      }
    } catch (err) {
      console.error(`❌ JSearch error for "${loc}":`, err.message);
    }
  }

  return allJobs;
}

module.exports = { fetchJobsFromJSearch };
