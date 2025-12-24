# Nodemailer Email Setup Guide

This project uses Nodemailer to send invoice emails to customers when bookings are created.

## Quick Setup (Gmail)

1. **Enable 2-Factor Authentication**
   - Go to your Google Account settings
   - Navigate to Security
   - Enable 2-Step Verification

2. **Generate App Password**
   - In Security settings, go to "2-Step Verification"
   - Scroll down to "App passwords"
   - Select "Mail" and your device
   - Copy the 16-character password (ignore spaces)

3. **Configure Environment Variables**
   - Copy `.env.example` to `.env`
   - Set the following variables:
     ```
     EMAIL_SERVICE=gmail
     EMAIL_USER=your-email@gmail.com
     EMAIL_PASSWORD=your-16-char-app-password
     ```

4. **Install Dependencies**
   ```bash
   npm install
   ```

5. **Test the Setup**
   - Start the server: `npm run dev`
   - Create a booking through the admin panel
   - The invoice will be sent to the customer's email

## Alternative Email Services

### Outlook/Hotmail
```env
EMAIL_SERVICE=outlook
EMAIL_USER=your-email@outlook.com
EMAIL_PASSWORD=your-password
```

### Yahoo Mail
```env
EMAIL_SERVICE=yahoo
EMAIL_USER=your-email@yahoo.com
EMAIL_PASSWORD=your-password
```

### Custom SMTP Server
```env
SMTP_HOST=smtp.yourdomain.com
SMTP_PORT=587
SMTP_SECURE=false
EMAIL_USER=your-email@yourdomain.com
EMAIL_PASSWORD=your-password
```

### SendGrid (Recommended for Production)
```env
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_SECURE=false
EMAIL_USER=apikey
EMAIL_PASSWORD=your-sendgrid-api-key
```

## Email Template

The invoice email includes:
- Professional HTML template with styling
- Booking confirmation details
- Customer information
- Trip details (pickup, dropoff, date, time)
- Vehicle information
- Fare breakdown
- Plain text fallback for email clients that don't support HTML

## Troubleshooting

**Error: Invalid login**
- Make sure you're using an App Password (not your regular password) for Gmail
- Verify 2FA is enabled on your Google account

**Error: Connection timeout**
- Check your SMTP settings (host, port)
- Verify your firewall isn't blocking outbound SMTP connections
- Try using port 465 with `SMTP_SECURE=true`

**Error: Self-signed certificate**
- Add `NODE_TLS_REJECT_UNAUTHORIZED=0` to `.env` (not recommended for production)
- Or configure proper SSL certificates for your SMTP server

**Email goes to spam**
- Set up SPF, DKIM, and DMARC records for your domain
- Use a reputable email service provider (SendGrid, Mailgun, etc.)
- Avoid spam trigger words in subject and body

## Production Recommendations

For production use, consider:
1. **SendGrid** - Free tier: 100 emails/day
2. **Mailgun** - Free tier: 5,000 emails/month
3. **Amazon SES** - Pay-as-you-go, very cost-effective
4. **Postmark** - Great deliverability, transactional focus

These services offer better deliverability, tracking, and analytics than using Gmail/Outlook.
