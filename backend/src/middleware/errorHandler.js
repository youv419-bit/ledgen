function errorHandler(err, req, res, next) {
  const status = err.status || err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  // Log full error in development
  if (process.env.NODE_ENV !== 'production') {
    console.error(`\x1b[31mError:\x1b[0m ${message}`);
    if (err.stack) console.error(err.stack);
  } else {
    console.error(`Error ${status}: ${message} — ${req.method} ${req.originalUrl}`);
  }

  res.status(status).json({
    error: message,
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
  });
}

function notFound(req, res) {
  res.status(404).json({ error: `Route not found: ${req.method} ${req.originalUrl}` });
}

module.exports = { errorHandler, notFound };
