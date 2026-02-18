const Application = require("../models/Application");
const Registration = require("../models/Registration");

exports.getDashboardStats = async (req, res) => {
  try {
    const apps = await Application.find({ user: req.userId }).sort({
      appliedAt: -1,
    });
    const totalApplied = apps.length;
    const offers = apps.filter((a) => a.status === "offer").length;
    res.json({
      totalApplied,
      successRate: totalApplied ? Math.round((offers / totalApplied) * 100) : 0,
      lastApplied: apps[0]?.appliedAt,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getRegistrations = async (req, res) => {
  try {
    const regs = await Registration.find({ user: req.userId }).sort({
      createdAt: -1,
    });
    res.json(regs);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
