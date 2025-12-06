import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import PricingClient from './PricingClient'

export const metadata = {
  title: 'Pricing',
  description: 'Choose the plan that fits your needs',
}

export default async function PricingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('username, subscription_status, subscription_plan, subscription_current_period_end, subscription_cancel_at_period_end')
    .eq('id', user.id)
    .single()

  return (
    <PricingClient
      user={user}
      username={profile?.username}
      currentPlan={profile?.subscription_plan || 'free'}
      subscriptionStatus={profile?.subscription_status || 'free'}
      periodEnd={profile?.subscription_current_period_end}
      cancelAtPeriodEnd={profile?.subscription_cancel_at_period_end || false}
    />
  )
}

