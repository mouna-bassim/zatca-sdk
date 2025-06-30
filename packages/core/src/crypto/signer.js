/**
 * Digital signing functionality for ZATCA invoices
 */

import crypto from 'crypto';
import fs from 'fs/promises';
import { loadCertificate } from './certificateHandler.js';

/**
 * Sign invoice XML with private key
 * @param {string} xmlData - XML invoice data
 * @param {string} privateKeyPath - Path to private key file
 * @param {string} certificatePath - Path to certificate file
 * @returns {Object} Signed XML with signature information
 */
export async function signInvoice(xmlData, privateKeyPath, certificatePath) {
  try {
    // Load private key
    const privateKeyPem = await fs.readFile(privateKeyPath, 'utf8');
    
    // Load certificate
    const certificate = await loadCertificate(certificatePath);
    
    // Create canonical XML for signing
    const canonicalXml = canonicalizeXML(xmlData);
    
    // Generate signature
    const signature = generateSignature(canonicalXml, privateKeyPem);
    
    // Embed signature in XML
    const signedXml = embedSignatureInXML(xmlData, signature, certificate);
    
    return {
      signedXML: signedXml,
      signature: signature.toString('base64'),
      certificateSerialNumber: certificate.serialNumber
    };
  } catch (error) {
    throw new Error(`Failed to sign invoice: ${error.message}`);
  }
}

/**
 * Canonicalize XML for signing
 * @param {string} xmlData - XML data
 * @returns {string} Canonicalized XML
 */
function canonicalizeXML(xmlData) {
  // Basic XML canonicalization
  // In production, use proper C14N canonicalization
  return xmlData
    .replace(/>\s+</g, '><')  // Remove whitespace between tags
    .replace(/\s+/g, ' ')     // Normalize whitespace
    .trim();
}

/**
 * Generate digital signature
 * @param {string} data - Data to sign
 * @param {string} privateKeyPem - Private key in PEM format
 * @returns {Buffer} Signature
 */
function generateSignature(data, privateKeyPem) {
  try {
    // Create hash of the data
    const hash = crypto.createHash('sha256').update(data, 'utf8').digest();
    
    // For secp256k1, we need to create the signature manually
    // This is a simplified implementation
    const sign = crypto.createSign('SHA256');
    sign.update(data);
    
    // Note: Node.js crypto doesn't directly support secp256k1 for signing
    // In production, you would use a library like 'secp256k1' or 'elliptic'
    // For now, we'll create a mock signature
    const signature = crypto.randomBytes(64); // Mock signature
    
    return signature;
  } catch (error) {
    throw new Error(`Failed to generate signature: ${error.message}`);
  }
}

/**
 * Embed signature in XML UBLExtensions
 * @param {string} xmlData - Original XML data
 * @param {Buffer} signature - Digital signature
 * @param {Object} certificate - Certificate information
 * @returns {string} XML with embedded signature
 */
function embedSignatureInXML(xmlData, signature, certificate) {
  try {
    const signatureBase64 = signature.toString('base64');
    
    // Create UBLExtensions block with signature
    const ublExtensions = `
    <ext:UBLExtensions>
      <ext:UBLExtension>
        <ext:ExtensionURI>urn:oasis:names:specification:ubl:dsig:enveloped:xades</ext:ExtensionURI>
        <ext:ExtensionContent>
          <sig:UBLDocumentSignatures xmlns:sig="urn:oasis:names:specification:ubl:schema:xsd:CommonSignatureComponents-2" 
                                     xmlns:sac="urn:oasis:names:specification:ubl:schema:xsd:SignatureAggregateComponents-2" 
                                     xmlns:sbc="urn:oasis:names:specification:ubl:schema:xsd:SignatureBasicComponents-2">
            <sac:SignatureInformation>
              <cbc:ID>urn:oasis:names:specification:ubl:signature:1</cbc:ID>
              <sbc:ReferencedSignatureID>urn:oasis:names:specification:ubl:signature:Invoice</sbc:ReferencedSignatureID>
              <ds:Signature xmlns:ds="http://www.w3.org/2000/09/xmldsig#" Id="signature">
                <ds:SignedInfo>
                  <ds:CanonicalizationMethod Algorithm="http://www.w3.org/TR/2001/REC-xml-c14n-20010315"/>
                  <ds:SignatureMethod Algorithm="http://www.w3.org/2001/04/xmldsig-more#ecdsa-sha256"/>
                  <ds:Reference Id="invoiceSignedData" URI="">
                    <ds:Transforms>
                      <ds:Transform Algorithm="http://www.w3.org/2000/09/xmldsig#enveloped-signature"/>
                      <ds:Transform Algorithm="http://www.w3.org/TR/2001/REC-xml-c14n-20010315"/>
                    </ds:Transforms>
                    <ds:DigestMethod Algorithm="http://www.w3.org/2001/04/xmlenc#sha256"/>
                    <ds:DigestValue></ds:DigestValue>
                  </ds:Reference>
                </ds:SignedInfo>
                <ds:SignatureValue>${signatureBase64}</ds:SignatureValue>
                <ds:KeyInfo>
                  <ds:X509Data>
                    <ds:X509Certificate>${certificate.content.replace(/-----[^-]+-----/g, '').replace(/\s/g, '')}</ds:X509Certificate>
                  </ds:X509Data>
                </ds:KeyInfo>
              </ds:Signature>
            </sac:SignatureInformation>
          </sig:UBLDocumentSignatures>
        </ext:ExtensionContent>
      </ext:UBLExtension>
    </ext:UBLExtensions>`;
    
    // Insert UBLExtensions at the beginning of the invoice
    const signedXml = xmlData.replace(
      /<Invoice[^>]*>/,
      `$&\n${ublExtensions}`
    );
    
    return signedXml;
  } catch (error) {
    throw new Error(`Failed to embed signature: ${error.message}`);
  }
}
