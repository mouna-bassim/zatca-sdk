/**
 * TLV QR Code generator for ZATCA simplified invoices
 * Implements QR Code spec v2.1
 */

/**
 * Generate TLV (Tag-Length-Value) QR code for simplified invoices
 * @param {Object} invoiceData - Invoice data
 * @returns {string} Base64 encoded TLV QR code
 */
export function generateTLVQR(invoiceData) {
  try {
    const tlvData = [];
    
    // Tag 1: Seller Name
    const sellerName = invoiceData.sellerName || 'Test Company';
    tlvData.push(createTLVTag(1, sellerName));
    
    // Tag 2: VAT Registration Number
    const vatNumber = invoiceData.sellerVAT || '123456789012345';
    tlvData.push(createTLVTag(2, vatNumber));
    
    // Tag 3: Time Stamp (ISO 8601)
    const timestamp = invoiceData.issueDateTime || new Date().toISOString();
    tlvData.push(createTLVTag(3, timestamp));
    
    // Tag 4: Invoice Total (with VAT)
    const totalWithVAT = (invoiceData.totalAmount || 100.00).toFixed(2);
    tlvData.push(createTLVTag(4, totalWithVAT));
    
    // Tag 5: VAT Total
    const vatAmount = calculateVATAmount(invoiceData.totalAmount || 100.00);
    tlvData.push(createTLVTag(5, vatAmount));
    
    // Combine all TLV data
    const combinedTLV = Buffer.concat(tlvData);
    
    // Return base64 encoded TLV
    return combinedTLV.toString('base64');
  } catch (error) {
    throw new Error(`Failed to generate TLV QR: ${error.message}`);
  }
}

/**
 * Create a TLV (Tag-Length-Value) structure
 * @param {number} tag - Tag number
 * @param {string} value - Value to encode
 * @returns {Buffer} TLV encoded buffer
 */
function createTLVTag(tag, value) {
  try {
    const valueBuffer = Buffer.from(value, 'utf8');
    const tagBuffer = Buffer.from([tag]);
    const lengthBuffer = Buffer.from([valueBuffer.length]);
    
    return Buffer.concat([tagBuffer, lengthBuffer, valueBuffer]);
  } catch (error) {
    throw new Error(`Failed to create TLV tag ${tag}: ${error.message}`);
  }
}

/**
 * Calculate VAT amount (15% of total)
 * @param {number} totalAmount - Total amount including VAT
 * @returns {string} VAT amount as string with 2 decimal places
 */
function calculateVATAmount(totalAmount) {
  // Saudi VAT is 15%
  // If total includes VAT: VAT = total * (15/115)
  const vatAmount = totalAmount * (15 / 115);
  return vatAmount.toFixed(2);
}

/**
 * Validate QR code data
 * @param {Object} invoiceData - Invoice data to validate
 * @returns {boolean} Validation result
 */
export function validateQRData(invoiceData) {
  try {
    if (!invoiceData.sellerName) {
      throw new Error('Seller name is required for QR code');
    }
    
    if (!invoiceData.sellerVAT) {
      throw new Error('Seller VAT number is required for QR code');
    }
    
    if (!invoiceData.totalAmount || invoiceData.totalAmount <= 0) {
      throw new Error('Valid total amount is required for QR code');
    }
    
    return true;
  } catch (error) {
    throw new Error(`QR data validation failed: ${error.message}`);
  }
}

/**
 * Parse TLV QR code (for testing/debugging)
 * @param {string} base64TLV - Base64 encoded TLV data
 * @returns {Object} Parsed TLV data
 */
export function parseTLVQR(base64TLV) {
  try {
    const tlvBuffer = Buffer.from(base64TLV, 'base64');
    const parsed = {};
    let offset = 0;
    
    while (offset < tlvBuffer.length) {
      const tag = tlvBuffer[offset];
      const length = tlvBuffer[offset + 1];
      const value = tlvBuffer.slice(offset + 2, offset + 2 + length).toString('utf8');
      
      switch (tag) {
        case 1:
          parsed.sellerName = value;
          break;
        case 2:
          parsed.vatNumber = value;
          break;
        case 3:
          parsed.timestamp = value;
          break;
        case 4:
          parsed.totalWithVAT = value;
          break;
        case 5:
          parsed.vatAmount = value;
          break;
        default:
          parsed[`tag${tag}`] = value;
      }
      
      offset += 2 + length;
    }
    
    return parsed;
  } catch (error) {
    throw new Error(`Failed to parse TLV QR: ${error.message}`);
  }
}
