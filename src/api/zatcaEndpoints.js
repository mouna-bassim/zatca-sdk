/**
 * ZATCA API endpoints and configuration
 * Implementation based on ZATCA specification for Phase-2 e-invoicing
 */

// Base URLs for ZATCA API
export const ZATCA_BASE_URLS = {
    sandbox: 'https://gw-fatoora.zatca.gov.sa',
    production: 'https://gw-fatoora.zatca.gov.sa'
};

// API endpoints mapping
export const ZATCA_ENDPOINTS = {
    // Door A: Compliance / Device-enablement API (once per device)
    compliance: '/e-invoicing/simulation/compliance',
    complianceProduction: '/e-invoicing/production/compliance',
    
    // Door B: Clearance API (every invoice)
    clearanceSimplified: '/e-invoicing/simulation/clearance/simplified',
    clearanceStandard: '/e-invoicing/simulation/clearance/standard',
    clearanceSimplifiedProduction: '/e-invoicing/production/clearance/simplified',
    clearanceStandardProduction: '/e-invoicing/production/clearance/standard'
};

/**
 * Build complete API URL
 * @param {string} environment - 'sandbox' or 'production'
 * @param {string} endpoint - endpoint key from ZATCA_ENDPOINTS
 * @returns {string} Complete URL
 */
export function buildAPIURL(environment = 'sandbox', endpoint) {
    const baseUrl = ZATCA_BASE_URLS[environment];
    const endpointPath = ZATCA_ENDPOINTS[endpoint];
    
    if (!baseUrl || !endpointPath) {
        throw new Error(`Invalid environment (${environment}) or endpoint (${endpoint})`);
    }
    
    return `${baseUrl}${endpointPath}`;
}

/**
 * Get appropriate headers for ZATCA API calls
 * @param {string} csid - Compliance CSID
 * @param {string} apiType - 'compliance' or 'clearance'
 * @returns {Object} Headers object
 */
export function getZATCAHeaders(csid, apiType = 'clearance') {
    const headers = {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Compliance-CSID': csid
    };
    
    if (apiType === 'clearance') {
        headers['Clearance-Status'] = 'SIMULATION';
    }
    
    return headers;
}

/**
 * Submit invoice for compliance check (Door A)
 * @param {string} signedXML - Base64 encoded signed XML
 * @param {string} invoiceHash - Invoice hash
 * @param {string} csid - Compliance CSID
 * @param {string} environment - 'sandbox' or 'production'
 * @returns {Promise<Object>} Compliance response
 */
export async function submitForCompliance(signedXML, invoiceHash, csid, environment = 'sandbox') {
    const url = buildAPIURL(environment, 'compliance');
    const headers = getZATCAHeaders(csid, 'compliance');
    
    const requestBody = {
        invoiceHash: invoiceHash,
        uuid: crypto.randomUUID(),
        invoice: signedXML
    };
    
    return makeZATCARequest(url, headers, requestBody);
}

/**
 * Submit invoice for clearance (Door B)
 * @param {string} signedXML - Base64 encoded signed XML
 * @param {string} invoiceHash - Invoice hash
 * @param {string} invoiceType - 'simplified' or 'standard'
 * @param {string} csid - Compliance CSID
 * @param {string} environment - 'sandbox' or 'production'
 * @returns {Promise<Object>} Clearance response
 */
export async function submitForClearance(signedXML, invoiceHash, invoiceType, csid, environment = 'sandbox') {
    const endpointKey = invoiceType === 'simplified' ? 'clearanceSimplified' : 'clearanceStandard';
    const url = buildAPIURL(environment, endpointKey);
    const headers = getZATCAHeaders(csid, 'clearance');
    
    const requestBody = {
        invoiceHash: invoiceHash,
        uuid: crypto.randomUUID(),
        invoice: signedXML
    };
    
    return makeZATCARequest(url, headers, requestBody);
}

/**
 * Make HTTP request to ZATCA API
 * @param {string} url - Complete API URL
 * @param {Object} headers - Request headers
 * @param {Object} body - Request body
 * @returns {Promise<Object>} API response
 */
async function makeZATCARequest(url, headers, body) {
    try {
        const https = require('https');
        const requestData = JSON.stringify(body);
        
        return new Promise((resolve, reject) => {
            const options = {
                method: 'POST',
                headers: {
                    ...headers,
                    'Content-Length': Buffer.byteLength(requestData)
                }
            };
            
            const req = https.request(url, options, (res) => {
                let responseData = '';
                
                res.on('data', (chunk) => {
                    responseData += chunk;
                });
                
                res.on('end', () => {
                    try {
                        const parsedResponse = JSON.parse(responseData);
                        
                        if (res.statusCode === 200) {
                            resolve({
                                success: true,
                                statusCode: res.statusCode,
                                data: parsedResponse,
                                reportingStatus: parsedResponse.reportingStatus,
                                clearedUUID: parsedResponse.clearedInvoice?.uuid,
                                invoiceHash: parsedResponse.invoiceHash
                            });
                        } else {
                            resolve({
                                success: false,
                                statusCode: res.statusCode,
                                error: parsedResponse.error || `HTTP ${res.statusCode}`,
                                data: parsedResponse
                            });
                        }
                    } catch (parseError) {
                        reject(new Error(`Failed to parse ZATCA response: ${parseError.message}`));
                    }
                });
            });
            
            req.on('error', (error) => {
                reject(new Error(`ZATCA API request failed: ${error.message}`));
            });
            
            req.write(requestData);
            req.end();
        });
    } catch (error) {
        return {
            success: false,
            error: `Request setup failed: ${error.message}`
        };
    }
}

/**
 * Parse and format ZATCA error responses
 * @param {Object} errorResponse - Error response from ZATCA
 * @returns {string} Formatted error message
 */
export function formatZATCAError(errorResponse) {
    if (!errorResponse.data) {
        return errorResponse.error || 'Unknown ZATCA API error';
    }
    
    const { statusCode, data } = errorResponse;
    
    // Common ZATCA error mappings
    const errorMappings = {
        403: 'INVALID_CSID - Check your CSID value',
        400: 'INVALID_SIGNATURE - Certificate/key mismatch or invalid XML',
        422: 'XML_VALIDATION_FAILED - Missing mandatory UBL fields'
    };
    
    const commonError = errorMappings[statusCode];
    if (commonError) {
        return commonError;
    }
    
    if (data.validationResults && data.validationResults.length > 0) {
        return `Validation failed: ${data.validationResults[0].errorMessage}`;
    }
    
    return `HTTP ${statusCode}: ${data.error || 'ZATCA API error'}`;
}