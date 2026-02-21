
import React, { useState, useEffect } from 'react';
import { AppMode, Voter, MediaItem, SchemeId, VoteOption, WsMediaUpdatePayload, WsVoteCastPayload } from './types';
import WeddingWall from './components/WeddingWall';
import InteractiveVoting from './components/InteractiveVoting';
import LuckyDraw from './components/LuckyDraw';
import ControlPanel from './components/ControlPanel';
import { VOTE_OPTIONS } from './constants';
import { fetchMediaSchemes, fetchVoteOptions, createScheme, renameSchemeApi, deleteSchemeApi, setLiveSchemeApi } from './services/apiService';
import { wsService } from './services/wsService';
import { LayoutPanelLeft, Vote, Trophy, Settings, Lock, Maximize, Minimize, Volume2, VolumeX } from 'lucide-react';

const App: React.FC = () => {
  const [mode, setMode] = useState<AppMode>(AppMode.WEDDING_WALL);
  const [participants, setParticipants] = useState<Voter[]>([]);
  const [votingEnded, setVotingEnded] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [videoMuted, setVideoMuted] = useState(true);

  const [votingPhase, setVotingPhase] = useState<'SETUP' | 'ACTIVE' | 'RESULTS'>('SETUP');
  const [voteOptions, setVoteOptions] = useState<VoteOption[]>(VOTE_OPTIONS);
  const [secondsRemaining, setSecondsRemaining] = useState(0);

  const [schemeIds, setSchemeIds] = useState<SchemeId[]>([]);
  const [schemes, setSchemes] = useState<Record<SchemeId, MediaItem[]>>({});
  const [schemeNames, setSchemeNames] = useState<Record<SchemeId, string>>({});

  const [liveScheme, setLiveSchemeLocal] = useState<SchemeId>('');
  const [showWallMessages, setShowWallMessages] = useState(true);

  const [slideshowSpeed, setSlideshowSpeed] = useState(8);
  const [messageScrollSpeed, setMessageScrollSpeed] = useState(40);
  const [pinnedMediaId, setPinnedMediaId] = useState<string | null>(null);

  // 從 API 載入媒體方案
  useEffect(() => {
    fetchMediaSchemes()
      .then((data) => {
        setSchemeIds(data.schemeIds);
        setSchemes(data.schemes);
        setSchemeNames(data.schemeNames);
        if (data.liveSchemeId) {
          setLiveSchemeLocal(data.liveSchemeId);
        } else if (data.schemeIds.length > 0) {
          setLiveSchemeLocal(data.schemeIds[0]);
        }
      })
      .catch((err) => console.error('Failed to fetch media schemes:', err));
  }, []);

  // 從 API 載入投票選項
  useEffect(() => {
    fetchVoteOptions()
      .then(({ options }) => setVoteOptions(options))
      .catch((err) => console.error('Failed to fetch vote options:', err));
  }, []);

  // 連接 WebSocket
  useEffect(() => {
    wsService.connect();

    const handleMediaUpdate = (payload: WsMediaUpdatePayload) => {
      setSchemeIds(payload.schemeIds);
      setSchemes(payload.schemes);
    };

    wsService.on('media:update', handleMediaUpdate);

    return () => {
      wsService.off('media:update', handleMediaUpdate);
    };
  }, []);

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

  const addScheme = async (name: string) => {
    // Optimistic update with temp id
    const tempId = `temp-${Date.now()}`;
    setSchemeIds(prev => [...prev, tempId]);
    setSchemes(prev => ({ ...prev, [tempId]: [] }));
    setSchemeNames(prev => ({ ...prev, [tempId]: name }));

    try {
      const created = await createScheme(name);
      // Replace temp with real data
      setSchemeIds(prev => prev.map(id => id === tempId ? created.id : id));
      setSchemes(prev => {
        const next = { ...prev };
        delete next[tempId];
        next[created.id] = [];
        return next;
      });
      setSchemeNames(prev => {
        const next = { ...prev };
        delete next[tempId];
        next[created.id] = created.name;
        return next;
      });
      return created.id;
    } catch (err) {
      console.error('Failed to create scheme:', err);
      // Rollback
      setSchemeIds(prev => prev.filter(id => id !== tempId));
      setSchemes(prev => {
        const next = { ...prev };
        delete next[tempId];
        return next;
      });
      setSchemeNames(prev => {
        const next = { ...prev };
        delete next[tempId];
        return next;
      });
      return null;
    }
  };

  const renameScheme = async (oldId: SchemeId, newName: string) => {
    // Optimistic name update
    const prevName = schemeNames[oldId];
    setSchemeNames(prev => ({ ...prev, [oldId]: newName }));

    try {
      const updated = await renameSchemeApi(oldId, newName);
      // Update name from backend response
      setSchemeNames(prev => {
        const next = { ...prev };
        if (updated.id !== oldId) {
          delete next[oldId];
        }
        next[updated.id] = updated.name;
        return next;
      });
      // If backend returns a new id, update accordingly
      if (updated.id !== oldId) {
        setSchemeIds(prev => prev.map(id => id === oldId ? updated.id : id));
        setSchemes(prev => {
          const next = { ...prev };
          next[updated.id] = next[oldId];
          delete next[oldId];
          return next;
        });
        if (liveScheme === oldId) setLiveSchemeLocal(updated.id);
      }
    } catch (err) {
      console.error('Failed to rename scheme:', err);
      // Rollback name
      setSchemeNames(prev => ({ ...prev, [oldId]: prevName }));
    }
  };

  const deleteScheme = async (id: SchemeId) => {
    if (id === liveScheme) {
      alert('正在播放中的方案無法刪除');
      return;
    }
    if (schemeIds.length <= 1) {
      alert('至少需保留一個方案');
      return;
    }

    const prevSchemeIds = schemeIds;
    const prevSchemes = schemes;
    const prevSchemeNames = schemeNames;

    // Optimistic update
    setSchemeIds(prev => prev.filter(sid => sid !== id));
    setSchemes(prev => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
    setSchemeNames(prev => {
      const next = { ...prev };
      delete next[id];
      return next;
    });

    try {
      await deleteSchemeApi(id);
    } catch (err) {
      console.error('Failed to delete scheme:', err);
      setSchemeIds(prevSchemeIds);
      setSchemes(prevSchemes);
      setSchemeNames(prevSchemeNames);
    }
  };

  // API-backed setLiveScheme — no rollback; also clears per-image pin
  const setLiveScheme = async (id: SchemeId) => {
    setLiveSchemeLocal(id);
    setPinnedMediaId(null);
    try {
      await setLiveSchemeApi(id);
    } catch (err) {
      console.error('Failed to set live scheme:', err);
    }
  };

  return (
    <div className="w-screen h-screen bg-black overflow-hidden flex flex-col relative font-[CustomWeddingFont]">

      {/* 頂部自適應 Header */}
      <header className="absolute top-0 left-0 w-full z-[90] p-6 md:p-10 lg:p-12 flex flex-col md:flex-row items-center justify-between gap-6 pointer-events-none">

        {/* 標題與 Slogan */}
        <div className="flex flex-col items-center md:items-start animate-in fade-in slide-in-from-left-5 duration-700">
          <h1 style={{ fontFamily: "'ChenYuluoyanThin', cursive" }} className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-[0.1em] mb-1 text-white drop-shadow-[0_4px_12px_rgba(0,0,0,0.9)] text-center md:text-left whitespace-nowrap">
            歲月敬好 <span className="text-[#E11D48] text-2xl sm:text-3xl md:text-4xl mx-1 md:mx-2">Ｘ</span> 共度玗生
          </h1>
          <p style={{ fontFamily: "'ChenYuluoyanThin', cursive" }} className="text-[10px] sm:text-xs tracking-[0.3em] md:tracking-[0.4em] text-white/60 uppercase text-center md:text-left">
            CHING & YU WEDDING CELEBRATION
          </p>
        </div>

        {/* 導覽列 */}
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
        {/* WeddingWall 永遠掛載，切換標籤時留言持續滾動 */}
        <WeddingWall
          mediaList={schemes[liveScheme] || []}
          showWallMessages={showWallMessages}
          pinnedMediaId={pinnedMediaId}
          slideshowSpeed={slideshowSpeed}
          messageScrollSpeed={messageScrollSpeed}
          isActiveMode={mode === AppMode.WEDDING_WALL}
          videoMuted={videoMuted}
        />
        {/* 其他模式蓋在 WeddingWall 上面 */}
        {mode === AppMode.VOTING && (
          <div className="absolute inset-0 z-50">
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
          </div>
        )}
        {mode === AppMode.LUCKY_DRAW && (
          <div className="absolute inset-0 z-50">
            <LuckyDraw isLocked={!votingEnded} />
          </div>
        )}
        {mode === AppMode.CONTROL && (
          <div className="absolute inset-0 z-50">
            <ControlPanel
              schemeIds={schemeIds}
              schemes={schemes}
              schemeNames={schemeNames}
              addScheme={addScheme}
              renameScheme={renameScheme}
              deleteScheme={deleteScheme}
              updateSchemeMedia={updateSchemeMedia}
              liveScheme={liveScheme}
              setLiveScheme={setLiveScheme}
              showWallMessages={showWallMessages}
              setShowWallMessages={setShowWallMessages}
              pinnedMediaId={pinnedMediaId}
              setPinnedMediaId={setPinnedMediaId}
              slideshowSpeed={slideshowSpeed}
              setSlideshowSpeed={setSlideshowSpeed}
              messageScrollSpeed={messageScrollSpeed}
              setMessageScrollSpeed={setMessageScrollSpeed}
            />
          </div>
        )}
      </main>

      {/* 右下角控制按鈕群組（靜音 + 全螢幕） */}
      <div className="absolute bottom-6 right-6 md:bottom-12 md:right-12 z-[90] flex flex-col items-center gap-3">
        {(schemes[liveScheme] || []).some(m => m.type === 'video' && m.visible) && (
          <button
            onClick={() => setVideoMuted(prev => !prev)}
            className="glass-card w-12 h-12 md:w-14 md:h-14 rounded-full border-white/10 text-white/60 hover:text-white hover:bg-white/10 transition-all active:scale-90 flex items-center justify-center shadow-2xl"
            title={videoMuted ? '開啟聲音' : '關閉聲音'}
          >
            {videoMuted
              ? <VolumeX size={20} className="md:size-[22px]" />
              : <Volume2 size={20} className="md:size-[22px]" />
            }
          </button>
        )}
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
