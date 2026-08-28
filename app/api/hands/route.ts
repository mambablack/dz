import { listHandRecords, saveHandRecord } from '@/db/hands';
import type { HandRecord } from '@/lib/poker';

export async function GET(request: Request) {
  const sessionId = new URL(request.url).searchParams.get('sessionId')?.trim();
  if (!sessionId || sessionId.length > 120) {
    return Response.json({ error: '缺少有效的训练会话' }, { status: 400 });
  }

  try {
    const hands = await listHandRecords(sessionId);
    return Response.json({ hands });
  } catch (error) {
    console.error('Failed to load hand histories', error);
    return Response.json({ error: '暂时无法读取手牌记录' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const record = (await request.json()) as Partial<HandRecord>;
    if (
      !record.id
      || !record.sessionId
      || !Number.isInteger(record.handNumber)
      || !Array.isArray(record.actions)
      || !Array.isArray(record.players)
      || !record.advice
    ) {
      return Response.json({ error: '手牌记录格式不完整' }, { status: 400 });
    }
    await saveHandRecord(record as HandRecord);
    return Response.json({ ok: true });
  } catch (error) {
    console.error('Failed to save hand history', error);
    return Response.json({ error: '暂时无法保存手牌记录' }, { status: 500 });
  }
}
