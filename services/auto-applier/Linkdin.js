require("dotenv").config();
const { MongoClient, ObjectId } = require("mongodb");
const puppeteer = require("puppeteer-extra");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
const fs = require("fs");
const path = require("path");
const { URL } = require("url");

puppeteer.use(StealthPlugin());

const logger = {
  info: (message) =>
    console.log(`[INFO] ${new Date().toISOString()} ${message}`),
  success: (message) =>
    console.log(`[SUCCESS] ✅ ${new Date().toISOString()} ${message}`),
  warn: (message) =>
    console.log(`[WARN] ⚠️ ${new Date().toISOString()} ${message}`),
  error: (message) =>
    console.error(`[ERROR] ❌ ${new Date().toISOString()} ${message}`),
};

const { LINKEDIN_EMAIL, LINKEDIN_PASSWORD, MONGODB_URI } = process.env;
const DB_NAME = "job-auto-agent";
const JOBS_COLLECTION = "jobs";
const FORM_COLLECTION = "form";
const APPLICATIONS_COLLECTION = "applications";
const HARDCODED_RESUME_PATH = process.env.RESUME_PATH || path.join(__dirname, "uploads", "resume.pdf");

const COOKIES_PATH = path.join(__dirname, "linkedin_cookies.json");
const DAILY_LIMIT = parseInt(process.env.DAILY_LIMIT, 10) || 12;

function humanDelay(min = 2000, max = 5000) {
  const ms = Math.floor(Math.random() * (max - min + 1)) + min;
  return new Promise((res) => setTimeout(res, ms));
}

async function randomMouseMovement(page) {
    try {
        const width = 1366;
        const height = 768;
        const x = Math.floor(Math.random() * width);
        const y = Math.floor(Math.random() * height);
        await page.mouse.move(x, y, { steps: 25 });
    } catch(e) { /* ignore */ }
}

async function autoScroll(page) {
    await page.evaluate(async () => {
        await new Promise((resolve) => {
            let totalHeight = 0;
            const distance = 100;
            const timer = setInterval(() => {
                const scrollHeight = document.body.scrollHeight;
                window.scrollBy(0, distance);
                totalHeight += distance;
                if(totalHeight >= scrollHeight / 2){ // Scroll half way
                    clearInterval(timer);
                    resolve();
                }
            }, 100);
        });
    });
}

async function saveCookies(page) {
    const cookies = await page.cookies();
    fs.writeFileSync(COOKIES_PATH, JSON.stringify(cookies, null, 2));
    logger.info("🍪 Cookies saved.");
}

async function loadCookies(page) {
    if (fs.existsSync(COOKIES_PATH)) {
        const cookiesString = fs.readFileSync(COOKIES_PATH);
        const cookies = JSON.parse(cookiesString);
        await page.setCookie(...cookies);
        logger.info("🍪 Cookies loaded.");
        return true;
    }
    return false;
}

async function typeHuman(elementHandle, text) {
  if (!elementHandle) {
    logger.warn("typeHuman: elementHandle is null.");
    return;
  }
  try {
    for (const char of text) {
      await elementHandle.type(char, {
        delay: Math.floor(Math.random() * 100) + 30,
      }); // Slightly increased char delay
    }
  } catch (e) {
    logger.warn(`typeHuman: Error typing - ${e.message}`);
  }
}

async function uploadResume(elementHandle, filePath) {
  if (!elementHandle) {
    logger.warn("uploadResume: elementHandle is null.");
    return;
  }
  if (!fs.existsSync(filePath)) {
    logger.error(`uploadResume: Resume file not found at ${filePath}`);
    throw new Error(`Resume file not found: ${filePath}`);
  }
  try {
    await elementHandle.uploadFile(filePath);
  } catch (e) {
    logger.error(`uploadResume: Error uploading file - ${e.message}`);
    throw e;
  }
}

