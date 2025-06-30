/**
 * ZATCA SDK Premium Licence Validation
 * Validates licence tokens for production features
 */

import crypto from 'crypto';

/**
 * Validate licence token format and authenticity
 * @param {string} token - Licence token to validate
 * @returns {boolean} - True if valid
 */
export function isValid(token) {
  if (!token || typeof token !== 'string') {
    return false;
  }
  
  // Format check: 20-char alphanumeric starting with "ZSDK"
  return /^ZSDK[A-Za-z0-9]{16}$/.test(token);
}

/**
 * Get licence token from environment or CLI args
 * @param {string[]} args - CLI arguments
 * @returns {string|null} - Licence token or null
 */
export function getLicenceToken(args = process.argv) {
  // Check CLI flag: --licence <token>
  const licenceIndex = args.findIndex(arg => arg === '--licence');
  if (licenceIndex !== -1 && args[licenceIndex + 1]) {
    return args[licenceIndex + 1];
  }
  
  // Check environment variable
  return process.env.ZSDK_LICENCE_KEY || null;
}

/**
 * Assert premium licence is valid, throw error if not
 * @param {string[]} args - CLI arguments (optional)
 * @throws {Error} - If licence is missing or invalid
 */
export function assertPremium(args) {
  const token = getLicenceToken(args);
  
  if (!token) {
    throw new Error('⛔ Premium features locked – Licence key missing. Set ZSDK_LICENCE_KEY or use --licence <token>. Get a key at /buy.html');
  }
  
  if (!isValid(token)) {
    throw new Error('⛔ Premium features locked – Invalid licence key format. Get a valid key at /buy.html');
  }
  
  // TODO: Replace with real HMAC validation against buyer's email
  // For now, any properly formatted token is considered valid
  console.log(`🔓 Premium licence validated: ${token.substring(0, 8)}...`);
  
  return true;
}

/**
 * Check if current session has premium access
 * @param {string[]} args - CLI arguments (optional)
 * @returns {boolean} - True if premium licence is valid
 */
export function hasPremiumAccess(args) {
  try {
    assertPremium(args);
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Generate demo licence token (for testing only)
 * @returns {string} - Valid demo token
 */
export function generateDemoToken() {
  const randomPart = crypto.randomBytes(8).toString('hex').toUpperCase();
  return `ZSDK${randomPart}`;
}