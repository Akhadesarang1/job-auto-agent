const mongoose = require("mongoose");

const jobSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  title: String,
  company: String,
  location: String,
  url: String,
  description: String,
  scrapedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Job", jobSchema);
