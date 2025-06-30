# ZATCA Phase-2 e-Invoice SDK

A comprehensive Node.js SDK for generating and submitting legally-valid electronic invoices to the Saudi Arabia Zakat, Tax & Customs Authority (ZATCA) Phase-2 system.

## 🚀 Features

- **Complete Phase-2 Compliance**: Supports both Standard (B2B/B2G) and Simplified (B2C) invoice types
- **Cryptographic Security**: Generate secp256k1 device keys and CSR with proper digital signing
- **UBL-Compliant XML**: Generate Saudi-flavored UBL 2.1 invoice XML with all mandatory fields
- **TLV QR Codes**: Generate Base64-encoded QR codes for simplified invoices (QR spec v2.1)
- **Sandbox Integration**: Connect to ZATCA's Integration/Clearance sandbox APIs
- **Production Ready**: MIT licensed, fully documented, and test-covered

## 📋 Prerequisites

- Node.js 16+ with ES modules support
- Valid Saudi VAT registration number
- ZATCA developer portal access for certificate generation

## 🔧 Installation

```bash
npm install zatca-phase2-sdk
