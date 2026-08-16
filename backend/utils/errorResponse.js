// Keep operational details in server logs rather than exposing driver, network,
// or third-party errors to API clients. Controllers may still use explicit
// 4xx errors for actionable validation and permission feedback.
const sendServerError = (res, error, message = 'Unable to complete this request') => {
  console.error(`${message}:`, error?.stack || error?.message || error);
  return res.status(500).json({ success: false, error: message });
};

const sendExpectedOrServerError = (res, error, message = 'Unable to complete this request') => {
  const status = Number(error?.statusCode);
  if (Number.isInteger(status) && status >= 400 && status < 500) {
    return res.status(status).json({ success: false, error: error.message });
  }
  return sendServerError(res, error, message);
};

module.exports = { sendServerError, sendExpectedOrServerError };
