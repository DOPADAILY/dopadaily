import Stripe from 'stripe'

// Server-side Stripe instance - ONLY import this in API routes/server components
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-11-17.clover',
  typescript: true,
})

// Re-export config for convenience in server-side code
export * from './stripe-config'

