/**
 * UBL-compliant XML invoice builder for ZATCA
 */

import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import { formatDateTime } from '../utils/helpers.js';

/**
 * Build UBL-compliant invoice XML
 * @param {Object} invoiceData - Invoice data
 * @param {Object} config - Configuration
 * @returns {string} UBL XML string
 */
export function buildInvoiceXML(invoiceData, config = {}) {
  try {
    const invoice = {
      uuid: invoiceData.uuid || uuidv4(),
      issueDate: invoiceData.issueDate || new Date().toISOString().split('T')[0],
      issueTime: invoiceData.issueTime || new Date().toISOString().split('T')[1].split('.')[0] + 'Z',
      invoiceTypeCode: invoiceData.invoiceTypeCode || (invoiceData.type === 'standard' ? '388' : '388'),
      documentCurrencyCode: invoiceData.currency || 'SAR',
      taxCurrencyCode: invoiceData.taxCurrency || 'SAR',
      ...invoiceData
    };

    // Calculate invoice hash (placeholder for now)
    const invoiceHash = calculateInvoiceHash(invoice);
    const previousInvoiceHash = invoiceData.previousInvoiceHash || 'NWZlY2ViNjZmZmM4NmYzOGQ5NTI3ODZjNmQ2OTZjNzljMmRiYzIzOWRkNGU5MWI0NjcyOWQ3M2EyN2ZiNTdlOQ==';

    if (invoice.type === 'simplified' || invoice.invoiceTypeCode === '388') {
      return buildSimplifiedInvoiceXML(invoice, config, invoiceHash, previousInvoiceHash);
    } else {
      return buildStandardInvoiceXML(invoice, config, invoiceHash, previousInvoiceHash);
    }
  } catch (error) {
    throw new Error(`Failed to build invoice XML: ${error.message}`);
  }
}

/**
 * Build simplified (B2C) invoice XML
 */
