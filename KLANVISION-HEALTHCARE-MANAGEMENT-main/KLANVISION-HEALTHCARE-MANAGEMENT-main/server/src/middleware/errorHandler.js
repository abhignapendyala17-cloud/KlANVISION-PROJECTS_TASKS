function notFound(req, res) {
  res.status(404).json({ message: `Route not found: ${req.method} ${req.originalUrl}` });
}

function errorHandler(error, _req, res, _next) {
  console.error(`Request failed: ${error.name || "Error"}${error.code ? ` (${error.code})` : ""}`);
  if (error.code === 11000) {
    return res.status(409).json({ message: "That email or appointment slot is already in use." });
  }
  if (error.name === "ValidationError") {
    return res.status(400).json({ message: "Please correct the submitted data." });
  }
  if (error.name === "CastError") {
    return res.status(400).json({ message: "A supplied identifier or value is invalid." });
  }
  return res.status(error.status || 500).json({
    message: error.status ? error.message : "An unexpected server error occurred.",
  });
}

module.exports = { notFound, errorHandler };
