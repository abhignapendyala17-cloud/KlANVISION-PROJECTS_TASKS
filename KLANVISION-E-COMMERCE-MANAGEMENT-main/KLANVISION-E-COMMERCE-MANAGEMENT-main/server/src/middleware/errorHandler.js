module.exports = (err, req, res, next) => {
  if (res.headersSent) return next(err);
  let status = err.status || 500;
  let message = err.message || 'Internal server error';

  if (err.name === 'ValidationError') {
    status = 400;
    message = Object.values(err.errors).map((item) => item.message).join(', ');
  } else if (err.code === 11000) {
    status = 409;
    message = `${Object.keys(err.keyValue || {})[0] || 'Value'} already exists`;
  } else if (err.name === 'CastError') {
    status = 400;
    message = 'Invalid resource ID';
  }

  if (status >= 500) console.error(err);
  res.status(status).json({ success: false, error: message });
};
