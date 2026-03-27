import { NextResponse } from 'next/server';
import { db } from '@/src/db';
import { systemLogs } from '@/src/db/schema';
import { desc, eq } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const limit = parseInt(searchParams.get('limit') || '50', 10);
        const level = searchParams.get('level') || 'ALL';

        let logsData;

        if (level !== 'ALL') {
            logsData = await db.select()
                .from(systemLogs)
                .where(eq(systemLogs.level, level))
                .orderBy(desc(systemLogs.createdAt))
                .limit(limit);
        } else {
            logsData = await db.select()
                .from(systemLogs)
                .orderBy(desc(systemLogs.createdAt))
                .limit(limit);
        }

        return NextResponse.json({ logs: logsData });

    } catch (error) {
        console.error('API Error fetching logs:', error);
        return NextResponse.json({ error: 'Failed to fetch logs' }, { status: 500 });
    }
}