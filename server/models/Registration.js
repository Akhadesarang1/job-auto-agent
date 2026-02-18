const mongoose = require("mongoose");

const registrationSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    name: String,
    email: String,
    fullName: String,
    phone: String,
    skills: [String],
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
    tailoredResume: String,
  },
  { timestamps: true }
);

module.exports = mongoose.model("Registration", registrationSchema);
