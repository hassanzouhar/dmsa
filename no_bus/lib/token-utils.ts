/**
 * Token Utilities for Secure Survey Retrieval
 * 
 * Provides cryptographically secure token generation, hashing, and verification
 * for per-survey access control without exposing sensitive data.
 */

import crypto from 'crypto';

// Get salt from environment or use default (should be set in production)
const TOKEN_SALT = process.env.DMSA_TOKEN_SALT || 'dmsa-default-salt-change-in-production';

/**
 * Generate a secure random token for survey retrieval
 * Uses 32 bytes (256 bits) of cryptographically secure random data
 * Encoded as base64url for URL safety
 */
export function generateToken(): string {
  const bytes = crypto.randomBytes(32);
  return bytes.toString('base64url'); // URL-safe base64 encoding
}

/**
 * Hash a token with the project salt for secure storage
 * Uses SHA-256 with salt to prevent rainbow table attacks
 */
export function hashToken(token: string, salt: string = TOKEN_SALT): string {
  if (!token) {
    throw new Error('Token is required for hashing');
  }
  
  const hash = crypto.createHash('sha256');
  hash.update(token + salt); // Append salt to token
  return hash.digest('hex');
}

/**
 * Verify a token against its stored hash
 * Constant-time comparison to prevent timing attacks
 */
export function verifyToken(token: string, storedHash: string, salt: string = TOKEN_SALT): boolean {
  if (!token || !storedHash) {
    return false;
  }
  
  try {
    const computedHash = hashToken(token, salt);
    
    // Use timingSafeEqual for constant-time comparison
    // This prevents timing attacks that could reveal hash information
    return crypto.timingSafeEqual(
      Buffer.from(computedHash, 'hex'),
      Buffer.from(storedHash, 'hex')
    );
  } catch (error) {
    console.error('Token verification error:', error);
    return false;
  }
}

/**
 * Create a retrieval token object for database storage
 * Returns both the plaintext token (for client) and hash (for database)
 */
export function createRetrievalToken() {
  const token = generateToken();
  const tokenHash = hashToken(token);
  
  return {
    token, // Return to client once
    tokenHash, // Store in database
    createdAt: new Date().toISOString(),
    revoked: false,
  };
}

/**
 * Validate token format without checking hash
 * Useful for basic input validation
 */
export function isValidTokenFormat(token: string): boolean {
  if (!token || typeof token !== 'string') {
    return false;
  }
  
  // Base64url should be 43 characters for 32-byte input
  // (32 bytes * 8 bits/byte / 6 bits per base64 char = 42.67, rounded up = 43)
  const base64urlPattern = /^[A-Za-z0-9_-]{43}$/;
  return base64urlPattern.test(token);
}

/**
 * Generate a secure API key for external integrations
 * Uses different format than survey tokens to avoid confusion
 */
export function generateApiKey(): string {
  const prefix = 'dmsa_'; // Clear identifier
  const keyBytes = crypto.randomBytes(24); // 192 bits for API keys
  const key = keyBytes.toString('hex'); // Hex encoding for API keys
  return prefix + key;
}

/**
 * Hash API key for secure storage
 */
export function hashApiKey(apiKey: string): string {
  if (!apiKey.startsWith('dmsa_')) {
    throw new Error('Invalid API key format');
  }
  
  return hashToken(apiKey, TOKEN_SALT + '_api'); // Different salt context
}

/**
 * Rate limiting helper - simple in-memory guard
 * For production, consider Redis or database-backed rate limiting
 */
const tokenAttempts = new Map<string, { count: number; resetTime: number }>();

export function checkRateLimit(identifier: string, maxAttempts: number = 10, windowMs: number = 15 * 60 * 1000): boolean {
  const now = Date.now();
  const key = identifier;
  
  const attempts = tokenAttempts.get(key);
  
  if (!attempts || now > attempts.resetTime) {
    // First attempt or window expired
    tokenAttempts.set(key, { count: 1, resetTime: now + windowMs });
    return true;
  }
  
  if (attempts.count >= maxAttempts) {
    return false; // Rate limit exceeded
  }
  
  // Increment attempt count
  attempts.count++;
  return true;
}

/**
 * Clear rate limit for an identifier (e.g., on successful request)
 */
export function clearRateLimit(identifier: string): void {
  tokenAttempts.delete(identifier);
}

/**
 * Utility to extract survey ID and token from various input formats
 */
export function parseTokenInput(input: string): { surveyId?: string; token?: string } {
  if (!input) return {};
  
  // Handle URL format: /surveys/abc123?token=xyz789
  const urlMatch = input.match(/\/surveys\/([a-zA-Z0-9]+).*[?&]token=([A-Za-z0-9_-]+)/);
  if (urlMatch) {
    return { surveyId: urlMatch[1], token: urlMatch[2] };
  }
  
  // Handle query string: ?id=abc123&token=xyz789
  const queryMatch = input.match(/[?&]id=([a-zA-Z0-9]+).*[?&]token=([A-Za-z0-9_-]+)/);
  if (queryMatch) {
    return { surveyId: queryMatch[1], token: queryMatch[2] };
  }
  
  // Handle token only
  if (isValidTokenFormat(input)) {
    return { token: input };
  }
  
  return {};
}

/**
 * Security audit helpers
 */
export function getTokenInfo(token: string) {
  const bytes = Buffer.from(token, 'base64url');
  
  return {
    length: token.length,
    byteLength: bytes.length,
    entropy: bytes.length * 8, // bits of entropy
    format: 'base64url',
    isValid: isValidTokenFormat(token),
  };
}

/**
 * Development helper - DO NOT USE IN PRODUCTION
 * Allows bypassing token verification for testing
 */
export function createDebugToken(surveyId: string): string {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Debug tokens not allowed in production');
  }
  
  return `debug_${surveyId}_${Date.now()}`;
}

export const tokenUtils = {
  generate: generateToken,
  hash: hashToken,
  verify: verifyToken,
  create: createRetrievalToken,
  isValid: isValidTokenFormat,
  checkRateLimit,
  clearRateLimit,
  parse: parseTokenInput,
  getInfo: getTokenInfo,
};

export default tokenUtils;