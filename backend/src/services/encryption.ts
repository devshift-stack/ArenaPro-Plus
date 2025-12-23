// AI Arena - Encryption Service
// AES-256-GCM encryption for user data

import crypto from 'crypto';
import { config } from '../config/index.js';
import { redis } from '../utils/redis.js';

class EncryptionService {
  private readonly algorithm = 'aes-256-gcm';
  private readonly keyLength = 32; // 256 bits
  private readonly ivLength = 16; // 128 bits
  private readonly tagLength = 16; // 128 bits
  private readonly masterKey: Buffer;

  constructor() {
    // Derive master key from config
    this.masterKey = crypto.scryptSync(
      config.ENCRYPTION_KEY,
      'ai-arena-salt',
      this.keyLength
    );
  }

  /**
   * Derive a unique key for a user/team
   */
  private async deriveKey(scopeId: string): Promise<Buffer> {
    // Check cache first
    const cacheKey = `encryption:key:${scopeId}`;
    const cached = await redis.getBuffer(cacheKey);
    if (cached) {
      return cached;
    }

    // Derive key using HKDF-like approach
    const key = crypto.scryptSync(
      this.masterKey,
      `user-key-${scopeId}`,
      this.keyLength
    );

    // Cache for 1 hour
    await redis.setex(cacheKey, 3600, key);

    return key;
  }

  /**
   * Encrypt data for a specific scope (user/team)
   */
  async encrypt(plaintext: string, scopeId: string): Promise<{
    encrypted: Buffer;
    iv: string;
  }> {
    const key = await this.deriveKey(scopeId);
    const iv = crypto.randomBytes(this.ivLength);

    const cipher = crypto.createCipheriv(this.algorithm, key, iv, {
      authTagLength: this.tagLength,
    });

    const encrypted = Buffer.concat([
      cipher.update(plaintext, 'utf8'),
      cipher.final(),
      cipher.getAuthTag(),
    ]);

    return {
      encrypted,
      iv: iv.toString('base64'),
    };
  }

  /**
   * Decrypt data for a specific scope
   */
  async decrypt(encryptedData: Buffer, ivBase64: string, scopeId: string): Promise<string> {
    const key = await this.deriveKey(scopeId);
    const iv = Buffer.from(ivBase64, 'base64');

    // Extract auth tag (last 16 bytes)
    const authTag = encryptedData.subarray(-this.tagLength);
    const ciphertext = encryptedData.subarray(0, -this.tagLength);

    const decipher = crypto.createDecipheriv(this.algorithm, key, iv, {
      authTagLength: this.tagLength,
    });
    decipher.setAuthTag(authTag);

    return decipher.update(ciphertext) + decipher.final('utf8');
  }

  /**
   * Rotate encryption key for a scope
   */
  async rotateKey(scopeId: string): Promise<void> {
    // Invalidate cached key
    const cacheKey = `encryption:key:${scopeId}`;
    await redis.del(cacheKey);

    // Note: In production, you'd need to:
    // 1. Re-encrypt all data for this scope with new key
    // 2. This is a complex operation that should be done in background
  }

  /**
   * Generate a secure random token
   */
  generateToken(length = 32): string {
    return crypto.randomBytes(length).toString('base64url');
  }

  /**
   * Hash a password
   */
  async hashPassword(password: string): Promise<string> {
    const salt = crypto.randomBytes(16);
    const hash = crypto.scryptSync(password, salt, 64);
    return `${salt.toString('hex')}:${hash.toString('hex')}`;
  }

  /**
   * Verify a password
   */
  async verifyPassword(password: string, storedHash: string): Promise<boolean> {
    const [saltHex, hashHex] = storedHash.split(':');
    const salt = Buffer.from(saltHex, 'hex');
    const storedHashBuffer = Buffer.from(hashHex, 'hex');
    const hash = crypto.scryptSync(password, salt, 64);
    return crypto.timingSafeEqual(hash, storedHashBuffer);
  }

  /**
   * Create a hash for caching/deduplication
   */
  createHash(data: string): string {
    return crypto.createHash('sha256').update(data).digest('hex');
  }
}

export const encryptionService = new EncryptionService();