function cleanJobUrl(jobUrlString) {
  if (!jobUrlString) return null;
  try {
    const parsedUrl = new URL(jobUrlString);
    if (
      parsedUrl.hostname.includes("linkedin.com") &&
      parsedUrl.pathname.startsWith("/jobs/view/")
    ) {
      return `${parsedUrl.protocol}//${parsedUrl.host}${parsedUrl.pathname}`;
    }
    const paramsToRemove = [
      "utm_source",
      "utm_medium",
      "utm_campaign",
      "utm_term",
      "utm_content",
      "gclid",
      "fbclid",
      "source",
    ];
    paramsToRemove.forEach((param) => parsedUrl.searchParams.delete(param));
    return parsedUrl.toString();
  } catch (error) {
    logger.warn(
      `Could not parse or clean URL: ${jobUrlString}. Error: ${error.message}`
    );
    return jobUrlString;
  }
}

async function runLinkedInBot() {
  logger.info("🚀 Starting LinkedIn Auto-Apply Bot");
  logger.warn(
    `OVERRIDE: Resume path is HARDCODED to: ${HARDCODED_RESUME_PATH}`
  );

  if (!LINKEDIN_EMAIL || !LINKEDIN_PASSWORD || !MONGODB_URI) {
    logger.error("❌ Missing critical environment variables.");
    return;
  }
  if (!fs.existsSync(HARDCODED_RESUME_PATH)) {
    logger.error(
      `❌ FATAL: Hardcoded resume file not found: ${HARDCODED_RESUME_PATH}`
    );
    return;
  } else {
    logger.info(`Hardcoded resume file found: ${HARDCODED_RESUME_PATH}`);
  }

  const client = new MongoClient(MONGODB_URI);
  let browser;
  let page;

  const screenshotsDir = path.join(__dirname, "screenshots_linkedin");
  if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir, { recursive: true });
  }
  const screenshotPath = (name) => path.join(screenshotsDir, name);

  try {
    await client.connect();
    logger.success("🗄️ Connected to MongoDB");

    const db = client.db(DB_NAME);
    const jobsCol = db.collection(JOBS_COLLECTION);
    const formCol = db.collection(FORM_COLLECTION);
    const appsCol = db.collection(APPLICATIONS_COLLECTION);

    let profile = await formCol.findOne({});
    if (!profile) {
      logger.warn(
        `⚠️ No user profile in '${FORM_COLLECTION}'. Using defaults.`
      );
      profile = { fullName: "Valued Applicant", skills: [], phone: null };
    } else {
      logger.info(`👤 Profile details loaded: ${profile.fullName}`);
    }

    const alreadyAppliedJobs = await appsCol
      .find({}, { projection: { jobId: 1 } })
      .toArray();
    const appliedJobIds = new Set(
      alreadyAppliedJobs
        .map((app) => (app.jobId ? app.jobId.toString() : null))
        .filter((id) => id)
    );

    const jobsToProcessQuery = { url: { $exists: true, $ne: null } };
    if (appliedJobIds.size > 0) {
      jobsToProcessQuery._id = {
        $nin: Array.from(appliedJobIds).map((id) => new ObjectId(id)),
      };
    }
    const jobsToProcess = await jobsCol.find(jobsToProcessQuery).toArray();

    logger.info(`📦 Found ${jobsToProcess.length} new job(s) to process.`);
    if (jobsToProcess.length === 0) return;

    browser = await puppeteer.launch({
      headless: true,
      slowMo: 130, // Slightly increased slowMo
      protocolTimeout: 120000,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-infobars",
        "--window-position=0,0",
        "--ignore-certifcate-errors",
        "--ignore-certifcate-errors-spki-list",
        "--disable-blink-features=AutomationControlled",
        "--start-maximized",
      ],
      ignoreHTTPSErrors: true,
    });

    page = (await browser.pages())[0] || (await browser.newPage());
    await page.setViewport({ width: 1366, height: 768 });
    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/97.0.4692.71 Safari/537.36"
    ); // Updated UA slightly
    page.setDefaultNavigationTimeout(100000);
    logger.success("🌐 Browser ready");

    // Load cookies first
    const hasCookies = await loadCookies(page);
    let isLoggedIn = false;

    if (hasCookies) {
        logger.info("🍪 Checking session validity...");
        try {
            await page.goto("https://www.linkedin.com/feed/", { waitUntil: "networkidle2" });
            if (page.url().includes("/feed")) {
                isLoggedIn = true;
                logger.success("✅ Session restored via cookies.");
            }
        } catch (e) {
            logger.warn("⚠️ Cookie session invalid/expired.");
        }
    }

    if (!isLoggedIn) {
        logger.info("🔐 Logging in to LinkedIn (Credentials)...");
        await page.goto("https://www.linkedin.com/login", {
          waitUntil: "networkidle2",
        });
        await humanDelay(2000, 4000);

        const emailInput = await page.waitForSelector("input#username", {
          visible: true,
          timeout: 30000,
        });
        await typeHuman(emailInput, LINKEDIN_EMAIL);
        await humanDelay();
        const passwordInput = await page.waitForSelector("input#password", {
          visible: true,
          timeout: 30000,
        });
        await typeHuman(passwordInput, LINKEDIN_PASSWORD);
        await humanDelay();

        await Promise.all([
          page.click('button[type="submit"]'),
          page.waitForNavigation({ waitUntil: "networkidle2", timeout: 60000 }),
        ]).catch(async (e) => {
          logger.warn(
            `⚠️ Login nav failed/timed out: ${e.message}. Checking post-login elements.`
          );
        });

        // Verify login
        try {
          await page.waitForFunction(
            () =>
              document.querySelector('input[placeholder*="Search"]') ||
              document.querySelector(".feed-identity-module") ||
              document.querySelector('nav[aria-label="Primary"]'),
            { timeout: 45000 }
          );
          logger.success("🔓 Logged in to LinkedIn");
          await saveCookies(page); // Save new session
        } catch (err) {
          logger.error("❌ Login failed: Post-login elements not found.");
          await page.screenshot({ path: screenshotPath("login_failure.png") });
          throw new Error("LinkedIn login failed.");
        }
    }

    // Warm-up actions
    logger.info("🔥 Warming up (random scrolling/movement)...");
    await randomMouseMovement(page);
    await autoScroll(page);
    await humanDelay(3000, 6000);


    let appliedCount = 0;
    for (const job of jobsToProcess) {
      if (appliedCount >= DAILY_LIMIT) {
        logger.info(`🏁 Reached application limit (${DAILY_LIMIT}).`);
        break;
      }

      const { _id, url: originalUrl, title = "N/A", company = "N/A" } = job;
      const jobIdForFile = _id.toString().replace(/[^a-z0-9]/gi, "_");
      const finalUrlToNavigate = cleanJobUrl(originalUrl);

      if (!finalUrlToNavigate) {
        logger.warn(`⏭ Skipping job with invalid original URL: ${originalUrl}`);
        continue;
      }

      logger.info(`--------------------------------------------------`);
      logger.info(`➡️ Processing job: ${title} at ${company}`);
      // logger.info(`Original URL: ${originalUrl}`); // Redundant if cleaned is same for LI
      logger.info(`Navigating to: ${finalUrlToNavigate}`);

      if (!finalUrlToNavigate.includes("linkedin.com/jobs/view/")) {
        logger.warn(
          `⏭ Skipping non-LinkedIn job view URL: ${finalUrlToNavigate}`
        );
        continue;
      }

      try {
        await page.goto(finalUrlToNavigate, { waitUntil: "domcontentloaded" });
        await humanDelay(1500, 2500); // Give a bit of time for initial JS to run

        // Attempt to handle cookie/consent popups (very basic)
        const acceptButtonSelectors = [
          'button[action-type="ACCEPT"]', // Common pattern for cookie banners
          'button[data-control-name="ga_consent_accept_button"]',
          "button#onetrust-accept-btn-handler",
        ];
        for (const selector of acceptButtonSelectors) {
          try {
            const button = await page.$(selector);
            if (button) {
              logger.info(
                `Found potential consent button with selector: ${selector}. Clicking...`
              );
              await button.click();
              await humanDelay(1000, 1500); // Wait for popup to disappear
              logger.info("Clicked consent button.");
              break; // Assume one accept is enough
            }
          } catch (popupErr) {
            logger.warn(
              `Minor issue clicking consent button (${selector}): ${popupErr.message}`
            );
          }
        }

        // Screenshot *before* waiting for the main job content selector
        await page.screenshot({
          path: screenshotPath(
            `jobpage_${jobIdForFile}_0_after_goto_and_consent.png`
          ),
        });

        // MODIFIED: Wait for a more general job title element or top card
        const jobPageReadySelectors = [
          ".jobs-unified-top-card__job-title", // Main job title
          "h1.jobs-unified-top-card__job-title", // More specific h1
          ".job-details-jobs-unified-top-card__job-title", // Another variation
          ".job-view-layout__job-title", // Older layout style
          ".jobs-details__main-content", // Keep one of the broader ones as fallback
          'main[aria-label*="job details"]',
        ];
        logger.info(
          `Waiting for one of job page ready selectors: ${jobPageReadySelectors.join(
            ", "
          )}`
        );
        await page.waitForFunction(
          (selectors) =>
            selectors.some((selector) => document.querySelector(selector)),
          { timeout: 50000 }, // Increased timeout for this critical wait
          jobPageReadySelectors
        );
        logger.info(
          "✅ Job page seems ready (found a key title/content element)."
        );
        await humanDelay(2000, 3000); // Extra delay for other elements

        await page.screenshot({
          path: screenshotPath(
            `jobpage_${jobIdForFile}_1_after_wait_ready.png`
          ),
        });

        const easyApplyButtonSelector =
          "button.jobs-apply-button[aria-label*='Easy Apply']";
        let applyButtonElement = await page.$(easyApplyButtonSelector);

        if (!applyButtonElement) {
          const genericApplyButton = await page.$("button.jobs-apply-button");
          if (genericApplyButton) {
            const buttonText = await page.evaluate(
              (el) => el.innerText.trim(),
              genericApplyButton
            );
            if (buttonText.toLowerCase().includes("applied")) {
              logger.info(
                `✅ Already applied (button: "${buttonText}"). Skipping: ${finalUrlToNavigate}`
              );
              await appsCol.updateOne(
                { jobId: _id },
                {
                  $setOnInsert: {
                    jobId: _id,
                    url: finalUrlToNavigate,
                    title,
                    company,
                    appliedAt: new Date(),
                    status: "Previously Applied (On-Page)",
                  },
                },
                { upsert: true }
              );
              continue;
            } else {
              logger.warn(
                `🟡 Regular "Apply" button (text: "${
                  buttonText || "N/A"
                }"), not "Easy Apply". Skipping. Screenshot: not_easyapply_btn_${jobIdForFile}.png`
              );
            }
          } else {
            logger.warn(
              `🟡 No "Easy Apply" or generic "Apply" button found. Screenshot: no_apply_btn_found_${jobIdForFile}.png`
            );
          }
          await page.screenshot({
            path: screenshotPath(`no_easyapply_btn_${jobIdForFile}.png`),
          });
          continue;
        }

        await page.evaluate(
          (el) => el.scrollIntoView({ behavior: "smooth", block: "center" }),
          applyButtonElement
        );
        await humanDelay();
        await applyButtonElement.click();
        logger.info("✅ Clicked Easy Apply button");
        await humanDelay(3000, 4000); // Wait for modal to fully open and render

        // --- Modal Interaction Loop (should be fine from previous version) ---
        let inApplicationModal = true;
        let maxModalSteps = 10;
        let currentStep = 0;

        while (inApplicationModal && currentStep < maxModalSteps) {
          currentStep++;
          logger.info(`🔄 Modal Step: ${currentStep}`);
          await humanDelay(2500, 3500); // Slightly longer wait per step
          await page.screenshot({
            path: screenshotPath(
              `modal_step_${jobIdForFile}_${currentStep}.png`
            ),
          });

          const resumeInputSelector =
            'input[type="file"][id*="jobs-document-upload"], input[type="file"][aria-label*="Resume"]';
          let resumeInputElement = await page.$(resumeInputSelector);
          if (
            resumeInputElement &&
            (await resumeInputElement.isIntersectingViewport())
          ) {
            const isResumeAlreadyThere = await page.$(
              'button[aria-label*="Remove file"], button[aria-label*="Delete resume"]'
            );
            if (!isResumeAlreadyThere) {
              logger.info("📄 Uploading resume (hardcoded path)...");
              await uploadResume(resumeInputElement, HARDCODED_RESUME_PATH);
              logger.info("📄 Resume uploaded.");
              await humanDelay();
            } else {
              logger.info("📄 Resume already present.");
            }
          }

          const phoneInputSelector =
            'input[id*="phoneNumber-nationalNumber"], input[data-test-form-builder-phone-national-number-input]';
          let phoneInputElement = await page.$(phoneInputSelector);
          if (
            profile.phone &&
            phoneInputElement &&
            (await phoneInputElement.isIntersectingViewport())
          ) {
            logger.info("📞 Filling phone number...");
            await phoneInputElement.click({ clickCount: 3 });
            await humanDelay(200, 400);
            await page.keyboard.press("Backspace");
            await humanDelay(200, 400);
            await typeHuman(phoneInputElement, profile.phone);
            logger.info("📞 Phone filled.");
            await humanDelay();
          }

          const coverLetterSelectors = [
            'textarea[id*="cover-letter"]',
            'textarea[name="coverLetter"]',
            'textarea[aria-label*="cover letter" i]',
          ];
          let coverLetterInputElement = null;
          for (const clSel of coverLetterSelectors) {
            const el = await page.$(clSel);
            if (el && (await el.isIntersectingViewport())) {
              coverLetterInputElement = el;
              logger.info(`✍️ Cover letter field found: ${clSel}`);
              break;
            }
          }
          if (
            coverLetterInputElement &&
            profile.skills &&
            profile.skills.length > 0
          ) {
            const coverLetterText = `Dear Hiring Team,\n\nI am very interested in the ${title}${
              company ? ` at ${company}` : ""
            }. My skills in ${profile.skills.join(
              ", "
            )} align well.\n\nBest regards,\n${profile.fullName}`;
            logger.info("✍️ Filling cover letter...");
            await coverLetterInputElement.click({ clickCount: 3 });
            await humanDelay(200, 400);
            await page.keyboard.press("Backspace");
            await humanDelay(200, 400);
            await typeHuman(coverLetterInputElement, coverLetterText);
            logger.info("✍️ Cover letter filled.");
            await humanDelay();
          }

          const submitButtonSelector =
            'button[aria-label="Submit application"], button[aria-label="Submit"], button[data-control-name="submit_unify"], button[data-easyapply-submit-button]';
          const reviewButtonSelector =
            'button[aria-label="Review application"], button[aria-label="Review"], button[data-control-name="review_unify"]';
          const nextButtonSelector =
            'button[aria-label="Continue to next step"], button[aria-label="Next"], button[data-control-name="continue_unify"]';

          const submitButton = await page.$(submitButtonSelector);
          const reviewButton = await page.$(reviewButtonSelector);
          const nextButton = await page.$(nextButtonSelector);

          if (submitButton && (await submitButton.isIntersectingViewport())) {
            logger.info("✅ Found FINAL SUBMIT button. Clicking...");
            await page.evaluate(
              (el) =>
                el.scrollIntoView({ behavior: "smooth", block: "center" }),
              submitButton
            );
            await humanDelay();
            await submitButton.click();
            await humanDelay(4000, 6000);
            let submissionConfirmed = false;
            try {
              await page.waitForFunction(
                () => {
                  const successTexts = [
                    /application sent/i,
                    /submitted/i,
                    /you applied/i,
                    /thanks for applying/i,
                  ];
                  const elements = Array.from(
                    document.querySelectorAll(
                      '[id*="artdeco-modal"] h2, [role="alertdialog"] p, .jobs-easy-apply-confirmation__text, .artdeco-toast-item__message'
                    )
                  );
                  return elements.some((el) =>
                    successTexts.some((regex) => regex.test(el.innerText))
                  );
                },
                { timeout: 25000 }
              ); // Slightly longer confirmation timeout
              logger.success(
                `🚀 Application submission confirmed for: ${finalUrlToNavigate}`
              );
              submissionConfirmed = true;
              const doneButtonSelectors = [
                'button[aria-label*="Dismiss"]',
                'button[aria-label*="Done"]',
                'button[data-control-name*="dismiss"]',
              ];
              for (const selector of doneButtonSelectors) {
                const doneButton = await page.$(selector);
                if (doneButton && (await doneButton.isIntersectingViewport())) {
                  await doneButton.click();
                  logger.info("Clicked 'Done/Dismiss'.");
                  await humanDelay();
                  break;
                }
              }
            } catch (e) {
              logger.warn(
                `⚠️ Submitted, but explicit confirmation not found. Screenshot: submission_confirm_issue_${jobIdForFile}.png. Error: ${e.message}`
              );
              await page.screenshot({
                path: screenshotPath(
                  `submission_confirm_issue_${jobIdForFile}.png`
                ),
              });
              submissionConfirmed = true;
            }
            if (submissionConfirmed) {
              await appsCol.insertOne({
                jobId: _id,
                url: finalUrlToNavigate,
                title,
                company,
                appliedAt: new Date(),
                status: "Applied",
              });
              appliedCount++;
            }
            inApplicationModal = false;
          } else if (
            reviewButton &&
            (await reviewButton.isIntersectingViewport())
          ) {
            logger.info("Found REVIEW button. Clicking...");
            await page.evaluate(
              (el) =>
                el.scrollIntoView({ behavior: "smooth", block: "center" }),
              reviewButton
            );
            await humanDelay();
            await reviewButton.click();
          } else if (
            nextButton &&
            (await nextButton.isIntersectingViewport())
          ) {
            logger.info("Found NEXT button. Clicking...");
            await page.evaluate(
              (el) =>
                el.scrollIntoView({ behavior: "smooth", block: "center" }),
              nextButton
            );
            await humanDelay();
            await nextButton.click();
          } else {
            logger.warn(
              `🤷 No known action buttons found on step ${currentStep}. Screenshot: unknown_modal_state_${jobIdForFile}_${currentStep}.png`
            );
            await page.screenshot({
              path: screenshotPath(
                `unknown_modal_state_${jobIdForFile}_${currentStep}.png`
              ),
            });
            const closeButton = await page.$(
              'button[aria-label="Dismiss"], button[aria-label*="close" i], li-icon[type="cancel-icon"]'
            );
            if (closeButton && (await closeButton.isIntersectingViewport())) {
              logger.info("Attempting to close modal...");
              try {
                await closeButton.click();
                await humanDelay(1000, 2000);
              } catch (closeErr) {
                logger.warn(`Could not click close: ${closeErr.message}`);
              }
            }
            inApplicationModal = false;
            throw new Error(
              "Stuck in application modal: No actionable buttons."
            );
          }
          if (currentStep >= maxModalSteps) {
            logger.error(
              `🚫 Exceeded max modal steps (${maxModalSteps}). Screenshot: max_steps_exceeded_${jobIdForFile}.png`
            );
            await page.screenshot({
              path: screenshotPath(`max_steps_exceeded_${jobIdForFile}.png`),
            });
            inApplicationModal = false;
            throw new Error("Exceeded maximum steps in application modal.");
          }
        } // --- End modal loop ---
      } catch (err) {
        logger.error(
          `❌ Failed processing job ${finalUrlToNavigate}: ${err.message}`
        );
        if (page && !page.isClosed())
          await page.screenshot({
            path: screenshotPath(`error_job_${jobIdForFile}.png`),
          });
        await appsCol.updateOne(
          { jobId: _id },
          {
            $setOnInsert: {
              jobId: _id,
              url: finalUrlToNavigate,
              title,
              company,
              appliedAt: new Date(),
              status: "Error",
              error: err.message.substring(0, 500),
            },
          },
          { upsert: true }
        );
      }
      await humanDelay(4000, 7000); // Increased delay between jobs
    }
    logger.success(
      `🎯 Completed run. Attempted ${appliedCount} new application(s) in this session.`
    );
  } catch (error) {
    logger.error(
      `☣️ CRITICAL ERROR in runLinkedInBot: ${error.message}\n${error.stack}`
    );
    if (page && !page.isClosed())
      await page.screenshot({
        path: screenshotPath("critical_error_final.png"),
      });
  } finally {
    if (browser) {
      await browser.close();
      logger.info("🚪 Browser closed");
    }
    await client.close();
    logger.info("🔌 MongoDB connection closed");
  }
}

runLinkedInBot().catch((err) => {
  logger.error(`☠️ Unhandled rejection or error: ${err.message}\n${err.stack}`);
  process.exit(1);
});
