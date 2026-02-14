import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import {
  FiArrowRight,
  FiBriefcase,
  FiClock,
  FiFileText,
  FiTrendingUp,
  FiUser,
} from "react-icons/fi";
import { useNavigate } from "react-router-dom";

export default function Dashboard() {
  const [dashboardData, setDashboardData] = useState({
    stats: null,
    loading: true,
    error: null,
  });
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const nav = useNavigate();

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          throw new Error("Not authenticated");
        }

        const res = await fetch("/api/dashboard", {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.status === 401 || res.status === 403) {
          localStorage.removeItem("token");
          nav("/login");
          return;
        }

        if (!res.ok) {
          const { message } = await res.json();
          throw new Error(message || "Failed to load dashboard");
        }

        const stats = await res.json();
        setDashboardData({ stats, loading: false, error: null });
      } catch (err) {
        if (err.message === "Not authenticated") {
          nav("/login");
          return;
        }
        setDashboardData({ stats: null, loading: false, error: err.message });
      }
    };

    fetchDashboard();
  }, []);

  const statsVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  if (dashboardData.error) {
    return (
      <div className="bg-gray-900 min-h-screen p-8 sm:p-12 flex items-center justify-center">
        <div className="text-center text-red-400">
          <div className="text-xl">Error: {dashboardData.error}</div>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-gray-800 rounded-lg hover:bg-gray-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-900 min-h-screen p-8 sm:p-12">
      {/* Header */}
      <div className="flex justify-between items-center mb-12">
        <div>
          <motion.h1
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent"
          >
            {dashboardData.loading ? (
              <div className="h-8 bg-gray-800 rounded w-64 animate-pulse" />
            ) : (
              `Welcome Back, ${dashboardData.stats.userName}!`
            )}
          </motion.h1>
          <div className="text-gray-400 mt-2">
            {dashboardData.loading ? (
              <div className="h-4 bg-gray-800 rounded w-48 animate-pulse" />
            ) : (
              "Your job search at a glance"
            )}
          </div>
        </div>

        {/* Profile Dropdown */}
        <div className="relative">
          <motion.button
            onClick={() => setShowProfileDropdown((v) => !v)}
            className="p-2 bg-gray-800 rounded-full hover:bg-gray-700 transition-all"
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
                <button className="flex items-center w-full px-4 py-2 text-gray-300 hover:bg-gray-700 transition-colors">
                  <FiUser className="mr-2" /> Profile
                </button>
                <button
                  onClick={() => nav("/history")}
                  className="flex items-center w-full px-4 py-2 text-gray-300 hover:bg-gray-700 transition-colors"
                >
                  <FiClock className="mr-2" /> History
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
        {dashboardData.loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <motion.div
              key={i}
              className="bg-gray-800 p-6 rounded-2xl shadow-xl h-40 animate-pulse"
            />
          ))
        ) : (
          <>
            <motion.div
              variants={statsVariants}
              className="bg-gray-800 p-6 rounded-2xl shadow-xl"
            >
              <div className="flex items-center mb-4">
                <div className="p-3 bg-blue-500/20 rounded-lg mr-4">
                  <FiBriefcase className="w-6 h-6 text-blue-400" />
                </div>
                <h2 className="text-xl font-semibold">Applications</h2>
              </div>
              <div className="flex justify-between items-end">
                <p className="text-4xl font-bold">
                  {dashboardData.stats.totalApplied}
                </p>
                <span className="text-gray-400">Total submissions</span>
              </div>
            </motion.div>

            <motion.div
              variants={statsVariants}
              className="bg-gray-800 p-6 rounded-2xl shadow-xl"
            >
              <div className="flex items-center mb-4">
                <div className="p-3 bg-purple-500/20 rounded-lg mr-4">
                  <FiTrendingUp className="w-6 h-6 text-purple-400" />
                </div>
                <h2 className="text-xl font-semibold">Success Rate</h2>
              </div>
              <div className="flex justify-between items-end">
                <p className="text-4xl font-bold">
                  {dashboardData.stats.successRate}%
                </p>
                <div className="w-1/3 bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-blue-400 to-purple-500 h-2 rounded-full"
                    style={{ width: `${dashboardData.stats.successRate}%` }}
                  />
                </div>
              </div>
            </motion.div>

            <motion.div
              variants={statsVariants}
              className="bg-gray-800 p-6 rounded-2xl shadow-xl"
            >
              <div className="flex items-center mb-4">
                <div className="p-3 bg-green-500/20 rounded-lg mr-4">
                  <FiClock className="w-6 h-6 text-green-400" />
                </div>
                <h2 className="text-xl font-semibold">Last Applied</h2>
              </div>
              <div className="flex justify-between items-end">
                <p className="text-4xl font-bold">
                  {new Date(dashboardData.stats.lastApplied).toLocaleDateString(
                    "en-US",
                    {
                      month: "short",
                      day: "numeric",
                    }
                  )}
                </p>
                <span className="text-gray-400">
                  {dashboardData.stats.lastAppliedCompany}
                </span>
              </div>
            </motion.div>
          </>
        )}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <motion.button
          onClick={() => nav("/preferences")}
          whileHover={{ scale: 1.02 }}
          className="bg-gray-800 p-6 rounded-2xl shadow-xl text-left group hover:bg-gray-700 transition-all"
        >
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-xl font-semibold mb-2">
                {dashboardData.loading ? (
                  <div className="h-6 bg-gray-700 rounded w-48 animate-pulse" />
                ) : (
                  "Resume & Preferences"
                )}
              </h3>
              <div className="text-gray-400">
                {dashboardData.loading ? (
                  <div className="h-4 bg-gray-700 rounded w-64 animate-pulse" />
                ) : (
                  "Update your profile and application settings"
                )}
              </div>
            </div>
            <div
              className={`p-3 bg-blue-500/20 rounded-lg ${!dashboardData.loading && "group-hover:bg-blue-500/30"
                } transition-all`}
            >
              {dashboardData.loading ? (
                <div className="w-6 h-6 bg-gray-700 rounded" />
              ) : (
                <FiFileText className="w-6 h-6 text-blue-400" />
              )}
            </div>
          </div>
        </motion.button>

        <motion.button
          onClick={() => nav("/history")}
          whileHover={{ scale: 1.02 }}
          className="bg-gray-800 p-6 rounded-2xl shadow-xl text-left group hover:bg-gray-700 transition-all"
        >
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-xl font-semibold mb-2">
                {dashboardData.loading ? (
                  <div className="h-6 bg-gray-700 rounded w-48 animate-pulse" />
                ) : (
                  "Application History"
                )}
              </h3>
              <div className="text-gray-400">
                {dashboardData.loading ? (
                  <div className="h-4 bg-gray-700 rounded w-64 animate-pulse" />
                ) : (
                  "View your complete application timeline"
                )}
              </div>
            </div>
            <div
              className={`p-3 bg-purple-500/20 rounded-lg ${!dashboardData.loading && "group-hover:bg-purple-500/30"
                } transition-all`}
            >
              {dashboardData.loading ? (
                <div className="w-6 h-6 bg-gray-700 rounded" />
              ) : (
                <FiArrowRight className="w-6 h-6 text-purple-400" />
              )}
            </div>
          </div>
        </motion.button>
      </div>
    </div>
  );
}
