import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  const results: Record<string, unknown> = {}
  
  // Check env vars
  results.env = {
    hasDbUrl: !!process.env.DATABASE_URL,
    hasDirectUrl: !!process.env.DIRECT_URL,
    dbUrlPrefix: process.env.DATABASE_URL?.substring(0, 30) + '...',
    nodeEnv: process.env.NODE_ENV,
  }
  
  // Try to connect with Prisma
  try {
    const { PrismaClient } = await import('@prisma/client')
    const prisma = new PrismaClient()
    
    // Try a simple query
    const count = await prisma.conversation.count()
    results.db = { connected: true, conversationCount: count }
    await prisma.$disconnect()
  } catch (error: unknown) {
    results.db = { 
      connected: false, 
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack?.split('\n').slice(0, 5) : undefined
    }
  }
  
  return NextResponse.json(results, { status: 200 })
}
