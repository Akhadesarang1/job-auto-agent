require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const path = require("path");
const axios = require("axios");
const FormData = require("form-data");
const fs = require("fs");

const app = express();
const PORT = process.env.PORT || 5000;

// ─── Middleware ─────────────────────────────────────────────────────
console.log("🔧 Setting up middleware...");
app.use(cors());
app.use(express.json());

// ─── MongoDB Connection ─────────────────────────────────────────────
console.log("🧬 Connecting to MongoDB...");
mongoose
  .connect(process.env.MONGO_URI, { dbName: "job-auto-agent" })
  .then(() => console.log("✅ Main server connected to MongoDB"))
  .catch((err) => console.error("❌ Main server DB connection error:", err));

// ─── Models ─────────────────────────────────────────────────────────
console.log("📦 Initializing Mongoose models...");
const userSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  password: String,
});
const User = mongoose.model("User", userSchema);

const registrationSchema = new mongoose.Schema({
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
  createdAt: { type: Date, default: Date.now },
});
const Registration = mongoose.model("Registration", registrationSchema);

const applicationSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  company: String,
  status: {
    type: String,
    enum: ["applied", "interview", "offer", "rejected"],
    default: "applied",
  },
  appliedAt: { type: Date, default: Date.now },
});
const Application = mongoose.model("Application", applicationSchema);

const jobListingSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  title: String,
  company: String,
  location: String,
  url: String,
  description: String,
  scrapedAt: { type: Date, default: Date.now },
});
const JobListing = mongoose.model("JobListing", jobListingSchema);

// ─── Auth Helpers ───────────────────────────────────────────────────
console.log("🔐 Setting up auth middleware...");
const createToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "3d" });

const auth = (req, res, next) => {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    console.log("🚫 Auth failed: No Bearer token");
    return res.status(401).json({ message: "Unauthorized" });
  }
  try {
    const token = header.split(" ")[1];
    const { id } = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = id;
    next();
  } catch (err) {
    console.log("🚫 Auth failed: Invalid token");
    res.status(401).json({ message: "Invalid token" });
  }
};

// ─── Multer Setup ────────────────────────────────────────────────────
console.log("📂 Configuring multer for file uploads...");
const storage = multer.diskStorage({
  destination: path.join(__dirname, "uploads"),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `resume-${req.userId}-${Date.now()}${ext}`);
  },
});
const upload = multer({ storage });

// ─── Routes ──────────────────────────────────────────────────────────

// Signup
app.post("/api/signup", async (req, res) => {
  try {
    console.log("📝 Signup attempt:", req.body.email);
    const { name, email, password } = req.body;
    if (await User.findOne({ email })) {
      console.log("⚠️ User already exists:", email);
      return res.status(400).json({ message: "User already exists" });
    }
    const user = await User.create({ name, email, password });
    console.log("✅ User registered:", user._id);
    res.status(201).json({ message: "User registered", userId: user._id });
  } catch (err) {
    console.error("❌ Signup error:", err);
    res.status(400).json({ message: err.message });
  }
});

// Login
app.post("/api/login", async (req, res) => {
  try {
    console.log("🔐 Login attempt:", req.body.email);
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user || user.password !== password) {
      console.log("🚫 Invalid login credentials:", email);
      return res.status(401).json({ message: "Invalid credentials" });
    }
    const token = createToken(user._id);
    console.log("✅ Login successful:", user._id);
    res.json({ token });
  } catch (err) {
    console.error("❌ Login error:", err);
    res.status(500).json({ message: err.message });
  }
});

// Dashboard Stats
app.get("/api/dashboard", auth, async (req, res) => {
  try {
    console.log("📊 Fetching dashboard stats for:", req.userId);
    const apps = await Application.find({ user: req.userId }).sort({
      appliedAt: -1,
    });
    const totalApplied = apps.length;
    const offers = apps.filter((a) => a.status === "offer").length;
    const successRate = totalApplied
      ? Math.round((offers / totalApplied) * 100)
      : 0;
    const last = apps[0];
    res.json({
      totalApplied,
      successRate,
      lastApplied: last?.appliedAt || null,
      lastAppliedCompany: last?.company || null,
    });
  } catch (err) {
    console.error("❌ Dashboard fetch error:", err);
    res.status(500).json({ message: err.message });
  }
});

