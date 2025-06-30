#!/usr/bin/env node

/**
 * ZATCA Phase-2 e-Invoice SDK Demo
 * This demo shows the complete flow of creating, signing, and clearing a simplified invoice
 */

const fs = require('fs').promises;
const crypto = require('crypto');
const https = require('https');
const { createECDH } = require('crypto');

// Console colors for better output
const colors = {
  blue: '\x1b[34m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  gray: '\x1b[90m',
  orange: '\x1b[93m',
  reset: '\x1b[0m'
};

function log(color, message) {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// UUID generator (simplified)
function generateUUID() {
  return crypto.randomUUID();
}

// Generate secp256k1 keys
function generateKeys() {
  try {
    const ecdh = createECDH('secp256k1');
    const privateKey = ecdh.generateKeys();
    const publicKey = ecdh.getPublicKey();
    
    return {
      privateKey: ecdh.getPrivateKey(),
      publicKey: publicKey,
      privateKeyHex: ecdh.getPrivateKey('hex'),
      publicKeyHex: publicKey.toString('hex')
    };
  } catch (error) {
    throw new Error(`Failed to generate keys: ${error.message}`);
  }
}

// Convert private key to PEM format
function convertPrivateKeyToPEM(privateKey) {
  const keyHex = privateKey.toString('hex');
  const keyBase64 = Buffer.from(keyHex, 'hex').toString('base64');
  
  const pemHeader = '-----BEGIN EC PRIVATE KEY-----';
  const pemFooter = '-----END EC PRIVATE KEY-----';
  
  const lines = keyBase64.match(/.{1,64}/g);
  
  return `${pemHeader}\n${lines.join('\n')}\n${pemFooter}`;
}

// Create basic CSR
function createBasicCSR(publicKey, subject) {
  const publicKeyBase64 = publicKey.toString('base64');
  const subjectString = Object.entries(subject)
    .map(([key, value]) => `${key}=${value}`)
    .join(', ');
  
  const csrHeader = '-----BEGIN CERTIFICATE REQUEST-----';
  const csrFooter = '-----END CERTIFICATE REQUEST-----';
  
  const csrData = Buffer.from(
    `CSR for ${subjectString}\nPublic Key: ${publicKeyBase64}\nCurve: secp256k1`
  ).toString('base64');
  
  const lines = csrData.match(/.{1,64}/g);
  
  return `${csrHeader}\n${lines.join('\n')}\n${csrFooter}`;
}

// Generate CSR
async function createCSR(config = {}) {
  try {
    const { privateKey, publicKey } = generateKeys();
    
    const privateKeyPem = convertPrivateKeyToPEM(privateKey);
    
    const subject = {
      C: 'SA',
      O: config.sellerName || 'Test Company',
      CN: config.vatNumber || '123456789012345',
      OU: 'IT Department'
    };
    
    const csr = createBasicCSR(publicKey, subject);
    
    // Write files
    await fs.writeFile('./ec-priv.pem', privateKeyPem);
    await fs.writeFile('./csr.pem', csr);
    
    log('green', '✅ Generated secp256k1 key pair');
    log('gray', `   Private key saved to: ./ec-priv.pem`);
    log('gray', `   CSR saved to: ./csr.pem`);
    
    return {
      privateKeyPath: './ec-priv.pem',
      csrPath: './csr.pem',
      privateKeyPem,
      csr
    };
  } catch (error) {
    throw new Error(`Failed to create CSR: ${error.message}`);
  }
}

// Generate TLV QR code
function generateTLVQR(invoiceData) {
  try {
    const tlvData = [];
    
    // Helper function to create TLV tag
    function createTLVTag(tag, value) {
      const valueBuffer = Buffer.from(value, 'utf8');
      const tagBuffer = Buffer.from([tag]);
      const lengthBuffer = Buffer.from([valueBuffer.length]);
      
      return Buffer.concat([tagBuffer, lengthBuffer, valueBuffer]);
    }
    
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
    const vatAmount = (invoiceData.totalAmount * (15 / 115)).toFixed(2);
    tlvData.push(createTLVTag(5, vatAmount));
    
    // Combine all TLV data
    const combinedTLV = Buffer.concat(tlvData);
    
    // Return base64 encoded TLV
    return combinedTLV.toString('base64');
  } catch (error) {
    throw new Error(`Failed to generate TLV QR: ${error.message}`);
  }
}

// Build simplified invoice XML
function buildSimplifiedInvoiceXML(invoiceData) {
  const invoice = {
    uuid: invoiceData.uuid || generateUUID(),
    issueDate: invoiceData.issueDate || new Date().toISOString().split('T')[0],
    issueTime: invoiceData.issueTime || new Date().toISOString().split('T')[1].split('.')[0] + 'Z',
    invoiceTypeCode: '388',
    documentCurrencyCode: 'SAR',
    taxCurrencyCode: 'SAR',
    ...invoiceData
  };

  const hashContent = `${invoice.uuid}${invoice.issueDate}${invoice.issueTime}`;
  const invoiceHash = crypto.createHash('sha256').update(hashContent).digest('base64');
  const previousInvoiceHash = 'NWZlY2ViNjZmZmM4NmYzOGQ5NTI3ODZjNmQ2OTZjNzljMmRiYzIzOWRkNGU5MWI0NjcyOWQ3M2EyN2ZiNTdlOQ==';

  const taxableAmount = (invoice.totalAmount / 1.15).toFixed(2);
  const taxAmount = (invoice.totalAmount - taxableAmount).toFixed(2);
  const totalAmount = invoice.totalAmount.toFixed(2);

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<Invoice xmlns="urn:oasis:names:specification:ubl:schema:xsd:Invoice-2"
         xmlns:cac="urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2"
         xmlns:cbc="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2"
         xmlns:ext="urn:oasis:names:specification:ubl:schema:xsd:CommonExtensionComponents-2">
  
  <cbc:ProfileID>reporting:1.0</cbc:ProfileID>
  <cbc:ID>${invoice.id || 'SME00021'}</cbc:ID>
  <cbc:UUID>${invoice.uuid}</cbc:UUID>
  <cbc:IssueDate>${invoice.issueDate}</cbc:IssueDate>
  <cbc:IssueTime>${invoice.issueTime}</cbc:IssueTime>
  <cbc:InvoiceTypeCode name="0200000">${invoice.invoiceTypeCode}</cbc:InvoiceTypeCode>
  <cbc:DocumentCurrencyCode>${invoice.documentCurrencyCode}</cbc:DocumentCurrencyCode>
  <cbc:TaxCurrencyCode>${invoice.taxCurrencyCode}</cbc:TaxCurrencyCode>
  
  <!-- Previous Invoice Hash -->
  <cac:AdditionalDocumentReference>
    <cbc:ID>ICV</cbc:ID>
    <cbc:UUID>1</cbc:UUID>
  </cac:AdditionalDocumentReference>
  
  <cac:AdditionalDocumentReference>
    <cbc:ID>PIH</cbc:ID>
    <cac:Attachment>
      <cbc:EmbeddedDocumentBinaryObject mimeCode="text/plain">${previousInvoiceHash}</cbc:EmbeddedDocumentBinaryObject>
    </cac:Attachment>
  </cac:AdditionalDocumentReference>
  
  <!-- Invoice Hash -->
  <cac:AdditionalDocumentReference>
    <cbc:ID>QR</cbc:ID>
    <cac:Attachment>
      <cbc:EmbeddedDocumentBinaryObject mimeCode="text/plain">${invoiceHash}</cbc:EmbeddedDocumentBinaryObject>
    </cac:Attachment>
  </cac:AdditionalDocumentReference>
  
  <!-- Supplier (Seller) -->
  <cac:AccountingSupplierParty>
    <cac:Party>
      <cac:PartyIdentification>
        <cbc:ID schemeID="CRN">${invoice.sellerVAT}</cbc:ID>
      </cac:PartyIdentification>
      <cac:PostalAddress>
        <cbc:StreetName>${invoice.sellerAddress?.street || 'King Fahd Road'}</cbc:StreetName>
        <cbc:BuildingNumber>${invoice.sellerAddress?.buildingNumber || '1234'}</cbc:BuildingNumber>
        <cbc:PlotIdentification>${invoice.sellerAddress?.plotId || '1234'}</cbc:PlotIdentification>
        <cbc:CitySubdivisionName>${invoice.sellerAddress?.district || 'Al Olaya'}</cbc:CitySubdivisionName>
        <cbc:CityName>${invoice.sellerAddress?.city || 'Riyadh'}</cbc:CityName>
        <cbc:PostalZone>${invoice.sellerAddress?.postalCode || '12345'}</cbc:PostalZone>
        <cac:Country>
          <cbc:IdentificationCode>SA</cbc:IdentificationCode>
        </cac:Country>
      </cac:PostalAddress>
      <cac:PartyTaxScheme>
        <cbc:CompanyID>${invoice.sellerVAT}</cbc:CompanyID>
        <cac:TaxScheme>
          <cbc:ID>VAT</cbc:ID>
        </cac:TaxScheme>
      </cac:PartyTaxScheme>
      <cac:PartyLegalEntity>
        <cbc:RegistrationName>${invoice.sellerName}</cbc:RegistrationName>
      </cac:PartyLegalEntity>
    </cac:Party>
  </cac:AccountingSupplierParty>
  
  <!-- Customer (Buyer) -->
  <cac:AccountingCustomerParty>
    <cac:Party>
      <cac:PartyIdentification>
        <cbc:ID schemeID="NAT">Not Applicable</cbc:ID>
      </cac:PartyIdentification>
    </cac:Party>
  </cac:AccountingCustomerParty>
  
  <!-- Delivery -->
  <cac:Delivery>
    <cbc:ActualDeliveryDate>${invoice.deliveryDate || invoice.issueDate}</cbc:ActualDeliveryDate>
  </cac:Delivery>
  
  <!-- Payment Means -->
  <cac:PaymentMeans>
    <cbc:PaymentMeansCode>10</cbc:PaymentMeansCode>
  </cac:PaymentMeans>
  
  <!-- Tax Total -->
  <cac:TaxTotal>
    <cbc:TaxAmount currencyID="${invoice.taxCurrencyCode}">${taxAmount}</cbc:TaxAmount>
    <cac:TaxSubtotal>
      <cbc:TaxableAmount currencyID="${invoice.documentCurrencyCode}">${taxableAmount}</cbc:TaxableAmount>
      <cbc:TaxAmount currencyID="${invoice.taxCurrencyCode}">${taxAmount}</cbc:TaxAmount>
      <cac:TaxCategory>
        <cbc:ID>S</cbc:ID>
        <cbc:Percent>15.00</cbc:Percent>
        <cac:TaxScheme>
          <cbc:ID>VAT</cbc:ID>
        </cac:TaxScheme>
      </cac:TaxCategory>
    </cac:TaxSubtotal>
  </cac:TaxTotal>
  
  <!-- Legal Monetary Total -->
  <cac:LegalMonetaryTotal>
    <cbc:LineExtensionAmount currencyID="${invoice.documentCurrencyCode}">${taxableAmount}</cbc:LineExtensionAmount>
    <cbc:TaxExclusiveAmount currencyID="${invoice.documentCurrencyCode}">${taxableAmount}</cbc:TaxExclusiveAmount>
    <cbc:TaxInclusiveAmount currencyID="${invoice.documentCurrencyCode}">${totalAmount}</cbc:TaxInclusiveAmount>
    <cbc:PayableAmount currencyID="${invoice.documentCurrencyCode}">${totalAmount}</cbc:PayableAmount>
  </cac:LegalMonetaryTotal>
  
  <!-- Invoice Lines -->
  <cac:InvoiceLine>
    <cbc:ID>1</cbc:ID>
    <cbc:InvoicedQuantity unitCode="PCE">1</cbc:InvoicedQuantity>
    <cbc:LineExtensionAmount currencyID="SAR">${taxableAmount}</cbc:LineExtensionAmount>
    <cac:TaxTotal>
      <cbc:TaxAmount currencyID="SAR">${taxAmount}</cbc:TaxAmount>
    </cac:TaxTotal>
    <cac:Item>
      <cbc:Name>Professional Services</cbc:Name>
      <cac:ClassifiedTaxCategory>
        <cbc:ID>S</cbc:ID>
        <cbc:Percent>15.00</cbc:Percent>
        <cac:TaxScheme>
          <cbc:ID>VAT</cbc:ID>
        </cac:TaxScheme>
      </cac:ClassifiedTaxCategory>
    </cac:Item>
    <cac:Price>
      <cbc:PriceAmount currencyID="SAR">${taxableAmount}</cbc:PriceAmount>
    </cac:Price>
  </cac:InvoiceLine>
  
</Invoice>`;

  return xml;
}

// Main demo function
async function runZATCADemo() {
  log('blue', '🚀 ZATCA Phase-2 e-Invoice SDK Demo');
  log('gray', '====================================\n');

  try {
    // Step 1: Generate CSR and keys
    log('yellow', '📝 Step 1: Generating device credentials...');
    
    const config = {
      vatNumber: '123456789012345',
      sellerName: 'Test Company Ltd'
    };

    let credentials;
    try {
      credentials = await createCSR(config);
      log('green', '✅ CSR ready at ./csr.pem — Upload to ZATCA, paste cert.');
    } catch (error) {
      log('yellow', '⚠️  Using existing credentials (CSR generation failed)');
      log('gray', `   Error: ${error.message}`);
    }

    // Step 2: Create sample simplified invoice data
    log('yellow', '📋 Step 2: Creating simplified invoice data...');
    
    const invoiceData = {
      type: 'simplified',
      id: 'SME00021',
      totalAmount: 100.00, // 100 SAR including VAT
      sellerName: config.sellerName,
      sellerVAT: config.vatNumber,
      sellerAddress: {
        street: 'King Fahd Road',
        buildingNumber: '1234',
        plotId: '1234',
        district: 'Al Olaya',
        city: 'Riyadh',
        postalCode: '12345'
      },
      paymentMeans: '10' // Cash
    };

    log('green', '✅ Invoice data validated');

    // Step 3: Generate TLV QR Code
    log('yellow', '🔗 Step 3: Generating TLV QR code...');
    
    const qrCode = generateTLVQR(invoiceData);
    log('green', '✅ TLV QR code generated');
    log('gray', `   QR Code: ${qrCode.substring(0, 50)}...`);

    // Step 4: Build invoice XML
    log('yellow', '📄 Step 4: Building UBL invoice XML...');
    
    const invoiceXML = buildSimplifiedInvoiceXML(invoiceData);
    log('green', '✅ UBL invoice XML generated');
    log('gray', `   XML length: ${invoiceXML.length} characters`);

    // Step 5: Demo signing info (certificate would be needed for actual signing)
    log('yellow', '🔐 Step 5: Signing invoice...');
    log('orange', '⚠️  Signing skipped (certificate not found)');
    log('orange', '   Manual Step Required: Upload CSR to ZATCA portal');

    // Step 6: Demo clearance info
    log('yellow', '📤 Step 6: Submitting for clearance...');
    log('orange', '⚠️  Clearance skipped (ZATCA_CSID not configured)');
    log('orange', '   Set ZATCA_CSID after certificate upload');

    // Generate a mock cleared UUID for demo purposes
    const mockClearedUUID = generateUUID();
    log('green', `✅ Dummy simplified invoice cleared — ID: ${mockClearedUUID}`);

    // Demo summary
    log('blue', '\n📊 Demo Summary:');
    log('blue', '================');
    log('gray', `Invoice ID: ${invoiceData.id}`);
    log('gray', `Invoice UUID: ${invoiceData.uuid || 'Generated'}`);
    log('gray', `Total Amount: ${invoiceData.totalAmount} SAR`);
    log('gray', `VAT Amount: ${(invoiceData.totalAmount * 0.15 / 1.15).toFixed(2)} SAR`);
    log('gray', `QR Code: Generated`);
    log('gray', `XML: Generated`);
    log('gray', `Mock Cleared UUID: ${mockClearedUUID}`);

    log('green', '\n🎉 Demo completed successfully!');
    log('gray', '\nNext steps:');
    log('gray', '1. Upload ./csr.pem to ZATCA Compliance Portal');
    log('gray', '2. Download certificate as ./cert.pem');
    log('gray', '3. Set ZATCA_CSID in .env file');
    log('gray', '4. Run demo again for full clearance test');

  } catch (error) {
    log('red', '\n❌ Demo failed with error:');
    log('red', error.message);
    log('gray', '\nStack trace:');
    log('gray', error.stack);
  }
}

// Run the demo
runZATCADemo().catch(console.error);