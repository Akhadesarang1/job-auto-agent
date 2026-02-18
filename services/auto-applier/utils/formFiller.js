const path = require("path");

// Types text character by character with a bit of randomness
async function typeHuman(page, selector, text) {
  await page.waitForSelector(selector, { visible: true });
  await page.focus(selector);
  await page.evaluate((sel) => {
    const el = document.querySelector(sel);
    if (el) el.value = "";
  }, selector);
  for (const char of text) {
    await page.type(selector, char, { delay: 100 + Math.random() * 100 });
  }
}

// Uploads the resume file (path relative to project root)
async function uploadResume(page, selector, resumePath) {
  await page.waitForSelector(selector, { visible: true });
  const input = await page.$(selector);
  const fullPath = path.resolve(process.cwd(), resumePath);
  await input.uploadFile(fullPath);
}

module.exports = {
  typeHuman,
  uploadResume,
};
