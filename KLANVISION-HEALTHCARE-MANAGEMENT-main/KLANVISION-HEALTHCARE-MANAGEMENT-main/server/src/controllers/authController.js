const crypto = require("node:crypto");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Patient = require("../models/Patient");
const Doctor = require("../models/Doctor");
const RevokedToken = require("../models/RevokedToken");
const asyncHandler = require("../utils/asyncHandler");

function createToken(user) {
  if (!process.env.JWT_SECRET) throw new Error("JWT_SECRET must be configured.");
  return jwt.sign({ sub: user.id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });
}

const register = asyncHandler(async (req, res) => {
  const { name, email, password, phone, age, gender } = req.body;
  if (await User.exists({ email: email.toLowerCase() })) {
    return res.status(409).json({ message: "An account with this email already exists." });
  }

  const user = await User.create({ name, email, password, role: "patient" });
  try {
    const patient = await Patient.create({ user: user.id, phone, age, gender });
    return res.status(201).json({ token: createToken(user), user, patient });
  } catch (error) {
    await User.findByIdAndDelete(user.id);
    throw error;
  }
});

const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email: email.toLowerCase() }).select("+password");
  if (!user || !(await user.comparePassword(password))) {
    return res.status(401).json({ message: "Email or password is incorrect." });
  }
  return res.json({ token: createToken(user), user });
});

const me = asyncHandler(async (req, res) => {
  let profile = null;
  if (req.user.role === "patient") profile = await Patient.findOne({ user: req.user.id });
  if (req.user.role === "doctor") profile = await Doctor.findOne({ user: req.user.id });
  return res.json({ user: req.user, profile });
});

const logout = asyncHandler(async (req, res) => {
  const tokenHash = crypto.createHash("sha256").update(req.authToken).digest("hex");
  await RevokedToken.updateOne(
    { tokenHash },
    { $set: { expiresAt: req.authTokenExpiresAt } },
    { upsert: true }
  );
  return res.json({ message: "Signed out successfully." });
});

module.exports = { register, login, me, logout };
