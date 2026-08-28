'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  BrainCircuit,
  Check,
  ChevronRight,
  CircleDollarSign,
  CloudCheck,
  CloudOff,
  Coins,
  Eye,
  Flag,
  History,
  Lightbulb,
  LoaderCircle,
  Play,
  Square,
  TimerReset,
  ShieldCheck,
  Target,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  BIG_BLIND,
  applyAction,
  appendHandToRound,
  completeTrainingRound,
  bestHand,
  cardText,
  chooseBotDecision,
  createReadyGame,
  createTrainingRound,
  getPot,
  getToCall,
  isRedSuit,
  positionLabel,
  preflopStrength,
  startNextHand,
  streetName,
  suitSymbol,
  toHandRecord,
  type AdviceItem,
  type Card,
  type GameAction,
  type GameState,
  type HandAdvice,
  type HandRecord,
  type TrainingRoundRecord,
  type Player,
} from '@/lib/poker';

const SESSION_KEY = 'riverlab-training-session';

const seatPositions = [
  'left-1/2 bottom-[-1%] -translate-x-1/2',
  'left-[1%] bottom-[18%]',
  'left-[7%] top-[12%]',
  'right-[7%] top-[12%]',
  'right-[1%] bottom-[18%]',
];

const betPositions = [
  'left-1/2 bottom-[22%] -translate-x-1/2',
  'left-[22%] bottom-[27%]',
  'left-[25%] top-[24%]',
  'right-[25%] top-[24%]',
  'right-[22%] bottom-[27%]',
];

function PokerCard({
  card,
  hidden = false,
  small = false,
  tableHole = false,
}: {
  card?: Card;
  hidden?: boolean;
  small?: boolean;
  tableHole?: boolean;
}) {
  const size = small
    ? 'h-12 w-9 rounded-md'
    : tableHole
      ? 'h-[68px] w-12 rounded-lg sm:h-[76px] sm:w-[54px]'
      : 'h-[82px] w-[58px] rounded-xl sm:h-[108px] sm:w-[76px]';
  const rankSize = small ? 'text-sm' : tableHole ? 'text-lg' : 'text-2xl';
  const cornerSuitSize = small
    ? 'text-[11px]'
    : tableHole
      ? 'text-sm'
      : 'text-lg';
  const centerSuitSize = small
    ? 'text-xl'
    : tableHole
      ? 'text-2xl'
      : 'text-4xl';
  const logoSize = small
    ? 'size-5 text-[9px]'
    : tableHole
      ? 'size-7 text-[11px]'
      : 'size-9 text-sm';

  if (hidden || !card) {
    return (
      <div
        aria-label="暗牌"
        className={`${size} card-back relative grid shrink-0 place-items-center border border-[#d7ff8f]/25 shadow-[0_10px_24px_rgba(0,0,0,.32)]`}
      >
        <span
          className={`grid ${logoSize} place-items-center rounded-lg border border-[#c9ff63]/25 font-black text-[#c9ff63]/65`}
        >
          R
        </span>
      </div>
    );
  }
  const red = isRedSuit(card.suit);
  return (
    <div
      aria-label={cardText(card)}
      className={`${size} relative shrink-0 border border-black/10 bg-[#f7f6f1] text-[#151817] shadow-[0_12px_26px_rgba(0,0,0,.34)]`}
    >
      <div
        className={`absolute left-2 top-1.5 ${rankSize} font-black leading-none ${red ? 'text-[#d3423b]' : 'text-[#181d1b]'}`}
      >
        <div>{card.rank}</div>
        <div className={`mt-0.5 ${cornerSuitSize}`}>
          {suitSymbol(card.suit)}
        </div>
      </div>
      <div
        className={`absolute bottom-1.5 right-2 rotate-180 ${centerSuitSize} ${red ? 'text-[#d3423b]' : 'text-[#181d1b]'}`}
      >
        {suitSymbol(card.suit)}
      </div>
    </div>
  );
}

function PlayerSeat({
  player,
  index,
  game,
}: {
  player: Player;
  index: number;
  game: GameState;
}) {
  const active = game.status === 'playing' && game.actingIndex === index;
  const reveal =
    player.isHero ||
    (game.status === 'complete' && game.showdown && !player.folded);
  const position =
    game.dealerIndex >= 0 ? positionLabel(index, game.dealerIndex) : '';
  return (
    <div
      className={`absolute z-20 ${seatPositions[index]} transition-all duration-300 ${player.folded ? 'opacity-45 saturate-50' : ''}`}
    >
      {!player.isHero && game.status !== 'ready' && (
        <div className="absolute -top-[50px] left-1/2 flex -translate-x-1/2 gap-1.5 sm:-top-[56px] sm:gap-2">
          <PokerCard card={player.holeCards[0]} hidden={!reveal} tableHole />
          <PokerCard card={player.holeCards[1]} hidden={!reveal} tableHole />
        </div>
      )}
      <div
        className={`relative flex min-w-[132px] items-center gap-2.5 rounded-2xl border p-2.5 shadow-2xl backdrop-blur transition-all sm:min-w-[148px] sm:gap-3 sm:p-3 ${
          active
            ? 'border-[#c9ff63]/65 bg-[#1a251b] shadow-[0_0_0_3px_rgba(201,255,99,.08),0_18px_45px_rgba(0,0,0,.45)]'
            : player.isHero
              ? 'border-[#c9ff63]/25 bg-[#172019]/95'
              : 'border-white/10 bg-[#111817]/94'
        }`}
      >
        <div
          className={`grid size-9 shrink-0 place-items-center rounded-xl text-xs font-black sm:size-11 sm:text-sm ${player.isHero ? 'bg-[#c9ff63] text-[#10180d]' : 'bg-emerald-400/10 text-emerald-200'}`}
        >
          {player.shortName}
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 whitespace-nowrap text-sm font-semibold text-white sm:text-[15px]">
            {player.name}
            {!player.isHero && (
              <span className="hidden text-[10px] font-medium text-white/35 sm:inline">
                {player.style}
              </span>
            )}
          </div>
          <div className="mt-1 flex items-center gap-1.5 text-xs tabular-nums text-amber-300 sm:text-sm">
            <Coins className="size-3.5" />
            {player.stack}
          </div>
        </div>
        {position && (
          <span className="absolute -right-2 -top-2 rounded-lg border border-white/10 bg-[#28312c] px-2 py-0.5 text-[9px] font-bold text-white/65">
            {position}
          </span>
        )}
        {game.dealerIndex === index && (
          <span className="absolute -bottom-2 -right-2 grid size-6 place-items-center rounded-full border-2 border-[#101615] bg-white text-[10px] font-black text-[#18201d]">
            D
          </span>
        )}
      </div>
      {player.lastAction && game.status !== 'ready' && (
        <div
          className={`absolute left-1/2 top-full mt-2 -translate-x-1/2 whitespace-nowrap rounded-full border px-2.5 py-1 text-[10px] font-semibold ${active ? 'border-[#c9ff63]/25 bg-[#c9ff63]/10 text-[#dfff9f]' : 'border-white/8 bg-black/45 text-white/60'}`}
        >
          {player.lastAction}
        </div>
      )}
      {player.isHero && game.status !== 'ready' && (
        <div className="absolute -top-[70px] left-1/2 flex -translate-x-1/2 gap-1.5 sm:-top-[78px] sm:gap-2">
          <PokerCard card={player.holeCards[0]} tableHole />
          <PokerCard card={player.holeCards[1]} tableHole />
        </div>
      )}
    </div>
  );
}

