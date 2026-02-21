
import React, { useState, useEffect, useCallback } from 'react';
import { Gift, RefreshCcw, Lock, Star, Users, RotateCcw, Loader2 } from 'lucide-react';
import { DrawWinner, EligibleParticipant } from '../types';
import { fetchEligibleParticipants, drawWinnerApi, fetchWinnersApi, cancelWinnerApi, resetAllWinnersApi } from '../services/apiService';

interface Props {
  isLocked: boolean;
}

const LuckyDraw: React.FC<Props> = ({ isLocked }) => {
  const [eligibleParticipants, setEligibleParticipants] = useState<EligibleParticipant[]>([]);
  const [eligibleCount, setEligibleCount] = useState(0);
  const [winners, setWinners] = useState<DrawWinner[]>([]);
  const [shuffling, setShuffling] = useState(false);
  const [shuffledName, setShuffledName] = useState('READY?');
  const [isLoading, setIsLoading] = useState(false);

  const refreshEligible = useCallback(() => {
    fetchEligibleParticipants()
      .then(res => {
        setEligibleParticipants(res.data);
        setEligibleCount(res.metadata.totalCount);
      })
      .catch(err => console.error('Failed to refresh eligible participants:', err));
  }, []);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [eligibleRes, winnersRes] = await Promise.all([
        fetchEligibleParticipants(),
        fetchWinnersApi(),
      ]);
      setEligibleParticipants(eligibleRes.data);
      setEligibleCount(eligibleRes.metadata.totalCount);
      setWinners(winnersRes.filter(w => w.isActive));
    } catch (err) {
      console.error('Failed to load lucky draw data:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isLocked) loadData();
  }, [isLocked, loadData]);

  const startDraw = async () => {
    if (shuffling || winners.length >= 2 || eligibleCount === 0) return;
    setShuffling(true);

    const names = eligibleParticipants.map(p => p.lineDisplayName);
    const getRandomName = () => names.length > 0 ? names[Math.floor(Math.random() * names.length)] : '...';

    const animInterval = setInterval(() => {
      setShuffledName(getRandomName());
    }, 60);

    try {
      const [winner] = await Promise.all([
        drawWinnerApi(),
        new Promise<void>(res => setTimeout(res, 2000)),
      ]);
      clearInterval(animInterval);
      setWinners(prev => [...prev, winner]);
      setShuffledName(winner.lineDisplayName);
      refreshEligible();
    } catch (err) {
      clearInterval(animInterval);
      console.error('Failed to draw winner:', err);
      setShuffledName('READY?');
    } finally {
      setShuffling(false);
    }
  };

  const handleRedraw = async (winner: DrawWinner, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (shuffling) return;

    try {
      await cancelWinnerApi(winner.id);
      setWinners(prev => prev.filter(w => w.id !== winner.id));
      setShuffledName('READY?');
      refreshEligible();
    } catch (err) {
      console.error('Failed to cancel winner:', err);
    }
  };

  const resetDraw = async () => {
    try {
      await resetAllWinnersApi();
      setWinners([]);
      setShuffledName('READY?');
      await loadData();
    } catch (err) {
      console.error('Failed to reset draw:', err);
    }
  };

  if (isLocked) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-[#050505] text-white p-6 sm:p-10 pt-32 md:pt-40">
        <div className="glass-card p-10 md:p-24 rounded-[2rem] md:rounded-[4rem] text-center space-y-8 md:space-y-12 max-w-3xl border-white/10 shadow-2xl relative overflow-hidden animate-in zoom-in duration-500">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#E11D48]/30 to-transparent" />
          <div className="relative inline-block">
             <Gift size={80} className="mx-auto text-white opacity-20 md:size-[100px]" />
             <div className="absolute -bottom-2 -right-2 md:-bottom-4 md:-right-4 bg-[#E11D48] p-3 md:p-4 rounded-full border-2 md:border-4 border-[#050505]">
                <Lock size={18} className="text-white" />
             </div>
          </div>
          <div className="space-y-4 md:space-y-6">
            <h2 className="text-3xl md:text-5xl font-bold tracking-[0.1em] md:tracking-[0.2em]">幸運抽獎尚未開啟</h2>
            <div className="w-16 md:w-20 h-1 bg-white/20 mx-auto rounded-full" />
            <p className="text-sm md:text-xl text-gray-400 leading-relaxed max-w-xl mx-auto font-medium">
              請在「互動投票」環節結束後開啟此功能。<br className="hidden sm:block"/>
              我們將從參與投票的賓客中抽出兩位幸運兒。
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-[#050505] text-white">
        <Loader2 size={40} className="animate-spin text-[#E11D48]" />
      </div>
    );
  }

  const filledCount = winners.length;
  // Display slots: always show 2 slots
  const displaySlots: (DrawWinner | null)[] = [winners[0] ?? null, winners[1] ?? null];

  return (
    <div className="w-full h-full flex flex-col lg:flex-row items-center justify-center bg-[#050505] px-6 md:px-20 py-10 overflow-hidden pt-32 md:pt-40 lg:pt-48 gap-8">
      <div className="flex flex-col lg:flex-row gap-8 w-full max-w-7xl h-full lg:h-[600px] overflow-y-auto lg:overflow-visible no-scrollbar pb-20 lg:pb-0">

        {/* 左側：幸運得獎者列表 */}
        <div className="w-full lg:w-1/3 glass-card rounded-[2rem] md:rounded-[3.5rem] p-6 md:p-10 flex flex-col relative border-white/10 shadow-2xl flex-shrink-0">
          <div className="flex items-center justify-between mb-8 md:mb-10">
            <div className="flex flex-col">
              <h3 className="text-[#E11D48] text-xl md:text-2xl font-bold tracking-[0.2em] md:tracking-[0.3em]">幸運得獎者</h3>
              <p className="text-[9px] md:text-[10px] text-white/20 uppercase tracking-widest mt-1">You're the Lucky One</p>
            </div>
            <Star className="text-[#E11D48]/20 fill-[#E11D48]/20 size-10 md:size-[60px]" />
          </div>

          <div className="flex flex-col gap-4 md:gap-6">
            {displaySlots.map((winner, idx) => (
              <div
                key={idx}
                className={`group flex items-center gap-3 p-4 md:p-6 rounded-[1rem] md:rounded-[1.5rem] border transition-all duration-700 relative ${
                  winner
                    ? 'bg-[#E11D48]/10 border-[#E11D48]/40 shadow-lg scale-[1.02]'
                    : 'bg-white/[0.03] border-white/5 opacity-40'
                }`}
              >
                <div className={`flex-shrink-0 w-8 h-8 md:w-10 md:h-10 rounded-full border flex items-center justify-center text-sm md:text-lg font-bold transition-colors ${
                  winner ? 'bg-[#E11D48] border-[#E11D48] text-white' : 'bg-black/40 border-white/10 text-white/40'
                }`}>
                  {idx + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-lg md:text-2xl font-bold text-white break-all leading-tight">
                    {winner ? winner.lineDisplayName : '???'}
                  </div>
                </div>
                {winner && !shuffling && (
                  <button
                    onClick={(e) => handleRedraw(winner, e)}
                    className="flex-shrink-0 p-2 rounded-full bg-white/5 text-white/10 hover:text-[#E11D48] hover:bg-[#E11D48]/10 transition-all sm:opacity-0 group-hover:opacity-100"
                    title="重新抽取"
                  >
                    <RotateCcw size={16} />
                  </button>
                )}
              </div>
            ))}
          </div>

          <div className="mt-8 lg:mt-auto flex justify-end items-center pt-8 border-t border-white/5">
            {filledCount > 0 && (
              <button
                onClick={resetDraw}
                className="flex items-center gap-2 text-white/20 hover:text-white transition-colors group"
              >
                <span className="text-[10px] font-bold uppercase tracking-widest">重設全部</span>
                <RefreshCcw size={14} className="group-hover:rotate-180 transition-transform duration-700" />
              </button>
            )}
          </div>
        </div>

        {/* 右側：抽獎主要區域 */}
        <div className="flex-1 glass-card rounded-[2rem] md:rounded-[3.5rem] p-8 md:p-16 flex flex-col items-center justify-between border-white/10 shadow-2xl relative overflow-hidden min-h-[400px]">
          <div className="absolute top-0 right-0 p-10 opacity-5 pointer-events-none hidden sm:block">
            <Gift size={200} />
          </div>

          <div className="text-center relative z-10 w-full">
            <span className="text-[#E11D48] text-[10px] md:text-sm tracking-[0.4em] md:tracking-[0.6em] font-black uppercase mb-2 md:mb-4 block">Selection In Progress</span>
            <div className="h-[120px] md:h-[200px] flex items-center justify-center overflow-hidden px-4">
              <h2 className={`text-4xl sm:text-5xl md:text-7xl font-bold tracking-tighter text-white leading-tight text-center break-all w-full ${shuffling ? 'animate-pulse opacity-50' : 'animate-in zoom-in duration-500'}`}>
                {shuffledName}
              </h2>
            </div>
          </div>

          <div className="flex flex-col items-center gap-6 md:gap-10 w-full relative z-10">
            <div className="flex flex-col sm:flex-row items-center gap-4 md:gap-8">
              <div className="flex items-center gap-3 px-6 md:px-8 py-2 md:py-3 bg-black/40 border border-white/10 rounded-full">
                <Users size={14} className="text-white/40" />
                <span className="text-white/60 text-[10px] md:text-sm font-medium tracking-widest">符合抽獎人數 ‧ Total Eligible Participants : </span>
                <span className="text-[#E11D48] text-lg md:text-xl font-bold tracking-widest">{eligibleCount}</span>
              </div>
            </div>

            <button
              disabled={shuffling || eligibleCount === 0 || filledCount >= 2}
              onClick={startDraw}
              className={`w-full max-w-md py-5 md:py-8 rounded-2xl md:rounded-[2rem] font-black tracking-[0.2em] transition-all duration-500 shadow-xl relative overflow-hidden group ${
                shuffling || eligibleCount === 0 || filledCount >= 2
                  ? 'bg-white/5 text-white/20 border-white/10 cursor-not-allowed'
                  : 'bg-[#E11D48] text-white hover:scale-105 active:scale-95'
              }`}
            >
              <div className="absolute inset-0 bg-white/10 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 skew-x-12" />
              <div className="flex flex-col items-center">
                {filledCount >= 2 ? (
                  <>
                    <span className="text-2xl md:text-3xl">抽獎已結束</span>
                    <span className="text-lg md:text-xl font-bold opacity-80 mt-1">Congratulations</span>
                  </>
                ) : shuffling ? (
                  <span className="text-2xl md:text-4xl animate-pulse">抽取中...</span>
                ) : (
                  <>
                    <span className="text-2xl md:text-3xl">看看幸運兒是誰</span>
                    <span className="text-lg md:text-xl font-bold opacity-80 mt-1">Who's Lucky One</span>
                  </>
                )}
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LuckyDraw;
