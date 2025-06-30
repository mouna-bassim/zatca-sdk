/**
 * ZATCA Phase-2 e-Invoice SDK Core (Free Sandbox Tier)
 * MIT License - Sandbox mode only with simulation endpoints
 */

import { generateKeys, createCSR } from './crypto/keyGenerator.js';
import { loadCertificate } from './crypto/certificateHandler.js';
import { signInvoice } from './crypto/signer.js';
import { buildInvoiceXML } from './invoice/xmlBuilder.js';
import { generateTLVQR } from './invoice/qrGenerator.js';
import { submitForClearance, submitForCompliance } from './api/zatcaClient.js';
import { ZATCA_BASE_URLS } from './api/zatcaEndpoints.js';

/**
 * Core ZATCA SDK Class - Free Sandbox Tier
 * Limited to simulation endpoints only
 */
export class ZATCAInvoiceSDK {
  constructor(config = {}) {
    this.config = {
      environment: 'sandbox', // Always sandbox in free tier
      apiBaseUrl: ZATCA_BASE_URLS.sandbox, // Always simulation
      vatNumber: config.vatNumber || process.env.ZATCA_VAT_NUMBER,
      sellerName: config.sellerName || process.env.ZATCA_SELLER_NAME,
      csid: config.csid || process.env.ZATCA_CSID,
      ...config
    };
    
    // Force simulation mode in free tier
    this.config.simulationMode = true;
  }

  /**
   * Generate device keys and CSR
   */
  async generateDeviceCredentials() {
    return await createCSR(this.config);
  }

  /**
   * Load certificate from file or string
   */
  loadCertificate(certPath) {
    return loadCertificate(certPath);
  }

  /**
   * Build invoice XML
   */
  buildInvoiceXML(invoiceData) {
    return buildInvoiceXML(invoiceData, this.config);
  }

  /**
   * Sign invoice XML
   */
  async signInvoice(xmlData, privateKeyPath, certificatePath) {
    return await signInvoice(xmlData, privateKeyPath, certificatePath);
  }

  /**
   * Generate TLV QR code for simplified invoices
   */
  generateTLVQR(invoiceData) {
    return generateTLVQR(invoiceData);
  }

  /**
   * Submit invoice for clearance - SANDBOX SIMULATION ONLY
   */
  async submitForClearance(signedXML, invoiceType, csid) {
    // Always force simulation headers in free tier
    const simulationHeaders = {
      'Clearance-Status': 'SIMULATION'
    };
    
    console.log('🆓 Using sandbox simulation endpoint (free tier)');
    return await submitForClearance(
      signedXML, 
      invoiceType, 
      csid, 
      this.config.apiBaseUrl,
      simulationHeaders
    );
  }

  /**
   * Submit for compliance check - SANDBOX SIMULATION ONLY
   */
  async submitForCompliance(signedXML, csid) {
    const simulationHeaders = {
      'Clearance-Status': 'SIMULATION'
    };
    
    console.log('🆓 Using sandbox simulation endpoint (free tier)');
    return await submitForCompliance(
      signedXML, 
      csid, 
      this.config.apiBaseUrl,
      simulationHeaders
    );
  }

  /**
   * Production features - blocked in free tier
   */
  switchToProduction() {
    throw new Error('⛔ Premium features locked – Production mode requires a licence key. Get one at /buy.html');
  }

  enableAutoRetry() {
    throw new Error('⛔ Premium features locked – Auto-retry requires a licence key. Get one at /buy.html');
  }

  enableCertificateAutoRenewal() {
    throw new Error('⛔ Premium features locked – Certificate auto-renewal requires a licence key. Get one at /buy.html');
  }
}

// Export individual functions for direct use
export {
  generateKeys,
  createCSR,
  loadCertificate,
  signInvoice,
  buildInvoiceXML,
  generateTLVQR,
  submitForClearance,
  submitForCompliance
};

export default ZATCAInvoiceSDK;