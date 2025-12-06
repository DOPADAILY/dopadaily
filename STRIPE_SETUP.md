# Stripe Integration Setup

This document explains how to set up Stripe subscription payments for Dopadaily.

## Overview

Dopadaily uses Stripe for subscription billing with two tiers:
- **Free**: Limited features (5 notes, 3 reminders, 3 sounds, read-only forum, fixed timer)
- **Premium**: $97/month - Unlimited access to all features

## Prerequisites

1. A Stripe account (https://stripe.com)
2. Supabase project with the database migrations applied

## Environment Variables

Add these to your `.env.local` file:

```bash
# Stripe Configuration
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...  # Your Stripe publishable key
STRIPE_SECRET_KEY=sk_test_...                    # Your Stripe secret key
STRIPE_WEBHOOK_SECRET=whsec_...                  # Webhook signing secret
STRIPE_PREMIUM_PRICE_ID=price_...                # Price ID for the $97/month subscription
```

## Setup Steps

### 1. Create Stripe Product and Price

1. Go to Stripe Dashboard → Products
2. Click "Add product"
3. Create product:
   - Name: "Dopadaily Premium"
   - Description: "Full access to all Dopadaily features"
4. Add pricing:
   - Price: $97.00
   - Billing period: Monthly
   - Currency: USD
5. Copy the Price ID (starts with `price_`) → Use as `STRIPE_PREMIUM_PRICE_ID`

### 2. Get API Keys

1. Go to Stripe Dashboard → Developers → API keys
2. Copy "Publishable key" → Use as `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
3. Copy "Secret key" → Use as `STRIPE_SECRET_KEY`

### 3. Set Up Webhook

1. Go to Stripe Dashboard → Developers → Webhooks
2. Click "Add endpoint"
3. Endpoint URL: `https://your-domain.com/api/stripe/webhook`
4. Select events:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_failed`
5. Copy the "Signing secret" → Use as `STRIPE_WEBHOOK_SECRET`

### 4. Apply Database Migration

Run the migration to add subscription fields to the profiles table:

```sql
-- Run this in Supabase SQL Editor
-- Located at: supabase/migrations/20241128_add_subscription_fields.sql

ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS subscription_status text DEFAULT 'free',
ADD COLUMN IF NOT EXISTS subscription_plan text DEFAULT 'free',
ADD COLUMN IF NOT EXISTS stripe_customer_id text,
ADD COLUMN IF NOT EXISTS stripe_subscription_id text,
ADD COLUMN IF NOT EXISTS subscription_current_period_end timestamp with time zone,
ADD COLUMN IF NOT EXISTS subscription_cancel_at_period_end boolean DEFAULT false;

-- Add constraints
ALTER TABLE public.profiles 
ADD CONSTRAINT profiles_subscription_status_check 
CHECK (subscription_status IN ('free', 'active', 'canceled', 'past_due', 'trialing'));

ALTER TABLE public.profiles 
ADD CONSTRAINT profiles_subscription_plan_check 
CHECK (subscription_plan IN ('free', 'premium'));

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_profiles_subscription_status ON public.profiles(subscription_status);
CREATE INDEX IF NOT EXISTS idx_profiles_stripe_customer_id ON public.profiles(stripe_customer_id);
```

### 5. Configure Stripe Billing Portal

1. Go to Stripe Dashboard → Settings → Billing → Customer portal
2. Enable the portal
3. Configure allowed actions:
   - Cancel subscription
   - Update payment method
   - View invoices

## Testing

### Test Mode

Use Stripe test mode keys for development:
- Test card: `4242 4242 4242 4242`
- Any future expiry date
- Any CVC

### Test Webhook Locally

Use Stripe CLI to forward webhooks:

```bash
# Install Stripe CLI
brew install stripe/stripe-cli/stripe

# Login
stripe login

# Forward webhooks to localhost
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

## API Routes

| Route | Method | Description |
|-------|--------|-------------|
| `/api/stripe/checkout` | POST | Create checkout session |
| `/api/stripe/webhook` | POST | Handle Stripe webhooks |
| `/api/stripe/portal` | POST | Create billing portal session |

## Feature Gating

Features are gated based on `subscription_status` in the user's profile:

| Feature | Free | Premium |
|---------|------|---------|
| Notes | 5 max | Unlimited |
| Reminders | 3 max | Unlimited |
| Sounds | 3 sounds | Full library |
| Forum | Read only | Full access |
| Timer | Fixed 25/5 | Custom durations |
| Achievements | First 3 | All milestones |
| Analytics | Today only | Full stats |

## Troubleshooting

### Webhook errors
- Verify the webhook secret is correct
- Check that all required events are selected
- Ensure the endpoint URL is correct and publicly accessible

### Subscription not updating
- Check Supabase logs for errors
- Verify the `SUPABASE_SERVICE_ROLE_KEY` is set (needed for webhook handler)
- Check that the user exists in the profiles table

### Checkout not redirecting
- Verify `NEXT_PUBLIC_SITE_URL` is set correctly
- Check browser console for errors
- Ensure the price ID is valid

