/**
 * ZATCA Phase-2 e-Invoice SDK
 * Main entry point for the SDK
 */

import { generateKeys, createCSR } from './src/crypto/keyGenerator.js';
import { loadCertificate, extractCertificateInfo } from './src/crypto/certificateHandler.js';
import { signInvoice } from './src/crypto/signer.js';
import { buildInvoiceXML } from './src/invoice/xmlBuilder.js';
import { generateTLVQR } from './src/invoice/qrGenerator.js';
import { submitForClearance, submitForCompliance } from './src/api/zatcaClient.js';

/**
 * Main ZATCA SDK Class
 */
export class ZATCAInvoiceSDK {
  constructor(config = {}) {
    this.config = {
      vatNumber: config.vatNumber || process.env.ZATCA_VAT_NUMBER,
      sellerName: config.sellerName || process.env.ZATCA_SELLER_NAME,
      apiBaseUrl: config.apiBaseUrl || process.env.ZATCA_API_BASE_URL || 'https://gw-fatoora.zatca.gov.sa/e-invoicing/developer-portal',
      ...config
    };
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
   * Submit invoice for clearance
   */
  async submitForClearance(signedXML, invoiceType, csid) {
    return await submitForClearance(signedXML, invoiceType, csid, this.config.apiBaseUrl);
  }

  /**
   * Submit for compliance check
   */
  async submitForCompliance(signedXML, csid) {
    return await submitForCompliance(signedXML, csid, this.config.apiBaseUrl);
  }
}

// Export individual functions for direct use
export {
  generateKeys,
  createCSR,
  loadCertificate,
  extractCertificateInfo,
  signInvoice,
  buildInvoiceXML,
  generateTLVQR,
  submitForClearance,
  submitForCompliance
};

// Default export
export default ZATCAInvoiceSDK;
