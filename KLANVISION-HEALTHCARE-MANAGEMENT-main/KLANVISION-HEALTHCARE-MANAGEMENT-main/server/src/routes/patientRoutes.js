const express = require("express");
const { listPatients, getMyPatient } = require("../controllers/patientController");
const { authenticate, authorize } = require("../middleware/auth");
const asyncHandler = require("../utils/asyncHandler");

const router = express.Router();

router.get("/", authenticate, authorize("admin"), asyncHandler(listPatients));
router.get("/me", authenticate, authorize("patient"), asyncHandler(getMyPatient));

module.exports = router;
