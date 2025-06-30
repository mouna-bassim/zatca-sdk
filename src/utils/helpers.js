/**
 * Helper utilities for ZATCA e-invoicing
 */

import crypto from 'crypto';

/**
 * Format date time to ZATCA required format (ISO 8601)
 * @param {Date|string} date - Date to format
 * @returns {string} Formatted date string
 */
export function formatDateTime(date = new Date()) {
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toISOString();
  } catch (error) {
    throw new Error(`Invalid date format: ${error.message}`);
  }
}

/**
 * Format date to YYYY-MM-DD
 * @param {Date|string} date - Date to format
 * @returns {string} Formatted date string
 */
export function formatDate(date = new Date()) {
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toISOString().split('T')[0];
  } catch (error) {
    throw new Error(`Invalid date format: ${error.message}`);
  }
}

/**
 * Format time to HH:MM:SSZ
 * @param {Date|string} time - Time to format
 * @returns {string} Formatted time string
 */
export function formatTime(time = new Date()) {
  try {
    const timeObj = typeof time === 'string' ? new Date(time) : time;
    return timeObj.toISOString().split('T')[1];
  } catch (error) {
    throw new Error(`Invalid time format: ${error.message}`);
  }
}

/**
 * Validate VAT number format
 * @param {string} vatNumber - VAT number to validate
 * @returns {boolean} Validation result
 */
export function validateVATNumber(vatNumber) {
  if (!vatNumber || typeof vatNumber !== 'string') {
    return false;
  }
  
  // Saudi VAT number should be 15 digits
  const vatRegex = /^\d{15}$/;
  return vatRegex.test(vatNumber);
}

/**
 * Calculate VAT amount
 * @param {number} amount - Base amount
 * @param {number} vatRate - VAT rate (default 15%)
 * @returns {number} VAT amount
 */
export function calculateVAT(amount, vatRate = 15) {
  if (typeof amount !== 'number' || amount < 0) {
    throw new Error('Invalid amount for VAT calculation');
  }
  
  return Number((amount * (vatRate / 100)).toFixed(2));
}

/**
 * Calculate amount excluding VAT
 * @param {number} totalAmount - Total amount including VAT
 * @param {number} vatRate - VAT rate (default 15%)
 * @returns {number} Amount excluding VAT
 */
export function calculateAmountExcludingVAT(totalAmount, vatRate = 15) {
  if (typeof totalAmount !== 'number' || totalAmount < 0) {
    throw new Error('Invalid total amount');
  }
  
  return Number((totalAmount / (1 + vatRate / 100)).toFixed(2));
}

/**
 * Generate UUID v4
 * @returns {string} UUID
 */
export function generateUUID() {
  return crypto.randomUUID();
}

/**
 * Generate random string
 * @param {number} length - String length
 * @returns {string} Random string
 */
export function generateRandomString(length = 16) {
  return crypto.randomBytes(Math.ceil(length / 2)).toString('hex').slice(0, length);
}

/**
 * Hash string with SHA-256
 * @param {string} data - Data to hash
 * @returns {string} Hash in base64 format
 */
export function hashSHA256(data) {
  return crypto.createHash('sha256').update(data, 'utf8').digest('base64');
}

/**
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {boolean} Validation result
 */
export function validateEmail(email) {
  if (!email || typeof email !== 'string') {
    return false;
  }
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Format currency amount
 * @param {number} amount - Amount to format
 * @param {string} currency - Currency code
 * @param {number} decimals - Number of decimal places
 * @returns {string} Formatted amount
 */
export function formatCurrency(amount, currency = 'SAR', decimals = 2) {
  if (typeof amount !== 'number') {
    throw new Error('Amount must be a number');
  }
  
  return amount.toFixed(decimals);
}

/**
 * Validate invoice line item
 * @param {Object} lineItem - Line item to validate
 * @returns {boolean} Validation result
 */
export function validateLineItem(lineItem) {
  if (!lineItem || typeof lineItem !== 'object') {
    return false;
  }
  
  const required = ['itemName', 'quantity', 'unitPrice'];
  return required.every(field => lineItem.hasOwnProperty(field) && lineItem[field] != null);
}

/**
 * Clean XML string
 * @param {string} xml - XML string to clean
 * @returns {string} Cleaned XML
 */
export function cleanXML(xml) {
  if (!xml || typeof xml !== 'string') {
    return '';
  }
  
  return xml
    .replace(/^\s+|\s+$/g, '') // Trim whitespace
    .replace(/>\s+</g, '><')   // Remove whitespace between tags
    .replace(/\s+/g, ' ');     // Normalize internal whitespace
}

/**
 * Escape XML special characters
 * @param {string} text - Text to escape
 * @returns {string} Escaped text
 */
export function escapeXML(text) {
  if (!text || typeof text !== 'string') {
    return '';
  }
  
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Validate invoice data
 * @param {Object} invoiceData - Invoice data to validate
 * @param {string} invoiceType - Invoice type ('standard' or 'simplified')
 * @returns {Object} Validation result
 */
export function validateInvoiceData(invoiceData, invoiceType = 'simplified') {
  const errors = [];
  const warnings = [];
  
  // Basic validation
  if (!invoiceData || typeof invoiceData !== 'object') {
    errors.push('Invoice data is required');
    return { valid: false, errors, warnings };
  }
  
  // Seller validation
  if (!invoiceData.sellerName) {
    errors.push('Seller name is required');
  }
  
  if (!invoiceData.sellerVAT) {
    errors.push('Seller VAT number is required');
  } else if (!validateVATNumber(invoiceData.sellerVAT)) {
    errors.push('Invalid seller VAT number format');
  }
  
  // Amount validation
  if (!invoiceData.totalAmount || typeof invoiceData.totalAmount !== 'number') {
    errors.push('Valid total amount is required');
  } else if (invoiceData.totalAmount <= 0) {
    errors.push('Total amount must be greater than zero');
  }
  
  // Standard invoice specific validation
  if (invoiceType === 'standard') {
    if (!invoiceData.buyerName) {
      errors.push('Buyer name is required for standard invoices');
    }
    
    if (!invoiceData.buyerVAT) {
      errors.push('Buyer VAT number is required for standard invoices');
    } else if (!validateVATNumber(invoiceData.buyerVAT)) {
      errors.push('Invalid buyer VAT number format');
    }
  }
  
  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Sleep for specified milliseconds
 * @param {number} ms - Milliseconds to sleep
 * @returns {Promise} Promise that resolves after sleep
 */
export function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Retry function with exponential backoff
 * @param {Function} fn - Function to retry
 * @param {number} maxRetries - Maximum number of retries
 * @param {number} delay - Initial delay in milliseconds
 * @returns {Promise} Promise that resolves with function result
 */
export async function retry(fn, maxRetries = 3, delay = 1000) {
  let lastError;
  
  for (let i = 0; i <= maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      
      if (i < maxRetries) {
        await sleep(delay * Math.pow(2, i)); // Exponential backoff
      }
    }
  }
  
  throw lastError;
}
