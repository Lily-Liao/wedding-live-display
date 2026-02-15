
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { QrCode, Heart } from 'lucide-react';
import { INITIAL_MESSAGES, ROSE_GOLD, MOCK_GUESTS } from '../constants';
import { GuestMessage, MediaItem } from '../types';
import { generateRomanticWish } from '../services/geminiService';

interface Props {
  mediaList: MediaItem[];
  showWallMessages: boolean;
  pinnedMediaId: string | null;
  slideshowSpeed: number;
  messageScrollSpeed: number;
}

const WeddingWall: React.FC<Props> = ({ mediaList, showWallMessages, pinnedMediaId, slideshowSpeed, messageScrollSpeed }) => {
  const [messages, setMessages] = useState<GuestMessage[]>(INITIAL_MESSAGES);
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0);
  
  // 雙層渲染狀態
  const [bottomMedia, setBottomMedia] = useState<MediaItem | null>(null);
  const [topMedia, setTopMedia] = useState<MediaItem | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const visibleMedia = useMemo(() => mediaList.filter(m => m.visible), [mediaList]);
  
  const currentMedia = useMemo(() => {
    if (pinnedMediaId) {
      return mediaList.find(m => m.id === pinnedMediaId) || null;
    }
    return visibleMedia.length > 0 ? visibleMedia[currentMediaIndex] : null;
  }, [pinnedMediaId, mediaList, visibleMedia, currentMediaIndex]);

  const transitionTimeout = useRef<number | null>(null);
  const slideshowTimeout = useRef<number | null>(null);

  const nextMedia = () => {
    if (pinnedMediaId || visibleMedia.length <= 1) return;
    setCurrentMediaIndex((prev) => (prev + 1) % visibleMedia.length);
  };

  // 絲滑過渡引擎
  useEffect(() => {
    if (!currentMedia) return;

    if (!bottomMedia) {
      setBottomMedia(currentMedia);
      setTopMedia(currentMedia);
      return;
    }

    if (currentMedia.id === topMedia?.id) return;

    setIsTransitioning(true);
    setTopMedia(currentMedia);

    if (transitionTimeout.current) window.clearTimeout(transitionTimeout.current);
    
    transitionTimeout.current = window.setTimeout(() => {
      setBottomMedia(currentMedia);
      setIsTransitioning(false);
    }, 1500);

    return () => {
      if (transitionTimeout.current) window.clearTimeout(transitionTimeout.current);
    };
  }, [currentMedia?.id]);

  // 智慧自動輪播邏輯
  useEffect(() => {
    if (pinnedMediaId || visibleMedia.length <= 1) return;

    if (slideshowTimeout.current) window.clearTimeout(slideshowTimeout.current);

    if (currentMedia?.type === 'image') {
      slideshowTimeout.current = window.setTimeout(() => {
        nextMedia();
      }, slideshowSpeed * 1000);
    }

    return () => {
      if (slideshowTimeout.current) window.clearTimeout(slideshowTimeout.current);
    };
  }, [currentMediaIndex, pinnedMediaId, visibleMedia.length, slideshowSpeed, currentMedia?.type]);

  const handleVideoEnded = () => {
    if (!pinnedMediaId) {
      nextMedia();
    }
  };

  // 模擬留言
  useEffect(() => {
    const interval = setInterval(async () => {
      const randomGuest = MOCK_GUESTS[Math.floor(Math.random() * MOCK_GUESTS.length)];
      const wish = await generateRomanticWish(randomGuest);
      const newMessage: GuestMessage = {
        id: Math.random().toString(36).substr(2, 9),
        name: randomGuest,
        content: wish,
        timestamp: Date.now()
      };
      setMessages(prev => [...prev, newMessage]);
    }, 12000);
    return () => clearInterval(interval);
  }, []);

  const renderMedia = (media: MediaItem | null, isTop: boolean) => {
    if (!media) return null;
    
    if (media.type === 'image') {
      return (
        <div
          key={media.id}
          className="absolute inset-0 w-full h-full bg-cover bg-center transition-transform duration-[3000ms] hover:scale-105"
          style={{ backgroundImage: `url(${media.url})` }}
        />
      );
    }

    return (
      <video
        key={media.id}
        src={media.url}
        autoPlay
        playsInline
        loop={pinnedMediaId === media.id}
        muted={isTransitioning ? !isTop : false}
        onEnded={isTop ? handleVideoEnded : undefined}
        className="absolute inset-0 w-full h-full object-cover"
      />
    );
  };

  return (
    <div className="relative w-full h-full overflow-hidden bg-black text-white">
      <div className="absolute inset-0 z-0">
        {renderMedia(bottomMedia, false)}
      </div>

      <div 
        className={`absolute inset-0 z-10 transition-opacity duration-[1500ms] ease-in-out will-change-opacity ${
          isTransitioning ? 'opacity-100' : 'opacity-0'
        }`}
      >
        {renderMedia(topMedia, true)}
      </div>

      <div className="absolute inset-0 z-20 bg-black/40 pointer-events-none" />

      {/* 留言牆 */}
      {showWallMessages && (
        <div className="absolute inset-0 flex items-center justify-end pr-16 pt-32 pb-24 z-30 animate-in fade-in slide-in-from-right-10 duration-1000">
          <div className="w-[450px] h-full overflow-hidden mask-linear-gradient flex flex-col">
            <div 
              className="animate-scroll flex flex-col gap-5" 
              style={{ animationDuration: `${messageScrollSpeed}s` }}
            >
              {[...messages, ...messages].map((msg, idx) => (
                <div key={`${msg.id}-${idx}`} className="glass-card p-5 rounded-2xl border-l-[4px] border-l-[#E11D48] bg-black/40">
                  <div className="flex items-center gap-2 mb-1.5">
                    <Heart size={14} fill={ROSE_GOLD} color={ROSE_GOLD} />
                    <span className="font-bold text-[#E11D48] text-base">{msg.name}</span>
                  </div>
                  <p className="text-white text-lg leading-relaxed font-medium">{msg.content}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* QR Code */}
      <div className="absolute bottom-10 left-10 z-40">
        <div className="flex flex-col items-center group transition-all duration-500 hover:scale-105">
          <div className="bg-black/70 backdrop-blur-3xl border border-white/10 p-4 rounded-[2.5rem] flex flex-col items-center gap-4 shadow-2xl rose-gold-glow">
            <div className="bg-white p-3 rounded-[1.8rem] shadow-inner">
               <QrCode size={110} color="#000" />
            </div>
            <div className="w-full flex flex-col items-center justify-center py-1">
              <span className="text-[#FDE68A] text-xl font-bold tracking-[0.2em] whitespace-nowrap leading-tight drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]">
                留言應援牆
              </span>
              <span className="text-white/40 text-[10px] font-bold tracking-[0.2em] uppercase whitespace-nowrap leading-none mt-1">
                Message Wall
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-black/90 via-transparent to-black/30 z-25" />
    </div>
  );
};

export default WeddingWall;