// Upload → Parse → Tailor
app.post("/api/upload", auth, upload.single("resume"), async (req, res) => {
  try {
    console.log("📤 Resume upload initiated by:", req.userId);

    if (!req.file) {
      console.log("⚠️ No resume file uploaded");
      return res.status(400).json({ message: "No resume file uploaded" });
    }

    console.log("📁 Resume file saved at:", req.file.path);

    const b = req.body;
    const toArr = (key) =>
      Array.isArray(b[key]) ? b[key] : b[key] ? [b[key]] : [];

    console.log("🗃️ Saving registration data...");
    const reg = await Registration.create({
      user: req.userId,
      name: b.name,
      email: b.email,
      roles: toArr("roles"),
      locations: toArr("locations"),
      jobType: b.jobType,
      platforms: toArr("platforms"),
      keywords: b.keywords,
      applicationFrequency: b.applicationFrequency,
      experience: b.experience,
      expectedCtc: b.expectedCtc,
      registrationLink: b.registrationLink,
      resumePath: req.file.path,
    });

    console.log("📨 Sending resume to resume-parser microservice...");
    const parseForm = new FormData();
    parseForm.append("file", fs.createReadStream(req.file.path), {
      filename: path.basename(req.file.path),
      contentType: "application/pdf",
    });
    parseForm.append("registrationId", reg._id.toString());

    const parseResp = await axios.post(
      `${process.env.RESUME_PARSER_URL || "http://localhost:5001"}/parse`,
      parseForm,
      { headers: parseForm.getHeaders() }
    );
    const parsedText = parseResp.data.text;
    console.log("📄 Resume parsed successfully");

    const pseudoJD = `
Position(s): ${reg.roles.join(", ")}
Location(s): ${reg.locations.join(", ")}
Job Type: ${reg.jobType}
Experience: ${reg.experience}
Expected CTC: ${reg.expectedCtc}
Keywords: ${reg.keywords}
Registration Link: ${reg.registrationLink}
    `.trim();

    console.log("🤖 Sending resume + JD to LLM agent...");
    const llmForm = new FormData();
    llmForm.append("resume", parsedText);
    llmForm.append("job_description", pseudoJD);

    const llmResp = await axios.post(`${process.env.LLM_AGENT_URL || "http://localhost:5005"}/tailor`, llmForm, {
      headers: llmForm.getHeaders(),
    });

    console.log("✅ Tailored resume received from LLM");

    res.status(200).json({
      message: "Uploaded → parsed → tailored!",
      registrationId: reg._id,
      parsedText,
      tailoredResume: llmResp.data.tailored_resume,
    });
  } catch (err) {
    console.error("❌ /api/upload error:", err);
    res.status(500).json({ message: err.toString() });
  }
});

// Job Search
app.post("/api/search-jobs", auth, async (req, res) => {
  try {
    console.log("🔍 Initiating job scrape for:", req.userId);
    const response = await axios.post(
      `${process.env.JOB_SEARCH_URL || "http://localhost:5002"}/api/scrape`,
      req.body
    );
    const jobs = response.data.jobs || [];

    console.log(`📝 ${jobs.length} job(s) found, saving to DB...`);

    const docs = await Promise.all(
      jobs.map((j) =>
        JobListing.create({
          user: req.userId,
          title: j.title,
          company: j.company,
          location: j.location,
          url: j.url,
          description: j.description,
        })
      )
    );

    console.log("✅ Job listings saved");
    res.json({ message: "Jobs scraped & saved", listings: docs });
  } catch (err) {
    console.error("❌ Job scrape error:", err);
    res.status(500).json({ message: err.toString() });
  }
});

// ─── Start Server ────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`🚀 Server running: http://localhost:${PORT}`);
});
