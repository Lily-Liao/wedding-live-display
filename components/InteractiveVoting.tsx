
import React, { useState, useEffect, useMemo } from 'react';
import { Minus, Plus, CheckCircle2, X } from 'lucide-react';
import { VoteOption, Voter } from '../types';
import { updateVotingSessionStatus, fetchVoteOptions } from '../services/apiService';

interface Props {
  onVotingEnd: (voters: Voter[]) => void;
  phase: 'SETUP' | 'ACTIVE' | 'RESULTS';
  setPhase: (p: 'SETUP' | 'ACTIVE' | 'RESULTS') => void;
  options: VoteOption[];
  setOptions: React.Dispatch<React.SetStateAction<VoteOption[]>>;
  secondsRemaining: number;
  setSecondsRemaining: React.Dispatch<React.SetStateAction<number>>;
  participants: Voter[];
  setParticipants: React.Dispatch<React.SetStateAction<Voter[]>>;
}

const InteractiveVoting: React.FC<Props> = ({
  onVotingEnd, phase, setPhase, options, setOptions,
  secondsRemaining, setSecondsRemaining, participants, setParticipants
}) => {
  const [setupTime, setSetupTime] = useState(10);
  const [activePopup, setActivePopup] = useState<number | null>(null); // 0=step1, 1=step2, 2=step3

  // 倒數計時
  useEffect(() => {
    let timer: number;
    if (phase === 'ACTIVE' && secondsRemaining > 0) {
      timer = window.setInterval(() => {
        setSecondsRemaining((prev) => prev - 1);
      }, 1000);
    } else if (phase === 'ACTIVE' && secondsRemaining === 0) {
      updateVotingSessionStatus('CLOSED').catch(err => {
        console.error('Failed to close voting session:', err);
      });
      setPhase('RESULTS');
      onVotingEnd(participants);
    }
    return () => clearInterval(timer);
  }, [phase, secondsRemaining, setSecondsRemaining, setPhase, onVotingEnd, participants]);

  // 進入結果階段時，從 API 取得最終投票數據
  useEffect(() => {
    if (phase !== 'RESULTS') return;
    fetchVoteOptions()
      .then(({ options: apiOptions }) => setOptions(apiOptions))
      .catch(err => console.error('Failed to fetch vote results:', err));
  }, [phase]);


  const startVoting = async () => {
    try {
      await updateVotingSessionStatus('START');
    } catch (err) {
      console.error('Failed to start voting session:', err);
      return;
    }
    setOptions(options.map(o => ({ ...o, count: 0, percentage: 0 })));
    setParticipants([]);
    setSecondsRemaining(setupTime * 60);
    setPhase('ACTIVE');
  };

  const totalVotes = options.reduce((acc, opt) => acc + opt.count, 0);
  const formatTime = (s: number) => `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;

  const STEP_IMAGES = [
    'https://img.wedding.kenny.work/schemes/e1cdc9f8-d2c1-47a5-acd2-a45ed345aa55/bc82e910-53a9-4434-9a08-c9525ab86f09/step1.jpg',
    'https://img.wedding.kenny.work/schemes/e1cdc9f8-d2c1-47a5-acd2-a45ed345aa55/0cd245c7-1754-4dff-8f77-9efd5b316d43/step2.jpg',
    'https://img.wedding.kenny.work/schemes/e1cdc9f8-d2c1-47a5-acd2-a45ed345aa55/dd0c18f8-1ca3-4da0-bb3b-f0e022cb1f65/step3.jpg',
  ];

  if (phase === 'SETUP') {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-black pt-32 md:pt-40 lg:pt-48 pb-20 overflow-hidden px-6">
        <div className="glass-card p-8 md:p-12 rounded-[2rem] md:rounded-[3.5rem] w-full max-w-3xl flex flex-col items-center gap-8 md:gap-10 border-white/5 shadow-2xl scale-95 origin-center">
          <div className="text-center">
            <h2 className="text-3xl sm:text-4xl md:text-6xl font-black text-white uppercase tracking-widest mb-2">VOTING MODE ON</h2>
            <div className="w-12 h-1 bg-[#E11D48] mx-auto rounded-full" />
          </div>

          <div className="flex flex-col items-center gap-6 bg-white/5 p-6 md:p-10 rounded-[1.5rem] md:rounded-[2.5rem] w-full max-w-md border border-white/5">
            <span className="text-white/40 text-[9px] md:text-[10px] font-bold uppercase tracking-[0.2em] md:tracking-[0.3em]">Voting Time (min)</span>
            <div className="flex items-center gap-6 md:gap-10">
              <button
                onClick={() => setSetupTime(p => Math.max(1, p - 1))}
                className="w-12 h-12 md:w-16 md:h-16 rounded-full border-2 border-white/10 flex items-center justify-center text-xl md:text-2xl hover:bg-[#E11D48] transition-all"
              >
                <Minus size={20} />
              </button>
              <div className="flex flex-col items-center">
                <span className="text-6xl md:text-8xl font-bold text-white leading-none">{setupTime}</span>
              </div>
              <button
                onClick={() => setSetupTime(p => Math.min(15, p + 1))}
                className="w-12 h-12 md:w-16 md:h-16 rounded-full border-2 border-white/10 flex items-center justify-center text-xl md:text-2xl hover:bg-[#E11D48] transition-all"
              >
                <Plus size={20} />
              </button>
            </div>
          </div>

          <button onClick={startVoting} className="bg-[#E11D48] text-white py-4 md:py-6 px-16 md:px-24 rounded-2xl md:rounded-[2rem] text-2xl md:text-4xl font-black hover:scale-105 transition-transform shadow-lg tracking-[0.2em] md:tracking-widest">
            START
          </button>
        </div>
      </div>
    );
  }

  if (phase === 'ACTIVE') {
    const totalSetupSeconds = setupTime * 60;
    const progress = (secondsRemaining / totalSetupSeconds) * 100;

    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-black px-6 pt-32 md:pt-40 lg:pt-48 pb-20 overflow-hidden">
        <div className="w-full flex flex-col items-center gap-8 md:gap-10 max-w-5xl">
          <div className={`text-center opacity-100 transition-all duration-500 ${activePopup !== null ? 'opacity-10 blur-sm' : ''}`}>
            <div className="flex flex-col gap-2">
              <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-white tracking-[0.1em] md:tracking-[0.2em] leading-relaxed">
                猜猜看新娘下一套禮服的顏色？
              </h2>
              <p className="text-xs md:text-sm text-white/60 tracking-[0.1em] md:tracking-[0.2em] uppercase font-medium">
                Let's guess the color of the bride's next dress
              </p>
            </div>
            <div className="w-16 md:w-20 h-1 bg-[#E11D48] mx-auto mt-4 rounded-full" />
          </div>

          <div className={`flex flex-wrap justify-center gap-5 md:gap-8 transition-all duration-500 ${activePopup !== null ? 'opacity-10 blur-sm scale-95 pointer-events-none' : ''}`}>
            <InstructionCard step="1" imageUrl={STEP_IMAGES[0]} onClick={() => setActivePopup(0)} />
            <InstructionCard step="2" imageUrl={STEP_IMAGES[1]} isPrimary onClick={() => setActivePopup(1)} />
            <InstructionCard step="3" imageUrl={STEP_IMAGES[2]} onClick={() => setActivePopup(2)} />
          </div>

          <div className={`transition-all duration-500 ${activePopup !== null ? 'opacity-10 blur-sm' : ''}`}>
             <div className="glass-card px-8 md:px-12 py-4 md:py-6 rounded-[1.5rem] md:rounded-[2.5rem] flex flex-col items-center bg-black/40 backdrop-blur-2xl border-white/10 relative overflow-hidden min-w-[280px] md:min-w-[360px]">
                <span className="text-[#E11D48] text-[8px] md:text-[9px] tracking-[0.3em] md:tracking-[0.5em] uppercase font-black mb-1">Live Remaining Time</span>
                <div className="text-5xl md:text-[6rem] font-bold font-mono text-white leading-none tracking-tighter">
                  {formatTime(secondsRemaining)}
                </div>
                <div className="absolute bottom-0 left-0 h-1 bg-[#E11D48]" style={{ width: `${progress}%`, transition: 'width 1s linear' }} />
             </div>
          </div>
        </div>

        {/* Popup: enlarged step image */}
        {activePopup !== null && (
          <div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-xl animate-in fade-in duration-300 p-6"
            onClick={() => setActivePopup(null)}
          >
            <div
              className="relative flex flex-col items-center gap-4 animate-in zoom-in duration-300"
              onClick={e => e.stopPropagation()}
            >
              <button
                onClick={() => setActivePopup(null)}
                className="absolute -top-3 -right-3 z-10 w-10 h-10 rounded-full bg-black/80 border border-white/20 flex items-center justify-center text-white/60 hover:text-[#E11D48] hover:border-[#E11D48]/50 transition-colors"
              >
                <X size={18} />
              </button>
              <img
                src={STEP_IMAGES[activePopup]}
                alt={`Step ${activePopup + 1}`}
                className="max-h-[72vh] max-w-[85vw] object-contain rounded-[1.5rem] shadow-2xl"
              />
              <span className="text-white/40 text-[10px] font-black tracking-[0.5em] uppercase">STEP {activePopup + 1}</span>
            </div>

            {/* Countdown timer in bottom-right */}
            <div className="absolute bottom-6 right-6 md:bottom-12 md:right-12 z-[110] animate-in slide-in-from-bottom-5 duration-500">
              <div className="glass-card px-6 md:px-10 py-4 md:py-6 rounded-[1.5rem] md:rounded-[2.5rem] border-[#E11D48]/50 rose-gold-glow flex flex-col items-center min-w-[200px] md:min-w-[280px] overflow-hidden bg-black/80 backdrop-blur-3xl shadow-2xl">
                <span className="text-[#E11D48] text-[8px] md:text-[10px] tracking-[0.3em] md:tracking-[0.5em] uppercase font-black mb-1 md:mb-2">Time Remaining</span>
                <div className="text-4xl md:text-6xl font-bold font-mono text-white tracking-tighter">
                  {formatTime(secondsRemaining)}
                </div>
                <div className="w-full h-1 bg-white/10 mt-3 rounded-full overflow-hidden">
                  <div className="h-full bg-[#E11D48] transition-all duration-1000 ease-linear shadow-[0_0_15px_#E11D48]" style={{ width: `${progress}%` }} />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col items-center bg-black px-6 pt-32 md:pt-40 lg:pt-48 pb-20 overflow-y-auto custom-scrollbar">
      <div className="text-center mb-8 md:mb-12">
        <div className="flex flex-col gap-2">
          <h2 className="text-2xl md:text-4xl font-bold text-white tracking-[0.2em] md:tracking-[0.3em]">大家的選擇是…</h2>
          <p className="text-xs md:text-lg text-white/40 tracking-[0.3em] uppercase font-bold">Your Choice Is…</p>
        </div>
        <div className="w-16 md:w-24 h-1 bg-[#E11D48] mx-auto mt-4 rounded-full" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 w-full max-w-5xl items-start mb-16">
        {options.map((opt) => {
          const perc = opt.percentage != null ? Math.round(opt.percentage) : (totalVotes === 0 ? 0 : Math.round((opt.count / totalVotes) * 100));
          return (
            <div key={opt.key} className="glass-card px-6 md:px-10 py-6 md:py-8 rounded-[1.5rem] md:rounded-[2.5rem] flex items-center justify-between relative overflow-hidden group hover:bg-white/[0.08] transition-all border-white/5">
              <div className="absolute bottom-0 left-0 h-1.5 transition-all duration-[1.5s] ease-out" style={{ backgroundColor: opt.color, width: `${perc}%`, boxShadow: `0 0 15px ${opt.color}` }} />
              <div className="flex flex-col">
                <span className="text-2xl md:text-4xl font-black text-[#E11D48] opacity-80 group-hover:opacity-100 transition-opacity mb-1">{opt.key}</span>
                <span className="text-base md:text-xl font-bold text-white tracking-widest">{opt.label}</span>
              </div>
              <div className="flex flex-col items-end">
                <div className="text-4xl md:text-6xl font-black text-white font-mono tracking-tighter leading-none">{perc}%</div>
                <div className="text-white/40 text-[10px] md:text-sm font-bold mt-2 tracking-widest uppercase">{opt.count} votes</div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex flex-col items-center gap-6 pb-12">
          <div className="flex items-center gap-4 px-6 md:px-10 py-3 md:py-5 bg-[#E11D48]/10 border border-[#E11D48]/20 rounded-full">
            <CheckCircle2 className="text-[#E11D48] size-6 md:size-[28px]" />
            <span className="text-[#E11D48] text-sm md:text-xl font-black tracking-[0.2em] md:tracking-[0.4em] uppercase">VOTING CLOSED · 投票已截止</span>
          </div>
          <p className="text-white/20 text-[8px] md:text-[10px] font-bold tracking-[0.4em] md:tracking-[0.5em] uppercase">CHING & YU WEDDING CELEBRATION</p>
      </div>
    </div>
  );
};

const InstructionCard = ({ step, imageUrl, isPrimary, onClick }: { step: string; imageUrl: string; isPrimary?: boolean; onClick: () => void }) => (
  <button
    onClick={onClick}
    className={`w-[155px] md:w-[235px] rounded-[1.5rem] md:rounded-[2.5rem] border-2 overflow-hidden flex flex-col transition-all duration-300 hover:scale-[1.04] hover:shadow-2xl active:scale-95 ${isPrimary ? 'border-[#E11D48] shadow-[0_0_24px_rgba(225,29,72,0.35)]' : 'border-white/15 hover:border-white/35'}`}
  >
    <img
      src={imageUrl}
      alt={`Step ${step}`}
      className="w-full aspect-[3/4] object-cover"
      style={{ imageRendering: 'auto' }}
    />
    <div className="py-2 flex items-center justify-center bg-black/80">
      <span className="text-[9px] md:text-[11px] font-black text-white tracking-[0.25em] uppercase">STEP {step}</span>
    </div>
  </button>
);

export default InteractiveVoting;