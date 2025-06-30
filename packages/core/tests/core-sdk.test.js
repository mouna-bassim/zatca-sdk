/**
 * Jest tests for ZATCA Core SDK
 */

import { ZATCAInvoiceSDK } from '../src/index.js';

describe('ZATCA Core SDK', () => {
  let sdk;
  
  beforeEach(() => {
    sdk = new ZATCAInvoiceSDK({
      vatNumber: '123456789012345',
      sellerName: 'Test Company Ltd'
    });
  });

  test('should initialize with sandbox configuration', () => {
    expect(sdk.config.environment).toBe('sandbox');
    expect(sdk.config.simulationMode).toBe(true);
    expect(sdk.config.apiBaseUrl).toContain('sandbox');
  });

  test('should block production mode switch', () => {
    expect(() => {
      sdk.switchToProduction();
    }).toThrow('Premium features locked');
  });

  test('should block auto-retry feature', () => {
    expect(() => {
      sdk.enableAutoRetry();
    }).toThrow('Premium features locked');
  });

  test('should block certificate auto-renewal', () => {
    expect(() => {
      sdk.enableCertificateAutoRenewal();  
    }).toThrow('Premium features locked');
  });

  test('should generate TLV QR code', () => {
    const invoiceData = {
      seller: { name: 'Test Company', vatNumber: '123456789012345' },
      totalAmount: 100,
      vatAmount: 15,
      issueDate: '2024-01-01',
      issueTime: '10:00:00Z'
    };
    
    const qrCode = sdk.generateTLVQR(invoiceData);
    expect(qrCode).toBeDefined();
    expect(typeof qrCode).toBe('string');
    expect(qrCode.length).toBeGreaterThan(0);
  });

  test('should build invoice XML', () => {
    const invoiceData = {
      invoiceType: 'simplified',
      invoiceNumber: 'SME00001',
      issueDate: '2024-01-01',
      issueTime: '10:00:00Z',
      seller: {
        vatNumber: '123456789012345',
        name: 'Test Company Ltd'
      },
      lines: [{
        description: 'Test Product',
        quantity: 1,
        unitPrice: 100,
        totalAmount: 100
      }],
      totalAmount: 100
    };
    
    const xml = sdk.buildInvoiceXML(invoiceData);
    expect(xml).toBeDefined();
    expect(typeof xml).toBe('string');
    expect(xml).toContain('Invoice');
  });
});