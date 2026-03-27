import { db } from '@/src/db';
import { systemLogs } from '@/src/db/schema';

export async function safeSystemLog(level: 'INFO' | 'WARNING' | 'ERROR', message: string, details?: string) {
    try {
        await db.insert(systemLogs).values({
            level,
            message,
            details: details || null,
        });
        console.log(`✅ [LOGGER] Zapsán systémový log: "${message}"`);
    } catch (logError) {
        console.error(`⚠️ [LOGGER WARNING] Nepodařilo se zapsat systémový log: "${message}"`);
        console.error(logError);
    }
}