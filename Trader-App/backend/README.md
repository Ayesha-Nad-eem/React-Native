# Trader App Backend

Express.js backend server for the Trader App with Stripe payment integration.

## Setup

1. Install dependencies:

```bash
cd backend
npm install
```

2. Configure environment variables:

```bash
cp .env.example .env
```

3. Edit `.env` file with your actual keys:

- `STRIPE_SECRET_KEY`: Your Stripe secret key (get from https://dashboard.stripe.com/apikeys)
- `STRIPE_WEBHOOK_SECRET`: Webhook secret for handling Stripe events (optional for development)

4. Start the server:

```bash
npm start
```

Or for development with auto-reload:

```bash
npm run dev
```

## API Endpoints

### Payment Routes (`/api/payment`)

#### POST `/api/payment/create-checkout-session`

Creates a Stripe checkout session for booking payment.

**Request Body:**

```json
{
  "amount": 150.0,
  "customerName": "John Doe",
  "customerPhone": "+1234567890",
  "carModel": "Mercedes S-Class",
  "distanceKm": 25,
  "durationMin": 45,
  "pickup": { "latitude": 24.8607, "longitude": 67.0011 },
  "dropoff": { "latitude": 24.9207, "longitude": 67.1011 },
  "successUrl": "exp://192.168.1.100:8081/--/payment-success",
  "cancelUrl": "exp://192.168.1.100:8081/--/payment-cancel"
}
```

**Response:**

```json
{
  "sessionId": "cs_test_...",
  "url": "https://checkout.stripe.com/pay/..."
}
```

#### GET `/api/payment/verify-payment/:sessionId`

Verifies the payment status of a checkout session.

**Response:**

```json
{
  "status": "paid",
  "customerEmail": "customer@example.com",
  "amountTotal": 150.0,
  "metadata": {
    "customerName": "John Doe",
    "customerPhone": "+1234567890",
    "carModel": "Mercedes S-Class"
  }
}
```

#### POST `/api/payment/webhook`

Stripe webhook endpoint for handling payment events.

## Environment Variables

| Variable                | Description                   |
| ----------------------- | ----------------------------- |
| `PORT`                  | Server port (default: 3000)   |
| `APP_URL`               | Base URL for the app          |
| `STRIPE_SECRET_KEY`     | Stripe API secret key         |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret |

## Testing

Use Stripe test keys for development. Test card numbers:

- **Success**: `4242 4242 4242 4242`
- **Decline**: `4000 0000 0000 0002`
- **3D Secure**: `4000 0025 0000 3155`

Use any future date for expiry and any 3-digit CVC.
