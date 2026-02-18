const Registration = require("../models/Registration");
const Job = require("../models/Job");
const axios = require("axios");
const FormData = require("form-data");
const fs = require("fs");

const PARSER_URL = process.env.RESUME_PARSER_URL || "http://localhost:5001/parse";
const TAILOR_URL = process.env.LLM_AGENT_URL || "http://localhost:5005/tailor";

exports.uploadResume = async (req, res) => {
  console.log("📂 Upload request received");
  console.log("Headers content-type:", req.headers["content-type"]);
  console.log("Req.file:", req.file);
  console.log("Req.body keys:", Object.keys(req.body));
  try {
    if (!req.file) {
        console.error("❌ No file in request");
        return res.status(400).json({ message: "No file received by server" });
    }
    const b = req.body;
    const reg = await Registration.create({
      user: req.userId,
      name: b.name,
      email: b.email,
      roles: Array.isArray(b.roles) ? b.roles : [b.roles].filter(Boolean),
      locations: Array.isArray(b.locations)
        ? b.locations
        : [b.locations].filter(Boolean),
      jobType: b.jobType,
      platforms: Array.isArray(b.platforms)
        ? b.platforms
        : [b.platforms].filter(Boolean),
      keywords: b.keywords,
      applicationFrequency: b.applicationFrequency,
      experience: b.experience,
      expectedCtc: b.expectedCtc,
      registrationLink: b.registrationLink,
      resumePath: req.file.path,
    });

    // parse
    const parseForm = new FormData();
    parseForm.append("file", fs.createReadStream(req.file.path));
    parseForm.append("registrationId", reg._id.toString());

    let parsedText = "";
    try {
        const parseRes = await axios.post(PARSER_URL, parseForm, {
            headers: parseForm.getHeaders(),
        });
        parsedText = parseRes.data.text;
    } catch (e) {
        console.error("Parser service error:", e.message);
        parsedText = "Error parsing resume text.";
        // fallback or return error? Original code crashed.
    }

    // fetch JD or fallback
    const job = await Job.findOne({ url: reg.registrationLink });
    const pseudoJD = `Position(s): ${reg.roles.join(
      ", "
    )}\nLocation(s): ${reg.locations.join(", ")}\nJob Type: ${
      reg.jobType
    }\nExperience: ${reg.experience}\nExpected CTC: ${
      reg.expectedCtc
    }\nKeywords: ${reg.keywords}\nRegistration Link: ${reg.registrationLink}`;
    const jobDescription = job?.description || pseudoJD;

    // tailor
    const llmForm = new FormData();
    llmForm.append("resume", parsedText);
    llmForm.append("job_description", jobDescription);

    let tailored = "", fullName = "", phone = "", skills = [];

    try {
        const llmRes = await axios.post(TAILOR_URL, llmForm, {
            headers: llmForm.getHeaders(),
        });
        tailored = llmRes.data.tailored_resume;
        fullName = llmRes.data.fullName;
        phone = llmRes.data.phone;
        skills = llmRes.data.skills;
    } catch (e) {
         console.error("LLM service error:", e.message);
         tailored = "Error tailoring resume.";
    }

    // save
    reg.tailoredResume = tailored;
    reg.fullName = fullName;
    reg.phone = phone;
    reg.skills = Array.isArray(skills) ? skills : [skills].filter(Boolean);
    await reg.save();

    res.json({
      registrationId: reg._id,
      parsedText,
      tailored,
      fullName,
      phone,
      skills,
    });
  } catch (err) {
    res.status(500).json({ message: err.toString() });
  }
};
