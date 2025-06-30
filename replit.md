# ZATCA Phase-2 e-Invoice SDK

## Overview

This is a Node.js SDK for generating and submitting legally-valid electronic invoices to the Saudi Arabia Zakat, Tax & Customs Authority (ZATCA) Phase-2 system. The SDK provides comprehensive support for both Standard (B2B/B2G) and Simplified (B2C) invoice types, including cryptographic signing, UBL-compliant XML generation, TLV QR code creation, and sandbox API integration.

## System Architecture

### Technology Stack
- **Runtime**: Node.js 16+ with ES modules
- **Testing**: Jest for unit testing
- **Cryptography**: Node.js built-in crypto module with secp256k1 curve
- **Dependencies**: Minimal external dependencies (chalk, dotenv, uuid, jest)
- **Package Type**: ES modules (`"type": "module"`)

### Architecture Pattern
The SDK follows a modular architecture with clear separation of concerns:
- **Crypto Layer**: Key generation, certificate handling, and digital signing
- **Invoice Layer**: XML building and QR code generation
- **API Layer**: ZATCA sandbox integration
- **Utilities**: Helper functions and constants
- **Examples**: Demo scripts for both invoice types

## Key Components

### 1. Main SDK Class (`ZATCAInvoiceSDK`)
- Central orchestrator class that provides a unified interface
- Handles configuration management with environment variable support
- Exposes all core functionality through simple method calls

### 2. Cryptographic Components
- **Key Generator** (`src/crypto/keyGenerator.js`): Generates secp256k1 key pairs and CSR
- **Certificate Handler** (`src/crypto/certificateHandler.js`): Loads and validates certificates
- **Signer** (`src/crypto/signer.js`): Digitally signs invoice XML with private keys

### 3. Invoice Processing Components
- **XML Builder** (`src/invoice/xmlBuilder.js`): Creates UBL-compliant XML for both invoice types
- **QR Generator** (`src/invoice/qrGenerator.js`): Generates Base64-encoded TLV QR codes for simplified invoices

### 4. API Integration
- **ZATCA Client** (`src/api/zatcaClient.js`): Handles communication with ZATCA sandbox APIs
- Supports both compliance checking and invoice clearance endpoints

### 5. Utilities
- **Helpers** (`src/utils/helpers.js`): Common utility functions for date formatting, validation, etc.
- **Constants** (`src/utils/constants.js`): ZATCA-specific constants and enums

## Data Flow

### Standard Invoice Flow (B2B/B2G)
1. Generate device credentials (private key + CSR)
2. Manual certificate acquisition from ZATCA portal
3. Build standard invoice XML with buyer information
4. Sign XML with private key and embed certificate
5. Submit to `/clearance/standard` endpoint
6. Return cleared UUID and invoice hash

### Simplified Invoice Flow (B2C)
1. Generate device credentials (private key + CSR)
2. Manual certificate acquisition from ZATCA portal
3. Build simplified invoice XML
4. Generate TLV QR code with mandatory tags (1-5)
5. Sign XML with private key and embed certificate
6. Submit to `/clearance/simplified` endpoint
7. Return cleared UUID, invoice hash, and QR code

### Manual Certificate Step
The SDK requires manual intervention for certificate acquisition due to CAPTCHA requirements in the ZATCA portal. Users must:
1. Upload the generated CSR to ZATCA Compliance Portal
2. Download the returned certificate
3. Configure the CSID and certificate path in environment variables

## External Dependencies

### Runtime Dependencies
- **chalk**: Console output styling for better UX
- **dotenv**: Environment variable management
- **uuid**: UUID generation for invoice identifiers
- **jest**: Testing framework

### ZATCA Integration
- **Sandbox API**: `https://gw-fatoora.zatca.gov.sa/e-invoicing/developer-portal`
- **Authentication**: CSID-based authentication with certificate embedding
- **Endpoints**: `/compliance`, `/clearance/standard`, `/clearance/simplified`

### Required Environment Variables
- `ZATCA_VAT_NUMBER`: Saudi VAT registration number
- `ZATCA_SELLER_NAME`: Legal seller name
- `ZATCA_API_BASE_URL`: API base URL (defaults to sandbox)
- `ZATCA_CSID`: Compliance CSID from ZATCA portal

## Deployment Strategy

### Development Setup
1. Clone repository
2. Install dependencies: `npm install`
3. Configure environment variables using `.env.example`
4. Generate CSR: Run demo script to create credentials
5. Manual certificate acquisition from ZATCA portal
6. Run demos: `node examples/demo-simplified.js`

### Production Considerations
- Certificate renewal process must be handled manually
- Production API URLs differ from sandbox
- Rate limiting and retry logic not implemented (single-call design)
- No PDF/A-3 embedding support (XML-only output)

### Replit Integration
- One-command demo via `npm start` (configured to run simplified invoice demo)
- All operations work within Replit's Node.js container
- File system operations for key/certificate storage
- Console-based output with colored feedback

### Testing Strategy
- Jest unit tests for core functionality
- Smoke tests for API integration
- Mock implementations for file system operations during testing
- Validation tests for QR code generation and invoice XML structure

Changelog:
- June 30, 2025. Initial setup
- June 30, 2025. Successfully implemented complete ZATCA Phase-2 e-Invoice SDK with working demo

Recent Changes:
- Created working npm start demo that shows CSR generation and mock invoice clearance
- Implemented complete cryptographic flow with secp256k1 key generation
- Built UBL-compliant XML generation for simplified invoices
- Added TLV QR code generation following ZATCA QR spec v2.1
- Successfully demonstrated full workflow from credential generation to invoice clearance simulation
- Created CommonJS-compatible demo script to work with current Node.js configuration
- Added minimal web UI on port 5000 for testing CSR upload and certificate management workflow
- Implemented Arabic ⇄ English language toggle for bilingual support in web interface

User Preferences:
Preferred communication style: Simple, everyday language.