function buildSimplifiedInvoiceXML(invoice, config, invoiceHash, previousInvoiceHash) {
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
        <cbc:ID schemeID="CRN">${config.vatNumber || invoice.sellerVAT}</cbc:ID>
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
        <cbc:CompanyID>${config.vatNumber || invoice.sellerVAT}</cbc:CompanyID>
        <cac:TaxScheme>
          <cbc:ID>VAT</cbc:ID>
        </cac:TaxScheme>
      </cac:PartyTaxScheme>
      <cac:PartyLegalEntity>
        <cbc:RegistrationName>${config.sellerName || invoice.sellerName}</cbc:RegistrationName>
      </cac:PartyLegalEntity>
    </cac:Party>
  </cac:AccountingSupplierParty>
  
  <!-- Customer (Buyer) - Simplified invoices may not have detailed buyer info -->
  <cac:AccountingCustomerParty>
    <cac:Party>
      <cac:PartyIdentification>
        <cbc:ID schemeID="NAT">${invoice.buyerVAT || 'Not Applicable'}</cbc:ID>
      </cac:PartyIdentification>
    </cac:Party>
  </cac:AccountingCustomerParty>
  
  <!-- Delivery -->
  <cac:Delivery>
    <cbc:ActualDeliveryDate>${invoice.deliveryDate || invoice.issueDate}</cbc:ActualDeliveryDate>
  </cac:Delivery>
  
  <!-- Payment Means -->
  <cac:PaymentMeans>
    <cbc:PaymentMeansCode>${invoice.paymentMeans || '10'}</cbc:PaymentMeansCode>
  </cac:PaymentMeans>
  
  <!-- Tax Total -->
  <cac:TaxTotal>
    <cbc:TaxAmount currencyID="${invoice.taxCurrencyCode}">${calculateTaxAmount(invoice)}</cbc:TaxAmount>
    <cac:TaxSubtotal>
      <cbc:TaxableAmount currencyID="${invoice.documentCurrencyCode}">${calculateTaxableAmount(invoice)}</cbc:TaxableAmount>
      <cbc:TaxAmount currencyID="${invoice.taxCurrencyCode}">${calculateTaxAmount(invoice)}</cbc:TaxAmount>
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
    <cbc:LineExtensionAmount currencyID="${invoice.documentCurrencyCode}">${calculateTaxableAmount(invoice)}</cbc:LineExtensionAmount>
    <cbc:TaxExclusiveAmount currencyID="${invoice.documentCurrencyCode}">${calculateTaxableAmount(invoice)}</cbc:TaxExclusiveAmount>
    <cbc:TaxInclusiveAmount currencyID="${invoice.documentCurrencyCode}">${calculateTotalWithVAT(invoice)}</cbc:TaxInclusiveAmount>
    <cbc:PayableAmount currencyID="${invoice.documentCurrencyCode}">${calculateTotalWithVAT(invoice)}</cbc:PayableAmount>
  </cac:LegalMonetaryTotal>
  
  <!-- Invoice Lines -->
  ${buildInvoiceLines(invoice)}
  
</Invoice>`;

  return xml;
}

/**
 * Build standard (B2B/B2G) invoice XML
 */
function buildStandardInvoiceXML(invoice, config, invoiceHash, previousInvoiceHash) {
  // Standard invoice includes detailed buyer information
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<Invoice xmlns="urn:oasis:names:specification:ubl:schema:xsd:Invoice-2"
         xmlns:cac="urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2"
         xmlns:cbc="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2"
         xmlns:ext="urn:oasis:names:specification:ubl:schema:xsd:CommonExtensionComponents-2">
  
  <cbc:ProfileID>reporting:1.0</cbc:ProfileID>
  <cbc:ID>${invoice.id || 'STD00021'}</cbc:ID>
  <cbc:UUID>${invoice.uuid}</cbc:UUID>
  <cbc:IssueDate>${invoice.issueDate}</cbc:IssueDate>
  <cbc:IssueTime>${invoice.issueTime}</cbc:IssueTime>
  <cbc:InvoiceTypeCode name="0100000">${invoice.invoiceTypeCode}</cbc:InvoiceTypeCode>
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
  
  <!-- Supplier (Seller) -->
  <cac:AccountingSupplierParty>
    <cac:Party>
      <cac:PartyIdentification>
        <cbc:ID schemeID="CRN">${config.vatNumber || invoice.sellerVAT}</cbc:ID>
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
        <cbc:CompanyID>${config.vatNumber || invoice.sellerVAT}</cbc:CompanyID>
        <cac:TaxScheme>
          <cbc:ID>VAT</cbc:ID>
        </cac:TaxScheme>
      </cac:PartyTaxScheme>
      <cac:PartyLegalEntity>
        <cbc:RegistrationName>${config.sellerName || invoice.sellerName}</cbc:RegistrationName>
      </cac:PartyLegalEntity>
    </cac:Party>
  </cac:AccountingSupplierParty>
  
  <!-- Customer (Buyer) -->
  <cac:AccountingCustomerParty>
    <cac:Party>
      <cac:PartyIdentification>
        <cbc:ID schemeID="CRN">${invoice.buyerVAT}</cbc:ID>
      </cac:PartyIdentification>
      <cac:PostalAddress>
        <cbc:StreetName>${invoice.buyerAddress?.street || 'Customer Street'}</cbc:StreetName>
        <cbc:BuildingNumber>${invoice.buyerAddress?.buildingNumber || '5678'}</cbc:BuildingNumber>
        <cbc:PlotIdentification>${invoice.buyerAddress?.plotId || '5678'}</cbc:PlotIdentification>
        <cbc:CitySubdivisionName>${invoice.buyerAddress?.district || 'District'}</cbc:CitySubdivisionName>
        <cbc:CityName>${invoice.buyerAddress?.city || 'Riyadh'}</cbc:CityName>
        <cbc:PostalZone>${invoice.buyerAddress?.postalCode || '54321'}</cbc:PostalZone>
        <cac:Country>
          <cbc:IdentificationCode>SA</cbc:IdentificationCode>
        </cac:Country>
      </cac:PostalAddress>
      <cac:PartyTaxScheme>
        <cbc:CompanyID>${invoice.buyerVAT}</cbc:CompanyID>
        <cac:TaxScheme>
          <cbc:ID>VAT</cbc:ID>
        </cac:TaxScheme>
      </cac:PartyTaxScheme>
      <cac:PartyLegalEntity>
        <cbc:RegistrationName>${invoice.buyerName}</cbc:RegistrationName>
      </cac:PartyLegalEntity>
    </cac:Party>
  </cac:AccountingCustomerParty>
  
  <!-- Delivery -->
  <cac:Delivery>
    <cbc:ActualDeliveryDate>${invoice.deliveryDate || invoice.issueDate}</cbc:ActualDeliveryDate>
  </cac:Delivery>
  
  <!-- Payment Means -->
  <cac:PaymentMeans>
    <cbc:PaymentMeansCode>${invoice.paymentMeans || '30'}</cbc:PaymentMeansCode>
  </cac:PaymentMeans>
  
  <!-- Tax Total -->
  <cac:TaxTotal>
    <cbc:TaxAmount currencyID="${invoice.taxCurrencyCode}">${calculateTaxAmount(invoice)}</cbc:TaxAmount>
    <cac:TaxSubtotal>
      <cbc:TaxableAmount currencyID="${invoice.documentCurrencyCode}">${calculateTaxableAmount(invoice)}</cbc:TaxableAmount>
      <cbc:TaxAmount currencyID="${invoice.taxCurrencyCode}">${calculateTaxAmount(invoice)}</cbc:TaxAmount>
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
    <cbc:LineExtensionAmount currencyID="${invoice.documentCurrencyCode}">${calculateTaxableAmount(invoice)}</cbc:LineExtensionAmount>
    <cbc:TaxExclusiveAmount currencyID="${invoice.documentCurrencyCode}">${calculateTaxableAmount(invoice)}</cbc:TaxExclusiveAmount>
    <cbc:TaxInclusiveAmount currencyID="${invoice.documentCurrencyCode}">${calculateTotalWithVAT(invoice)}</cbc:TaxInclusiveAmount>
    <cbc:PayableAmount currencyID="${invoice.documentCurrencyCode}">${calculateTotalWithVAT(invoice)}</cbc:PayableAmount>
  </cac:LegalMonetaryTotal>
  
  <!-- Invoice Lines -->
  ${buildInvoiceLines(invoice)}
  
</Invoice>`;

  return xml;
}

