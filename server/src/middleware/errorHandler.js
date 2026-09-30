/**
 * Global Error Handler (UQR6: Plain language with fault condition and recovery action)
 */
function errorHandler(err, req, res, next) {
  console.error('[RxGuard Error]', err);

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map(val => val.message);
    return res.status(400).json({
      success: false,
      error: 'Data Validation Failed',
      details: messages,
      recoveryAction: 'Please check your inputs and ensure all mandatory clinical fields meet standard boundaries.'
    });
  }

  // Duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0];
    return res.status(409).json({
      success: false,
      error: `Duplicate Entry: A record with this ${field} already exists.`,
      recoveryAction: 'Please use a unique identifier or update the existing record.'
    });
  }

  res.status(err.status || 500).json({
    success: false,
    error: err.message || 'Internal Server Error',
    recoveryAction: 'The system encountered an unexpected issue. Please retry or contact system administrator.'
  });
}

module.exports = errorHandler;
