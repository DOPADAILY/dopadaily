import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function GET() {
    try {
        const supabase = await createClient()

        // Simple database query to keep the project active
        // Query the profiles table to check if Supabase is responsive
        const { data, error } = await supabase
            .from('profiles')
            .select('id')
            .limit(1)

        if (error) {
            console.error('Health check failed:', error)
            return NextResponse.json(
                { status: 'error', message: 'Database query failed' },
                { status: 500 }
            )
        }

        return NextResponse.json({
            status: 'ok',
            message: 'Dopadaily is healthy',
            timestamp: new Date().toISOString(),
            data: data ? 'Database connection active' : 'No data found'
        })
    } catch (error) {
        console.error('Health check error:', error)
        return NextResponse.json(
            { status: 'error', message: 'Health check failed' },
            { status: 500 }
        )
    }
}
