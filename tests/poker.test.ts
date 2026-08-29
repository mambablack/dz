import assert from 'node:assert/strict';
import {
  applyAction,
  appendHandToRound,
  bestHand,
  cardText,
  chooseBotDecision,
  completeTrainingRound,
  generateRoundCoachReport,
  formatHandRecordResult,
  createReadyGame,
  createTrainingRound,
  getGameResultBreakdown,
  getHandRecordResultBreakdown,
  getToCall,
  preflopStrength,
  refreshHandAdvice,
  startNextHand,
  toHandRecord,
  type Card,
} from '../lib/poker';

const card = (rank: Card['rank'], suit: Card['suit']): Card => ({ rank, suit });

assert.equal(
  bestHand([
    card('A', 's'),
    card('K', 's'),
    card('Q', 's'),
    card('J', 's'),
    card('T', 's'),
    card('2', 'd'),
    card('3', 'c'),
  ]).name,
  '同花顺',
);
assert.equal(cardText(card('T', 's')), '10♠', '十点牌应显示为 10，而不是 T');
assert.equal(
  bestHand([
    card('9', 's'),
    card('9', 'h'),
    card('9', 'd'),
    card('9', 'c'),
    card('A', 's'),
    card('K', 'd'),
    card('2', 'c'),
  ]).name,
  '四条',
);
assert.ok(
  preflopStrength([card('A', 's'), card('A', 'h')]) >
    preflopStrength([card('7', 's'), card('2', 'h')]),
);

let game = createReadyGame();
for (let hand = 0; hand < 120; hand += 1) {
  game = startNextHand(game);
  const cards = [
    ...game.players.flatMap((player) => player.holeCards),
    ...game.deck,
  ];
  assert.equal(
    new Set(cards.map(cardText)).size,
    52,
    '每手牌必须使用一副无重复的 52 张牌',
  );
  const startingTotal = game.startingStacks.reduce(
    (sum, stack) => sum + stack,
    0,
  );
  let guard = 0;
  while (game.status === 'playing' && guard < 250) {
    const actor = game.actingIndex;
    if (actor === 0) {
      const toCall = getToCall(game, 0);
      const hero = game.players[0];
      if (hand % 17 === 0 && hero.streetBet + hero.stack > game.currentBet) {
        game = applyAction(game, 0, {
          type: 'raise',
          raiseTo: hero.streetBet + hero.stack,
        });
      } else {
        game = applyAction(game, 0, { type: toCall > 0 ? 'call' : 'check' });
      }
    } else {
      game = applyAction(game, actor, chooseBotDecision(game, actor));
    }
    guard += 1;
  }
  assert.equal(game.status, 'complete', `第 ${hand + 1} 手未能正常结束`);
  assert.ok(guard < 250, '牌局行动次数不应失控');
  assert.ok(
    game.players.every((player) => player.stack >= 0),
    '筹码不能为负数',
  );
  assert.equal(
    game.players.reduce((sum, player) => sum + player.stack, 0),
    startingTotal,
    '单手结算后筹码总额必须守恒',
  );
  const record = toHandRecord(game, 'test-session');
  assert.equal(record.players.length, 5);
  assert.equal(record.heroCards.length, 2);
  assert.ok(record.actions.length >= 3);
  assert.ok(record.advice.items.length >= 2);
  assert.deepEqual(record.sidePots, game.sidePots);

  const liveBreakdown = getGameResultBreakdown(game);
  const archivedBreakdown = getHandRecordResultBreakdown(record);
  const legacyBreakdown = getHandRecordResultBreakdown({
    ...record,
    sidePots: undefined,
  });
  assert.ok(liveBreakdown.rows.length >= 1, '牌桌结算必须列出赢家');
  assert.ok(archivedBreakdown.rows.length >= 1, '档案结算必须列出赢家');
  assert.ok(legacyBreakdown.rows.length >= 1, '旧档案也必须列出赢家');
  assert.equal(
    liveBreakdown.rows.reduce((total, row) => total + (row.amount ?? 0), 0),
    game.finalPot,
    '结构化结算中的筹码分配必须等于最终底池',
  );
  if (game.showdown) {
    liveBreakdown.rows.forEach((row) => {
      assert.ok(row.winnerName, '摊牌结算必须显示赢家姓名');
      assert.ok(row.cards, '摊牌结算必须显示赢家手牌');
      assert.ok(row.handName, '摊牌结算必须突出获胜牌型');
      assert.ok(row.handDescription, '摊牌结算必须说明牌型组成');
    });
  } else {
    assert.equal(liveBreakdown.rows[0]?.handName, null);
    assert.equal(liveBreakdown.rows[0]?.handDescription, null);
  }

  assert.ok(
    game.winnerIds.every((winnerId) =>
      game.resultText.includes(
        game.players.find((player) => player.id === winnerId)?.name ?? '',
      ),
    ),
    '结算文案必须包含所有赢家',
  );
  if (game.showdown) {
    assert.match(game.resultText, /牌型：/, '摊牌结算必须说明获胜牌型');
    assert.match(game.resultText, /（.+）/, '摊牌结算必须显示赢家手牌');
  } else {
    assert.match(
      game.resultText,
      /方式：其他玩家全部弃牌/,
      '无人跟注获胜必须说明结算方式',
    );
  }
  assert.match(game.resultText, /赢得：|底池：/, '结算必须说明筹码归属');
}
const trainingRound = createTrainingRound('test-session');
const roundRecord = toHandRecord(game, 'test-session', trainingRound.id, 1);
const splitPotBreakdown = getHandRecordResultBreakdown({
  ...roundRecord,
  showdown: true,
  pot: 150,
  winnerNames: ['火花', '老K'],
  sidePots: [
    {
      amount: 100,
      winners: ['火花'],
      winnerCards: ['A♠ A♥'],
      handName: '一对',
      handDescription: '一对（A，K、Q、J 踢脚）',
      payouts: [{ name: '火花', amount: 100 }],
    },
    {
      amount: 50,
      winners: ['火花', '老K'],
      winnerCards: ['10♠ 9♠', '10♥ 9♥'],
      handName: '顺子',
      handDescription: '顺子（10 高）',
      payouts: [
        { name: '火花', amount: 25 },
        { name: '老K', amount: 25 },
      ],
    },
  ],
});
assert.deepEqual(
  splitPotBreakdown.rows.map((row) => row.potLabel),
  ['主池', '边池 1', '边池 1'],
);
assert.deepEqual(
  splitPotBreakdown.rows.map((row) => row.winnerName),
  ['火花', '火花', '老K'],
);
assert.deepEqual(
  splitPotBreakdown.rows.map((row) => row.handName),
  ['一对', '顺子', '顺子'],
);
assert.equal(
  splitPotBreakdown.rows.reduce((total, row) => total + (row.amount ?? 0), 0),
  150,
);

