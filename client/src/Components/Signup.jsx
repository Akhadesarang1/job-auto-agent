import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import toast, { Toaster } from "react-hot-toast";
import { FiEye, FiEyeOff, FiLock, FiMail, FiUser } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import zxcvbn from "zxcvbn";

export default function Signup() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirm: "",
  });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [showPwd, setShowPwd] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const nav = useNavigate();

  const handleChange = (e) =>
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const { password, confirm } = form;
  const pwdScore = zxcvbn(password).score;
  const strengthLabels = ["Very Weak", "Weak", "Fair", "Good", "Strong"];
  const strengthColors = [
    "bg-red-500",
    "bg-orange-500",
    "bg-yellow-500",
    "bg-blue-500",
    "bg-green-500",
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirm) {
      setError("Passwords do not match");
      toast.error("Passwords must match");
      return;
    }
    setError("");
    setBusy(true);
    toast.dismiss();
    toast.loading("Signing you up…", { id: "signup" });

    try {
      const res = await fetch("http://localhost:5000/api/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          password,
        }),
      });
      const payload = await res.json();
      if (!res.ok) throw new Error(payload.message || "Signup failed");
      toast.success("Account created!", { id: "signup" });
      setTimeout(() => nav("/login"), 800);
    } catch (err) {
      setError(err.message);
      toast.error(err.message, { id: "signup" });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center px-4 relative overflow-hidden">
      {/* Glow background */}
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 0.1 }}
        transition={{ duration: 2, repeat: Infinity, repeatType: "mirror" }}
        className="absolute w-96 h-96 bg-gradient-to-r from-green-500/30 to-blue-500/30 rounded-full blur-3xl -top-32 -left-32"
      />

      <Toaster
        position="top-right"
        toastOptions={{
          className: "bg-gray-800 text-gray-100",
          success: { iconTheme: { primary: "#48BB78", secondary: "#fff" } },
          error: { iconTheme: { primary: "#F56565", secondary: "#fff" } },
        }}
      />

      <motion.form
        onSubmit={handleSubmit}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md bg-gray-800/90 backdrop-blur-sm p-8 rounded-2xl shadow-2xl space-y-6 relative z-10 border border-gray-700/50 hover:border-gray-700/70 transition-all"
      >
        {/* Profile Icon */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="flex justify-center"
        >
          <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-blue-500 rounded-2xl flex items-center justify-center">
            <FiUser className="h-8 w-8 text-white" />
          </div>
        </motion.div>

        {/* Title */}
        <motion.h2
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-3xl font-bold text-white text-center bg-gradient-to-r from-green-400 to-blue-500 bg-clip-text text-transparent"
        >
          Create Account
        </motion.h2>

        {/* Error */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="text-red-400 text-sm bg-red-500/10 p-3 rounded-lg flex items-center gap-2"
            >
              <FiLock className="flex-shrink-0" />
              <span>{error}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Name Field */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
          className="relative"
        >
          <FiUser className="absolute top-3 left-3 text-gray-400" />
          <input
            name="name"
            type="text"
            value={form.name}
            onChange={handleChange}
            required
            placeholder="Your Name"
            className="w-full pl-10 pr-4 py-3 bg-gray-700/50 rounded-lg text-gray-100 placeholder-gray-400 outline-none focus:ring-2 focus:ring-green-500 focus:bg-gray-700/70 transition-all duration-300"
          />
        </motion.div>

        {/* Email Field */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.6 }}
          className="relative"
        >
          <FiMail className="absolute top-3 left-3 text-gray-400" />
          <input
            name="email"
            type="email"
            value={form.email}
            onChange={handleChange}
            required
            placeholder="you@example.com"
            className="w-full pl-10 pr-4 py-3 bg-gray-700/50 rounded-lg text-gray-100 placeholder-gray-400 outline-none focus:ring-2 focus:ring-blue-500 focus:bg-gray-700/70 transition-all duration-300"
          />
        </motion.div>

        {/* Password Field */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.8 }}
          className="relative"
        >
          <FiLock className="absolute top-3 left-3 text-gray-400" />
          <motion.button
            type="button"
            onClick={() => setShowPwd((v) => !v)}
            className="absolute top-3 right-3 text-gray-400"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            {showPwd ? <FiEyeOff /> : <FiEye />}
          </motion.button>
          <input
            name="password"
            type={showPwd ? "text" : "password"}
            value={password}
            onChange={handleChange}
            required
            placeholder="••••••••"
            className="w-full pl-10 pr-10 py-3 bg-gray-700/50 rounded-lg text-gray-100 placeholder-gray-400 outline-none focus:ring-2 focus:ring-purple-500 focus:bg-gray-700/70 transition-all duration-300"
          />

          {password && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-2 space-y-1"
            >
              <div className="h-2 rounded-full bg-gray-600 overflow-hidden">
                <motion.div
                  className={`h-2 rounded-full ${strengthColors[pwdScore]}`}
                  initial={{ width: 0 }}
                  animate={{ width: `${(pwdScore + 1) * 20}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>
              <p className="text-xs text-gray-400">
                Strength:{" "}
                <span className={`font-medium ${strengthColors[pwdScore]}`}>
                  {strengthLabels[pwdScore]}
                </span>
              </p>
            </motion.div>
          )}
        </motion.div>

        {/* Confirm Field */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 1.0 }}
          className="relative"
        >
          <FiLock className="absolute top-3 left-3 text-gray-400" />
          <motion.button
            type="button"
            onClick={() => setShowConfirm((v) => !v)}
            className="absolute top-3 right-3 text-gray-400"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            {showConfirm ? <FiEyeOff /> : <FiEye />}
          </motion.button>
          <input
            name="confirm"
            type={showConfirm ? "text" : "password"}
            value={confirm}
            onChange={handleChange}
            required
            placeholder="••••••••"
            className="w-full pl-10 pr-10 py-3 bg-gray-700/50 rounded-lg text-gray-100 placeholder-gray-400 outline-none focus:ring-2 focus:ring-purple-500 focus:bg-gray-700/70 transition-all duration-300"
          />
        </motion.div>

        {/* Submit Button */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2 }}
        >
          <button
            type="submit"
            disabled={busy}
            className={`w-full py-4 rounded-lg text-white font-semibold transition-all duration-300 flex items-center justify-center gap-2 ${
              busy
                ? "bg-green-400 cursor-not-allowed"
                : "bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 hover:shadow-lg active:scale-95"
            }`}
          >
            {busy && (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 1 }}
                className="h-5 w-5 border-2 border-white/50 border-t-transparent rounded-full"
              />
            )}
            <span>{busy ? "Signing up…" : "Sign Up"}</span>
          </button>
        </motion.div>

        {/* Login Link */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.4 }}
          className="text-gray-400 text-sm text-center"
        >
          Already have an account?{" "}
          <button
            type="button"
            onClick={() => nav("/login")}
            className="text-blue-400 hover:underline"
          >
            Log In
          </button>
        </motion.div>
      </motion.form>
    </div>
  );
}
