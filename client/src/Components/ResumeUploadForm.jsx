// src/components/ResumeUploadForm.jsx
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import {
  FiCheckCircle,
  FiClock,
  FiFile,
  FiLayers,
  FiUpload,
  FiUser,
} from "react-icons/fi";
export default function ResumeUploadForm() {
  const [jobListings, setJobListings] = useState([]);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    roles: [],
    locations: [],
    jobType: "",
    platforms: [],
    keywords: "",
    applicationFrequency: "Daily",
    experience: "",
    expectedCtc: "",
    resume: null,
    registrationLink: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [viewPdf, setViewPdf] = useState(null);
  const [isDragging, setIsDragging] = useState(false);

  const roleOptions = [
    "Software Developer",
    "SDE Intern",
    "Frontend Engineer",
    "Backend Engineer",
    "Full Stack Developer",
  ];
  const locationOptions = ["Remote", "Pune", "Bangalore", "Hyderabad", "Delhi"];
  const platformOptions = [
    "Naukri",
    "LinkedIn",
    "Superset",
    "Indeed",
    "AngelList",
  ];
  const jobTypeOptions = ["Full-time", "Internship", "Freelance"];
  const frequencyOptions = ["Daily", "Weekly", "Every 3 Days"];

  const sectionVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
  };

  const handleMultiSelect = (name, value) => {
    setFormData((prev) => ({
      ...prev,
      [name]: prev[name].includes(value)
        ? prev[name].filter((item) => item !== value)
        : [...prev[name], value],
    }));
  };

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (name === "resume") {
      const file = files[0];
      setFormData((fd) => ({ ...fd, resume: file }));
      setViewPdf(file ? URL.createObjectURL(file) : null);
    } else {
      setFormData((fd) => ({ ...fd, [name]: value }));
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };
  const handleDragLeave = () => setIsDragging(false);
  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type === "application/pdf") {
      setFormData((fd) => ({ ...fd, resume: file }));
      setViewPdf(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const token = localStorage.getItem("token");

      // Build only the required payload for your job-search service
      const payload = {
        roles: formData.roles, // e.g. ["Frontend Engineer"]
        locations: formData.locations, // e.g. ["Bangalore"]
        platforms: formData.platforms, // e.g. ["jsearch", "LinkedIn"]
        keywords: formData.keywords, // e.g. "React"
        numPagesJSearch: formData.numPagesJSearch || 1,
      };

      // Trigger your job-search microservice
      const res = await fetch("http://localhost:5002/api/scrape", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Job search trigger failed");
      const json = await res.json();

      console.log("✅ Job search response:", json);
      setJobListings(json.listings || []); // Expect `listings` array back
      // You can also read json.totalFetched, json.newlyAdded, etc.

      // Optionally clear form / reset state here
      setFormData({
        name: "",
        email: "",
        roles: [],
        locations: [],
        jobType: "",
        platforms: [],
        keywords: "",
        applicationFrequency: "Daily",
        experience: "",
        expectedCtc: "",
        resume: null,
        registrationLink: "",
        numPagesJSearch: 1,
      });
      setViewPdf(null);
    } catch (err) {
      console.error("Submission error:", err);
      alert(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    const handler = (e) => {
      if (!e.target.closest(".profile-dropdown")) setShowProfileDropdown(false);
    };
    window.addEventListener("click", handler);
    return () => window.removeEventListener("click", handler);
  }, []);

  return (
    <div className="flex-1 w-full bg-gray-900 py-16 px-4 sm:px-6 lg:px-8 min-h-screen">
      {/* Profile Dropdown */}
      <div className="absolute top-4 right-4 profile-dropdown">
        <motion.button
          onClick={() => setShowProfileDropdown((v) => !v)}
          className="p-2 bg-gray-800 rounded-full hover:bg-gray-700"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <FiUser className="w-6 h-6 text-gray-300" />
        </motion.button>
        <AnimatePresence>
          {showProfileDropdown && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute right-0 mt-2 w-48 bg-gray-800 rounded-lg shadow-xl py-2 z-10"
            >
              <button className="flex items-center w-full px-4 py-2 text-gray-300 hover:bg-gray-700">
                <FiClock className="mr-2" /> History
              </button>
              <button className="flex items-center w-full px-4 py-2 text-gray-300 hover:bg-gray-700">
                <FiFile className="mr-2" /> Documents
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent mb-4">
            Job Registration Portal
          </h1>
          <p className="text-gray-400 max-w-2xl mx-auto">
            Transform your career journey with seamless job applications
          </p>
        </motion.div>

        <form onSubmit={handleSubmit} className="space-y-12">
          {/* Personal Information */}
          <motion.div
            variants={sectionVariants}
            initial="hidden"
            animate="visible"
            className="bg-gray-800 rounded-2xl p-8 shadow-xl"
          >
            <div className="flex items-center mb-6">
              <FiUser className="w-6 h-6 text-blue-400 mr-2" />
              <h2 className="text-xl font-semibold text-gray-200">
                Personal Information
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Name */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-300">
                  Full Name
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  placeholder="John Doe"
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-100 placeholder-gray-400 transition"
                />
              </div>
              {/* Email */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-300">
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  placeholder="john@example.com"
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-100 placeholder-gray-400 transition"
                />
              </div>
            </div>
          </motion.div>

          {/* Job Preferences */}
          {/* Job Preferences Section */}
          <motion.div
            variants={sectionVariants}
            initial="hidden"
            animate="visible"
            className="bg-gray-800 rounded-2xl p-8 shadow-xl"
          >
            <div className="flex items-center mb-6">
              <FiLayers className="w-6 h-6 text-purple-400 mr-2" />
              <h2 className="text-xl font-semibold text-gray-200">
                Job Preferences
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Roles Multi-Select */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-300">
                  Target Roles
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {roleOptions.map((role) => (
                    <label
                      key={role}
                      className={`flex items-center space-x-2 p-2 rounded-lg cursor-pointer transition-colors ${
                        formData.roles.includes(role)
                          ? "bg-blue-500/20 border border-blue-500"
                          : "bg-gray-700 hover:bg-gray-600"
                      }`}
                    >
                      <input
                        type="checkbox"
                        className="hidden"
                        checked={formData.roles.includes(role)}
                        onChange={() => handleMultiSelect("roles", role)}
                      />
                      <span className="text-gray-100 text-sm">{role}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Location Preference */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-300">
                  Preferred Locations
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {locationOptions.map((location) => (
                    <label
                      key={location}
                      className={`flex items-center space-x-2 p-2 rounded-lg cursor-pointer transition-colors ${
                        formData.locations.includes(location)
                          ? "bg-purple-500/20 border border-purple-500"
                          : "bg-gray-700 hover:bg-gray-600"
                      }`}
                    >
                      <input
                        type="checkbox"
                        className="hidden"
                        checked={formData.locations.includes(location)}
                        onChange={() =>
                          handleMultiSelect("locations", location)
                        }
                      />
                      <span className="text-gray-100 text-sm">{location}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Job Type Dropdown */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-300">
                  Job Type
                </label>
                <select
                  name="jobType"
                  value={formData.jobType}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-100 transition-all"
                >
                  <option value="">Select Job Type</option>
                  {jobTypeOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>

              {/* Application Frequency */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-300">
                  Application Frequency
                </label>
                <select
                  name="applicationFrequency"
                  value={formData.applicationFrequency}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-100 transition-all"
                >
                  {frequencyOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>

              {/* Platforms Multi-Select */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-300">
                  Job Platforms
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {platformOptions.map((platform) => (
                    <label
                      key={platform}
                      className={`flex items-center space-x-2 p-2 rounded-lg cursor-pointer transition-colors ${
                        formData.platforms.includes(platform)
                          ? "bg-green-500/20 border border-green-500"
                          : "bg-gray-700 hover:bg-gray-600"
                      }`}
                    >
                      <input
                        type="checkbox"
                        className="hidden"
                        checked={formData.platforms.includes(platform)}
                        onChange={() =>
                          handleMultiSelect("platforms", platform)
                        }
                      />
                      <span className="text-gray-100 text-sm">{platform}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Keywords Input */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-300">
                  Keywords/Filters
                </label>
                <input
                  type="text"
                  name="keywords"
                  value={formData.keywords}
                  onChange={handleChange}
                  placeholder="e.g. React, Python, Machine Learning"
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-100 placeholder-gray-400 transition-all"
                />
              </div>
            </div>
          </motion.div>

          {/* Resume Upload Section */}
          <motion.div
            variants={sectionVariants}
            initial="hidden"
            animate="visible"
            className="bg-gray-800 rounded-2xl p-8 shadow-xl"
          >
            <div className="flex items-center mb-6">
              <FiUpload className="w-6 h-6 text-green-400 mr-2" />
              <h2 className="text-xl font-semibold text-gray-200">
                Resume Upload
              </h2>
            </div>

            <div className="space-y-4">
              <div
                className={`flex items-center justify-center w-full border-2 border-dashed rounded-2xl cursor-pointer transition-all ${
                  isDragging
                    ? "border-blue-500 bg-gray-700"
                    : "border-gray-600 bg-gray-700 hover:bg-gray-600"
                }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <label className="flex flex-col w-full h-32 items-center justify-center">
                  <motion.div
                    animate={{ y: isDragging ? 2 : 0 }}
                    className="flex flex-col items-center"
                  >
                    <FiUpload
                      className={`w-8 h-8 ${
                        isDragging ? "text-blue-400" : "text-gray-400"
                      } transition-colors`}
                    />
                    <p
                      className={`pt-1 text-sm ${
                        isDragging ? "text-blue-300" : "text-gray-400"
                      } transition-colors`}
                    >
                      {formData.resume
                        ? formData.resume.name
                        : "Drag & drop or click to upload PDF"}
                    </p>
                  </motion.div>
                  <input
                    type="file"
                    name="resume"
                    accept=".pdf"
                    onChange={handleChange}
                    className="opacity-0"
                  />
                </label>
              </div>

              <AnimatePresence>
                {viewPdf && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="mt-4"
                  >
                    <a
                      href={viewPdf}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-400 hover:text-blue-300 flex items-center group"
                    >
                      <FiFile className="mr-2 transition-transform group-hover:rotate-12" />
                      <span className="border-b border-transparent group-hover:border-blue-300">
                        View Uploaded PDF
                      </span>
                    </a>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>

          {/* Submit Button */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center"
          >
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full max-w-xl mx-auto py-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold rounded-2xl hover:scale-[1.02] shadow-2xl transition"
            >
              {isSubmitting ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 1 }}
                  className="w-5 h-5 border-2 border-white rounded-full border-t-transparent mx-auto"
                />
              ) : (
                <FiCheckCircle className="inline-block w-5 h-5 mr-2" />
              )}
              {isSubmitting ? "Processing..." : "Complete Registration"}
            </button>
          </motion.div>
        </form>
      </div>
    </div>
  );
}
