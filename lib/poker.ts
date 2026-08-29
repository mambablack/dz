export const SMALL_BLIND = 5;
export const BIG_BLIND = 10;
export const STARTING_STACK = 500;

export type Suit = 's' | 'h' | 'd' | 'c';
export type Rank =
  | '2'
  | '3'
  | '4'
  | '5'
  | '6'
  | '7'
  | '8'
  | '9'
  | 'T'
  | 'J'
  | 'Q'
  | 'K'
  | 'A';
export type Street = 'preflop' | 'flop' | 'turn' | 'river';
export type GameStatus = 'ready' | 'playing' | 'complete';
export type ActionType =
  | 'small-blind'
  | 'big-blind'
  | 'fold'
  | 'check'
  | 'call'
  | 'bet'
  | 'raise'
  | 'deal'
  | 'win'
  | 'showdown';

export interface Card {
  rank: Rank;
  suit: Suit;
}

export interface Player {
  id: string;
  name: string;
  shortName: string;
  style: string;
  styleKey: 'hero' | 'rock' | 'balanced' | 'aggro' | 'station';
  isHero: boolean;
  stack: number;
  holeCards: Card[];
  folded: boolean;
  allIn: boolean;
  acted: boolean;
  streetBet: number;
  totalBet: number;
  lastAction: string;
}

export interface GameAction {
  id: string;
  playerId: string;
  playerName: string;
  street: Street;
  type: ActionType;
  amount: number;
  toAmount?: number;
  potBefore: number;
  description: string;
  reason?: string;
  isAllIn?: boolean;
}

export interface AdviceItem {
  title: string;
  verdict: 'good' | 'review' | 'note';
  text: string;
}

export interface HandAdvice {
  grade: 'A' | 'B' | 'C';
  headline: string;
  items: AdviceItem[];
}
export interface RoundCoachReport {
  grade: HandAdvice['grade'];
  headline: string;
  summary: string;
  items: AdviceItem[];
  nextSteps: string[];
}

export interface SidePotResult {
  amount: number;
  winners: string[];
  handName: string;
}

export interface GameState {
  handId: string;
  handNumber: number;
  dealerIndex: number;
  players: Player[];
  startingStacks: number[];
  deck: Card[];
  board: Card[];
  street: Street;
  currentBet: number;
  minRaise: number;
  actingIndex: number;
  actions: GameAction[];
  status: GameStatus;
  finalPot: number;
  resultText: string;
  winnerIds: string[];
  showdown: boolean;
  sidePots: SidePotResult[];
  advice: HandAdvice | null;
}

export interface BotDecision {
  type: 'fold' | 'check' | 'call' | 'raise';
  raiseTo?: number;
  reason: string;
}

export interface HandRecord {
  id: string;
  sessionId: string;
  handNumber: number;
  trainingRoundId: string | null;
  roundHandNumber: number | null;
  playedAt: string;
  blinds: string;
  dealerIndex: number;
  heroCards: Card[];
  board: Card[];
  players: Array<{
    id: string;
    name: string;
    style: string;
    startingStack: number;
    endingStack: number;
    cards: Card[];
    folded: boolean;
  }>;
  actions: GameAction[];
  pot: number;
  heroProfit: number;
  resultText: string;
  winnerNames: string[];
  showdown: boolean;
  advice: HandAdvice;
  heroStats: {
    vpip: boolean;
    pfr: boolean;
    wentToShowdown: boolean;
    won: boolean;
  };
}

export interface TrainingRoundRecord {
  id: string;
  sessionId: string;
  startedAt: string;
  endedAt: string | null;
  status: 'active' | 'completed';
  handIds: string[];
  handsPlayed: number;
  heroProfit: number;
  vpipHands: number;
  pfrHands: number;
  showdownHands: number;
  wins: number;
  gradeCounts: {
    A: number;
    B: number;
    C: number;
  };
  coachReport?: RoundCoachReport | null;
}

const RANKS: Rank[] = [
  '2',
  '3',
  '4',
  '5',
  '6',
  '7',
  '8',
  '9',
  'T',
  'J',
  'Q',
  'K',
  'A',
];
const SUITS: Suit[] = ['s', 'h', 'd', 'c'];
const RANK_VALUE: Record<Rank, number> = {
  '2': 2,
  '3': 3,
  '4': 4,
  '5': 5,
  '6': 6,
  '7': 7,
  '8': 8,
  '9': 9,
  T: 10,
  J: 11,
  Q: 12,
  K: 13,
  A: 14,
};

const STREET_NAMES: Record<Street, string> = {
  preflop: '翻前',
  flop: '翻牌',
  turn: '转牌',
  river: '河牌',
};

const PLAYER_BLUEPRINTS: Array<
  Pick<Player, 'id' | 'name' | 'shortName' | 'style' | 'styleKey' | 'isHero'>
> = [
  {
    id: 'hero',
    name: 'Hero',
    shortName: '你',
    style: '训练中',
    styleKey: 'hero',
    isHero: true,
  },
  {
    id: 'rock',
    name: '岩石',
    shortName: '岩',
    style: '紧手',
    styleKey: 'rock',
    isHero: false,
  },
  {
    id: 'balanced',
    name: '阿凌',
    shortName: '凌',
    style: '平衡',
    styleKey: 'balanced',
    isHero: false,
  },
  {
    id: 'aggro',
    name: '火花',
    shortName: '火',
    style: '激进',
    styleKey: 'aggro',
    isHero: false,
  },
  {
    id: 'station',
    name: '老K',
    shortName: 'K',
    style: '跟注站',
    styleKey: 'station',
    isHero: false,
  },
];

function makeId(prefix: string) {
  const random = Math.random().toString(36).slice(2, 10);
  return `${prefix}-${Date.now().toString(36)}-${random}`;
}

