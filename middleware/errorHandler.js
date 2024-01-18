const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);

  if (err.type === 'StripeInvalidRequestError') {
    return res.status(400).json({
      error: 'Invalid request to Stripe',
      message: err.message,
    });
  }

  if (err.type === 'StripeAPIError') {
    return res.status(500).json({
      error: 'Stripe API error',
      message: err.message,
    });
  }

  if (err.type === 'StripeAuthenticationError') {
    return res.status(401).json({
      error: 'Stripe authentication failed',
      message: err.message,
    });
  }

  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

module.exports = {
  errorHandler,
};
