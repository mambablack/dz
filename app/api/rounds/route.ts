import { listTrainingRounds, saveTrainingRound } from '@/db/rounds';
import type { TrainingRoundRecord } from '@/lib/poker';

export async function GET(request: Request) {
  const sessionId = new URL(request.url).searchParams.get('sessionId')?.trim();
  if (!sessionId || sessionId.length > 120) {
    return Response.json({ error: '缺少有效的训练会话' }, { status: 400 });
  }

  try {
    const rounds = await listTrainingRounds(sessionId);
    return Response.json({ rounds });
  } catch (error) {
    console.error('Failed to load training rounds', error);
    return Response.json({ error: '暂时无法读取训练轮次' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const round = (await request.json()) as Partial<TrainingRoundRecord>;
    if (
      !round.id ||
      !round.sessionId ||
      !round.startedAt ||
      !['active', 'completed'].includes(round.status ?? '') ||
      !Array.isArray(round.handIds) ||
      !Number.isInteger(round.handsPlayed) ||
      !round.gradeCounts
    ) {
      return Response.json({ error: '训练轮次格式不完整' }, { status: 400 });
    }
    await saveTrainingRound(round as TrainingRoundRecord);
    return Response.json({ ok: true });
  } catch (error) {
    console.error('Failed to save training round', error);
    return Response.json({ error: '暂时无法保存训练轮次' }, { status: 500 });
  }
}
