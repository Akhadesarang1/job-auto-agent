function timestamp() {
  return new Date().toISOString();
}

function info(msg, ...params) {
  console.log(`[INFO]    ${timestamp()} —`, msg, ...params);
}

function success(msg, ...params) {
  console.log(`[SUCCESS] ${timestamp()} —`, msg, ...params);
}

function warn(msg, ...params) {
  console.warn(`[WARN]    ${timestamp()} —`, msg, ...params);
}

function error(msg, ...params) {
  console.error(`[ERROR]   ${timestamp()} —`, msg, ...params);
}

module.exports = {
  info,
  success,
  warn,
  error,
};
