# ZATCA SDK Demo Environment

This directory contains the interactive demo environment for testing and showcasing the ZATCA SDK functionality. This demo is hosted separately and not included in the npm packages.

## Demo Features

- **Interactive Web UI** - Test invoice generation, signing, and clearance
- **Multilingual Support** - Arabic and English interface
- **CSR Generation** - Generate device credentials for ZATCA compliance
- **Certificate Management** - Upload certificates and configure CSID
- **Invoice Testing** - Test both simplified (B2C) and standard (B2B) invoice flows
- **Gumroad Integration** - Payment processing and licence management
- **Admin Dashboard** - Monitor purchases and validate licence keys

## Running the Demo

```bash
cd demo
node server.js
```

The demo will be available at `http://localhost:5000`

## File Structure

- `server.js` - Express server with API endpoints and UI
- `docs/` - HTML pages for buy/admin interfaces
- `i18n/` - Internationalization files (Arabic/English)

## Demo Endpoints

- `/` - Main testing interface
- `/docs/buy.html` - Purchase Pro licence page
- `/docs/admin.html` - Admin dashboard for monitoring
- `/api/gumroad/webhook` - Webhook for payment processing
- `/api/validate-licence` - Licence key validation
- `/api/purchase-stats` - Purchase statistics

## Live Demo

The demo is hosted at: https://replit.com/@mouna-bassim/zatca-sdk

## Note

This demo environment is for testing and marketing purposes only. It includes payment integration stubs and should not be used in production without proper webhook configuration and database setup.

For production usage, install the npm packages:
- `@zatca-sdk/core` - Free sandbox features
- `@zatca-sdk/pro` - Premium production features