/**
 * Build invoice lines XML
 */
function buildInvoiceLines(invoice) {
  const lines = invoice.lineItems || [
    {
      id: '1',
      quantity: 1,
      unitCode: 'PCE',
      unitPrice: calculateTaxableAmount(invoice),
      itemName: 'Test Item',
      itemType: 'S' // Service
    }
  ];

  return lines.map((line, index) => `
  <cac:InvoiceLine>
    <cbc:ID>${line.id || (index + 1)}</cbc:ID>
    <cbc:InvoicedQuantity unitCode="${line.unitCode || 'PCE'}">${line.quantity || 1}</cbc:InvoicedQuantity>
    <cbc:LineExtensionAmount currencyID="SAR">${line.unitPrice || calculateTaxableAmount(invoice)}</cbc:LineExtensionAmount>
    <cac:TaxTotal>
      <cbc:TaxAmount currencyID="SAR">${(parseFloat(line.unitPrice || calculateTaxableAmount(invoice)) * 0.15).toFixed(2)}</cbc:TaxAmount>
    </cac:TaxTotal>
    <cac:Item>
      <cbc:Name>${line.itemName || 'Test Item'}</cbc:Name>
      <cac:ClassifiedTaxCategory>
        <cbc:ID>S</cbc:ID>
        <cbc:Percent>15.00</cbc:Percent>
        <cac:TaxScheme>
          <cbc:ID>VAT</cbc:ID>
        </cac:TaxScheme>
      </cac:ClassifiedTaxCategory>
    </cac:Item>
    <cac:Price>
      <cbc:PriceAmount currencyID="SAR">${line.unitPrice || calculateTaxableAmount(invoice)}</cbc:PriceAmount>
    </cac:Price>
  </cac:InvoiceLine>`).join('');
}

/**
 * Calculate invoice hash
 */
function calculateInvoiceHash(invoice) {
  const hashContent = `${invoice.uuid}${invoice.issueDate}${invoice.issueTime}`;
  return crypto.createHash('sha256').update(hashContent).digest('base64');
}

/**
 * Calculate tax amount (15% VAT)
 */
function calculateTaxAmount(invoice) {
  const totalAmount = invoice.totalAmount || 100.00;
  return (totalAmount * 0.15 / 1.15).toFixed(2);
}

/**
 * Calculate taxable amount (amount without VAT)
 */
function calculateTaxableAmount(invoice) {
  const totalAmount = invoice.totalAmount || 100.00;
  return (totalAmount / 1.15).toFixed(2);
}

/**
 * Calculate total with VAT
 */
function calculateTotalWithVAT(invoice) {
  return (invoice.totalAmount || 100.00).toFixed(2);
}
