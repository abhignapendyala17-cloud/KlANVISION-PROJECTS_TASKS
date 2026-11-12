const crypto = require("node:crypto");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const RevokedToken = require("../models/RevokedToken");

async function authenticate(req, res, next) {
  try {
    const authorization = req.headers.authorization || "";
    const [scheme, token] = authorization.split(" ");
    if (scheme !== "Bearer" || !token) {
      return res.status(401).json({ message: "Authentication is required." });
    }

    const payload = jwt.verify(token, process.env.JWT_SECRET);
    if (typeof payload !== "object" || typeof payload.exp !== "number") {
      return res.status(401).json({ message: "The authentication token is invalid or expired." });
    }
    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
    if (await RevokedToken.exists({ tokenHash })) {
      return res.status(401).json({ message: "The authentication token is invalid or expired." });
    }
    const user = await User.findById(payload.sub);
    if (!user) {
      return res.status(401).json({ message: "The authenticated user no longer exists." });
    }
    req.user = user;
    req.authToken = token;
    req.authTokenExpiresAt = new Date(payload.exp * 1000);
    return next();
  } catch (error) {
    if (error.name === "JsonWebTokenError" || error.name === "TokenExpiredError") {
      return res.status(401).json({ message: "The authentication token is invalid or expired." });
    }
    return next(error);
  }
}

function authorize(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ message: "You do not have permission to perform this action." });
    }
    return next();
  };
}

module.exports = { authenticate, authorize };
