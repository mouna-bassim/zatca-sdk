/**
 * TypeScript definitions for ZATCA Pro SDK
 */

import { ZATCAInvoiceSDK } from '@zatca-sdk/core';

export interface ProConfig {
  vatNumber?: string;
  sellerName?: string;
  environment?: 'sandbox' | 'production';
  autoRetry?: boolean;
  maxRetries?: number;
  retryDelay?: number;
  certificateAutoRenewal?: boolean;
  args?: string[];
}

export interface CertificateExpiryCheck {
  needsRenewal: boolean;
  daysUntilExpiry?: number;
  error?: string;
}

export declare class ZATCAInvoiceSDKPro extends ZATCAInvoiceSDK {
  constructor(config?: ProConfig);
  
  switchToProduction(): ZATCAInvoiceSDKPro;
  enableAutoRetry(maxRetries?: number, retryDelay?: number): ZATCAInvoiceSDKPro;
  enableCertificateAutoRenewal(): ZATCAInvoiceSDKPro;
  
  withRetry<T>(fn: () => Promise<T>): Promise<T>;
  checkCertificateExpiry(certificatePath: string): Promise<CertificateExpiryCheck>;
}

export declare function assertPremium(args?: string[]): boolean;
export declare function hasPremiumAccess(args?: string[]): boolean;

export declare function isValid(token: string): boolean;
export declare function getLicenceToken(args?: string[]): string | null;
export declare function generateDemoToken(): string;

export declare function submitForClearance(
  signedXML: string, 
  invoiceType: string, 
  csid: string, 
  args?: string[]
): Promise<any>;

export declare function submitForCompliance(
  signedXML: string, 
  csid: string, 
  args?: string[]
): Promise<any>;

export * from '@zatca-sdk/core';
export default ZATCAInvoiceSDKPro;