const updatedRound = appendHandToRound(trainingRound, roundRecord);
assert.equal(roundRecord.trainingRoundId, trainingRound.id);
assert.equal(roundRecord.roundHandNumber, 1);
assert.equal(formatHandRecordResult(roundRecord), roundRecord.resultText);
assert.match(
  formatHandRecordResult({ ...roundRecord, resultText: '旧版结算文案' }),
  /牌型：|方式：/,
  '历史手牌也应生成清晰的结算摘要',
);
assert.equal(updatedRound.handsPlayed, 1);
assert.deepEqual(updatedRound.handIds, [roundRecord.id]);
assert.equal(updatedRound.heroProfit, roundRecord.heroProfit);

const completedRound = completeTrainingRound(updatedRound, [roundRecord]);
assert.equal(completedRound.status, 'completed');
assert.ok(completedRound.endedAt);
assert.equal(completedRound.handsPlayed, 1);
assert.ok(completedRound.coachReport);
assert.equal(completedRound.coachReport?.items.length, 5);
assert.equal(completedRound.coachReport?.nextSteps.length, 3);
const regeneratedReport = generateRoundCoachReport(completedRound, [
  roundRecord,
]);
assert.match(regeneratedReport.summary, /1 手/);
const frequencyOnlyReport = generateRoundCoachReport(
  {
    ...completedRound,
    handsPlayed: 10,
    vpipHands: 7,
    pfrHands: 4,
    gradeCounts: { A: 10, B: 0, C: 0 },
  },
  [],
);
assert.equal(frequencyOnlyReport.grade, 'A', '高 VPIP 本身不应降低轮次评分');
assert.doesNotMatch(frequencyOnlyReport.headline, /翻前范围|收紧/);
assert.match(frequencyOnlyReport.summary, /仅供跨轮观察，不参与本轮正误或总评/);

const reviewedPreflopHand = {
  ...roundRecord,
  heroCards: [card('7', 's'), card('2', 'h')],
  dealerIndex: 2,
  actions: [
    {
      id: 'weak-utg-call',
      playerId: 'hero',
      playerName: 'Hero',
      street: 'preflop' as const,
      type: 'call' as const,
      amount: 10,
      potBefore: 15,
      description: 'Hero 跟注 10',
    },
  ],
  advice: {
    grade: 'A' as const,
    headline: '旧版评价',
    items: [
      {
        title: '翻前选择',
        verdict: 'good' as const,
        text: '旧版评价认为这手牌没有问题。',
      },
    ],
  },
};
assert.equal(
  refreshHandAdvice(reviewedPreflopHand).items[0]?.verdict,
  'review',
  '旧档案必须按具体手牌、位置与前序行动重新判断',
);
const decisionLedReport = generateRoundCoachReport(
  {
    ...completedRound,
    gradeCounts: { A: 0, B: 1, C: 0 },
  },
  [reviewedPreflopHand],
);
assert.equal(decisionLedReport.grade, 'B');
assert.equal(
  decisionLedReport.items.find((item) => item.title === '逐手翻前入池判断')
    ?.verdict,
  'review',
);
assert.match(decisionLedReport.summary, /1 次需要复盘/);

console.log('Poker engine checks passed: evaluator + 120 complete hands');
