import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import {
  FiArrowLeft,
  FiCheckCircle,
  FiClock,
  FiDownload,
  FiXCircle,
} from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import {
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const MOCK_HISTORY = [
  {
    id: 1,
    jobTitle: "Senior React Developer",
    company: "Tech Corp",
    status: "success",
    type: "Application",
    appliedOn: "2023-07-25",
  },
  {
    id: 2,
    jobTitle: "ML Engineer",
    company: "AI Startups",
    status: "pending",
    type: "Analysis",
    appliedOn: "2023-07-24",
  },
  {
    id: 3,
    jobTitle: "Backend Engineer",
    company: "Cloud Systems",
    status: "failed",
    type: "Application",
    appliedOn: "2023-07-23",
  },
];

const COLORS = ["#60a5fa", "#fbbf24", "#ef4444"];

export default function HistoryPage() {
  const navigate = useNavigate();
  const [apps, setApps] = useState([]);
  const [selectedFilter, setSelectedFilter] = useState("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setTimeout(() => {
      setApps(MOCK_HISTORY);
      setLoading(false);
    }, 1500);
  }, []);

  const statusData = Object.entries(
    apps.reduce((acc, app) => {
      acc[app.status] = (acc[app.status] || 0) + 1;
      return acc;
    }, {})
  ).map(([name, value]) => ({ name, value }));

  const weeklyData = [
    { week: "Week 1", applications: 4, success: 3 },
    { week: "Week 2", applications: 6, success: 4 },
    { week: "Week 3", applications: 5, success: 2 },
  ];

  const filteredApps = apps.filter((app) =>
    selectedFilter === "all" ? true : app.status === selectedFilter
  );

  return (
    <div className="bg-gray-900 min-h-screen p-8 sm:p-12 text-gray-200">
      <div className="max-w-7xl mx-auto">
        {/* Back to Dashboard */}
        <button
          onClick={() => navigate("/dashboard")}
          className="mb-6 flex items-center text-blue-400 hover:text-blue-300"
        >
          <FiArrowLeft className="mr-2" />
          Back to Dashboard
        </button>

        {/* Title */}
        <motion.h1
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent mb-8"
        >
          Application History
        </motion.h1>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gray-800 p-6 rounded-2xl">
            <h3 className="text-gray-300 mb-2">Total Activities</h3>
            <p className="text-4xl font-bold">{apps.length}</p>
          </div>
          <div className="bg-gray-800 p-6 rounded-2xl">
            <h3 className="text-gray-300 mb-2">Success Rate</h3>
            <p className="text-4xl font-bold">
              {apps.length > 0
                ? Math.round(
                    (apps.filter((a) => a.status === "success").length /
                      apps.length) *
                      100
                  )
                : 0}
              %
            </p>
          </div>
          <div className="bg-gray-800 p-6 rounded-2xl">
            <h3 className="text-gray-300 mb-2">Recent Activity</h3>
            <p className="text-xl">
              {apps[0]
                ? new Date(apps[0].appliedOn).toLocaleDateString()
                : "N/A"}
            </p>
          </div>
        </div>

        {/* Filters and Charts */}
        <div className="bg-gray-800 rounded-2xl p-6 mb-8">
          <div className="flex flex-wrap gap-4 mb-6">
            {["all", "success", "pending", "failed"].map((filter) => (
              <button
                key={filter}
                onClick={() => setSelectedFilter(filter)}
                className={`px-4 py-2 rounded-full flex items-center gap-2 ${
                  selectedFilter === filter
                    ? "bg-blue-500 text-white"
                    : "bg-gray-700 hover:bg-gray-600"
                }`}
              >
                {filter === "success" && <FiCheckCircle />}
                {filter === "pending" && <FiClock />}
                {filter === "failed" && <FiXCircle />}
                {filter.charAt(0).toUpperCase() + filter.slice(1)}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-gray-700 p-4 rounded-xl">
              <h4 className="text-center mb-4 font-semibold">
                Status Distribution
              </h4>
              <PieChart width={400} height={200}>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={index} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </div>

            <div className="bg-gray-700 p-4 rounded-xl">
              <h4 className="text-center mb-4 font-semibold">
                Weekly Applications
              </h4>
              <BarChart width={400} height={200} data={weeklyData}>
                <XAxis dataKey="week" stroke="#fff" />
                <YAxis stroke="#fff" />
                <Tooltip />
                <Bar dataKey="applications" fill="#60a5fa" />
                <Bar dataKey="success" fill="#4ade80" />
              </BarChart>
            </div>
          </div>
        </div>

        {/* Application List */}
        <div className="space-y-4">
          {loading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="bg-gray-800 p-4 rounded-lg animate-pulse h-20"
              />
            ))
          ) : filteredApps.length > 0 ? (
            filteredApps.map((app) => (
              <motion.div
                key={app.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-gray-800 p-6 rounded-xl shadow-lg flex flex-col sm:flex-row justify-between items-start sm:items-center hover:bg-gray-700 transition-colors"
              >
                <div className="mb-2 sm:mb-0">
                  <h3 className="font-semibold text-lg">{app.jobTitle}</h3>
                  <p className="text-gray-400">{app.company}</p>
                </div>

                <div className="flex items-center gap-4">
                  <span
                    className={`px-3 py-1 rounded-full text-sm ${
                      app.status === "success"
                        ? "bg-green-500/20 text-green-400"
                        : app.status === "pending"
                        ? "bg-yellow-500/20 text-yellow-400"
                        : "bg-red-500/20 text-red-400"
                    }`}
                  >
                    {app.status}
                  </span>
                  <p className="text-gray-400 text-sm">
                    {new Date(app.appliedOn).toLocaleDateString()}
                  </p>
                  <button className="text-blue-400 hover:text-blue-300">
                    <FiDownload size={18} />
                  </button>
                </div>
              </motion.div>
            ))
          ) : (
            <div className="text-center py-12 text-gray-400">
              No activities found for this filter
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
