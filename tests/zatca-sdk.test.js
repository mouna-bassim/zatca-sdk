/**
 * Jest test suite for ZATCA SDK
 */

import { jest } from '@jest/globals';
import { ZATCAInvoiceSDK } from '../index.js';
import { generateTLVQR, validateQRData } from '../src/invoice/qrGenerator.js';
import { validateInvoiceData, validateVATNumber, calculateVAT } from '../src/utils/helpers.js';

// Mock the file system operations for testing
jest.mock('fs/promises');

describe('ZATCA Invoice SDK', () => {
  let sdk;

  beforeEach(() => {
    sdk = new ZATCAInvoiceSDK({
      vatNumber: '123456789012345',
      sellerName: 'Test Company Ltd',
      apiBaseUrl: 'https://test-api.zatca.gov.sa'
    });
  });

  describe('SDK Initialization', () => {
    test('should initialize with default config', () => {
      const defaultSdk = new ZATCAInvoiceSDK();
      expect(defaultSdk.config).toBeDefined();
    });

    test('should initialize with custom config', () => {
      expect(sdk.config.vatNumber).toBe('123456789012345');
      expect(sdk.config.sellerName).toBe('Test Company Ltd');
      expect(sdk.config.apiBaseUrl).toBe('https://test-api.zatca.gov.sa');
    });
  });

  describe('TLV QR Code Generation', () => {
    test('should generate valid TLV QR code for simplified invoice', () => {
      const invoiceData = {
        sellerName: 'Test Company',
        sellerVAT: '123456789012345',
        totalAmount: 100.00,
        issueDateTime: '2023-12-01T10:00:00Z'
      };

      const qrCode = generateTLVQR(invoiceData);
      expect(qrCode).toBeDefined();
      expect(typeof qrCode).toBe('string');
      expect(qrCode.length).toBeGreaterThan(0);
    });

    test('should validate QR data correctly', () => {
      const validData = {
        sellerName: 'Test Company',
        sellerVAT: '123456789012345',
        totalAmount: 100.00
      };

      const invalidData = {
        sellerName: '',
        sellerVAT: '123456789012345',
        totalAmount: 100.00
      };

      expect(() => validateQRData(validData)).not.toThrow();
      expect(() => validateQRData(invalidData)).toThrow();
    });
  });

  describe('Invoice XML Generation', () => {
    test('should build simplified invoice XML', () => {
      const invoiceData = {
        type: 'simplified',
        id: 'SME00021',
        totalAmount: 100.00,
        sellerName: 'Test Company',
        sellerVAT: '123456789012345'
      };

      const xml = sdk.buildInvoiceXML(invoiceData);
      expect(xml).toBeDefined();
      expect(xml).toContain('<?xml version="1.0" encoding="UTF-8"?>');
      expect(xml).toContain('<Invoice');
      expect(xml).toContain('SME00021');
      expect(xml).toContain('Test Company');
    });

    test('should build standard invoice XML', () => {
      const invoiceData = {
        type: 'standard',
        id: 'STD00021',
        totalAmount: 2300.00,
        sellerName: 'Test Company',
        sellerVAT: '123456789012345',
        buyerName: 'Customer Company',
        buyerVAT: '987654321098765'
      };

      const xml = sdk.buildInvoiceXML(invoiceData);
      expect(xml).toBeDefined();
      expect(xml).toContain('STD00021');
      expect(xml).toContain('Customer Company');
      expect(xml).toContain('987654321098765');
    });
  });

  describe('Validation Functions', () => {
    test('should validate VAT numbers correctly', () => {
      expect(validateVATNumber('123456789012345')).toBe(true);
      expect(validateVATNumber('12345678901234')).toBe(false); // too short
      expect(validateVATNumber('1234567890123456')).toBe(false); // too long
      expect(validateVATNumber('12345678901234a')).toBe(false); // contains letter
      expect(validateVATNumber('')).toBe(false);
      expect(validateVATNumber(null)).toBe(false);
    });

    test('should calculate VAT correctly', () => {
      expect(calculateVAT(100)).toBe(15);
      expect(calculateVAT(200, 10)).toBe(20);
      expect(calculateVAT(0)).toBe(0);
    });

    test('should validate simplified invoice data', () => {
      const validData = {
        sellerName: 'Test Company',
        sellerVAT: '123456789012345',
        totalAmount: 100.00
      };

      const invalidData = {
        sellerName: '',
        sellerVAT: '123456789012345',
        totalAmount: 100.00
      };

      const validResult = validateInvoiceData(validData, 'simplified');
      const invalidResult = validateInvoiceData(invalidData, 'simplified');

      expect(validResult.valid).toBe(true);
      expect(validResult.errors).toHaveLength(0);
      
      expect(invalidResult.valid).toBe(false);
      expect(invalidResult.errors.length).toBeGreaterThan(0);
    });

    test('should validate standard invoice data', () => {
      const validData = {
        sellerName: 'Test Company',
        sellerVAT: '123456789012345',
        buyerName: 'Customer Company',
        buyerVAT: '987654321098765',
        totalAmount: 2300.00
      };

      const invalidData = {
        sellerName: 'Test Company',
        sellerVAT: '123456789012345',
        // Missing buyer information
        totalAmount: 2300.00
      };

      const validResult = validateInvoiceData(validData, 'standard');
      const invalidResult = validateInvoiceData(invalidData, 'standard');

      expect(validResult.valid).toBe(true);
      expect(invalidResult.valid).toBe(false);
      expect(invalidResult.errors).toContain('Buyer name is required for standard invoices');
    });
  });

  describe('Error Handling', () => {
    test('should handle invalid invoice data gracefully', () => {
      expect(() => {
        sdk.buildInvoiceXML(null);
      }).toThrow();

      expect(() => {
        sdk.buildInvoiceXML({});
      }).not.toThrow();
    });

    test('should handle QR generation errors', () => {
      expect(() => {
        generateTLVQR(null);
      }).toThrow();

      expect(() => {
        generateTLVQR({});
      }).toThrow();
    });
  });

  describe('Integration Tests', () => {
    test('should create complete simplified invoice flow', () => {
      const invoiceData = {
        type: 'simplified',
        id: 'SME00021',
        totalAmount: 100.00,
        sellerName: 'Test Company',
        sellerVAT: '123456789012345'
      };

      // Validate data
      const validation = validateInvoiceData(invoiceData, 'simplified');
      expect(validation.valid).toBe(true);

      // Generate QR
      const qrCode = sdk.generateTLVQR(invoiceData);
      expect(qrCode).toBeDefined();

      // Generate XML
      const xml = sdk.buildInvoiceXML(invoiceData);
      expect(xml).toBeDefined();
      expect(xml).toContain('SME00021');
    });

    test('should handle missing configuration gracefully', () => {
      const emptySdk = new ZATCAInvoiceSDK({});
      
      const invoiceData = {
        type: 'simplified',
        totalAmount: 100.00
      };

      expect(() => {
        emptySdk.buildInvoiceXML(invoiceData);
      }).not.toThrow();
    });
  });
});

// Test data fixtures
export const testInvoiceData = {
  simplified: {
    type: 'simplified',
    id: 'SME00021',
    totalAmount: 100.00,
    sellerName: 'Test Company Ltd',
    sellerVAT: '123456789012345',
    lineItems: [
      {
        id: '1',
        itemName: 'Test Service',
        quantity: 1,
        unitPrice: 86.96,
        itemType: 'S'
      }
    ]
  },
  standard: {
    type: 'standard',
    id: 'STD00021',
    totalAmount: 2300.00,
    sellerName: 'Test Company Ltd',
    sellerVAT: '123456789012345',
    buyerName: 'Customer Company Ltd',
    buyerVAT: '987654321098765',
    lineItems: [
      {
        id: '1',
        itemName: 'Professional Services',
        quantity: 40,
        unitPrice: 50.00,
        itemType: 'S'
      }
    ]
  }
};
