/**
 * Constants for ZATCA e-invoicing
 */

export const ZATCA_CONSTANTS = {
  // Invoice Types
  INVOICE_TYPES: {
    STANDARD: 'standard',
    SIMPLIFIED: 'simplified'
  },

  // Invoice Type Codes
  INVOICE_TYPE_CODES: {
    STANDARD: '388',
    SIMPLIFIED: '388'
  },

  // Currency Codes
  CURRENCIES: {
    SAR: 'SAR',
    USD: 'USD',
    EUR: 'EUR'
  },

  // VAT Categories
  VAT_CATEGORIES: {
    STANDARD: 'S',
    ZERO_RATED: 'Z',
    EXEMPT: 'E',
    OUT_OF_SCOPE: 'O'
  },

  // VAT Rates
  VAT_RATES: {
    STANDARD: 15.00,
    ZERO: 0.00
  },

  // Payment Means Codes
  PAYMENT_MEANS: {
    CASH: '10',
    CREDIT_TRANSFER: '30',
    DEBIT: '31',
    CARD: '48'
  },

  // Unit Codes
  UNIT_CODES: {
    PIECE: 'PCE',
    HOUR: 'HUR',
    KILOGRAM: 'KGM',
    METER: 'MTR',
    LITER: 'LTR'
  },

  // Document Types
  DOCUMENT_TYPES: {
    INVOICE: 'Invoice',
    CREDIT_NOTE: 'CreditNote',
    DEBIT_NOTE: 'DebitNote'
  },

  // API Endpoints
  API_ENDPOINTS: {
    COMPLIANCE: '/compliance',
    CLEARANCE_STANDARD: '/clearance/standard',
    CLEARANCE_SIMPLIFIED: '/clearance/simplified',
    STATUS: '/status'
  },

  // Required Fields
  REQUIRED_FIELDS: {
    STANDARD: [
      'sellerVAT',
      'sellerName',
      'buyerVAT',
      'buyerName',
      'totalAmount',
      'lineItems'
    ],
    SIMPLIFIED: [
      'sellerVAT',
      'sellerName',
      'totalAmount'
    ]
  },

  // QR Code Tags
  QR_TAGS: {
    SELLER_NAME: 1,
    VAT_NUMBER: 2,
    TIMESTAMP: 3,
    TOTAL_WITH_VAT: 4,
    VAT_AMOUNT: 5
  },

  // Error Codes
  ERROR_CODES: {
    INVALID_INVOICE: 'INVALID_INVOICE',
    INVALID_SIGNATURE: 'INVALID_SIGNATURE',
    INVALID_CERTIFICATE: 'INVALID_CERTIFICATE',
    API_ERROR: 'API_ERROR',
    NETWORK_ERROR: 'NETWORK_ERROR'
  },

  // Validation Rules
  VALIDATION_RULES: {
    VAT_NUMBER_LENGTH: 15,
    MAX_LINE_ITEMS: 1000,
    MAX_INVOICE_AMOUNT: 999999999.99,
    MIN_INVOICE_AMOUNT: 0.01
  }
};

export const ZATCA_NAMESPACES = {
  UBL: 'urn:oasis:names:specification:ubl:schema:xsd:Invoice-2',
  CAC: 'urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2',
  CBC: 'urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2',
  EXT: 'urn:oasis:names:specification:ubl:schema:xsd:CommonExtensionComponents-2',
  DSIG: 'http://www.w3.org/2000/09/xmldsig#',
  XADES: 'http://uri.etsi.org/01903/v1.3.2#'
};

export const ZATCA_PROFILES = {
  REPORTING: 'reporting:1.0',
  CLEARANCE: 'clearance:1.0'
};

export default ZATCA_CONSTANTS;
