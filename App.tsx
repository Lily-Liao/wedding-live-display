
import React, { useState, useEffect } from 'react';
import { AppMode, Voter, MediaItem, SchemeId, VoteOption } from './types';
import WeddingWall from './components/WeddingWall';
import InteractiveVoting from './components/InteractiveVoting';
import LuckyDraw from './components/LuckyDraw';
import ControlPanel from './components/ControlPanel';
import { WEDDING_IMAGES, VOTE_OPTIONS } from './constants';
import { LayoutPanelLeft, Vote, Trophy, Settings, Lock, Maximize, Minimize } from 'lucide-react';

const App: React.FC = () => {
  const [mode, setMode] = useState<AppMode>(AppMode.WEDDING_WALL);
  const [participants, setParticipants] = useState<Voter[]>([]);
  const [votingEnded, setVotingEnded] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  const [votingPhase, setVotingPhase] = useState<'SETUP' | 'ACTIVE' | 'RESULTS'>('SETUP');
  const [voteOptions, setVoteOptions] = useState<VoteOption[]>(VOTE_OPTIONS);
  const [secondsRemaining, setSecondsRemaining] = useState(0);

  const [schemeIds, setSchemeIds] = useState<SchemeId[]>(['A', 'B', 'C']);
  const [schemes, setSchemes] = useState<Record<SchemeId, MediaItem[]>>({
    A: WEDDING_IMAGES.slice(0, 15).map((url, i) => ({ id: `A-${i}`, url, type: 'image', visible: true })),
    B: WEDDING_IMAGES.slice(15, 30).map((url, i) => ({ id: `B-${i}`, url, type: 'image', visible: true })),
    C: WEDDING_IMAGES.slice(30, 45).map((url, i) => ({ id: `C-${i}`, url, type: 'image', visible: true })),
  });
  
  const [liveScheme, setLiveScheme] = useState<SchemeId>('A');
  const [showWallMessages, setShowWallMessages] = useState(true);
  
  const [pinnedMediaIds, setPinnedMediaIds] = useState<Record<SchemeId, string | null>>({
    A: null,
    B: null,
    C: null
  });

  const [slideshowSpeed, setSlideshowSpeed] = useState(8);
  const [messageScrollSpeed, setMessageScrollSpeed] = useState(40);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => {
        console.error(`Error attempting to enable full-screen mode: ${err.message}`);
      });
    } else {
      document.exitFullscreen();
    }
  };

  const handleVotingEnd = (voters: Voter[]) => {
    setParticipants(voters);
    setVotingEnded(true);
  };

  const updateSchemeMedia = (id: SchemeId, newList: MediaItem[]) => {
    setSchemes(prev => ({ ...prev, [id]: newList }));
  };

  const addScheme = (name: string) => {
    if (schemeIds.includes(name)) {
      alert('方案名稱已存在');
      return;
    }
    setSchemeIds(prev => [...prev, name]);
    setSchemes(prev => ({ ...prev, [name]: [] }));
    setPinnedMediaIds(prev => ({ ...prev, [name]: null }));
  };

  const renameScheme = (oldId: SchemeId, newId: SchemeId) => {
    if (oldId === newId) return;
    if (schemeIds.includes(newId)) {
      alert('方案名稱已存在');
      return;
    }

    setSchemeIds(prev => prev.map(id => id === oldId ? newId : id));
    setSchemes(prev => {
      const next = { ...prev };
      next[newId] = next[oldId];
      delete next[oldId];
      return next;
    });
    setPinnedMediaIds(prev => {
      const next = { ...prev };
      next[newId] = next[oldId];
      delete next[oldId];
      return next;
    });
    if (liveScheme === oldId) setLiveScheme(newId);
  };

  const deleteScheme = (id: SchemeId) => {
    if (id === liveScheme) {
      alert('正在播放中的方案無法刪除');
      return;
    }
    if (schemeIds.length <= 1) {
      alert('至少需保留一個方案');
      return;
    }

    setSchemeIds(prev => prev.filter(sid => sid !== id));
    setSchemes(prev => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
    setPinnedMediaIds(prev => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  };

  const setPinnedMediaIdForScheme = (schemeId: SchemeId, mediaId: string | null) => {
    setPinnedMediaIds(prev => ({ ...prev, [schemeId]: mediaId }));
  };

  return (
    <div className="w-screen h-screen bg-black overflow-hidden flex flex-col relative font-[CustomWeddingFont]">
      
      {/* 頂部自適應 Header */}
      <header className="absolute top-0 left-0 w-full z-[90] p-6 md:p-10 lg:p-12 flex flex-col md:flex-row items-center justify-between gap-6 pointer-events-none">
        
        {/* 標題與 Slogan */}
        <div className="flex flex-col items-center md:items-start animate-in fade-in slide-in-from-left-5 duration-700">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-[0.1em] mb-1 text-white drop-shadow-[0_4px_12px_rgba(0,0,0,0.9)] text-center md:text-left whitespace-nowrap">
            歲月敬好 <span className="text-[#E11D48] text-2xl sm:text-3xl md:text-4xl mx-1 md:mx-2">Ｘ</span> 共度玗生
          </h1>
          <p className="text-[10px] sm:text-xs tracking-[0.3em] md:tracking-[0.4em] text-white/60 uppercase text-center md:text-left">
            CHING & YU WEDDING CELEBRATION
          </p>
        </div>

        {/* 導覽列 (改為 pointer-events-auto 以便點擊) */}
        <nav className="pointer-events-auto">
          <div className="glass-card p-1 sm:p-1.5 rounded-full flex gap-1 bg-black/40 border-white/10 backdrop-blur-3xl shadow-2xl overflow-x-auto max-w-[90vw] no-scrollbar">
            <NavButton 
              active={mode === AppMode.WEDDING_WALL} 
              onClick={() => setMode(AppMode.WEDDING_WALL)}
              icon={<LayoutPanelLeft size={16} />}
              label="應援牆"
            />
            <NavButton 
              active={mode === AppMode.VOTING} 
              onClick={() => setMode(AppMode.VOTING)}
              icon={<Vote size={16} />}
              label="互動投票"
            />
            <NavButton 
              active={mode === AppMode.LUCKY_DRAW} 
              onClick={() => setMode(AppMode.LUCKY_DRAW)}
              icon={!votingEnded ? <Lock size={14} /> : <Trophy size={16} />}
              label="幸運抽獎"
              disabled={!votingEnded && mode !== AppMode.LUCKY_DRAW}
              isLocked={!votingEnded}
            />
            <NavButton 
              active={mode === AppMode.CONTROL} 
              onClick={() => setMode(AppMode.CONTROL)}
              icon={<Settings size={16} />}
              label="系統控制"
            />
          </div>
        </nav>
      </header>

      {/* 主要內容區域 */}
      <main className="flex-grow relative h-full">
        {mode === AppMode.WEDDING_WALL && (
          <WeddingWall 
            mediaList={schemes[liveScheme] || []} 
            showWallMessages={showWallMessages} 
            pinnedMediaId={pinnedMediaIds[liveScheme]} 
            slideshowSpeed={slideshowSpeed}
            messageScrollSpeed={messageScrollSpeed}
          />
        )}
        {mode === AppMode.VOTING && (
          <InteractiveVoting 
            onVotingEnd={handleVotingEnd} 
            phase={votingPhase}
            setPhase={setVotingPhase}
            options={voteOptions}
            setOptions={setVoteOptions}
            secondsRemaining={secondsRemaining}
            setSecondsRemaining={setSecondsRemaining}
            participants={participants}
            setParticipants={setParticipants}
          />
        )}
        {mode === AppMode.LUCKY_DRAW && <LuckyDraw participants={participants} isLocked={!votingEnded} />}
        {mode === AppMode.CONTROL && (
          <ControlPanel 
            schemeIds={schemeIds}
            schemes={schemes}
            addScheme={addScheme}
            renameScheme={renameScheme}
            deleteScheme={deleteScheme}
            updateSchemeMedia={updateSchemeMedia}
            liveScheme={liveScheme}
            setLiveScheme={setLiveScheme}
            showWallMessages={showWallMessages}
            setShowWallMessages={setShowWallMessages}
            pinnedMediaIds={pinnedMediaIds}
            setPinnedMediaIdForScheme={setPinnedMediaIdForScheme}
            slideshowSpeed={slideshowSpeed}
            setSlideshowSpeed={setSlideshowSpeed}
            messageScrollSpeed={messageScrollSpeed}
            setMessageScrollSpeed={setMessageScrollSpeed}
          />
        )}
      </main>

      {/* 右下角全螢幕按鈕 */}
      <div className="absolute bottom-6 right-6 md:bottom-12 md:right-12 z-[90] flex flex-col items-end gap-3">
        <button
          onClick={toggleFullscreen}
          className={`glass-card w-12 h-12 md:w-14 md:h-14 rounded-full border-white/10 text-white/60 hover:text-white hover:bg-[#E11D48]/20 hover:border-[#E11D48]/50 transition-all active:scale-90 flex items-center justify-center shadow-2xl group ${
            isFullscreen ? 'text-[#E11D48] border-[#E11D48] shadow-[0_0_20px_rgba(225,29,72,0.4)]' : ''
          }`}
          title={isFullscreen ? "退出全螢幕" : "進入全螢幕投影模式"}
        >
          {isFullscreen ? (
            <Minimize size={20} className="md:size-[24px] group-hover:scale-110 transition-transform" />
          ) : (
            <Maximize size={20} className="md:size-[24px] group-hover:scale-110 transition-transform" />
          )}
        </button>
      </div>

      <div className="absolute bottom-4 left-0 w-full flex justify-center text-white/5 text-[8px] md:text-[10px] tracking-[0.5em] uppercase pointer-events-none">
        CHING & YU WEDDING SYSTEM © 2024
      </div>
    </div>
  );
};

interface NavButtonProps {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  disabled?: boolean;
  isLocked?: boolean;
}

const NavButton: React.FC<NavButtonProps> = ({ active, onClick, icon, label, disabled, isLocked }) => {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 md:px-6 py-1.5 sm:py-2 md:py-2.5 rounded-full transition-all duration-500 group border whitespace-nowrap ${
        active 
          ? 'bg-[#E11D48] border-[#E11D48] text-white shadow-[0_0_20px_rgba(225,29,72,0.4)] scale-105' 
          : isLocked 
            ? 'opacity-60 cursor-not-allowed text-gray-500 border-white/10 bg-white/5' 
            : 'text-white/40 border-transparent hover:bg-white/10 hover:text-white'
      }`}
    >
      <span className={`${active ? 'scale-110' : 'group-hover:rotate-12'} transition-transform shrink-0`}>{icon}</span>
      <span className="font-bold tracking-[0.1em] md:tracking-[0.2em] text-[10px] md:text-xs uppercase">{label}</span>
    </button>
  );
};

export default App;
