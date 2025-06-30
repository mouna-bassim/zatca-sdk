/**
 * ZATCA API client for Phase-2 e-invoicing
 */

import https from 'https';
import { Buffer } from 'buffer';

/**
 * Submit invoice for clearance
 * @param {string} signedXML - Signed invoice XML
 * @param {string} invoiceType - 'standard' or 'simplified'
 * @param {string} csid - Compliance CSID
 * @param {string} apiBaseUrl - API base URL
 * @returns {Object} Clearance response
 */
export async function submitForClearance(signedXML, invoiceType, csid, apiBaseUrl) {
  try {
    const endpoint = invoiceType === 'standard' 
      ? '/clearance/standard' 
      : '/clearance/simplified';
    
    const requestOptions = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/xml',
        'Accept': 'application/json',
        'Compliance-CSID': csid,
        'Clearance-Status': 'SIMULATION',
        'Accept-Version': '1.0'
      }
    };

    const response = await makeHTTPRequest(
      `${apiBaseUrl}${endpoint}`,
      requestOptions,
      signedXML
    );

    return parseZATCAClearanceResponse(response);
  } catch (error) {
    throw new Error(`Failed to submit for clearance: ${error.message}`);
  }
}

/**
 * Submit for compliance check
 * @param {string} signedXML - Signed invoice XML
 * @param {string} csid - Compliance CSID
 * @param {string} apiBaseUrl - API base URL
 * @returns {Object} Compliance response
 */
export async function submitForCompliance(signedXML, csid, apiBaseUrl) {
  try {
    const requestOptions = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/xml',
        'Accept': 'application/json',
        'Compliance-CSID': csid,
        'Accept-Version': '1.0'
      }
    };

    const response = await makeHTTPRequest(
      `${apiBaseUrl}/compliance`,
      requestOptions,
      signedXML
    );

    return parseZATCAComplianceResponse(response);
  } catch (error) {
    throw new Error(`Failed to submit for compliance: ${error.message}`);
  }
}

/**
 * Make HTTP request to ZATCA API
 * @param {string} url - Request URL
 * @param {Object} options - Request options
 * @param {string} data - Request body data
 * @returns {Promise<Object>} Response data
 */
function makeHTTPRequest(url, options, data) {
  return new Promise((resolve, reject) => {
    try {
      const urlObj = new URL(url);
      
      const requestOptions = {
        hostname: urlObj.hostname,
        port: urlObj.port || 443,
        path: urlObj.pathname + urlObj.search,
        method: options.method,
        headers: {
          'Content-Length': Buffer.byteLength(data, 'utf8'),
          ...options.headers
        },
        // Allow self-signed certificates for sandbox
        rejectUnauthorized: false
      };

      const req = https.request(requestOptions, (res) => {
        let responseData = '';
        
        res.on('data', (chunk) => {
          responseData += chunk;
        });
        
        res.on('end', () => {
          try {
            const result = {
              statusCode: res.statusCode,
              headers: res.headers,
              body: responseData
            };
            
            // Try to parse JSON response
            try {
              result.json = JSON.parse(responseData);
            } catch (e) {
              // Response might not be JSON
              result.text = responseData;
            }
            
            if (res.statusCode >= 200 && res.statusCode < 300) {
              resolve(result);
            } else {
              reject(new Error(`HTTP ${res.statusCode}: ${responseData}`));
            }
          } catch (error) {
            reject(error);
          }
        });
      });

      req.on('error', (error) => {
        reject(new Error(`Request failed: ${error.message}`));
      });

      req.on('timeout', () => {
        req.destroy();
        reject(new Error('Request timeout'));
      });

      // Set timeout
      req.setTimeout(30000);

      // Write data and end request
      req.write(data, 'utf8');
      req.end();
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Parse ZATCA clearance response
 * @param {Object} response - HTTP response
 * @returns {Object} Parsed clearance response
 */
function parseZATCAClearanceResponse(response) {
  try {
    let parsedResponse = {
      statusCode: response.statusCode,
      success: response.statusCode === 200,
      rawResponse: response.body
    };

    if (response.json) {
      parsedResponse = {
        ...parsedResponse,
        clearedUUID: response.json.clearedUUID || response.json.uuid,
        reportingStatus: response.json.reportingStatus || 'CLEARED',
        invoiceHash: response.json.invoiceHash,
        qr: response.json.qr,
        warnings: response.json.warnings || [],
        errors: response.json.errors || []
      };
    } else if (response.text) {
      // Handle XML response
      parsedResponse.xmlResponse = response.text;
    }

    return parsedResponse;
  } catch (error) {
    throw new Error(`Failed to parse clearance response: ${error.message}`);
  }
}

/**
 * Parse ZATCA compliance response
 * @param {Object} response - HTTP response
 * @returns {Object} Parsed compliance response
 */
function parseZATCAComplianceResponse(response) {
  try {
    let parsedResponse = {
      statusCode: response.statusCode,
      success: response.statusCode === 200,
      rawResponse: response.body
    };

    if (response.json) {
      parsedResponse = {
        ...parsedResponse,
        complianceStatus: response.json.complianceStatus || 'PASS',
        validationResults: response.json.validationResults || [],
        warnings: response.json.warnings || [],
        errors: response.json.errors || []
      };
    }

    return parsedResponse;
  } catch (error) {
    throw new Error(`Failed to parse compliance response: ${error.message}`);
  }
}

/**
 * Get API status
 * @param {string} apiBaseUrl - API base URL
 * @returns {Object} API status
 */
export async function getAPIStatus(apiBaseUrl) {
  try {
    const requestOptions = {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      }
    };

    const response = await makeHTTPRequest(
      `${apiBaseUrl}/status`,
      requestOptions,
      ''
    );

    return {
      statusCode: response.statusCode,
      success: response.statusCode === 200,
      status: response.json || response.text
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}
