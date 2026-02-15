
import React, { useState, useEffect, useMemo } from 'react';
import { Minus, Plus, QrCode, Timer as TimerIcon, CheckCircle2, X } from 'lucide-react';
import { MOCK_GUESTS } from '../constants';
import { VoteOption, Voter } from '../types';

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
  const [activePopup, setActivePopup] = useState<'step1' | 'step2' | null>(null);
  
  useEffect(() => {
    let timer: number;
    if (phase === 'ACTIVE' && secondsRemaining > 0) {
      timer = window.setInterval(() => {
        setSecondsRemaining((prev) => prev - 1);
        if (Math.random() > 0.4) {
          const randomIdx = Math.floor(Math.random() * options.length);
          const randomGuest = MOCK_GUESTS[Math.floor(Math.random() * MOCK_GUESTS.length)];
          setOptions(prev => prev.map((opt, i) => i === randomIdx ? { ...opt, count: opt.count + 1 } : opt));
          setParticipants(prev => [...prev, { id: Math.random().toString(), name: randomGuest, choice: options[randomIdx].label }]);
        }
      }, 1000);
    } else if (phase === 'ACTIVE' && secondsRemaining === 0) {
      setPhase('RESULTS');
      onVotingEnd(participants);
    }
    return () => clearInterval(timer);
  }, [phase, secondsRemaining, options.length, setOptions, setParticipants, setPhase, onVotingEnd, participants]);

  const startVoting = () => {
    setOptions(options.map(o => ({ ...o, count: 0 })));
    setParticipants([]);
    setSecondsRemaining(setupTime * 60);
    setPhase('ACTIVE');
  };

  const totalVotes = options.reduce((acc, opt) => acc + opt.count, 0);
  const formatTime = (s: number) => `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;

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
          <div className={`text-center transition-all duration-500 ${activePopup ? 'opacity-10 blur-md scale-90' : 'opacity-100'}`}>
            <div className="flex flex-col gap-2">
              <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-white tracking-[0.1em] md:tracking-[0.2em] leading-relaxed">
                猜猜看新娘下一套禮服的顏色？
              </h2>
              <p className="text-xs md:text-sm text-white/60 tracking-[0.1em] md:tracking-[0.2em] uppercase font-medium">
                Let’s guess the color of the bride’s next dress
              </p>
            </div>
            <div className="w-16 md:w-20 h-1 bg-[#E11D48] mx-auto mt-4 rounded-full" />
          </div>
          
          <div className={`flex flex-wrap justify-center gap-6 md:gap-10 transition-all duration-500 ${activePopup ? 'opacity-10 blur-md scale-90' : 'opacity-100'}`}>
             <InstructionCard step="01" label="Scan QR Code" onClick={() => setActivePopup('step1')} icon={<QrCode className="size-10 md:size-[60px]" />} />
             <InstructionCard step="02" label="Submit Choice" onClick={() => setActivePopup('step2')} icon={<TimerIcon className="size-10 md:size-[60px]" />} isPrimary />
          </div>

          <div className={`transition-all duration-700 ${activePopup ? 'opacity-0 scale-75 translate-y-10' : 'opacity-100'}`}>
             <div className="glass-card px-8 md:px-12 py-4 md:py-6 rounded-[1.5rem] md:rounded-[2.5rem] flex flex-col items-center bg-black/40 backdrop-blur-2xl border-white/10 relative overflow-hidden min-w-[280px] md:min-w-[360px]">
                <span className="text-[#E11D48] text-[8px] md:text-[9px] tracking-[0.3em] md:tracking-[0.5em] uppercase font-black mb-1">Live Remaining Time</span>
                <div className="text-5xl md:text-[6rem] font-bold font-mono text-white leading-none tracking-tighter">
                  {formatTime(secondsRemaining)}
                </div>
                <div className="absolute bottom-0 left-0 h-1 bg-[#E11D48]" style={{ width: `${progress}%`, transition: 'width 1s linear' }} />
             </div>
          </div>
        </div>
        
        {/* Popup Overlay */}
        {activePopup && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-xl animate-in fade-in duration-500 p-6" onClick={() => setActivePopup(null)}>
            <div className="glass-card rounded-[2rem] md:rounded-[3.5rem] p-8 md:p-12 flex flex-col items-center gap-6 md:gap-8 max-w-xl w-full border-white/10 shadow-2xl animate-in zoom-in duration-300 relative" onClick={e => e.stopPropagation()}>
               <button onClick={() => setActivePopup(null)} className="absolute top-6 right-6 md:top-8 md:right-8 text-white/40 hover:text-[#E11D48] transition-colors">
                 <X size={24} md:size={32} />
               </button>
               
               <h3 className="text-xl md:text-3xl font-bold text-white tracking-[0.1em] md:tracking-widest uppercase text-center">{activePopup === 'step1' ? '掃描 QR Code 進入投票' : '選擇顏色並送出'}</h3>
               <div className="bg-white p-6 md:p-10 rounded-[1.5rem] md:rounded-[2.5rem] shadow-xl transform transition-transform duration-500 hover:scale-105">
                 {activePopup === 'step1' ? <QrCode className="size-48 md:size-[280px]" color="#000" /> : <TimerIcon className="size-48 md:size-[280px] animate-pulse" color="#E11D48" />}
               </div>
               
               <div className="flex flex-col items-center gap-3">
                 <p className="text-white/40 text-[10px] md:text-sm tracking-[0.2em] md:tracking-[0.3em] font-medium uppercase">
                   {activePopup === 'step1' ? 'Step 01: Scan with Camera' : 'Step 02: Pick your favorite'}
                 </p>
                 <div className="h-1 w-10 md:w-12 bg-[#E11D48]/30 rounded-full" />
               </div>
            </div>

            {/* Popup 內部的右下角小計時器 - 響應式調整 */}
            <div className="absolute bottom-6 right-6 md:bottom-12 md:right-12 z-[110] animate-in slide-in-from-bottom-10 duration-700 hidden sm:block">
               <div className="glass-card px-6 md:px-10 py-4 md:py-7 rounded-[1.5rem] md:rounded-[2.5rem] border-[#E11D48]/50 rose-gold-glow flex flex-col items-center min-w-[200px] md:min-w-[280px] overflow-hidden bg-black/80 backdrop-blur-3xl shadow-2xl">
                  <span className="text-[#E11D48] text-[8px] md:text-[10px] tracking-[0.3em] md:tracking-[0.5em] uppercase font-black mb-1 md:mb-2">Time Remaining</span>
                  <div className="text-4xl md:text-6xl font-bold font-mono text-white tracking-tighter">
                    {formatTime(secondsRemaining)}
                  </div>
                  <div className="w-full h-1 md:h-1.5 bg-white/10 mt-3 md:mt-5 rounded-full overflow-hidden">
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
          const perc = totalVotes === 0 ? 0 : Math.round((opt.count / totalVotes) * 100);
          return (
            <div key={opt.id} className="glass-card px-6 md:px-10 py-6 md:py-8 rounded-[1.5rem] md:rounded-[2.5rem] flex items-center justify-between relative overflow-hidden group hover:bg-white/[0.08] transition-all border-white/5">
              <div className="absolute bottom-0 left-0 h-1.5 transition-all duration-[1.5s] ease-out" style={{ backgroundColor: opt.color, width: `${perc}%`, boxShadow: `0 0 15px ${opt.color}` }} />
              <div className="flex flex-col">
                <span className="text-2xl md:text-4xl font-black text-[#E11D48] opacity-80 group-hover:opacity-100 transition-opacity mb-1">{opt.id}</span>
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

const InstructionCard = ({ step, label, onClick, icon, isPrimary }: any) => (
  <button onClick={onClick} className={`w-[140px] md:w-[220px] aspect-[9/12] rounded-[1.5rem] md:rounded-[3rem] border-2 md:border-4 transition-all flex flex-col items-center justify-center gap-4 md:gap-6 group ${isPrimary ? 'border-[#E11D48] shadow-lg bg-[#E11D48]/5' : 'border-white/10 hover:border-white/30 hover:bg-white/5'}`}>
    <div className={`p-4 md:p-6 rounded-[1rem] md:rounded-[1.5rem] transition-transform duration-500 group-hover:scale-110 ${isPrimary ? 'bg-[#E11D48] text-white' : 'bg-white text-black'}`}>{icon}</div>
    <div className="text-center px-2">
      <span className="text-xs md:text-xl font-black text-white tracking-widest">STEP {step}</span>
      <div className="h-0.5 md:h-1 w-6 md:w-8 bg-[#E11D48]/40 mx-auto my-1 md:my-2 rounded-full" />
      <span className="text-[8px] md:text-[9px] text-[#E11D48] font-bold uppercase tracking-[0.1em]">{label}</span>
    </div>
  </button>
);

export default InteractiveVoting;
