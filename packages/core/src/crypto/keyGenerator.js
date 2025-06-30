/**
 * Key generation and CSR creation for ZATCA compliance
 */

import crypto from 'crypto';
import fs from 'fs/promises';
import { createECDH } from 'crypto';

/**
 * Generate secp256k1 key pair
 * @returns {Object} Key pair with private and public keys
 */
export function generateKeys() {
  try {
    const ecdh = createECDH('secp256k1');
    const privateKey = ecdh.generateKeys();
    const publicKey = ecdh.getPublicKey();
    
    return {
      privateKey: ecdh.getPrivateKey(),
      publicKey: publicKey,
      privateKeyHex: ecdh.getPrivateKey('hex'),
      publicKeyHex: publicKey.toString('hex')
    };
  } catch (error) {
    throw new Error(`Failed to generate keys: ${error.message}`);
  }
}

/**
 * Create Certificate Signing Request (CSR)
 * @param {Object} config - Configuration object
 * @returns {Object} CSR and private key information
 */
export async function createCSR(config = {}) {
  try {
    const { privateKey, publicKey } = generateKeys();
    
    // Convert private key to PEM format
    const privateKeyPem = convertPrivateKeyToPEM(privateKey);
    
    // Create CSR using OpenSSL-compatible format
    const csr = await generateCSRContent(publicKey, config);
    
    // Write files
    await fs.writeFile('./ec-priv.pem', privateKeyPem);
    await fs.writeFile('./csr.pem', csr);
    
    console.log('✅ Generated secp256k1 key pair');
    console.log('✅ Private key saved to: ./ec-priv.pem');
    console.log('✅ CSR saved to: ./csr.pem');
    
    return {
      privateKeyPath: './ec-priv.pem',
      csrPath: './csr.pem',
      privateKeyPem,
      csr
    };
  } catch (error) {
    throw new Error(`Failed to create CSR: ${error.message}`);
  }
}

/**
 * Convert private key to PEM format
 * @param {Buffer} privateKey - Private key buffer
 * @returns {string} PEM formatted private key
 */
function convertPrivateKeyToPEM(privateKey) {
  const keyHex = privateKey.toString('hex');
  const keyBase64 = Buffer.from(keyHex, 'hex').toString('base64');
  
  // Create PEM format
  const pemHeader = '-----BEGIN EC PRIVATE KEY-----';
  const pemFooter = '-----END EC PRIVATE KEY-----';
  
  // Split base64 into 64-character lines
  const lines = keyBase64.match(/.{1,64}/g);
  
  return `${pemHeader}\n${lines.join('\n')}\n${pemFooter}`;
}

/**
 * Generate CSR content
 * @param {Buffer} publicKey - Public key buffer
 * @param {Object} config - Configuration object
 * @returns {string} CSR in PEM format
 */
async function generateCSRContent(publicKey, config) {
  try {
    // Create a basic CSR structure
    const subject = {
      C: 'SA',  // Country: Saudi Arabia
      O: config.sellerName || 'Test Company',
      CN: config.vatNumber || '123456789012345',
      OU: 'IT Department'
    };
    
    // For simplicity, we'll create a basic CSR format
    // In production, you might want to use a proper ASN.1 library
    const csrContent = createBasicCSR(publicKey, subject);
    
    return csrContent;
  } catch (error) {
    throw new Error(`Failed to generate CSR content: ${error.message}`);
  }
}

/**
 * Create a basic CSR structure
 * @param {Buffer} publicKey - Public key
 * @param {Object} subject - Subject information
 * @returns {string} CSR in PEM format
 */
function createBasicCSR(publicKey, subject) {
  // This is a simplified CSR generation
  // In a real implementation, you would use proper ASN.1 encoding
  const publicKeyBase64 = publicKey.toString('base64');
  const subjectString = Object.entries(subject)
    .map(([key, value]) => `${key}=${value}`)
    .join(', ');
  
  const csrHeader = '-----BEGIN CERTIFICATE REQUEST-----';
  const csrFooter = '-----END CERTIFICATE REQUEST-----';
  
  // Create a mock CSR structure - in production use proper ASN.1
  const csrData = Buffer.from(
    `CSR for ${subjectString}\nPublic Key: ${publicKeyBase64}\nCurve: secp256k1`
  ).toString('base64');
  
  const lines = csrData.match(/.{1,64}/g);
  
  return `${csrHeader}\n${lines.join('\n')}\n${csrFooter}`;
}
