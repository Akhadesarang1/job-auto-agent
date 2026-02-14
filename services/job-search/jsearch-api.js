// services/job-search/jsearch-api.js
require("dotenv").config();
const axios = require("axios");

const JSEARCH_API_HOST = process.env.RAPIDAPI_JSEARCH_HOST;
const JSEARCH_API_KEY = process.env.RAPIDAPI_KEY; // Make sure to add this to your .env file

if (!JSEARCH_API_HOST || !JSEARCH_API_KEY) {
  console.warn(
    "⚠️ JSearch API host or key not found in .env. JSearch API will not be available."
  );
}

/**
 * Transforms a job object from JSearch API to our internal format.
 * @param {object} apiJob - Job object from JSearch API.
 * @returns {object} - Job object in our internal format.
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
      )}`, // Fallback URL
    platform: "JSearch", // Or could be apiJob.job_publisher or similar if available and desired
    description: apiJob.job_description, // JSearch often provides this
    employmentType: apiJob.job_employment_type,
    postedAtText: apiJob.job_posted_at_datetime_utc, // This is a UTC string, might need formatting
    // Add any other relevant fields you want to map
  };
}

/**
 * Fetches jobs from the JSearch API.
 * @param {object} params - Parameters for the job search.
 * @param {string[]} params.roles - Array of job roles/titles.
 * @param {string[]} params.locations - Array of locations.
 * @param {string} [params.keywords] - Additional keywords.
 * @param {number} [params.numPages=1] - Number of pages to fetch (JSearch API specific).
 * @returns {Promise<Array<object>>} - A promise that resolves to an array of job listings.
 */
async function fetchJobsFromJSearch({
  roles = [],
  locations = [],
  keywords = "",
  numPages = 1, // JSearch specific pagination
}) {
  if (!JSEARCH_API_HOST || !JSEARCH_API_KEY) {
    console.log("JSearch API not configured. Skipping JSearch.");
    return [];
  }

  const queryParts = [...roles, ...locations];
  if (keywords) {
    queryParts.push(keywords);
  }
  const searchQuery = queryParts.join(" ");

  if (!searchQuery.trim()) {
    console.log("No search query provided for JSearch. Skipping.");
    return [];
  }

  const options = {
    method: "GET",
    url: `https://${JSEARCH_API_HOST}/search`,
    params: {
      query: searchQuery,
      page: "1", // JSearch uses page for pagination, starting from 1
      num_pages: String(numPages), // Number of pages of results to return
      // date_posted: 'today', // Example: 'all', 'today', '3days', 'week', 'month'
      // remote_jobs_only: 'false', // Example: 'true' or 'false'
      // employment_types: 'FULLTIME,CONTRACTOR', // Example: 'FULLTIME,PARTTIME,CONTRACTOR,INTERN'
    },
    headers: {
      "X-RapidAPI-Key": JSEARCH_API_KEY,
      "X-RapidAPI-Host": JSEARCH_API_HOST,
    },
  };

  try {
    console.log(
      `📞 Calling JSearch API with query: "${searchQuery}", num_pages: ${numPages}`
    );
    const response = await axios.request(options);

    if (
      response.data &&
      response.data.data &&
      Array.isArray(response.data.data)
    ) {
      const jobs = response.data.data
        .map(transformJSearchJob)
        .filter((job) => job.url && job.title); // Ensure essential fields are present
      console.log(`👍 JSearch API returned ${jobs.length} jobs.`);
      return jobs;
    } else {
      console.warn(
        "JSearch API returned an unexpected response structure:",
        response.data
      );
      return [];
    }
  } catch (error) {
    console.error("❌ Error fetching jobs from JSearch API:");
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      console.error("Data:", error.response.data);
      console.error("Status:", error.response.status);
      console.error("Headers:", error.response.headers);
    } else if (error.request) {
      // The request was made but no response was received
      console.error("Request:", error.request);
    } else {
      // Something happened in setting up the request that triggered an Error
      console.error("Error Message:", error.message);
    }
    return []; // Return empty array on error
  }
}

module.exports = { fetchJobsFromJSearch };
