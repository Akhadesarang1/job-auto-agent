#!/usr/bin/env node
require("dotenv").config();
const runLinkedInBot = require("./linkedInBot");
const logger = require("./utils/logger");

(async () => {
  logger.info("🚀 [Auto-Applier] Starting LinkedIn Auto-Apply Bot...");
  try {
    await runLinkedInBot();
    logger.success("✅ [Auto-Applier] Finished successfully.");
    process.exit(0);
  } catch (err) {
    logger.error("❌ [Auto-Applier] Run failed:", err);
    process.exit(1);
  }
})();
