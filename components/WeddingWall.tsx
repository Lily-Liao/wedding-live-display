
import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { Heart } from 'lucide-react';
import { ROSE_GOLD } from '../constants';
import { GuestMessage, MediaItem, WsMessagePayload } from '../types';
import { fetchMessages } from '../services/apiService';
import { wsService } from '../services/wsService';

interface Props {
  mediaList: MediaItem[];
  showWallMessages: boolean;
  pinnedMediaId: string | null;
  slideshowSpeed: number;
  messageScrollSpeed: number;
  isActiveMode: boolean;
  videoMuted: boolean;
}

// 模組層級：跨 mount 持久化（因為 component 現在永遠掛載，主要用於防止重複）
const globalDisplayedIds = new Set<string>();

const WeddingWall: React.FC<Props> = ({ mediaList, showWallMessages, pinnedMediaId, slideshowSpeed, messageScrollSpeed, isActiveMode, videoMuted }) => {
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0);

  const [bottomMedia, setBottomMedia] = useState<MediaItem | null>(null);
  const [topMedia, setTopMedia] = useState<MediaItem | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);

  // 留言列表
  const [messages, setMessages] = useState<GuestMessage[]>([]);

  // 持續滾動用的 ref
  const scrollRef = useRef<HTMLDivElement>(null);
  const scrollOffset = useRef(0);
  const rafId = useRef<number>(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const spacerHeight = useRef(0);

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
    if (!pinnedMediaId) nextMedia();
  };

  // 新增留言（去重）
  const addMessage = useCallback((msg: GuestMessage) => {
    if (globalDisplayedIds.has(msg.id)) return;
    globalDisplayedIds.add(msg.id);
    setMessages(prev => [...prev, msg]);
  }, []);

  // 載入歷史 + WebSocket 即時 + 定期輪詢
  useEffect(() => {
    const loadMessages = () => {
      fetchMessages()
        .then((msgs) => {
          const sorted = [...msgs].sort((a, b) => a.timestamp - b.timestamp);
          sorted.forEach(addMessage);
        })
        .catch((err) => console.error('Failed to fetch messages:', err));
    };

    loadMessages();
    const pollTimer = window.setInterval(loadMessages, 5000);

    const handleNewMessage = (payload: WsMessagePayload) => {
      addMessage({
        id: payload.id,
        name: payload.name,
        content: payload.content,
        timestamp: payload.timestamp,
        pictureUrl: payload.pictureUrl,
      });
    };

    wsService.on('message:new', handleNewMessage);
    return () => {
      window.clearInterval(pollTimer);
      wsService.off('message:new', handleNewMessage);
    };
  }, [addMessage]);

  // 測量容器高度（用於 spacer，讓留言從底部開始出現）
  useEffect(() => {
    const measure = () => {
      if (containerRef.current) {
        spacerHeight.current = containerRef.current.clientHeight;
      }
    };
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, []);

  // scrollSpeed: px per second，由系統控制面板的「留言速度」控制
  const scrollSpeed = useMemo(() => {
    // messageScrollSpeed 範圍 10-100，值越小越快
    return Math.max(15, 90 - messageScrollSpeed * 0.75);
  }, [messageScrollSpeed]);

  // 絲滑持續滾動（requestAnimationFrame）— 永遠運行，不受標籤切換影響
  useEffect(() => {
    let lastTime = performance.now();

    const tick = (now: number) => {
      const delta = (now - lastTime) / 1000;
      lastTime = now;

      const el = scrollRef.current;
      const container = containerRef.current;
      if (el && container) {
        const contentHeight = el.scrollHeight;
        const spHeight = spacerHeight.current;

        if (contentHeight > spHeight) {
          scrollOffset.current += scrollSpeed * delta;

          // 所有內容（含 spacer）已滾出畫面頂端 → 清空舊訊息，重置位置
          if (scrollOffset.current >= contentHeight) {
            setMessages([]);
            scrollOffset.current = 0;
            el.style.transform = 'translateY(0px)';
          } else {
            el.style.transform = `translateY(-${scrollOffset.current}px)`;
          }
        }
      }

      rafId.current = requestAnimationFrame(tick);
    };

    rafId.current = requestAnimationFrame(tick);
    return () => {
      if (rafId.current) cancelAnimationFrame(rafId.current);
    };
  }, [scrollSpeed]);

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
        muted={videoMuted || (isTop !== isTransitioning)}
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

      <div className={`absolute inset-0 z-10 transition-opacity duration-[1500ms] ease-in-out will-change-opacity ${isTransitioning ? 'opacity-100' : 'opacity-0'}`}>
        {renderMedia(topMedia, true)}
      </div>

      <div className="absolute inset-0 z-20 bg-black/40 pointer-events-none" />

      {/* 留言牆：每則留言由下往上滑入，持續不間斷 */}
      {showWallMessages && (
        <div
          ref={containerRef}
          className="absolute right-12 top-28 bottom-20 w-[420px] z-30 overflow-hidden pointer-events-none"
          style={{
            maskImage: 'linear-gradient(to bottom, transparent 0%, black 8%, black 92%, transparent 100%)',
            WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 8%, black 92%, transparent 100%)',
          }}
        >
          <div
            ref={scrollRef}
            className="flex flex-col gap-2 will-change-transform"
            style={{ transform: `translateY(-${scrollOffset.current}px)` }}
          >
            {/* Spacer：等於容器高度，讓留言從畫面底部開始進入 */}
            <div style={{ height: `${spacerHeight.current}px`, flexShrink: 0 }} />

            {messages.map((msg) => (
              <div key={msg.id} className="shrink-0 animate-msg-in">
                <div className="glass-card px-4 py-3 rounded-xl border-l-[3px] border-l-[#E11D48] bg-black/50 backdrop-blur-sm">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    {msg.pictureUrl ? (
                      <img src={msg.pictureUrl} alt="" className="w-5 h-5 rounded-full object-cover flex-shrink-0" />
                    ) : (
                      <Heart size={12} fill={ROSE_GOLD} color={ROSE_GOLD} />
                    )}
                    <span className="font-bold text-[#E11D48] text-sm">{msg.name}</span>
                  </div>
                  <p className="text-white text-base leading-snug font-medium">{msg.content}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* QR Code — 只在應援牆模式顯示 */}
      {isActiveMode && (
        <div className="absolute bottom-10 left-10 z-40">
          <div className="flex flex-col items-center group transition-all duration-500 hover:scale-105">
            <div className="bg-black/70 backdrop-blur-3xl border border-white/10 p-4 rounded-[2.5rem] flex flex-col items-center gap-4 shadow-2xl rose-gold-glow">
              <div className="bg-white p-3 rounded-[1.8rem] shadow-inner">
                <img src="https://qr-official.line.me/sid/L/737odmzn.png" alt="LINE QR Code" width={110} height={110} className="rounded-xl" />
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
      )}

      <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-black/90 via-transparent to-black/30 z-25" />

    </div>
  );
};

export default WeddingWall;
