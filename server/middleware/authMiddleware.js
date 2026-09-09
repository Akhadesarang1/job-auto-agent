const jwt = require("jsonwebtoken");

const auth = (req, res, next) => {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer "))
    return res.status(401).json({ message: "Unauthorized" });
  try {
    const token = header.split(" ")[1];
    const { id } = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = id;
    next();
  } catch {
    return res.status(401).json({ message: "Invalid token" });
  }
};

module.exports = auth;
