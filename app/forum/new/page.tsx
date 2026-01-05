import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import UserMenu from '@/components/UserMenu'
import { MobileMenuButton } from '@/components/MobileSidebar'
import NewPostForm from './NewPostForm'

export default async function NewPostPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    // Get user profile for username
    const { data: profile } = await supabase
        .from('profiles')
        .select('username')
        .eq('id', user.id)
        .single()

    return (
        <div className="min-h-screen">

            {/* Header */}
            <header className="h-16 lg:border-b border-border lg:bg-surface-elevated/80 backdrop-blur-sm sticky top-0 z-20">
                <div className="h-full mx-auto px-4 sm:px-6 lg:px-8 flex items-center gap-2">
                    <MobileMenuButton />
                    <div className="flex items-center gap-2 sm:gap-4 min-w-0 flex-1">
                        <Link href="/forum" className="inline-flex items-center gap-1 sm:gap-2 text-on-surface-secondary hover:text-on-surface transition-colors text-sm shrink-0">
                            <ArrowLeft size={18} />
                            <span className="hidden sm:inline">Back</span>
                        </Link>
                        <div className="min-w-0">
                            <h1 className="text-base sm:text-lg font-bold text-on-surface truncate">Create New Discussion</h1>
                            <p className="text-on-surface-secondary text-xs hidden sm:block">Share your thoughts with the community</p>
                        </div>
                    </div>
                    <UserMenu email={user.email} username={profile?.username} />
                </div>
            </header>

            <div className="mx-auto px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-12">
                <NewPostForm />

                {/* Guidelines Card */}
                <div className="card bg-backplate mt-6">
                    <h3 className="font-semibold text-on-surface mb-4 flex items-center gap-2">
                        <span className="text-lg">💙</span>
                        Community Guidelines
                    </h3>
                    <ul className="space-y-3 text-sm text-on-surface-secondary">
                        <li className="flex items-start gap-3">
                            <span className="text-primary mt-0.5">•</span>
                            <span>Be kind and supportive to all community members</span>
                        </li>
                        <li className="flex items-start gap-3">
                            <span className="text-primary mt-0.5">•</span>
                            <span>Share your experiences honestly but respectfully</span>
                        </li>
                        <li className="flex items-start gap-3">
                            <span className="text-primary mt-0.5">•</span>
                            <span>No medical advice - always consult healthcare professionals</span>
                        </li>
                        <li className="flex items-start gap-3">
                            <span className="text-primary mt-0.5">•</span>
                            <span>Respect privacy - don't share others' personal information</span>
                        </li>
                    </ul>
                </div>
            </div>
        </div>
    )
}
