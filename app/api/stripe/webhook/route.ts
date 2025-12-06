import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { createClient } from '@supabase/supabase-js'
import Stripe from 'stripe'

// Use service role client for webhook (bypasses RLS)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
)

export async function POST(request: NextRequest) {
  const body = await request.text()
  const signature = request.headers.get('stripe-signature')

  if (!signature) {
    return NextResponse.json({ error: 'No signature' }, { status: 400 })
  }

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (err) {
    console.error('Webhook signature verification failed:', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        await handleCheckoutComplete(session)
        break
      }

      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription
        await handleSubscriptionUpdate(subscription)
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        await handleSubscriptionDeleted(subscription)
        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        await handlePaymentFailed(invoice)
        break
      }

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Webhook handler error:', error)
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    )
  }
}

async function handleCheckoutComplete(session: Stripe.Checkout.Session) {
  const userId = session.metadata?.supabase_user_id
  if (!userId) {
    console.error('No user ID in checkout session metadata')
    return
  }

  // Subscription details will be handled by subscription.created event
  console.log(`Checkout completed for user ${userId}`)
}

async function handleSubscriptionUpdate(subscription: Stripe.Subscription) {
  const userId = subscription.metadata?.supabase_user_id

  if (!userId) {
    // Try to find user by customer ID
    const customerId = subscription.customer as string
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('stripe_customer_id', customerId)
      .single()

    if (!profile) {
      console.error('Could not find user for subscription update')
      return
    }

    await updateUserSubscription(profile.id, subscription)
  } else {
    await updateUserSubscription(userId, subscription)
  }
}

async function updateUserSubscription(
  userId: string,
  subscription: Stripe.Subscription
) {
  const status = mapStripeStatus(subscription.status)
  const plan = status === 'active' || status === 'trialing' ? 'premium' : 'free'

  // In Stripe SDK v20+, current_period_end is on SubscriptionItem, not Subscription
  // Get it from the first subscription item
  const firstItem = subscription.items?.data?.[0]
  const periodEnd = firstItem?.current_period_end

  const { error } = await supabaseAdmin
    .from('profiles')
    .update({
      subscription_status: status,
      subscription_plan: plan,
      stripe_subscription_id: subscription.id,
      subscription_current_period_end: periodEnd
        ? new Date(periodEnd * 1000).toISOString()
        : null,
      subscription_cancel_at_period_end: subscription.cancel_at_period_end,
    })
    .eq('id', userId)

  if (error) {
    console.error('Error updating subscription:', error)
    throw error
  }

  console.log(`Updated subscription for user ${userId}: ${status}`)
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string

  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('id')
    .eq('stripe_customer_id', customerId)
    .single()

  if (!profile) {
    console.error('Could not find user for subscription deletion')
    return
  }

  const { error } = await supabaseAdmin
    .from('profiles')
    .update({
      subscription_status: 'free',
      subscription_plan: 'free',
      stripe_subscription_id: null,
      subscription_current_period_end: null,
      subscription_cancel_at_period_end: false,
    })
    .eq('id', profile.id)

  if (error) {
    console.error('Error handling subscription deletion:', error)
    throw error
  }

  console.log(`Subscription deleted for user ${profile.id}`)
}

async function handlePaymentFailed(invoice: Stripe.Invoice) {
  const customerId = invoice.customer as string

  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('id')
    .eq('stripe_customer_id', customerId)
    .single()

  if (!profile) {
    console.error('Could not find user for payment failure')
    return
  }

  const { error } = await supabaseAdmin
    .from('profiles')
    .update({
      subscription_status: 'past_due',
    })
    .eq('id', profile.id)

  if (error) {
    console.error('Error handling payment failure:', error)
    throw error
  }

  console.log(`Payment failed for user ${profile.id}`)
}

function mapStripeStatus(
  stripeStatus: Stripe.Subscription.Status
): 'free' | 'active' | 'canceled' | 'past_due' | 'trialing' {
  switch (stripeStatus) {
    case 'active':
      return 'active'
    case 'trialing':
      return 'trialing'
    case 'past_due':
      return 'past_due'
    case 'canceled':
    case 'unpaid':
    case 'incomplete_expired':
      return 'canceled'
    // Handle 'incomplete' - payment not yet confirmed, treat as pending (not premium)
    case 'incomplete':
      return 'free'
    // Handle 'paused' - subscription paused but still exists, treat as canceled
    // User can resume via billing portal
    case 'paused':
      return 'canceled'
    default:
      // Log unexpected status for debugging
      console.warn(`[Webhook] Unhandled Stripe subscription status: ${stripeStatus}`)
      return 'free'
  }
}

