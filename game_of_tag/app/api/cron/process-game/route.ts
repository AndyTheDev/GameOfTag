import { NextResponse } from 'next/server';
import { processGameTimeouts } from '@/src/lib/gameCron';

// Zabrání cacheování této route (důležité pro cron!)
export const dynamic = 'force-dynamic'; 

export async function GET(request: Request) {

  const result = await processGameTimeouts();

  if (result.success) {
    return NextResponse.json({ 
      message: 'Game state updated', 
      stats: result 
    });
  } else {
    return NextResponse.json({ 
      message: 'Error processing game state', 
      error: result.error 
    }, { status: 500 });
  }
}