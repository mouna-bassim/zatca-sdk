/**
 * ZATCA Phase-2 e-Invoice SDK Pro (Premium Production Tier)
 * Extends core functionality with production features and auto-retry
 */

import { ZATCAInvoiceSDK as CoreSDK } from '@zatca-sdk/core';
import { assertPremium, hasPremiumAccess } from './licence.js';
import { ZATCA_BASE_URLS } from '@zatca-sdk/core/src/api/zatcaEndpoints.js';

/**
 * Premium ZATCA SDK Class with production features
 */
export class ZATCAInvoiceSDKPro extends CoreSDK {
  constructor(config = {}) {
    // Validate licence before initialization
    assertPremium(config.args);
    
    super(config);
    
    // Override to allow production mode
    this.config.environment = config.environment || 'production';
    this.config.apiBaseUrl = config.environment === 'production' 
      ? ZATCA_BASE_URLS.production 
      : ZATCA_BASE_URLS.sandbox;
    
    // Disable forced simulation mode
    this.config.simulationMode = false;
    
    // Premium features
    this.config.autoRetry = config.autoRetry !== false; // Default enabled
    this.config.maxRetries = config.maxRetries || 3;
    this.config.retryDelay = config.retryDelay || 1000;
    this.config.certificateAutoRenewal = config.certificateAutoRenewal !== false;
  }

  /**
   * Switch to production mode (premium feature)
   */
  switchToProduction() {
    console.log('🔓 Switching to production mode...');
    this.config.environment = 'production';
    this.config.apiBaseUrl = ZATCA_BASE_URLS.production;
    this.config.simulationMode = false;
    return this;
  }

  /**
   * Submit invoice for clearance with production features
   */
  async submitForClearance(signedXML, invoiceType, csid) {
    const headers = this.config.simulationMode 
      ? { 'Clearance-Status': 'SIMULATION' }
      : {}; // Production headers
    
    // Add licence expiry warning header
    const licenceToken = process.env.ZSDK_LICENCE_KEY;
    if (licenceToken) {
      // Simulate licence expiry check (in real implementation, decode JWT or check database)
      const daysUntilExpiry = 30; // Mock value
      headers['X-ZSDK-Expires-In'] = daysUntilExpiry.toString();
      
      if (daysUntilExpiry <= 7) {
        console.log('⚠️  LICENCE WARNING: Your ZATCA SDK Pro licence expires in ' + daysUntilExpiry + ' days');
        console.log('   Renew at /buy.html to avoid production disruption');
      }
    }
    
    if (this.config.environment === 'production') {
      console.log('🚀 Using production ZATCA endpoint');
    }

    if (this.config.autoRetry) {
      return await this.withRetry(async () => {
        const { submitForClearance } = await import('@zatca-sdk/core/src/api/zatcaClient.js');
        return await submitForClearance(
          signedXML, 
          invoiceType, 
          csid, 
          this.config.apiBaseUrl,
          headers
        );
      });
    } else {
      const { submitForClearance } = await import('@zatca-sdk/core/src/api/zatcaClient.js');
      return await submitForClearance(
        signedXML, 
        invoiceType, 
        csid, 
        this.config.apiBaseUrl,
        headers
      );
    }
  }

  /**
   * Submit for compliance with production features
   */
  async submitForCompliance(signedXML, csid) {
    const headers = this.config.simulationMode 
      ? { 'Clearance-Status': 'SIMULATION' }
      : {};

    if (this.config.autoRetry) {
      return await this.withRetry(async () => {
        const { submitForCompliance } = await import('@zatca-sdk/core/src/api/zatcaClient.js');
        return await submitForCompliance(
          signedXML, 
          csid, 
          this.config.apiBaseUrl,
          headers
        );
      });
    } else {
      const { submitForCompliance } = await import('@zatca-sdk/core/src/api/zatcaClient.js');
      return await submitForCompliance(
        signedXML, 
        csid, 
        this.config.apiBaseUrl,
        headers
      );
    }
  }

  /**
   * Auto-retry with exponential backoff (premium feature)
   */
  async withRetry(fn) {
    let lastError;
    
    for (let attempt = 0; attempt < this.config.maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error;
        
        if (attempt < this.config.maxRetries - 1) {
          const delay = this.config.retryDelay * Math.pow(2, attempt);
          console.log(`⏳ Retry ${attempt + 1}/${this.config.maxRetries} in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    
    throw lastError;
  }

  /**
   * Certificate auto-renewal check (premium feature)
   */
  async checkCertificateExpiry(certificatePath) {
    console.log('🔄 Checking certificate expiry (premium feature)...');
    
    try {
      const { loadCertificate } = await import('@zatca-sdk/core/src/crypto/certificateHandler.js');
      const cert = await loadCertificate(certificatePath);
      
      if (cert.expiryDate) {
        const daysUntilExpiry = Math.ceil((cert.expiryDate - new Date()) / (1000 * 60 * 60 * 24));
        
        if (daysUntilExpiry <= 30) {
          console.log(`⚠️  Certificate expires in ${daysUntilExpiry} days - renewal recommended`);
          return { needsRenewal: true, daysUntilExpiry };
        }
      }
      
      return { needsRenewal: false };
    } catch (error) {
      console.warn('Certificate expiry check failed:', error.message);
      return { needsRenewal: false, error: error.message };
    }
  }

  /**
   * Enable certificate auto-renewal (premium feature)
   */
  enableCertificateAutoRenewal() {
    console.log('🔓 Certificate auto-renewal enabled (premium feature)');
    this.config.certificateAutoRenewal = true;
    return this;
  }

  /**
   * Enable auto-retry (premium feature)
   */
  enableAutoRetry(maxRetries = 3, retryDelay = 1000) {
    console.log('🔓 Auto-retry enabled (premium feature)');
    this.config.autoRetry = true;
    this.config.maxRetries = maxRetries;
    this.config.retryDelay = retryDelay;
    return this;
  }
}

// Re-export core functions with premium checks
export {
  generateKeys,
  createCSR,
  loadCertificate,
  signInvoice,
  buildInvoiceXML,
  generateTLVQR
} from '@zatca-sdk/core';

// Premium-wrapped functions
export async function submitForClearance(signedXML, invoiceType, csid, args) {
  assertPremium(args);
  const sdk = new ZATCAInvoiceSDKPro({ args });
  return await sdk.submitForClearance(signedXML, invoiceType, csid);
}

export async function submitForCompliance(signedXML, csid, args) {
  assertPremium(args);
  const sdk = new ZATCAInvoiceSDKPro({ args });
  return await sdk.submitForCompliance(signedXML, csid);
}

export { assertPremium, hasPremiumAccess } from './licence.js';
export default ZATCAInvoiceSDKPro;