function makePlayer(blueprint: (typeof PLAYER_BLUEPRINTS)[number]): Player {
  return {
    ...blueprint,
    stack: STARTING_STACK,
    holeCards: [],
    folded: false,
    allIn: false,
    acted: false,
    streetBet: 0,
    totalBet: 0,
    lastAction: '',
  };
}

export function createReadyGame(): GameState {
  return {
    handId: '',
    handNumber: 0,
    dealerIndex: -1,
    players: PLAYER_BLUEPRINTS.map(makePlayer),
    startingStacks: PLAYER_BLUEPRINTS.map(() => STARTING_STACK),
    deck: [],
    board: [],
    street: 'preflop',
    currentBet: 0,
    minRaise: BIG_BLIND,
    actingIndex: -1,
    actions: [],
    status: 'ready',
    finalPot: 0,
    resultText: '',
    winnerIds: [],
    showdown: false,
    sidePots: [],
    advice: null,
  };
}

export function makeDeck(): Card[] {
  return SUITS.flatMap((suit) => RANKS.map((rank) => ({ rank, suit })));
}

export function shuffleDeck(deck: Card[]): Card[] {
  const shuffled = [...deck];
  for (let i = shuffled.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

function nextIndex(index: number, playerCount = PLAYER_BLUEPRINTS.length) {
  return (index + 1 + playerCount) % playerCount;
}

function takeCard(deck: Card[]) {
  const card = deck[deck.length - 1];
  deck.pop();
  return card;
}

function postBlind(
  players: Player[],
  index: number,
  amount: number,
  type: 'small-blind' | 'big-blind',
  actions: GameAction[],
) {
  const player = players[index];
  const paid = Math.min(player.stack, amount);
  player.stack -= paid;
  player.streetBet += paid;
  player.totalBet += paid;
  player.allIn = player.stack === 0;
  player.lastAction = type === 'small-blind' ? `小盲 ${paid}` : `大盲 ${paid}`;
  actions.push({
    id: makeId('a'),
    playerId: player.id,
    playerName: player.name,
    street: 'preflop',
    type,
    amount: paid,
    toAmount: player.streetBet,
    potBefore: getPotFromPlayers(players) - paid,
    description: `${player.name} 支付${type === 'small-blind' ? '小盲' : '大盲'} ${paid}`,
  });
}

function findNextEligible(players: Player[], fromIndex: number) {
  for (let step = 1; step <= players.length; step += 1) {
    const index = (fromIndex + step) % players.length;
    const player = players[index];
    if (!player.folded && !player.allIn) return index;
  }
  return -1;
}

function findNextPending(
  players: Player[],
  fromIndex: number,
  currentBet: number,
) {
  for (let step = 1; step <= players.length; step += 1) {
    const index = (fromIndex + step) % players.length;
    const player = players[index];
    if (
      !player.folded &&
      !player.allIn &&
      (!player.acted || player.streetBet < currentBet)
    )
      return index;
  }
  return -1;
}

export function startNextHand(previous: GameState): GameState {
  const dealerIndex = nextIndex(previous.dealerIndex);
  const players = previous.players.map((player, index) => ({
    ...player,
    stack: player.stack < BIG_BLIND ? STARTING_STACK : player.stack,
    holeCards: [] as Card[],
    folded: false,
    allIn: false,
    acted: false,
    streetBet: 0,
    totalBet: 0,
    lastAction: '',
    id: PLAYER_BLUEPRINTS[index].id,
  }));
  const startingStacks = players.map((player) => player.stack);
  const deck = shuffleDeck(makeDeck());
  const actions: GameAction[] = [];

  for (let round = 0; round < 2; round += 1) {
    for (let step = 1; step <= players.length; step += 1) {
      const index = (dealerIndex + step) % players.length;
      players[index].holeCards.push(takeCard(deck));
    }
  }

  const smallBlindIndex = nextIndex(dealerIndex);
  const bigBlindIndex = nextIndex(smallBlindIndex);
  postBlind(players, smallBlindIndex, SMALL_BLIND, 'small-blind', actions);
  postBlind(players, bigBlindIndex, BIG_BLIND, 'big-blind', actions);

  return {
    handId: makeId('hand'),
    handNumber: previous.handNumber + 1,
    dealerIndex,
    players,
    startingStacks,
    deck,
    board: [],
    street: 'preflop',
    currentBet: Math.max(
      players[smallBlindIndex].streetBet,
      players[bigBlindIndex].streetBet,
    ),
    minRaise: BIG_BLIND,
    actingIndex: findNextEligible(players, bigBlindIndex),
    actions,
    status: 'playing',
    finalPot: 0,
    resultText: '',
    winnerIds: [],
    showdown: false,
    sidePots: [],
    advice: null,
  };
}

export function getPotFromPlayers(players: Player[]) {
  return players.reduce((sum, player) => sum + player.totalBet, 0);
}

export function getPot(state: GameState) {
  return state.status === 'complete'
    ? state.finalPot
    : getPotFromPlayers(state.players);
}

export function getToCall(state: GameState, playerIndex = state.actingIndex) {
  if (playerIndex < 0) return 0;
  return Math.max(0, state.currentBet - state.players[playerIndex].streetBet);
}

function cloneGame(state: GameState): GameState {
  return {
    ...state,
    players: state.players.map((player) => ({
      ...player,
      holeCards: [...player.holeCards],
    })),
    startingStacks: [...state.startingStacks],
    deck: [...state.deck],
    board: [...state.board],
    actions: [...state.actions],
    winnerIds: [...state.winnerIds],
    sidePots: [...state.sidePots],
  };
}

export function applyAction(
  current: GameState,
  playerIndex: number,
  decision: Pick<BotDecision, 'type' | 'raiseTo'> & { reason?: string },
): GameState {
  if (current.status !== 'playing' || current.actingIndex !== playerIndex)
    return current;
  const state = cloneGame(current);
  const player = state.players[playerIndex];
  const toCall = Math.max(0, state.currentBet - player.streetBet);
  const potBefore = getPotFromPlayers(state.players);
  let type: ActionType = decision.type;
  let amount = 0;
  let toAmount = player.streetBet;

  if (decision.type === 'fold') {
    player.folded = true;
    player.acted = true;
    player.lastAction = '弃牌';
  } else if (decision.type === 'check') {
    if (toCall > 0) return current;
    player.acted = true;
    player.lastAction = '过牌';
  } else if (decision.type === 'call') {
    amount = Math.min(player.stack, toCall);
    player.stack -= amount;
    player.streetBet += amount;
    player.totalBet += amount;
    player.allIn = player.stack === 0;
    player.acted = true;
    toAmount = player.streetBet;
    player.lastAction = player.allIn ? `跟注全下 ${amount}` : `跟注 ${amount}`;
  } else if (decision.type === 'raise') {
    const maxTo = player.streetBet + player.stack;
    const minimumTo =
      state.currentBet === 0 ? BIG_BLIND : state.currentBet + state.minRaise;
    const requestedTo = Math.max(
      state.currentBet + 1,
      Math.round(decision.raiseTo ?? minimumTo),
    );
    const target = Math.min(
      maxTo,
      Math.max(requestedTo, Math.min(minimumTo, maxTo)),
    );
    if (target <= state.currentBet) {
      return applyAction(current, playerIndex, {
        type: toCall > 0 ? 'call' : 'check',
        reason: decision.reason,
      });
    }
    amount = target - player.streetBet;
    const raiseSize = target - state.currentBet;
    player.stack -= amount;
    player.streetBet = target;
    player.totalBet += amount;
    player.allIn = player.stack === 0;
    player.acted = true;
    toAmount = target;
    type = state.currentBet === 0 ? 'bet' : 'raise';
    if (raiseSize >= state.minRaise) state.minRaise = raiseSize;
    state.currentBet = target;
    state.players.forEach((other, index) => {
      if (index !== playerIndex && !other.folded && !other.allIn)
        other.acted = false;
    });
    player.lastAction = player.allIn
      ? `全下至 ${target}`
      : `${type === 'bet' ? '下注' : '加注至'} ${target}`;
  }

  const actionLabel: Record<
    'fold' | 'check' | 'call' | 'bet' | 'raise',
    string
  > = {
    fold: '弃牌',
    check: '过牌',
    call: player.allIn ? `跟注全下 ${amount}` : `跟注 ${amount}`,
    bet: player.allIn ? `全下 ${toAmount}` : `下注 ${amount}`,
    raise: player.allIn ? `全下至 ${toAmount}` : `加注至 ${toAmount}`,
  };
  state.actions.push({
    id: makeId('a'),
    playerId: player.id,
    playerName: player.name,
    street: state.street,
    type,
    amount,
    toAmount,
    potBefore,
    description: `${player.name} ${actionLabel[type as keyof typeof actionLabel]}`,
    reason: decision.reason,
    isAllIn: player.allIn,
  });

  return settleAfterAction(state, playerIndex);
}

function settleAfterAction(
  state: GameState,
  lastActorIndex: number,
): GameState {
  const livePlayers = state.players.filter((player) => !player.folded);
  if (livePlayers.length === 1) return awardUncontested(state, livePlayers[0]);

  const eligible = state.players.filter(
    (player) => !player.folded && !player.allIn,
  );
  const roundComplete = eligible.every(
    (player) => player.acted && player.streetBet === state.currentBet,
  );

  if (!roundComplete) {
    state.actingIndex = findNextPending(
      state.players,
      lastActorIndex,
      state.currentBet,
    );
    return state;
  }

  if (state.street === 'river') return resolveShowdown(state);
  return advanceStreet(state);
}

function dealStreet(state: GameState, street: Street) {
  const count = street === 'flop' ? 3 : 1;
  const dealt: Card[] = [];
  for (let i = 0; i < count; i += 1) {
    const card = takeCard(state.deck);
    state.board.push(card);
    dealt.push(card);
  }
  state.street = street;
  state.actions.push({
    id: makeId('a'),
    playerId: 'dealer',
    playerName: '牌桌',
    street,
    type: 'deal',
    amount: 0,
    potBefore: getPotFromPlayers(state.players),
    description: `${STREET_NAMES[street]}发出 ${dealt.map(cardText).join(' ')}`,
  });
}

function advanceStreet(state: GameState): GameState {
  state.players.forEach((player) => {
    player.streetBet = 0;
    player.acted = false;
    if (!player.folded && !player.allIn) player.lastAction = '';
  });
  state.currentBet = 0;
  state.minRaise = BIG_BLIND;

  const nextStreet: Record<Exclude<Street, 'river'>, Street> = {
    preflop: 'flop',
    flop: 'turn',
    turn: 'river',
  };
  dealStreet(state, nextStreet[state.street as Exclude<Street, 'river'>]);

  const canAct = state.players.filter(
    (player) => !player.folded && !player.allIn,
  );
  if (canAct.length <= 1) {
    while (state.street !== 'river') {
      const following: Record<Exclude<Street, 'river' | 'preflop'>, Street> = {
        flop: 'turn',
        turn: 'river',
      };
      dealStreet(state, following[state.street as 'flop' | 'turn']);
    }
    return resolveShowdown(state);
  }

  state.actingIndex = findNextEligible(state.players, state.dealerIndex);
  return state;
}

function awardUncontested(state: GameState, winner: Player): GameState {
  const pot = getPotFromPlayers(state.players);
  winner.stack += pot;
  winner.lastAction = `赢得 ${pot}`;
  state.finalPot = pot;
  state.status = 'complete';
  state.actingIndex = -1;
  state.winnerIds = [winner.id];
  state.resultText = `${winner.name} 在其他玩家弃牌后赢得 ${pot} 筹码`;
  state.actions.push({
    id: makeId('a'),
    playerId: winner.id,
    playerName: winner.name,
    street: state.street,
    type: 'win',
    amount: pot,
    potBefore: pot,
    description: state.resultText,
  });
  state.advice = generateAdvice(state);
  return state;
}

interface EvaluatedHand {
  values: number[];
  name: string;
}

function compareValues(a: number[], b: number[]) {
  const length = Math.max(a.length, b.length);
  for (let i = 0; i < length; i += 1) {
    const diff = (a[i] ?? 0) - (b[i] ?? 0);
    if (diff !== 0) return diff;
  }
  return 0;
}

function evaluateFive(cards: Card[]): EvaluatedHand {
  const ranks = cards
    .map((card) => RANK_VALUE[card.rank])
    .sort((a, b) => b - a);
  const counts = new Map<number, number>();
  ranks.forEach((rank) => counts.set(rank, (counts.get(rank) ?? 0) + 1));
  const groups = [...counts.entries()].sort(
    (a, b) => b[1] - a[1] || b[0] - a[0],
  );
  const flush = cards.every((card) => card.suit === cards[0].suit);
  const unique = [...new Set(ranks)];
  let straightHigh = 0;
  if (unique.length === 5 && unique[0] - unique[4] === 4)
    straightHigh = unique[0];
  if (unique.join(',') === '14,5,4,3,2') straightHigh = 5;

  if (flush && straightHigh)
    return { values: [8, straightHigh], name: '同花顺' };
  if (groups[0][1] === 4)
    return { values: [7, groups[0][0], groups[1][0]], name: '四条' };
  if (groups[0][1] === 3 && groups[1][1] === 2)
    return { values: [6, groups[0][0], groups[1][0]], name: '葫芦' };
  if (flush) return { values: [5, ...ranks], name: '同花' };
  if (straightHigh) return { values: [4, straightHigh], name: '顺子' };
  if (groups[0][1] === 3) {
    return {
      values: [
        3,
        groups[0][0],
        ...groups
          .slice(1)
          .map(([rank]) => rank)
          .sort((a, b) => b - a),
      ],
      name: '三条',
    };
  }
  if (groups[0][1] === 2 && groups[1][1] === 2) {
    const pairs = [groups[0][0], groups[1][0]].sort((a, b) => b - a);
    return { values: [2, ...pairs, groups[2][0]], name: '两对' };
  }
  if (groups[0][1] === 2) {
    return {
      values: [
        1,
        groups[0][0],
        ...groups
          .slice(1)
          .map(([rank]) => rank)
          .sort((a, b) => b - a),
      ],
      name: '一对',
    };
  }
  return { values: [0, ...ranks], name: '高牌' };
}

function combinations<T>(items: T[], choose: number): T[][] {
  const result: T[][] = [];
  const walk = (start: number, picked: T[]) => {
    if (picked.length === choose) {
      result.push(picked);
      return;
    }
    for (let i = start; i <= items.length - (choose - picked.length); i += 1) {
      walk(i + 1, [...picked, items[i]]);
    }
  };
  walk(0, []);
  return result;
}

export function bestHand(cards: Card[]): EvaluatedHand {
  if (cards.length < 5) return { values: [0], name: '未成牌' };
  let best: EvaluatedHand | null = null;
  combinations(cards, 5).forEach((combo) => {
    const evaluated = evaluateFive(combo);
    if (!best || compareValues(evaluated.values, best.values) > 0)
      best = evaluated;
  });
  return best ?? { values: [0], name: '高牌' };
}

function resolveShowdown(state: GameState): GameState {
  const pot = getPotFromPlayers(state.players);
  const levels = [
    ...new Set(
      state.players
        .map((player) => player.totalBet)
        .filter((amount) => amount > 0),
    ),
  ].sort((a, b) => a - b);
  const evaluations = new Map<string, EvaluatedHand>();
  state.players.forEach((player) => {
    if (!player.folded)
      evaluations.set(
        player.id,
        bestHand([...player.holeCards, ...state.board]),
      );
  });

  let previousLevel = 0;
  const sidePots: SidePotResult[] = [];
  const winnerIds = new Set<string>();
  levels.forEach((level) => {
    const contributors = state.players.filter(
      (player) => player.totalBet >= level,
    );
    const amount = (level - previousLevel) * contributors.length;
    previousLevel = level;
    const eligible = contributors.filter((player) => !player.folded);
    if (amount <= 0 || eligible.length === 0) return;
    let winners = [eligible[0]];
    for (let i = 1; i < eligible.length; i += 1) {
      const comparison = compareValues(
        evaluations.get(eligible[i].id)?.values ?? [0],
        evaluations.get(winners[0].id)?.values ?? [0],
      );
      if (comparison > 0) winners = [eligible[i]];
      else if (comparison === 0) winners.push(eligible[i]);
    }
    winners.sort((a, b) => {
      const ai = state.players.findIndex((player) => player.id === a.id);
      const bi = state.players.findIndex((player) => player.id === b.id);
      return (
        ((ai - state.dealerIndex + state.players.length) %
          state.players.length) -
        ((bi - state.dealerIndex + state.players.length) % state.players.length)
      );
    });
    const share = Math.floor(amount / winners.length);
    let remainder = amount % winners.length;
    winners.forEach((winner) => {
      winner.stack += share + (remainder > 0 ? 1 : 0);
      if (remainder > 0) remainder -= 1;
      winnerIds.add(winner.id);
    });
    sidePots.push({
      amount,
      winners: winners.map((winner) => winner.name),
      handName: evaluations.get(winners[0].id)?.name ?? '高牌',
    });
  });

  const winners = state.players.filter((player) => winnerIds.has(player.id));
  winners.forEach((winner) => {
    const won =
      winner.stack -
      state.startingStacks[
        state.players.findIndex((player) => player.id === winner.id)
      ] +
      winner.totalBet;
    winner.lastAction = `摊牌赢得 ${Math.max(0, won)}`;
  });
  state.finalPot = pot;
  state.status = 'complete';
  state.actingIndex = -1;
  state.winnerIds = [...winnerIds];
  state.showdown = true;
  state.sidePots = sidePots;
  const main = sidePots[0];
  state.resultText = main
    ? `${main.winners.join('、')} 以${main.handName}赢得${sidePots.length > 1 ? '主池' : ''} ${main.amount} 筹码`
    : '摊牌完成';
  state.actions.push({
    id: makeId('a'),
    playerId: 'dealer',
    playerName: '牌桌',
    street: 'river',
    type: 'showdown',
    amount: pot,
    potBefore: pot,
    description: state.resultText,
  });
  state.advice = generateAdvice(state);
  return state;
}

export function preflopStrength(cards: Card[]): number {
  if (cards.length < 2) return 0;
  const first = RANK_VALUE[cards[0].rank];
  const second = RANK_VALUE[cards[1].rank];
  const high = Math.max(first, second);
  const low = Math.min(first, second);
  if (high === low) return Math.min(100, 38 + high * 4.4);
  let score = high * 4.3 + low * 1.35 - 17;
  if (cards[0].suit === cards[1].suit) score += 6;
  const gap = high - low;
  if (gap === 1) score += 5;
  else if (gap === 2) score += 2;
  else if (gap >= 5) score -= 4;
  if (high === 14) score += 6;
  if (high >= 12 && low >= 10) score += 7;
  return Math.max(8, Math.min(98, Math.round(score)));
}

function postflopStrength(player: Player, board: Card[]) {
  const cards = [...player.holeCards, ...board];
  const evaluated = bestHand(cards);
  const category = evaluated.values[0];
  const categoryBase = [18, 46, 65, 74, 82, 87, 93, 98, 100][category] ?? 18;
  let score = categoryBase;
  if (category === 1) score += Math.max(0, (evaluated.values[1] - 8) * 1.5);
  const suitCounts = new Map<Suit, number>();
  cards.forEach((card) =>
    suitCounts.set(card.suit, (suitCounts.get(card.suit) ?? 0) + 1),
  );
  if ([...suitCounts.values()].some((count) => count === 4)) score += 8;
  const uniqueRanks = [
    ...new Set(cards.map((card) => RANK_VALUE[card.rank])),
  ].sort((a, b) => a - b);
  for (let i = 0; i < uniqueRanks.length; i += 1) {
    const window = uniqueRanks.filter(
      (rank) => rank >= uniqueRanks[i] && rank <= uniqueRanks[i] + 4,
    );
    if (window.length >= 4) score += 6;
  }
  return Math.min(100, Math.round(score));
}

export function positionLabel(playerIndex: number, dealerIndex: number) {
  const offset =
    (playerIndex - dealerIndex + PLAYER_BLUEPRINTS.length) %
    PLAYER_BLUEPRINTS.length;
  return ['BTN', 'SB', 'BB', 'UTG', 'CO'][offset] ?? '';
}

export function chooseBotDecision(
  state: GameState,
  playerIndex: number,
): BotDecision {
  const player = state.players[playerIndex];
  const toCall = getToCall(state, playerIndex);
  const pot = getPotFromPlayers(state.players);
  const profile = {
    rock: { enter: 60, aggression: 0.5, looseness: -5 },
    balanced: { enter: 47, aggression: 0.58, looseness: 0 },
    aggro: { enter: 35, aggression: 0.78, looseness: 8 },
    station: { enter: 38, aggression: 0.2, looseness: 10 },
    hero: { enter: 50, aggression: 0.5, looseness: 0 },
  }[player.styleKey];
  const position = positionLabel(playerIndex, state.dealerIndex);
  const positionBonus =
    position === 'BTN' ? 8 : position === 'CO' ? 5 : position === 'SB' ? -2 : 0;
  const baseStrength =
    state.street === 'preflop'
      ? preflopStrength(player.holeCards)
      : postflopStrength(player, state.board);
  const strength = Math.max(
    0,
    Math.min(100, baseStrength + profile.looseness + positionBonus),
  );
  const random = Math.random();
  const maxTo = player.streetBet + player.stack;
  const minRaiseTo =
    state.currentBet === 0 ? BIG_BLIND : state.currentBet + state.minRaise;
  const canRaise = maxTo > state.currentBet && maxTo >= minRaiseTo;
  const strongThreshold = state.street === 'preflop' ? 72 : 70;

  if (toCall === 0) {
    const shouldBet =
      strength >= strongThreshold - 8 && random < profile.aggression;
    if (shouldBet && canRaise) {
      const target =
        state.street === 'preflop'
          ? Math.max(3 * BIG_BLIND, minRaiseTo)
          : Math.max(
              minRaiseTo,
              Math.round((pot * (0.5 + profile.aggression * 0.25)) / 5) * 5,
            );
      return {
        type: 'raise',
        raiseTo: Math.min(maxTo, target),
        reason: `牌力估计 ${strength}/100；${player.style}策略主动争取价值`,
      };
    }
    return { type: 'check', reason: `牌力估计 ${strength}/100；免费实现权益` };
  }

  const potOdds = toCall / Math.max(1, pot + toCall);
  const equityProxy = strength / 100;
  const entryFloor =
    state.street === 'preflop' ? profile.enter / 100 : potOdds + 0.08;
  const pressure = toCall / Math.max(1, player.stack + toCall);
  const continueScore =
    equityProxy + (Math.random() - 0.5) * 0.14 - pressure * 0.18;

  if (
    continueScore < entryFloor &&
    !(player.styleKey === 'station' && continueScore > entryFloor - 0.14)
  ) {
    return {
      type: 'fold',
      reason: `牌力估计 ${strength}/100，所需底池赔率 ${Math.round(potOdds * 100)}%；选择弃牌`,
    };
  }

  if (
    strength >= strongThreshold &&
    canRaise &&
    Math.random() < profile.aggression
  ) {
    const raiseBy =
      state.street === 'preflop'
        ? Math.max(state.minRaise, state.currentBet * 2)
        : Math.max(state.minRaise, Math.round((pot * 0.65) / 5) * 5);
    return {
      type: 'raise',
      raiseTo: Math.min(maxTo, state.currentBet + raiseBy),
      reason: `牌力估计 ${strength}/100；以${player.style}频率加注`,
    };
  }

  return {
    type: 'call',
    reason: `牌力估计 ${strength}/100，对比 ${Math.round(potOdds * 100)}% 底池赔率后继续`,
  };
}

function generateAdvice(state: GameState): HandAdvice {
  const hero = state.players[0];
  const heroActions = state.actions.filter(
    (action) =>
      action.playerId === hero.id &&
      ['fold', 'check', 'call', 'bet', 'raise'].includes(action.type),
  );
  const preflopActions = heroActions.filter(
    (action) => action.street === 'preflop',
  );
  const firstVoluntary = preflopActions[0];
  const strength = preflopStrength(hero.holeCards);
  const position = positionLabel(0, state.dealerIndex);
  const items: AdviceItem[] = [];
  let deductions = 0;

  if (!firstVoluntary) {
    items.push({
      title: '翻前选择',
      verdict: 'note',
      text: '这手牌在你行动前就已结束，没有可评价的主动决策。继续关注位置与桌上行动。',
    });
  } else if (firstVoluntary.type === 'fold') {
    const questionable =
      strength >= 68 || (['BTN', 'CO'].includes(position) && strength >= 52);
    if (questionable) deductions += 1;
    items.push({
      title: '翻前选择',
      verdict: questionable ? 'review' : 'good',
      text: questionable
        ? `${cardText(hero.holeCards[0])}${cardText(hero.holeCards[1])} 在 ${position} 具有一定可玩性；面对当前尺度可考虑更主动地进入底池。`
        : `这手牌的牌力评分约为 ${strength}/100，在 ${position} 弃牌保持了合理的起手牌纪律。`,
    });
  } else {
    const tooLoose = strength < 36 && !['BTN', 'CO'].includes(position);
    if (tooLoose) deductions += 1;
    items.push({
      title: '翻前范围',
      verdict: tooLoose ? 'review' : 'good',
      text: tooLoose
        ? `牌力评分约 ${strength}/100，且你位于 ${position}；从这个位置继续偏松，长期容易被身后玩家施压。`
        : `从 ${position} 用这手牌继续是可解释的选择；注意结合前位加注尺度调整范围。`,
    });
  }

  const aggressive = heroActions.filter(
    (action) => action.type === 'bet' || action.type === 'raise',
  );
  const unusualSizing = aggressive.find((action) => {
    if (action.isAllIn || action.street === 'preflop') return false;
    const ratio = action.amount / Math.max(1, action.potBefore);
    return ratio < 0.3 || ratio > 1.25;
  });
  if (unusualSizing) {
    deductions += 1;
    items.push({
      title: '下注尺度',
      verdict: 'review',
      text: `${STREET_NAMES[unusualSizing.street]}的投入约为行动前底池的 ${Math.round((unusualSizing.amount / Math.max(1, unusualSizing.potBefore)) * 100)}%。先明确是在薄价值、保护还是施压，再选择更一致的尺度。`,
    });
  } else if (aggressive.length > 0) {
    items.push({
      title: '主动性',
      verdict: 'good',
      text: '你在这手牌中保留了下注或加注的主动性。复盘时重点检查更差牌能否跟注、以及更好牌会否弃牌。',
    });
  } else {
    items.push({
      title: '主动性',
      verdict: 'note',
      text: '本手没有主动下注。被动线路并不等于错误，但要避免只因不确定就自动过牌或跟注。',
    });
  }

  const heroProfit = hero.stack - state.startingStacks[0];
  items.push({
    title: '结果隔离',
    verdict: 'note',
    text: `本手结果为 ${heroProfit >= 0 ? '+' : ''}${heroProfit} 筹码。单手输赢不代表决策质量，优先复查当时可见信息与底池赔率。`,
  });

  const grade: HandAdvice['grade'] =
    deductions === 0 ? 'A' : deductions === 1 ? 'B' : 'C';
  return {
    grade,
    headline:
      grade === 'A'
        ? '线路整体清晰'
        : grade === 'B'
          ? '有一处值得复盘'
          : '建议放慢决策节奏',
    items,
  };
}

export function toHandRecord(
  state: GameState,
  sessionId: string,
  trainingRoundId: string | null = null,
  roundHandNumber: number | null = null,
): HandRecord {
  const hero = state.players[0];
  const heroPreflop = state.actions.filter(
    (action) => action.playerId === hero.id && action.street === 'preflop',
  );
  const winnerNames = state.players
    .filter((player) => state.winnerIds.includes(player.id))
    .map((player) => player.name);
  return {
    id: state.handId,
    sessionId,
    handNumber: state.handNumber,
    trainingRoundId,
    roundHandNumber,
    playedAt: new Date().toISOString(),
    blinds: `${SMALL_BLIND}/${BIG_BLIND}`,
    dealerIndex: state.dealerIndex,
    heroCards: [...hero.holeCards],
    board: [...state.board],
    players: state.players.map((player, index) => ({
      id: player.id,
      name: player.name,
      style: player.style,
      startingStack: state.startingStacks[index],
      endingStack: player.stack,
      cards: [...player.holeCards],
      folded: player.folded,
    })),
    actions: state.actions,
    pot: state.finalPot,
    heroProfit: hero.stack - state.startingStacks[0],
    resultText: state.resultText,
    winnerNames,
    showdown: state.showdown,
    advice: state.advice ?? generateAdvice(state),
    heroStats: {
      vpip: heroPreflop.some((action) =>
        ['call', 'bet', 'raise'].includes(action.type),
      ),
      pfr: heroPreflop.some((action) => ['bet', 'raise'].includes(action.type)),
      wentToShowdown: state.showdown && !hero.folded,
      won: state.winnerIds.includes(hero.id),
    },
  };
}

export function createTrainingRound(sessionId: string): TrainingRoundRecord {
  return {
    id: makeId('round'),
    sessionId,
    startedAt: new Date().toISOString(),
    endedAt: null,
    status: 'active',
    handIds: [],
    handsPlayed: 0,
    heroProfit: 0,
    vpipHands: 0,
    pfrHands: 0,
    showdownHands: 0,
    wins: 0,
    gradeCounts: { A: 0, B: 0, C: 0 },
    coachReport: null,
  };
}

export function appendHandToRound(
  round: TrainingRoundRecord,
  hand: HandRecord,
): TrainingRoundRecord {
  if (round.handIds.includes(hand.id)) return round;
  const gradeCounts = { ...round.gradeCounts };
  gradeCounts[hand.advice.grade] += 1;
  return {
    ...round,
    handIds: [...round.handIds, hand.id],
    handsPlayed: round.handsPlayed + 1,
    heroProfit: round.heroProfit + hand.heroProfit,
    vpipHands: round.vpipHands + (hand.heroStats.vpip ? 1 : 0),
    pfrHands: round.pfrHands + (hand.heroStats.pfr ? 1 : 0),
    showdownHands:
      round.showdownHands + (hand.heroStats.wentToShowdown ? 1 : 0),
    wins: round.wins + (hand.heroStats.won ? 1 : 0),
    gradeCounts,
  };
}
export function generateRoundCoachReport(
  round: TrainingRoundRecord,
  hands: HandRecord[] = [],
): RoundCoachReport {
  const count = round.handsPlayed;
  const gradeCounts = round.gradeCounts ?? { A: 0, B: 0, C: 0 };
  const gradedHands = gradeCounts.A + gradeCounts.B + gradeCounts.C;
  const baseGradeScore = gradedHands
    ? (gradeCounts.A * 2 + gradeCounts.B) / (gradedHands * 2)
    : 0.5;
  const vpip = count ? Math.round((round.vpipHands / count) * 100) : 0;
  const pfr = count ? Math.round((round.pfrHands / count) * 100) : 0;
  const passiveGap = vpip - pfr;
  const profitBb = round.heroProfit / BIG_BLIND;
  const showdownRate = count
    ? Math.round((round.showdownHands / count) * 100)
    : 0;

  const handNumber = (hand: HandRecord) =>
    hand.roundHandNumber ?? hand.handNumber;
  const signedBb = (chips: number) =>
    `${chips >= 0 ? '+' : ''}${(chips / BIG_BLIND).toFixed(1)} BB`;
  const preflopCallHands = hands.filter((hand) =>
    hand.actions.some(
      (action) =>
        action.playerId === 'hero' &&
        action.street === 'preflop' &&
        action.type === 'call',
    ),
  ).length;
  const costlyLosses = hands
    .filter((hand) => hand.heroProfit <= -BIG_BLIND * 20)
    .sort((left, right) => handNumber(left) - handNumber(right));
  const topWins = [...hands]
    .filter((hand) => hand.heroProfit > 0)
    .sort((left, right) => right.heroProfit - left.heroProfit)
    .slice(0, 3);
  const topWinTotal = topWins.reduce(
    (total, hand) => total + hand.heroProfit,
    0,
  );
  const remainingProfit = round.heroProfit - topWinTotal;
  const concentratedProfit =
    count >= 8 &&
    round.heroProfit > 0 &&
    topWins.length === 3 &&
    remainingProfit < 0;

  let adjustedGradeScore = baseGradeScore;
  if (count >= 6) {
    if (vpip >= 55) adjustedGradeScore -= 0.2;
    else if (vpip >= 45) adjustedGradeScore -= 0.1;

    if (passiveGap >= 15) adjustedGradeScore -= 0.12;
    else if (passiveGap >= 10) adjustedGradeScore -= 0.06;
  }
  const grade: HandAdvice['grade'] =
    adjustedGradeScore >= 0.72 ? 'A' : adjustedGradeScore >= 0.4 ? 'B' : 'C';

  const issueCounts = new Map<string, number>();
  hands.forEach((hand) => {
    hand.advice.items
      .filter((item) => item.verdict === 'review')
      .forEach((item) => {
        issueCounts.set(item.title, (issueCounts.get(item.title) ?? 0) + 1);
      });
  });
  const recurringIssue = [...issueCounts.entries()].sort(
    (left, right) => right[1] - left[1],
  )[0];

  const costlyLossText = costlyLosses
    .map((hand) => `第 ${handNumber(hand)} 手 ${signedBb(hand.heroProfit)}`)
    .join('、');
  const topWinHands = [...topWins]
    .sort((left, right) => handNumber(left) - handNumber(right))
    .map((hand) => `第 ${handNumber(hand)} 手`)
    .join('、');

  const items: AdviceItem[] = [
    {
      title: `轮次总评：${grade}`,
      verdict: grade === 'A' ? 'good' : grade === 'C' ? 'review' : 'note',
      text:
        count === 0
          ? '本轮还没有完成手牌，结束若干手后才会形成整体评价。'
          : `逐手启发式评分为 A ${gradeCounts.A}、B ${gradeCounts.B}、C ${gradeCounts.C}。轮次总评还会纳入 VPIP/PFR 结构与整轮风险分布，避免仅因短期盈利或单手结果给出过高评价。`,
    },
    {
      title: '翻前入池结构',
      verdict:
        count < 6 ? 'note' : passiveGap >= 15 || vpip >= 45 ? 'review' : 'good',
      text:
        count < 6
          ? `当前 VPIP ${vpip}%、PFR ${pfr}%，样本不足 6 手，只记录倾向，不据此给打法定性。`
          : passiveGap >= 15 || vpip >= 45
            ? `VPIP ${vpip}%、PFR ${pfr}%，相差 ${passiveGap} 个百分点；${preflopCallHands} 手出现翻前跟注动作。这不表示每次跟注都错，但说明入池过宽和被动线路是下一轮的首要训练主题。`
            : `VPIP ${vpip}%、PFR ${pfr}%，本轮没有明显的被动入池信号；继续按位置和对手类型管理范围。`,
    },
    {
      title: '大底池风险控制',
      verdict: costlyLosses.length > 0 ? 'review' : 'good',
      text:
        costlyLosses.length > 0
          ? `本轮有 ${costlyLosses.length} 手亏损达到 20BB 以上：${costlyLossText}。重点检查多人底池中的边缘牌、面对强线时的 bluff-catcher，以及是否在更差牌难以跟注时主动做大底池。`
          : '本轮没有出现单手亏损达到 20BB 的记录。继续在大额投入前确认价值目标和对手范围。',
    },
    {
      title: '盈利结构与结果偏差',
      verdict: concentratedProfit ? 'review' : 'note',
      text: concentratedProfit
        ? `本轮净赢 ${signedBb(round.heroProfit)}，但${topWinHands}这三手合计赢得 ${signedBb(topWinTotal)}，其余 ${Math.max(0, count - topWins.length)} 手合计 ${signedBb(remainingProfit)}。盈利高度集中，说明强牌价值兑现得好，但不能用最终盈亏掩盖其余手牌的过程漏洞。`
        : `本轮盈亏为 ${signedBb(round.heroProfit)}。这个数字只记录波动；是否执行了清晰、可复述的决策流程，才是训练报告的核心。`,
    },
    recurringIssue && recurringIssue[1] >= 2
      ? {
          title: `重复问题：${recurringIssue[0]}`,
          verdict: 'review',
          text: `这一问题在 ${recurringIssue[1]} 手牌后建议中重复出现。下一轮应把它设为唯一主课题，而不是同时分散修正多个小问题。`,
        }
      : {
          title: '重复性漏洞',
          verdict: 'good',
          text:
            count < 3
              ? '手牌数量较少，暂时无法判断是否存在重复性漏洞。'
              : '本轮逐手建议中尚未出现两次以上的同类警报，继续跨轮次观察。',
        },
  ];

  const nextSteps: string[] = [];
  if (count < 6) {
    nextSteps.push('下一轮至少完成 6–8 手，再判断频率类指标是否形成趋势。');
  } else if (vpip >= 45 || passiveGap >= 15) {
    nextSteps.push(
      '把下一轮设为“翻前入池纪律”专项：以 VPIP 低于 45%、VPIP-PFR 差距小于 12 个百分点作为训练目标，首次自愿入池优先加注或弃牌。',
    );
  } else {
    nextSteps.push('继续按位置记录翻前入池理由，保持主动性并跨轮验证频率。');
  }

  if (count >= 6 && (vpip >= 45 || preflopCallHands >= 3)) {
    nextSteps.push(
      '面对 limper 时，以约 4BB 加每位 limper 1BB 作为隔离加注训练基线，再按位置、筹码和对手调整。',
    );
  } else {
    nextSteps.push(
      '每次翻前加注前明确目标：拿下死钱、隔离弱手，或为强范围建立底池。',
    );
  }

  if (costlyLosses.length > 0) {
    nextSteps.push(
      '多人底池计划投入超过 20BB 前先问：更差牌会跟吗？更好牌会弃吗？若两者都是否，优先控制底池。',
    );
  } else {
    nextSteps.push('大额下注前先写出：更差牌会不会跟、更好牌会不会弃。');
  }

  const headline =
    count === 0
      ? '等待本轮形成训练样本'
      : vpip >= 55 && profitBb >= 0
        ? '盈利不错，但翻前范围与大底池边界需要收紧'
        : vpip >= 55
          ? '先收紧翻前范围，再谈扩大盈利'
          : passiveGap >= 15
            ? '减少被动入池，建立翻前主动性'
            : grade === 'C'
              ? '先修正决策流程中的高频漏洞'
              : concentratedProfit
                ? '强牌兑现出色，过程稳定性仍需提升'
                : grade === 'A'
                  ? '本轮决策节奏整体稳定'
                  : '本轮基础线路基本稳定';

  return {
    grade,
    headline,
    summary:
      count === 0
        ? '完成手牌后，教练会先汇总整轮趋势，再提供逐手复盘。'
        : `本轮完成 ${count} 手，VPIP ${vpip}%、PFR ${pfr}%，摊牌 ${round.showdownHands} 手（${showdownRate}%）、赢下 ${round.wins} 手，盈亏 ${signedBb(round.heroProfit)}。频率指标已经能暴露初步趋势，但仍需跨多个轮次验证。`,
    items,
    nextSteps: nextSteps.slice(0, 3),
  };
}
export function completeTrainingRound(
  round: TrainingRoundRecord,
  hands: HandRecord[] = [],
): TrainingRoundRecord {
  const completed: TrainingRoundRecord = {
    ...round,
    endedAt: new Date().toISOString(),
    status: 'completed',
  };
  return {
    ...completed,
    coachReport: generateRoundCoachReport(completed, hands),
  };
}

export function streetName(street: Street) {
  return STREET_NAMES[street];
}

export function suitSymbol(suit: Suit) {
  return { s: '♠', h: '♥', d: '♦', c: '♣' }[suit];
}

export function cardText(card: Card) {
  return `${card.rank}${suitSymbol(card.suit)}`;
}

export function isRedSuit(suit: Suit) {
  return suit === 'h' || suit === 'd';
}
