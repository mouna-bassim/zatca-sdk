# Gumroad Webhook Integration

This directory contains the webhook handler for processing Gumroad payment notifications when customers purchase ZATCA SDK Pro licences.

## Webhook Configuration

Configure your Gumroad product webhook with:

**Endpoint URL:** `https://your-domain.com/webhooks/gumroad/handler`  
**Events:** `sale`, `refund`, `dispute`  
**Secret:** Set in environment variable `GUMROAD_WEBHOOK_SECRET`

## Payload Examples

### Sale Event
```json
{
  "type": "sale",
  "id": "abc123",
  "email": "customer@example.com",
  "product_name": "ZATCA SDK Pro",
  "price": "29",
  "currency": "USD",
  "timestamp": "2025-06-30T12:00:00Z"
}
```

### Refund Event
```json
{
  "type": "refund", 
  "sale_id": "abc123",
  "refund_amount": "29",
  "timestamp": "2025-06-30T12:00:00Z"
}
```

## Security

- All webhook payloads are verified using HMAC-SHA256 signature
- Invalid signatures are rejected with HTTP 401
- Webhook secret must be configured in environment variables

## Licence Key Generation

When a sale is processed:
1. Generate unique ZSDK licence key (format: `ZSDK` + 16 hex characters)
2. Store purchase record with customer email and licence key
3. Send licence key to customer via email (integrate with email service)
4. Activate premium features for the licence key

## Database Schema

Purchase records are stored with:
- `id`: Gumroad sale ID
- `email`: Customer email address  
- `licenceKey`: Generated ZSDK licence key
- `status`: `active`, `refunded`, or `disputed`
- `purchaseDate`: ISO timestamp
- `amount`: Purchase amount
- `currency`: Payment currency