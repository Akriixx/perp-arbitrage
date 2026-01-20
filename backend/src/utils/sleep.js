/**
 * Sleep utility - promisified setTimeout
 */
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

module.exports = { sleep };
