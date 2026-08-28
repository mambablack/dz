import assert from 'node:assert/strict';
import {
  applyAction,
  appendHandToRound,
  bestHand,
  cardText,
  chooseBotDecision,
  completeTrainingRound,
  createReadyGame,
  createTrainingRound,
  getToCall,
  preflopStrength,
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
}
const trainingRound = createTrainingRound('test-session');
const roundRecord = toHandRecord(game, 'test-session', trainingRound.id, 1);
const updatedRound = appendHandToRound(trainingRound, roundRecord);
assert.equal(roundRecord.trainingRoundId, trainingRound.id);
assert.equal(roundRecord.roundHandNumber, 1);
assert.equal(updatedRound.handsPlayed, 1);
assert.deepEqual(updatedRound.handIds, [roundRecord.id]);
assert.equal(updatedRound.heroProfit, roundRecord.heroProfit);

const completedRound = completeTrainingRound(updatedRound);
assert.equal(completedRound.status, 'completed');
assert.ok(completedRound.endedAt);
assert.equal(completedRound.handsPlayed, 1);

console.log('Poker engine checks passed: evaluator + 120 complete hands');