function TableCenter({ game }: { game: GameState }) {
  const currentPlayer =
    game.actingIndex >= 0 ? game.players[game.actingIndex] : null;
  return (
    <div className="absolute left-1/2 top-[45%] z-10 flex w-[min(94%,760px)] -translate-x-1/2 -translate-y-1/2 flex-col items-center">
      {game.status === 'ready' ? (
        <div className="max-w-sm text-center">
          <span className="rounded-full border border-emerald-200/10 bg-black/15 px-4 py-1.5 text-[10px] uppercase tracking-[0.2em] text-emerald-100/45">
            No Limit Hold&apos;em
          </span>
          <p className="mt-4 text-lg font-semibold text-emerald-50/75">
            你的私人训练桌已就绪
          </p>
          <p className="mt-2 text-xs leading-6 text-emerald-50/40">
            四名 Bot 会依照各自风格行动，全部决策会自动记入手牌历史。
          </p>
        </div>
      ) : (
        <>
          <div className="w-fit max-w-full rounded-[30px] border border-white/[.075] bg-black/[.12] px-2.5 py-3 shadow-[0_24px_70px_rgba(0,0,0,.18)] backdrop-blur-[2px] sm:px-5 sm:py-4">
            <div className="mb-2 flex items-center justify-between px-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-emerald-50/35">
              <span>公共牌</span>
              <span>{streetName(game.street)}</span>
            </div>
            <div className="flex min-h-[82px] items-center justify-center gap-1 sm:min-h-[108px] sm:gap-2.5">
              {Array.from({ length: 5 }, (_, index) => (
                <PokerCard
                  key={index}
                  card={game.board[index]}
                  hidden={!game.board[index]}
                />
              ))}
            </div>
            <div className="mt-3 flex justify-center">
              <div className="flex items-center gap-3 rounded-2xl border border-amber-200/15 bg-[#0a1812]/75 px-4 py-2 shadow-lg">
                <div className="grid size-9 place-items-center rounded-xl bg-amber-300/10 text-amber-300">
                  <Coins className="size-4.5" />
                </div>
                <div>
                  <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-white/35">
                    当前底池
                  </p>
                  <p className="text-2xl font-semibold leading-none tabular-nums text-amber-200 sm:text-3xl">
                    {getPot(game)}
                    <span className="ml-1.5 text-[10px] font-medium text-amber-100/35">
                      筹码
                    </span>
                  </p>
                </div>
              </div>
            </div>
          </div>
          {game.status === 'playing' && currentPlayer && (
            <p className="mt-2.5 flex items-center gap-2 rounded-full bg-black/20 px-3 py-1.5 text-[11px] font-medium text-emerald-50/55 sm:text-xs">
              {!currentPlayer.isHero && (
                <LoaderCircle className="size-3.5 animate-spin text-[#c9ff63]" />
              )}
              {currentPlayer.isHero
                ? '轮到你行动'
                : `${currentPlayer.name} 正在思考`}
            </p>
          )}
          {game.status === 'complete' && (
            <div className="mt-2.5 max-w-[580px] rounded-2xl border border-[#c9ff63]/20 bg-[#0c1711]/92 px-5 py-2.5 text-center text-xs font-semibold leading-5 text-[#dcffa2] shadow-xl sm:text-sm">
              {game.resultText}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function BetMarkers({ game }: { game: GameState }) {
  if (game.status === 'ready') return null;
  return (
    <>
      {game.players.map(
        (player, index) =>
          player.streetBet > 0 && (
            <div
              key={player.id}
              className={`absolute z-[15] ${betPositions[index]} flex items-center gap-1.5 rounded-full border border-amber-200/20 bg-black/45 px-3 py-1.5 text-[11px] font-bold tabular-nums text-amber-200/90 shadow-lg`}
            >
              <span className="size-2.5 rounded-full border border-amber-200/40 bg-amber-400/80" />
              {player.streetBet}
            </div>
          ),
      )}
    </>
  );
}

function ActionControls({
  game,
  roundActive,
  autoNextCountdown,
  lastRound,
  onAction,
  onStartRound,
  onNext,
  onReview,
}: {
  game: GameState;
  roundActive: boolean;
  autoNextCountdown: number | null;
  lastRound: TrainingRoundRecord | null;
  onAction: (
    type: 'fold' | 'check' | 'call' | 'raise',
    raiseTo?: number,
  ) => void;
  onStartRound: () => void;
  onNext: () => void;
  onReview: () => void;
}) {
  const hero = game.players[0];
  const heroTurn = game.status === 'playing' && game.actingIndex === 0;
  const toCall = getToCall(game, 0);
  const maxRaiseTo = hero.streetBet + hero.stack;
  const minRaiseTo = Math.min(
    maxRaiseTo,
    Math.max(game.currentBet + game.minRaise, BIG_BLIND),
  );
  const canRaise = heroTurn && maxRaiseTo > game.currentBet;
  const [raiseTo, setRaiseTo] = useState(minRaiseTo);

  useEffect(() => {
    if (heroTurn) setRaiseTo(minRaiseTo);
  }, [game.actions.length, heroTurn, minRaiseTo]);

  const clampSizing = useCallback(
    (value: number) => {
      const rounded = Math.round(value / 5) * 5;
      return Math.max(minRaiseTo, Math.min(maxRaiseTo, rounded));
    },
    [maxRaiseTo, minRaiseTo],
  );

  const setPotSizing = (factor: number) => {
    const potAfterCall = getPot(game) + toCall;
    const target = hero.streetBet + toCall + potAfterCall * factor;
    setRaiseTo(clampSizing(target));
  };

  useEffect(() => {
    if (!heroTurn) return;
    const handler = (event: KeyboardEvent) => {
      if (
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLTextAreaElement
      )
        return;
      if (event.key.toLowerCase() === 'f') onAction('fold');
      if (event.key.toLowerCase() === 'c')
        onAction(toCall > 0 ? 'call' : 'check');
      if (event.key.toLowerCase() === 'r' && canRaise)
        onAction('raise', raiseTo);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [canRaise, heroTurn, onAction, raiseTo, toCall]);

  if (game.status === 'ready') {
    return (
      <div className="flex items-center justify-between rounded-2xl border border-white/8 bg-[#111716] p-3 shadow-xl">
        <div className="hidden sm:block">
          <p className="text-xs font-medium text-white/70">开始一轮连续训练</p>
          <p className="mt-0.5 text-[10px] text-white/35">
            自动续手 · 起始 500 筹码 · 小盲 5 · 大盲 10
          </p>
        </div>
        <Button
          onClick={onStartRound}
          className="ml-auto h-11 rounded-xl bg-[#c9ff63] px-6 text-[#10180d] hover:bg-[#d7ff87]"
        >
          <Play data-icon="inline-start" className="fill-current" />
          开始训练轮次
        </Button>
      </div>
    );
  }

  if (game.status === 'complete') {
    const heroProfit = hero.stack - game.startingStacks[0];
    return (
      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-white/8 bg-[#111716] p-3 shadow-xl">
        <div className="mr-auto">
          <p className="text-xs font-medium text-white/70">
            {roundActive
              ? `本手已记录${autoNextCountdown === null ? '' : ` · ${autoNextCountdown} 秒后自动续手`}`
              : '本轮训练已结束'}
          </p>
          <p
            className={`mt-0.5 text-[11px] font-semibold tabular-nums ${heroProfit >= 0 ? 'text-[#c9ff63]' : 'text-rose-300'}`}
          >
            {roundActive || !lastRound
              ? `本手 ${heroProfit >= 0 ? '+' : ''}${heroProfit} 筹码`
              : `本轮 ${lastRound.handsPlayed} 手 · ${lastRound.heroProfit >= 0 ? '+' : ''}${(lastRound.heroProfit / BIG_BLIND).toFixed(1)} BB`}
          </p>
        </div>
        <Button
          variant="outline"
          onClick={onReview}
          className="h-10 border-white/10 bg-white/[.03] text-white/70 hover:bg-white/[.07] hover:text-white"
        >
          <Eye data-icon="inline-start" />
          复盘本手
        </Button>
        {roundActive ? (
          <Button
            onClick={onNext}
            className="h-10 bg-[#c9ff63] px-5 text-[#10180d] hover:bg-[#d7ff87]"
          >
            立即下一手
            <ChevronRight data-icon="inline-end" />
          </Button>
        ) : (
          <Button
            onClick={onStartRound}
            className="h-10 bg-[#c9ff63] px-5 text-[#10180d] hover:bg-[#d7ff87]"
          >
            <Play data-icon="inline-start" className="fill-current" />
            开始新轮次
          </Button>
        )}
      </div>
    );
  }

  if (!heroTurn) {
    const acting = game.players[game.actingIndex];
    return (
      <div className="flex min-h-[76px] items-center justify-center rounded-2xl border border-white/8 bg-[#111716] p-3 shadow-xl">
        <LoaderCircle className="mr-2 size-4 animate-spin text-[#c9ff63]" />
        <span className="text-xs text-white/45">
          {acting?.name ?? 'Bot'} 正在思考，行动会自动继续
        </span>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-[#c9ff63]/15 bg-[#111716] p-3 shadow-[0_18px_50px_rgba(0,0,0,.32)]">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
        <div className="grid grid-cols-2 gap-2 sm:flex">
          <Button
            variant="outline"
            onClick={() => onAction('fold')}
            className="h-11 border-white/10 bg-white/[.025] px-5 text-white/60 hover:bg-rose-400/10 hover:text-rose-200"
          >
            弃牌{' '}
            <kbd className="ml-1 rounded bg-white/5 px-1 text-[9px] text-white/30">
              F
            </kbd>
          </Button>
          <Button
            variant="secondary"
            onClick={() => onAction(toCall > 0 ? 'call' : 'check')}
            className="h-11 bg-white/[.08] px-5 text-white hover:bg-white/[.13]"
          >
            {toCall > 0 ? `跟注 ${Math.min(toCall, hero.stack)}` : '过牌'}{' '}
            <kbd className="ml-1 rounded bg-black/15 px-1 text-[9px] text-white/35">
              C
            </kbd>
          </Button>
        </div>
        {canRaise && (
          <div className="min-w-0 flex-1 rounded-xl border border-white/7 bg-black/10 px-3 py-2">
            <div className="mb-2 flex items-center gap-1.5">
              {[0.5, 0.75, 1].map((factor) => (
                <button
                  key={factor}
                  onClick={() => setPotSizing(factor)}
                  className="rounded-md px-2 py-1 text-[9px] font-semibold text-white/40 transition hover:bg-white/7 hover:text-white/70"
                >
                  {factor === 1 ? '满池' : `${factor * 100}%池`}
                </button>
              ))}
              <button
                onClick={() => setRaiseTo(maxRaiseTo)}
                className="rounded-md px-2 py-1 text-[9px] font-semibold text-amber-200/50 transition hover:bg-amber-300/8 hover:text-amber-200"
              >
                全下
              </button>
              <span className="ml-auto text-[10px] tabular-nums text-white/40">
                加注至 <strong className="text-white/75">{raiseTo}</strong>
              </span>
            </div>
            <Slider
              min={minRaiseTo}
              max={maxRaiseTo}
              step={5}
              value={[raiseTo]}
              onValueChange={(value) =>
                setRaiseTo(clampSizing(Array.isArray(value) ? value[0] : value))
              }
            />
          </div>
        )}
        <Button
          disabled={!canRaise}
          onClick={() => onAction('raise', raiseTo)}
          className="h-11 bg-[#c9ff63] px-5 text-[#10180d] hover:bg-[#d7ff87]"
        >
          {game.currentBet === 0 ? `下注 ${raiseTo}` : `加注至 ${raiseTo}`}
          <kbd className="ml-1 rounded bg-black/10 px-1 text-[9px] text-black/45">
            R
          </kbd>
        </Button>
      </div>
    </div>
  );
}

function Timeline({
  actions,
  revealReasons,
}: {
  actions: GameAction[];
  revealReasons: boolean;
}) {
  if (actions.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-white/10 px-5 py-9 text-center">
        <History className="mx-auto size-4 text-white/20" />
        <p className="mt-3 text-xs font-medium text-white/50">等待发牌</p>
        <p className="mt-1 text-[10px] leading-5 text-white/25">
          盲注、下注、跟注、弃牌与结算会依次出现在这里。
        </p>
      </div>
    );
  }
  return (
    <div className="space-y-1.5">
      {actions.map((action, index) => {
        const isHero = action.playerId === 'hero';
        const isDeal =
          action.type === 'deal' ||
          action.type === 'showdown' ||
          action.type === 'win';
        return (
          <div
            key={action.id}
            className={`rounded-xl border px-3 py-2.5 ${isHero ? 'border-[#c9ff63]/15 bg-[#c9ff63]/[.035]' : 'border-white/[.055] bg-white/[.018]'}`}
          >
            <div className="flex items-start gap-2.5">
              <span
                className={`mt-1.5 size-1.5 shrink-0 rounded-full ${isDeal ? 'bg-amber-300/70' : isHero ? 'bg-[#c9ff63]' : 'bg-white/25'}`}
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <p
                    className={`text-[11px] leading-5 ${isHero ? 'font-semibold text-[#dcffa2]' : 'text-white/62'}`}
                  >
                    {action.description}
                  </p>
                  <span className="shrink-0 text-[8px] uppercase text-white/20">
                    {streetName(action.street)}
                  </span>
                </div>
                {revealReasons && action.reason && (
                  <p className="mt-1 border-l border-white/8 pl-2 text-[9px] leading-4 text-white/30">
                    Bot 注释：{action.reason}
                  </p>
                )}
              </div>
              <span className="text-[9px] tabular-nums text-white/15">
                {index + 1}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function VerdictIcon({ verdict }: { verdict: AdviceItem['verdict'] }) {
  if (verdict === 'good') return <Check className="size-3.5 text-[#c9ff63]" />;
  if (verdict === 'review')
    return <Target className="size-3.5 text-amber-300" />;
  return <Lightbulb className="size-3.5 text-sky-300" />;
}

function AdviceView({ advice }: { advice: HandAdvice }) {
  return (
    <div>
      <div className="flex items-center gap-3 rounded-2xl border border-[#c9ff63]/15 bg-[#c9ff63]/[.035] p-3.5">
        <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-[#c9ff63] text-lg font-black text-[#11170f]">
          {advice.grade}
        </div>
        <div>
          <p className="text-xs font-semibold text-white/80">
            {advice.headline}
          </p>
          <p className="mt-0.5 text-[9px] text-white/30">
            启发式教练反馈 · 不是求解器答案
          </p>
        </div>
      </div>
      <div className="mt-3 space-y-2">
        {advice.items.map((item, index) => (
          <div
            key={`${item.title}-${index}`}
            className="rounded-xl border border-white/[.06] bg-white/[.018] p-3"
          >
            <div className="flex items-center gap-2 text-[11px] font-semibold text-white/65">
              <VerdictIcon verdict={item.verdict} />
              {item.title}
            </div>
            <p className="mt-1.5 text-[10px] leading-[1.65] text-white/38">
              {item.text}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

function LiveCoach({ game }: { game: GameState }) {
  if (game.status === 'complete' && game.advice)
    return <AdviceView advice={game.advice} />;
  if (game.status === 'ready') {
    return (
      <div className="rounded-2xl border border-white/7 bg-white/[.02] p-4">
        <BrainCircuit className="size-4 text-[#c9ff63]" />
        <p className="mt-3 text-xs font-medium text-white/65">
          教练将在牌后点评
        </p>
        <p className="mt-1.5 text-[10px] leading-5 text-white/30">
          为了不泄露答案，牌局进行中只提示你应该思考的信息，不会直接替你做决定。
        </p>
      </div>
    );
  }
  const hero = game.players[0];
  const heroTurn = game.actingIndex === 0;
  const toCall = getToCall(game, 0);
  const potOdds =
    toCall > 0 ? Math.round((toCall / (getPot(game) + toCall)) * 100) : 0;
  const position = positionLabel(0, game.dealerIndex);
  const madeHand =
    game.board.length >= 3
      ? bestHand([...hero.holeCards, ...game.board]).name
      : null;
  return (
    <div className="space-y-2">
      <div
        className={`rounded-2xl border p-4 ${heroTurn ? 'border-[#c9ff63]/18 bg-[#c9ff63]/[.035]' : 'border-white/7 bg-white/[.02]'}`}
      >
        <div className="flex items-center gap-2">
          <BrainCircuit className="size-4 text-[#c9ff63]" />
          <p className="text-xs font-medium text-white/70">
            {heroTurn ? '决策检查清单' : '观察模式'}
          </p>
        </div>
        <p className="mt-2 text-[10px] leading-5 text-white/35">
          {heroTurn
            ? `你在 ${position}，${toCall > 0 ? `需投入 ${toCall}，最低底池赔率约 ${potOdds}%` : '可以免费过牌或主动下注'}。先想清楚更差牌是否跟注、更好牌是否弃牌。`
            : '留意每位 Bot 的入池频率与下注尺度。牌后可在行动记录中查看它们的启发式决策注释。'}
        </p>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-xl border border-white/6 bg-white/[.018] p-3">
          <p className="text-[9px] text-white/25">当前位置</p>
          <p className="mt-1 text-sm font-semibold text-white/65">{position}</p>
        </div>
        <div className="rounded-xl border border-white/6 bg-white/[.018] p-3">
          <p className="text-[9px] text-white/25">当前牌型</p>
          <p className="mt-1 text-sm font-semibold text-white/65">
            {madeHand ?? `翻前 ${preflopStrength(hero.holeCards)}/100`}
          </p>
        </div>
      </div>
    </div>
  );
}

function SidePanel({ game }: { game: GameState }) {
  return (
    <div className="h-full">
      <Tabs defaultValue="actions" className="h-full">
        <TabsList
          variant="line"
          className="w-full justify-start border-b border-white/8 pb-2"
        >
          <TabsTrigger
            value="actions"
            className="flex-none px-3 text-xs text-white/40 data-active:text-white"
          >
            本手行动
          </TabsTrigger>
          <TabsTrigger
            value="coach"
            className="flex-none px-3 text-xs text-white/40 data-active:text-white"
          >
            教练
          </TabsTrigger>
        </TabsList>
        <TabsContent value="actions" className="mt-3">
          <ScrollArea className="h-[calc(100vh-145px)] min-h-[360px] pr-2 max-xl:h-[420px]">
            <Timeline
              actions={game.actions}
              revealReasons={game.status === 'complete'}
            />
          </ScrollArea>
        </TabsContent>
        <TabsContent value="coach" className="mt-3">
          <ScrollArea className="h-[calc(100vh-145px)] min-h-[360px] pr-2 max-xl:h-[420px]">
            <LiveCoach game={game} />
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function MiniStat({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: 'positive' | 'negative';
}) {
  return (
    <div>
      <div className="text-[10px] text-white/28">{label}</div>
      <div
        className={`mt-1 text-xl font-semibold tabular-nums ${tone === 'positive' ? 'text-[#c9ff63]' : tone === 'negative' ? 'text-rose-300' : 'text-white/78'}`}
      >
        {value}
      </div>
    </div>
  );
}

function HistoryReview({ record }: { record: HandRecord }) {
  return (
    <div className="grid min-h-0 grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_280px]">
      <div className="min-w-0">
        <div className="rounded-2xl border border-white/8 bg-[#0d1412] p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-[10px] text-white/30">
                第 {record.handNumber} 手 ·{' '}
                {new Date(record.playedAt).toLocaleString('zh-CN', {
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
              <p className="mt-1.5 text-sm font-semibold text-white/75">
                {record.resultText}
              </p>
            </div>
            <Badge
              variant="outline"
              className={`border-white/10 ${record.heroProfit >= 0 ? 'text-[#c9ff63]' : 'text-rose-300'}`}
            >
              Hero {record.heroProfit >= 0 ? '+' : ''}
              {record.heroProfit}
            </Badge>
          </div>
          <div className="mt-4 flex flex-wrap items-end gap-5">
            <div>
              <p className="mb-1.5 text-[9px] uppercase tracking-[0.12em] text-white/25">
                Hero 手牌
              </p>
              <div className="flex gap-1.5">
                {record.heroCards.map((card, index) => (
                  <PokerCard
                    key={`${cardText(card)}-${index}`}
                    card={card}
                    small
                  />
                ))}
              </div>
            </div>
            <div>
              <p className="mb-1.5 text-[9px] uppercase tracking-[0.12em] text-white/25">
                公共牌
              </p>
              <div className="flex gap-1.5">
                {record.board.length > 0 ? (
                  record.board.map((card, index) => (
                    <PokerCard
                      key={`${cardText(card)}-${index}`}
                      card={card}
                      small
                    />
                  ))
                ) : (
                  <span className="text-[10px] text-white/25">未发出</span>
                )}
              </div>
            </div>
            <div className="ml-auto text-right">
              <p className="text-[9px] text-white/25">最终底池</p>
              <p className="mt-1 text-lg font-semibold text-amber-200">
                {record.pot}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div>
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-white/28">
              完整行动
            </p>
            <ScrollArea className="h-[360px] pr-2">
              <Timeline actions={record.actions} revealReasons />
            </ScrollArea>
          </div>
          <div>
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-white/28">
              所有玩家
            </p>
            <div className="space-y-2">
              {record.players.map((player) => (
                <div
                  key={player.id}
                  className="flex items-center gap-3 rounded-xl border border-white/6 bg-white/[.018] p-2.5"
                >
                  <div className="grid size-8 place-items-center rounded-lg bg-white/5 text-[10px] font-bold text-white/50">
                    {player.name.slice(0, 1)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 text-[10px] font-medium text-white/60">
                      {player.name}
                      <span className="text-[8px] text-white/22">
                        {player.style}
                      </span>
                    </div>
                    <p
                      className={`mt-0.5 text-[9px] tabular-nums ${player.endingStack - player.startingStack >= 0 ? 'text-[#c9ff63]/65' : 'text-rose-300/65'}`}
                    >
                      {player.startingStack} → {player.endingStack} (
                      {player.endingStack - player.startingStack >= 0
                        ? '+'
                        : ''}
                      {player.endingStack - player.startingStack})
                    </p>
                  </div>
                  <div
                    className={`flex gap-1 ${player.folded ? 'opacity-45' : ''}`}
                  >
                    {player.cards.map((card, index) => (
                      <PokerCard
                        key={`${cardText(card)}-${index}`}
                        card={card}
                        small
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      <div>
        <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-white/28">
          牌后教练
        </p>
        <AdviceView advice={record.advice} />
      </div>
    </div>
  );
}

function HistoryDialog({
  open,
  onOpenChange,
  history,
  selectedId,
  onSelect,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  history: HandRecord[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  const selected =
    history.find((record) => record.id === selectedId) ?? history[0];
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] max-w-[min(1180px,calc(100%-24px))] overflow-hidden border border-white/10 bg-[#09100e] p-0 text-white shadow-2xl sm:max-w-[min(1180px,calc(100%-32px))]">
        <DialogHeader className="border-b border-white/8 px-5 py-4">
          <DialogTitle className="flex items-center gap-2 text-base text-white/85">
            <History className="size-4 text-[#c9ff63]" /> 手牌档案
          </DialogTitle>
          <DialogDescription className="text-[10px] text-white/30">
            每位玩家的手牌、行动、Bot 决策注释与训练建议均保存在这里。
          </DialogDescription>
        </DialogHeader>
        {history.length === 0 ? (
          <div className="grid min-h-[420px] place-items-center p-10 text-center">
            <div>
              <History className="mx-auto size-7 text-white/15" />
              <p className="mt-3 text-sm text-white/45">
                完成第一手后，这里会出现详细记录。
              </p>
            </div>
          </div>
        ) : (
          <div className="grid min-h-0 flex-1 grid-cols-1 md:grid-cols-[190px_minmax(0,1fr)]">
            <ScrollArea className="h-[calc(92vh-86px)] border-r border-white/8 bg-white/[.012] p-3">
              <div className="space-y-1.5 pr-2">
                {history.map((record) => (
                  <button
                    key={record.id}
                    onClick={() => onSelect(record.id)}
                    className={`w-full rounded-xl border p-3 text-left transition ${selected?.id === record.id ? 'border-[#c9ff63]/20 bg-[#c9ff63]/[.05]' : 'border-transparent hover:border-white/7 hover:bg-white/[.025]'}`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] font-semibold text-white/60">
                        第 {record.handNumber} 手
                      </span>
                      <span
                        className={`text-[10px] font-semibold tabular-nums ${record.heroProfit >= 0 ? 'text-[#c9ff63]' : 'text-rose-300'}`}
                      >
                        {record.heroProfit >= 0 ? '+' : ''}
                        {record.heroProfit}
                      </span>
                    </div>
                    <div className="mt-2 flex items-center gap-1 text-[10px] font-bold text-white/45">
                      {record.heroCards.map(cardText).join(' ')}
                    </div>
                    <div className="mt-1.5 truncate text-[8px] text-white/22">
                      底池 {record.pot} · {record.showdown ? '摊牌' : '未摊牌'}
                    </div>
                  </button>
                ))}
              </div>
            </ScrollArea>
            <ScrollArea className="h-[calc(92vh-86px)] p-5">
              {selected && <HistoryReview record={selected} />}
            </ScrollArea>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function RoundSummaryDialog({
  open,
  onOpenChange,
  round,
  onStartNew,
  onOpenHistory,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  round: TrainingRoundRecord | null;
  onStartNew: () => void;
  onOpenHistory: () => void;
}) {
  if (!round) return null;
  const vpip = round.handsPlayed
    ? Math.round((round.vpipHands / round.handsPlayed) * 100)
    : 0;
  const pfr = round.handsPlayed
    ? Math.round((round.pfrHands / round.handsPlayed) * 100)
    : 0;
  const winRate = round.handsPlayed
    ? Math.round((round.wins / round.handsPlayed) * 100)
    : 0;
  const profitBb = round.heroProfit / BIG_BLIND;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[min(520px,calc(100%-24px))] border border-white/10 bg-[#09100e] p-0 text-white shadow-2xl sm:max-w-[520px]">
        <DialogHeader className="border-b border-white/8 px-5 py-4">
          <DialogTitle className="flex items-center gap-2 text-base text-white/85">
            <Flag className="size-4 text-[#c9ff63]" />
            本轮训练完成
          </DialogTitle>
          <DialogDescription className="text-[10px] text-white/30">
            共完成 {round.handsPlayed} 手，所有手牌与决策记录均已保存。
          </DialogDescription>
        </DialogHeader>
        <div className="p-5">
          <div className="rounded-2xl border border-[#c9ff63]/15 bg-[#c9ff63]/[.035] p-4">
            <p className="text-[10px] text-white/30">本轮盈亏</p>
            <p
              className={`mt-1 text-3xl font-semibold tabular-nums ${profitBb >= 0 ? 'text-[#c9ff63]' : 'text-rose-300'}`}
            >
              {profitBb >= 0 ? '+' : ''}
              {profitBb.toFixed(1)} BB
            </p>
            <p className="mt-1 text-[10px] text-white/28">
              结果用于记录波动，训练评价仍应以决策质量为主。
            </p>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
            <div className="rounded-xl border border-white/7 bg-white/[.02] p-3">
              <MiniStat label="手牌" value={String(round.handsPlayed)} />
            </div>
            <div className="rounded-xl border border-white/7 bg-white/[.02] p-3">
              <MiniStat label="VPIP" value={`${vpip}%`} />
            </div>
            <div className="rounded-xl border border-white/7 bg-white/[.02] p-3">
              <MiniStat label="PFR" value={`${pfr}%`} />
            </div>
            <div className="rounded-xl border border-white/7 bg-white/[.02] p-3">
              <MiniStat label="胜率" value={`${winRate}%`} />
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between rounded-xl border border-white/7 bg-white/[.018] px-3 py-2.5 text-[10px]">
            <span className="text-white/35">牌后评分</span>
            <span className="tabular-nums text-white/60">
              A {round.gradeCounts.A} · B {round.gradeCounts.B} · C{' '}
              {round.gradeCounts.C}
            </span>
          </div>
          <div className="mt-5 flex flex-wrap justify-end gap-2">
            <Button
              variant="outline"
              onClick={onOpenHistory}
              className="border-white/10 bg-white/[.025] text-white/65 hover:bg-white/[.06] hover:text-white"
            >
              <History data-icon="inline-start" />
              查看手牌档案
            </Button>
            <Button
              onClick={onStartNew}
              className="bg-[#c9ff63] text-[#10180d] hover:bg-[#d7ff87]"
            >
              <Play data-icon="inline-start" className="fill-current" />
              开始新轮次
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function PokerTrainer() {
  const [game, setGame] = useState<GameState>(() => createReadyGame());
  const [history, setHistory] = useState<HandRecord[]>([]);
  const [sessionId, setSessionId] = useState('');
  const [storageState, setStorageState] = useState<
    'loading' | 'ready' | 'saving' | 'error'
  >('loading');
  const [historyOpen, setHistoryOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [activeRound, setActiveRound] = useState<TrainingRoundRecord | null>(
    null,
  );
  const [lastRound, setLastRound] = useState<TrainingRoundRecord | null>(null);
  const [roundEndRequested, setRoundEndRequested] = useState(false);
  const [autoNextCountdown, setAutoNextCountdown] = useState<number | null>(
    null,
  );
  const [roundSummaryOpen, setRoundSummaryOpen] = useState(false);
  const resumedRound = useRef<string | null>(null);
  const roundStartLocked = useRef(false);
  const savedHands = useRef(new Set<string>());

  useEffect(() => {
    let active = true;
    const existing = window.localStorage.getItem(SESSION_KEY);
    const id =
      existing ||
      window.crypto?.randomUUID?.() ||
      `session-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    if (!existing) window.localStorage.setItem(SESSION_KEY, id);
    setSessionId(id);
    Promise.all([
      fetch(`/api/hands?sessionId=${encodeURIComponent(id)}`).then(
        async (response) => {
          if (!response.ok) throw new Error('history request failed');
          return response.json() as Promise<{ hands: HandRecord[] }>;
        },
      ),
      fetch(`/api/rounds?sessionId=${encodeURIComponent(id)}`).then(
        async (response) => {
          if (!response.ok) throw new Error('rounds request failed');
          return response.json() as Promise<{ rounds: TrainingRoundRecord[] }>;
        },
      ),
    ])
      .then(([{ hands }, { rounds }]) => {
        if (!active) return;
        setHistory(hands);
        hands.forEach((record) => savedHands.current.add(record.id));
        const newest = hands[0];
        if (newest) {
          setGame((current) => ({
            ...current,
            handNumber: Math.max(...hands.map((record) => record.handNumber)),
            dealerIndex: newest.dealerIndex,
          }));
        }
        setActiveRound(
          rounds.find((round) => round.status === 'active') ?? null,
        );
        setLastRound(
          rounds.find((round) => round.status === 'completed') ?? null,
        );
        setStorageState('ready');
      })
      .catch(() => {
        if (active) setStorageState('error');
      });
    return () => {
      active = false;
    };
  }, []);

  const saveRound = useCallback(async (round: TrainingRoundRecord) => {
    const response = await fetch('/api/rounds', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(round),
    });
    if (!response.ok) throw new Error('round save failed');
  }, []);

  useEffect(() => {
    if (
      !activeRound ||
      storageState !== 'ready' ||
      resumedRound.current === activeRound.id
    )
      return;
    resumedRound.current = activeRound.id;
    setRoundEndRequested(false);
    setGame((current) =>
      current.status === 'ready' ? startNextHand(current) : current,
    );
  }, [activeRound, storageState]);

  useEffect(() => {
    if (
      game.status !== 'playing' ||
      game.actingIndex < 0 ||
      game.players[game.actingIndex].isHero
    )
      return;
    const handId = game.handId;
    const actionCount = game.actions.length;
    const actorIndex = game.actingIndex;
    const timeout = window.setTimeout(
      () => {
        setGame((current) => {
          if (
            current.handId !== handId ||
            current.actions.length !== actionCount ||
            current.actingIndex !== actorIndex
          )
            return current;
          const decision = chooseBotDecision(current, actorIndex);
          return applyAction(current, actorIndex, decision);
        });
      },
      520 + Math.random() * 430,
    );
    return () => window.clearTimeout(timeout);
  }, [
    game.actions.length,
    game.actingIndex,
    game.handId,
    game.players,
    game.status,
  ]);

  useEffect(() => {
    if (
      game.status !== 'complete' ||
      !sessionId ||
      savedHands.current.has(game.handId)
    )
      return;
    savedHands.current.add(game.handId);
    const roundHandNumber = activeRound ? activeRound.handsPlayed + 1 : null;
    const record = toHandRecord(
      game,
      sessionId,
      activeRound?.id ?? null,
      roundHandNumber,
    );
    const updatedRound = activeRound
      ? appendHandToRound(activeRound, record)
      : null;
    if (updatedRound) setActiveRound(updatedRound);
    setHistory((current) => [
      record,
      ...current.filter((item) => item.id !== record.id),
    ]);
    setSelectedId(record.id);
    setStorageState('saving');

    const saves: Promise<unknown>[] = [
      fetch('/api/hands', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(record),
      }).then((response) => {
        if (!response.ok) throw new Error('hand save failed');
      }),
    ];
    if (updatedRound) saves.push(saveRound(updatedRound));
    Promise.all(saves)
      .then(() => setStorageState('ready'))
      .catch(() => setStorageState('error'));
  }, [activeRound, game, saveRound, sessionId]);
  useEffect(() => {
    if (
      game.status !== 'complete' ||
      !activeRound ||
      !activeRound.handIds.includes(game.handId)
    )
      return;

    if (roundEndRequested) {
      const completed = completeTrainingRound(activeRound);
      roundStartLocked.current = false;
      setActiveRound(null);
      setLastRound(completed);
      setRoundEndRequested(false);
      setAutoNextCountdown(null);
      setRoundSummaryOpen(true);
      setStorageState('saving');
      saveRound(completed)
        .then(() => setStorageState('ready'))
        .catch(() => setStorageState('error'));
      return;
    }

    setAutoNextCountdown(3);
    const interval = window.setInterval(() => {
      setAutoNextCountdown((current) =>
        current === null ? null : Math.max(0, current - 1),
      );
    }, 1000);
    const timeout = window.setTimeout(() => {
      setAutoNextCountdown(null);
      setGame((current) =>
        current.status === 'complete' ? startNextHand(current) : current,
      );
    }, 3000);
    return () => {
      window.clearInterval(interval);
      window.clearTimeout(timeout);
    };
  }, [activeRound, game.handId, game.status, roundEndRequested, saveRound]);

  const displayedRound = activeRound ?? lastRound;
  const stats = useMemo(() => {
    const count = displayedRound?.handsPlayed ?? 0;
    const profit = displayedRound?.heroProfit ?? 0;
    const vpip =
      count && displayedRound
        ? Math.round((displayedRound.vpipHands / count) * 100)
        : 0;
    const pfr =
      count && displayedRound
        ? Math.round((displayedRound.pfrHands / count) * 100)
        : 0;
    return { count, profit, vpip, pfr };
  }, [displayedRound]);

  const handleAction = useCallback(
    (type: 'fold' | 'check' | 'call' | 'raise', raiseTo?: number) => {
      setGame((current) => applyAction(current, 0, { type, raiseTo }));
    },
    [],
  );

  const handleStartRound = useCallback(() => {
    if (!sessionId || activeRound || roundStartLocked.current) return;
    roundStartLocked.current = true;
    const round = createTrainingRound(sessionId);
    resumedRound.current = round.id;
    setActiveRound(round);
    setRoundEndRequested(false);
    setAutoNextCountdown(null);
    setRoundSummaryOpen(false);
    setStorageState('saving');
    saveRound(round)
      .then(() => setStorageState('ready'))
      .catch(() => setStorageState('error'));
    setGame((current) => {
      const ready = createReadyGame();
      return startNextHand({
        ...ready,
        handNumber: current.handNumber,
        dealerIndex: current.dealerIndex,
      });
    });
  }, [activeRound, saveRound, sessionId]);

  const handleNext = useCallback(() => {
    if (!activeRound) return;
    setAutoNextCountdown(null);
    setGame((current) =>
      current.status === 'complete' ? startNextHand(current) : current,
    );
  }, [activeRound]);

  const handleToggleEndRound = useCallback(() => {
    if (!activeRound) return;
    setRoundEndRequested((current) => !current);
  }, [activeRound]);

  const openCurrentReview = () => {
    const record =
      history.find((item) => item.id === game.handId) ?? history[0];
    if (record) setSelectedId(record.id);
    setHistoryOpen(true);
  };

  return (
    <main className="min-h-screen bg-[#080d0c] text-[#edf7f2]">
      <header className="flex h-16 items-center justify-between border-b border-white/8 px-4 sm:px-6 lg:px-7">
        <div className="flex items-center gap-3">
          <div className="grid size-9 place-items-center rounded-xl bg-[#c9ff63] text-sm font-black text-[#10180d] shadow-[0_0_30px_rgba(201,255,99,.15)]">
            R
          </div>
          <div>
            <div className="font-semibold tracking-[-0.02em]">RiverLab</div>
            <div className="hidden text-[9px] uppercase tracking-[0.18em] text-white/30 sm:block">
              Poker training room
            </div>
          </div>
        </div>
        <div className="hidden items-center gap-2 text-[10px] text-white/45 md:flex">
          <span className="rounded-full border border-white/8 bg-white/[.03] px-3 py-1.5">
            盲注 5 / 10
          </span>
          <span className="rounded-full border border-white/8 bg-white/[.03] px-3 py-1.5">
            5 人桌 · 50BB
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="hidden items-center gap-1.5 text-[9px] text-white/28 sm:flex">
            {storageState === 'saving' ? (
              <LoaderCircle className="size-3 animate-spin" />
            ) : storageState === 'error' ? (
              <CloudOff className="size-3 text-amber-300" />
            ) : (
              <CloudCheck className="size-3 text-[#c9ff63]/60" />
            )}
            {storageState === 'saving'
              ? '正在保存'
              : storageState === 'error'
                ? '同步待恢复'
                : storageState === 'loading'
                  ? '载入记录'
                  : '已自动保存'}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setHistoryOpen(true)}
            className="border-white/10 bg-white/[.025] text-white/60 hover:bg-white/[.06] hover:text-white"
          >
            <History data-icon="inline-start" />
            手牌档案
            {history.length > 0 && (
              <span className="ml-1 rounded-full bg-[#c9ff63]/12 px-1.5 text-[9px] text-[#c9ff63]">
                {history.length}
              </span>
            )}
          </Button>
        </div>
      </header>

      <div className="grid min-h-[calc(100vh-4rem)] grid-cols-1 xl:grid-cols-[minmax(0,1fr)_300px] 2xl:grid-cols-[184px_minmax(690px,1fr)_310px]">
        <aside className="hidden border-r border-white/8 p-5 2xl:block">
          <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-white/28">
            {activeRound ? '当前轮次' : lastRound ? '上一轮次' : '训练轮次'}
          </p>
          <div className="mt-5 space-y-5">
            <MiniStat label="已完成手牌" value={String(stats.count)} />
            <MiniStat
              label="累计盈亏"
              value={`${stats.profit >= 0 ? '+' : ''}${(stats.profit / BIG_BLIND).toFixed(1)} BB`}
              tone={
                stats.profit > 0
                  ? 'positive'
                  : stats.profit < 0
                    ? 'negative'
                    : undefined
              }
            />
            <div className="grid grid-cols-2 gap-3 border-y border-white/7 py-4">
              <MiniStat label="VPIP" value={`${stats.vpip}%`} />
              <MiniStat label="PFR" value={`${stats.pfr}%`} />
            </div>
            <div className="rounded-2xl border border-white/8 bg-white/[.022] p-3.5">
              <ShieldCheck className="size-4 text-[#c9ff63]" />
              <p className="mt-3 text-[11px] font-medium text-white/60">
                训练原则
              </p>
              <p className="mt-1.5 text-[10px] leading-5 text-white/28">
                先评价决策，再看输赢。短期结果不能证明一次行动正确或错误。
              </p>
            </div>
            <div>
              <p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-white/22">
                Bot 阵容
              </p>
              <div className="mt-2 space-y-2">
                {game.players.slice(1).map((player) => (
                  <div
                    key={player.id}
                    className="flex items-center justify-between text-[10px]"
                  >
                    <span className="text-white/45">{player.name}</span>
                    <span className="rounded-md bg-white/[.035] px-1.5 py-0.5 text-white/25">
                      {player.style}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </aside>

        <section className="flex min-w-0 flex-col px-3 py-4 sm:px-6 sm:py-5">
          <div className="mb-2 flex items-center justify-between gap-3 sm:mb-3">
            <div>
              <p className="text-[10px] text-white/28">
                训练桌 01 ·{' '}
                {activeRound
                  ? `轮次进行中 · 已完成 ${activeRound.handsPlayed} 手`
                  : game.status === 'ready'
                    ? '等待新轮次'
                    : `第 ${game.handNumber} 手`}
              </p>
              <h1 className="mt-1 text-base font-semibold tracking-tight text-white/82 sm:text-lg">
                {game.status === 'ready'
                  ? '准备开始训练'
                  : game.status === 'complete'
                    ? '本手已完成'
                    : `${streetName(game.street)} · ${game.actingIndex === 0 ? '轮到你行动' : '观察对手行动'}`}
              </h1>
            </div>
            <div className="flex items-center gap-2">
              <div className="hidden items-center gap-2 text-[10px] text-white/35 sm:flex">
                <CircleDollarSign className="size-3.5 text-amber-300" />
                Hero {game.players[0].stack}
              </div>
              {activeRound && (
                <Button
                  variant="outline"
                  size="sm"
                  aria-pressed={roundEndRequested}
                  onClick={handleToggleEndRound}
                  className={
                    roundEndRequested
                      ? 'border-amber-300/25 bg-amber-300/8 text-amber-200 hover:bg-amber-300/12 hover:text-amber-100'
                      : 'border-white/12 bg-white/[.025] text-white/65 hover:border-rose-300/25 hover:bg-rose-300/8 hover:text-rose-200'
                  }
                >
                  {roundEndRequested ? (
                    <TimerReset data-icon="inline-start" />
                  ) : (
                    <Square data-icon="inline-start" />
                  )}
                  {roundEndRequested ? '取消结束' : '结束本轮'}
                </Button>
              )}
            </div>
          </div>
          {activeRound && (
            <div
              className={`mb-2 flex items-center gap-2 rounded-xl border px-3 py-2 text-[10px] ${roundEndRequested ? 'border-amber-300/15 bg-amber-300/[.035] text-amber-100/65' : 'border-[#c9ff63]/12 bg-[#c9ff63]/[.025] text-[#dfff9f]/55'}`}
            >
              <span
                className={`size-1.5 rounded-full ${roundEndRequested ? 'bg-amber-300' : 'animate-pulse bg-[#c9ff63]'}`}
              />
              {roundEndRequested
                ? '将在本手结算并保存后结束本轮'
                : '训练轮次进行中，本手结束后会自动开始下一手'}
            </div>
          )}

          <div className="relative mx-auto h-[500px] w-full max-w-5xl flex-none sm:h-[540px]">
            <div className="poker-table absolute inset-x-[2%] bottom-[9%] top-[8%] rounded-[46%] border-[8px] border-[#202a24] shadow-[inset_0_0_0_1px_rgba(255,255,255,.08),0_35px_90px_rgba(0,0,0,.45)] sm:inset-x-[5%] sm:border-[10px]">
              <div className="absolute inset-4 rounded-[46%] border border-white/[.065] sm:inset-5" />
            </div>
            <TableCenter game={game} />
            <BetMarkers game={game} />
            {game.players.map((player, index) => (
              <PlayerSeat
                key={player.id}
                player={player}
                index={index}
                game={game}
              />
            ))}
          </div>

          <ActionControls
            game={game}
            roundActive={Boolean(activeRound)}
            autoNextCountdown={autoNextCountdown}
            lastRound={lastRound}
            onAction={handleAction}
            onStartRound={handleStartRound}
            onNext={handleNext}
            onReview={openCurrentReview}
          />

          <div className="mt-4 rounded-2xl border border-white/8 bg-[#0b1110] p-4 xl:hidden">
            <SidePanel game={game} />
          </div>
        </section>

        <aside className="hidden border-l border-white/8 bg-[#0b1110] p-4 xl:block">
          <SidePanel game={game} />
        </aside>
      </div>

      <HistoryDialog
        open={historyOpen}
        onOpenChange={setHistoryOpen}
        history={history}
        selectedId={selectedId}
        onSelect={setSelectedId}
      />
      <RoundSummaryDialog
        open={roundSummaryOpen}
        onOpenChange={setRoundSummaryOpen}
        round={lastRound}
        onStartNew={handleStartRound}
        onOpenHistory={() => {
          const latestRoundHandId =
            lastRound?.handIds[lastRound.handIds.length - 1];
          if (latestRoundHandId) setSelectedId(latestRoundHandId);
          setRoundSummaryOpen(false);
          setHistoryOpen(true);
        }}
      />
    </main>
  );
}
