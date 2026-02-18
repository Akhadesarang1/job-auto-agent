"use strict";
require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");

// Routes
const authRoutes = require("./routes/authRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const uploadRoutes = require("./routes/uploadRoutes");

const app = express();
const PORT = process.env.PORT || 5000;

// ─── Middleware ─────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());
// Optional: Serve uploads statically if the frontend needs to access them directly
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ─── MongoDB Connection ─────────────────────────────────────────────
mongoose
  .connect(process.env.MONGO_URI, { dbName: "job-auto-agent" })
  .then(() => console.log("✅ Connected to MongoDB"))
  .catch((err) => console.error("❌ DB connection error:", err));

// ─── Routes ─────────────────────────────────────────────────────────
app.use("/api", authRoutes); // Handles /api/signup, /api/login
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/upload", uploadRoutes);

// ─── Start Server ───────────────────────────────────────────────────
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
