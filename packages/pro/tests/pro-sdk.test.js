/**
 * Jest tests for ZATCA Pro SDK
 */

import { ZATCAInvoiceSDKPro, assertPremium, hasPremiumAccess } from '../src/index.js';
import { isValid, generateDemoToken } from '../src/licence.js';

describe('ZATCA Pro SDK Licence System', () => {
  test('licence validation accepts valid tokens', () => {
    expect(isValid('ZSDK1234567890ABCDEF')).toBe(true);
    expect(isValid('ZSDK' + 'A'.repeat(16))).toBe(true);
  });

  test('licence validation rejects invalid tokens', () => {
    expect(isValid('INVALID1234567890')).toBe(false);
    expect(isValid('ZSDK123')).toBe(false);
    expect(isValid('')).toBe(false);
    expect(isValid(null)).toBe(false);
  });

  test('generated demo token is valid', () => {
    const token = generateDemoToken();
    expect(isValid(token)).toBe(true);
    expect(token).toMatch(/^ZSDK[A-Za-z0-9]{16}$/);
  });

  test('assertPremium throws error without licence', () => {
    expect(() => {
      assertPremium([]);
    }).toThrow('Premium features locked');
  });

  test('assertPremium accepts valid licence from CLI args', () => {
    const args = ['node', 'script.js', '--licence', 'ZSDK1234567890ABCDEF'];
    expect(() => {
      assertPremium(args);
    }).not.toThrow();
  });

  test('hasPremiumAccess returns false without licence', () => {
    expect(hasPremiumAccess([])).toBe(false);
  });

  test('hasPremiumAccess returns true with valid licence', () => {
    const args = ['node', 'script.js', '--licence', 'ZSDK1234567890ABCDEF'];
    expect(hasPremiumAccess(args)).toBe(true);
  });
});

describe('ZATCA Pro SDK Features', () => {
  let sdk;
  const validArgs = ['node', 'script.js', '--licence', 'ZSDK1234567890ABCDEF'];
  
  beforeEach(() => {
    sdk = new ZATCAInvoiceSDKPro({
      vatNumber: '123456789012345',
      sellerName: 'Test Company Ltd',
      args: validArgs
    });
  });

  test('should initialize with production configuration', () => {
    expect(sdk.config.environment).toBe('production');
    expect(sdk.config.simulationMode).toBe(false);
    expect(sdk.config.autoRetry).toBe(true);
    expect(sdk.config.certificateAutoRenewal).toBe(true);
  });

  test('should allow production mode switch', () => {
    expect(() => {
      sdk.switchToProduction();
    }).not.toThrow();
    
    expect(sdk.config.environment).toBe('production');
  });

  test('should enable auto-retry feature', () => {
    expect(() => {
      sdk.enableAutoRetry(5, 2000);
    }).not.toThrow();
    
    expect(sdk.config.maxRetries).toBe(5);
    expect(sdk.config.retryDelay).toBe(2000);
  });

  test('should enable certificate auto-renewal', () => {
    expect(() => {
      sdk.enableCertificateAutoRenewal();
    }).not.toThrow();
    
    expect(sdk.config.certificateAutoRenewal).toBe(true);
  });

  test('should fail initialization without valid licence', () => {
    expect(() => {
      new ZATCAInvoiceSDKPro({
        vatNumber: '123456789012345',
        sellerName: 'Test Company Ltd',
        args: [] // No licence
      });
    }).toThrow('Premium features locked');
  });
});