
import React, { useState, useRef } from 'react';
import { MediaItem, SchemeId } from '../types';
import { Upload, Eye, EyeOff, Trash2, MessageSquare, MessageSquareOff, Clock, Pin, Video, Image as ImageIcon, GripVertical, CheckCircle2, Plus, X, Check, Edit2, AlertCircle } from 'lucide-react';

interface Props {
  schemeIds: SchemeId[];
  schemes: Record<SchemeId, MediaItem[]>;
  addScheme: (name: string) => void;
  renameScheme: (oldId: SchemeId, newId: SchemeId) => void;
  deleteScheme: (id: SchemeId) => void;
  updateSchemeMedia: (id: SchemeId, newList: MediaItem[]) => void;
  liveScheme: SchemeId;
  setLiveScheme: (id: SchemeId) => void;
  showWallMessages: boolean;
  setShowWallMessages: (val: boolean) => void;
  pinnedMediaIds: Record<SchemeId, string | null>;
  setPinnedMediaIdForScheme: (schemeId: SchemeId, mediaId: string | null) => void;
  slideshowSpeed: number;
  setSlideshowSpeed: (speed: number) => void;
  messageScrollSpeed: number;
  setMessageScrollSpeed: (speed: number) => void;
}

const ControlPanel: React.FC<Props> = ({ 
  schemeIds,
  schemes,
  addScheme,
  renameScheme,
  deleteScheme,
  updateSchemeMedia,
  liveScheme,
  setLiveScheme,
  showWallMessages, 
  setShowWallMessages,
  pinnedMediaIds,
  setPinnedMediaIdForScheme,
  slideshowSpeed,
  setSlideshowSpeed,
  messageScrollSpeed,
  setMessageScrollSpeed
}) => {
  const [editingScheme, setEditingScheme] = useState<SchemeId>(liveScheme);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  
  const [isAddingScheme, setIsAddingScheme] = useState(false);
  const [newSchemeInput, setNewSchemeInput] = useState('');
  
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameInput, setRenameInput] = useState('');
  
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [confirmSchemeDeleteId, setConfirmSchemeDeleteId] = useState<SchemeId | null>(null);

  const currentMediaList = schemes[editingScheme] || [];

  const handleAddSchemeConfirm = (e: React.FormEvent | React.MouseEvent) => {
    e.preventDefault();
    if (newSchemeInput.trim()) {
      addScheme(newSchemeInput.trim());
      setEditingScheme(newSchemeInput.trim());
      setNewSchemeInput('');
      setIsAddingScheme(false);
    }
  };

  const handleRenameConfirm = (e: React.FormEvent | React.MouseEvent) => {
    e.preventDefault();
    if (renamingId && renameInput.trim()) {
      renameScheme(renamingId, renameInput.trim());
      if (editingScheme === renamingId) setEditingScheme(renameInput.trim());
      setRenamingId(null);
      setRenameInput('');
    }
  };

  const handleDeleteSchemeExecute = (id: SchemeId) => {
    deleteScheme(id);
    if (editingScheme === id) {
      const remaining = schemeIds.filter(sid => sid !== id);
      if (remaining.length > 0) setEditingScheme(remaining[0]);
    }
    setConfirmSchemeDeleteId(null);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const newItems: MediaItem[] = (Array.from(files) as File[]).map(file => ({
        id: Math.random().toString(36).substr(2, 9),
        url: URL.createObjectURL(file),
        type: file.type.startsWith('video') ? 'video' : 'image',
        visible: true
      }));
      updateSchemeMedia(editingScheme, [...newItems, ...currentMediaList]);
    }
  };

  const executeDeleteMedia = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const newList = currentMediaList.filter(m => m.id !== id);
    updateSchemeMedia(editingScheme, newList);
    if (pinnedMediaIds[editingScheme] === id) {
      setPinnedMediaIdForScheme(editingScheme, null);
    }
    setConfirmDeleteId(null);
  };

  const toggleVisibility = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const newList = currentMediaList.map(m => m.id === id ? { ...m, visible: !m.visible } : m);
    updateSchemeMedia(editingScheme, newList);
  };

  const handlePinToggle = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const currentPinned = pinnedMediaIds[editingScheme];
    setPinnedMediaIdForScheme(editingScheme, currentPinned === id ? null : id);
  };

  const onDragStart = (idx: number) => setDraggedIndex(idx);
  const onDragOver = (e: React.DragEvent, idx: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === idx) return;
    const newList = [...currentMediaList];
    const item = newList.splice(draggedIndex, 1)[0];
    newList.splice(idx, 0, item);
    updateSchemeMedia(editingScheme, newList);
    setDraggedIndex(idx);
  };

  return (
    <div className="w-full h-full flex flex-col items-center bg-[#050505] pt-32 sm:pt-40 md:pt-48 px-4 sm:px-8 md:px-12 pb-8 overflow-hidden">
      <div className="max-w-7xl w-full h-full flex flex-col min-h-0 relative">
        
        {/* Header with Scheme Tabs */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between border-b border-white/10 pb-6 flex-shrink-0 gap-4">
          <div className="flex flex-col">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-white flex items-center gap-3">
              <div className="w-1 h-8 md:w-1.5 md:h-10 bg-[#E11D48] rounded-full" />
              素材方案管理
            </h2>
            <p className="text-white/40 text-[10px] md:text-sm mt-1 tracking-widest font-medium uppercase">DYNAMIC SCHEME ASSET HUB</p>
          </div>
          
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="flex bg-white/5 p-1 rounded-2xl border border-white/10 items-center overflow-x-auto max-w-full sm:max-w-[500px] md:max-w-[650px] no-scrollbar">
              {schemeIds.map(id => (
                <div key={id} className="relative group/tab">
                  {renamingId === id ? (
                    <form onSubmit={handleRenameConfirm} className="flex items-center gap-1 px-2 animate-in fade-in duration-200">
                      <input 
                        autoFocus
                        type="text"
                        value={renameInput}
                        onChange={(e) => setRenameInput(e.target.value)}
                        className="bg-black/40 border border-[#E11D48]/50 text-white px-2 py-1.5 rounded-lg text-xs focus:outline-none w-24"
                      />
                      <button type="submit" className="p-1.5 bg-[#E11D48] text-white rounded-lg"><Check size={14} /></button>
                      <button type="button" onClick={() => setRenamingId(null)} className="p-1.5 bg-white/10 text-white rounded-lg"><X size={14} /></button>
                    </form>
                  ) : (
                    <div className="flex items-center">
                      <button
                        onClick={() => setEditingScheme(id)}
                        className={`px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl font-bold transition-all flex items-center gap-2 whitespace-nowrap flex-shrink-0 ${
                          editingScheme === id 
                            ? 'bg-[#E11D48] text-white shadow-lg' 
                            : 'text-white/40 hover:text-white hover:bg-white/5'
                        }`}
                      >
                        <span className="text-sm sm:text-base">{id}</span>
                        {liveScheme === id && <CheckCircle2 size={12} className="animate-pulse" />}
                      </button>
                      
                      {/* Tab Quick Actions */}
                      <div className={`absolute -top-1 right-0 flex gap-1 opacity-0 group-hover/tab:opacity-100 transition-opacity z-10 scale-75 ${editingScheme === id ? 'translate-x-1' : ''}`}>
                         <button 
                           onClick={(e) => { e.stopPropagation(); setRenamingId(id); setRenameInput(id); }}
                           className="p-1.5 bg-white/10 backdrop-blur-md rounded-lg text-white/60 hover:text-white border border-white/10"
                           title="重新命名"
                         >
                           <Edit2 size={10} />
                         </button>
                         <button 
                           onClick={(e) => { 
                             e.stopPropagation(); 
                             if (id === liveScheme) return;
                             setConfirmSchemeDeleteId(id); 
                           }}
                           disabled={id === liveScheme}
                           className={`p-1.5 backdrop-blur-md rounded-lg border ${
                             id === liveScheme 
                             ? 'bg-white/5 text-white/10 cursor-not-allowed' 
                             : 'bg-red-500/20 text-red-400 hover:bg-red-500 hover:text-white border-red-500/30'
                           }`}
                           title={id === liveScheme ? "播放中方案不可刪除" : "刪除方案"}
                         >
                           <Trash2 size={10} />
                         </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}

              {isAddingScheme ? (
                <form onSubmit={handleAddSchemeConfirm} className="flex items-center gap-2 px-3 animate-in slide-in-from-right-2 duration-300">
                  <input 
                    autoFocus
                    type="text"
                    value={newSchemeInput}
                    onChange={(e) => setNewSchemeInput(e.target.value)}
                    placeholder="名稱..."
                    className="bg-black/40 border border-[#E11D48]/50 text-white px-2 py-1.5 rounded-lg text-xs focus:outline-none focus:border-[#E11D48] w-24 sm:w-32"
                  />
                  <button type="submit" className="p-1.5 sm:p-2 bg-[#E11D48] text-white rounded-lg"><Check size={14} /></button>
                  <button type="button" onClick={() => setIsAddingScheme(false)} className="p-1.5 sm:p-2 bg-white/10 text-white rounded-lg"><X size={14} /></button>
                </form>
              ) : (
                <button 
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); setIsAddingScheme(true); }}
                  className="p-2 sm:p-3 text-[#E11D48] hover:bg-white/5 rounded-xl transition-all flex items-center justify-center min-w-[40px] group"
                >
                  <Plus size={18} className="group-hover:rotate-90 transition-transform duration-300" />
                </button>
              )}
            </div>
            
            <label className="cursor-pointer bg-[#E11D48] text-white px-6 md:px-8 py-2.5 md:py-3.5 rounded-full font-bold hover:scale-105 transition-all flex items-center gap-2 shadow-[0_0_20px_rgba(225,29,72,0.3)] flex-shrink-0 text-xs sm:text-sm">
              <Upload size={16} /> 上傳至 {editingScheme}
              <input type="file" multiple accept="image/*,video/*" className="hidden" onChange={handleFileUpload} />
            </label>
          </div>
        </div>

        {/* Global Controls */}
        <div className="flex flex-col md:flex-row md:items-center justify-between py-6 flex-shrink-0 gap-6">
          <div className="flex items-center gap-4">
             <div className={`px-4 py-1.5 rounded-full text-[10px] md:text-xs font-bold border transition-all duration-500 ${
               liveScheme === editingScheme ? 'bg-[#E11D48]/20 border-[#E11D48] text-[#E11D48]' : 'bg-white/5 border-white/10 text-white/30'
             }`}>
               {liveScheme === editingScheme ? '● 正在應援牆播放中' : '○ 閒置方案 (僅限編輯)'}
             </div>
             {liveScheme !== editingScheme && (
               <button 
                 onClick={() => setLiveScheme(editingScheme)}
                 className="text-[#E11D48] text-[10px] md:text-xs font-bold underline underline-offset-4 hover:text-white transition-colors"
               >
                 切換應援牆至此方案
               </button>
             )}
          </div>
          
          <div className="flex flex-wrap items-center gap-4 md:gap-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 md:gap-8 bg-white/5 px-4 md:px-6 py-3 md:py-2 rounded-2xl border border-white/10 w-full md:w-auto">
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <span className="text-[9px] md:text-[10px] font-bold text-white/40 uppercase tracking-widest whitespace-nowrap">輪播速度:</span>
                <input 
                  type="range" min="3" max="30" step="1" 
                  value={slideshowSpeed}
                  onChange={(e) => setSlideshowSpeed(parseInt(e.target.value))}
                  className="w-20 md:w-24 h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-[#E11D48]"
                />
                <span className="text-[10px] md:text-xs font-mono font-bold text-[#E11D48] w-6 md:w-8">{slideshowSpeed}s</span>
              </div>
              <div className="hidden sm:block w-px h-4 bg-white/10" />
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <span className="text-[9px] md:text-[10px] font-bold text-white/40 uppercase tracking-widest whitespace-nowrap">留言速度:</span>
                <input 
                  type="range" min="10" max="100" step="5" 
                  value={messageScrollSpeed}
                  onChange={(e) => setMessageScrollSpeed(parseInt(e.target.value))}
                  className="w-20 md:w-24 h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-[#E11D48]"
                />
                <span className="text-[10px] md:text-xs font-mono font-bold text-[#E11D48] w-6 md:w-8">{messageScrollSpeed}s</span>
              </div>
            </div>

            <button 
              onClick={() => setShowWallMessages(!showWallMessages)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-[10px] md:text-xs font-bold transition-all w-full md:w-auto justify-center ${
                showWallMessages ? 'bg-[#E11D48] text-white shadow-[0_0_15px_rgba(225,29,72,0.3)]' : 'bg-white/10 text-white/40 border border-white/5'
              }`}
            >
              {showWallMessages ? <MessageSquare size={14} /> : <MessageSquareOff size={14} />}
              留言牆: {showWallMessages ? '開啟' : '關閉'}
            </button>
          </div>
        </div>

        {/* Media List */}
        <div className="flex flex-col gap-4 flex-1 min-h-0 bg-white/[0.02] border border-white/5 rounded-[1.5rem] md:rounded-[2.5rem] p-4 md:p-8 overflow-hidden shadow-inner">
          <div className="flex items-center justify-between flex-shrink-0">
             <div className="flex flex-col gap-1">
               <h3 className="text-xs md:text-sm font-bold tracking-[0.2em] text-white uppercase">方案 {editingScheme} 素材庫</h3>
               <p className="text-[9px] md:text-[10px] text-white/30">共 {currentMediaList.length} 個項目。拖拽可排序。</p>
             </div>
             <span className="text-[9px] md:text-[10px] text-[#E11D48] font-bold bg-[#E11D48]/10 px-3 py-1 rounded-full border border-[#E11D48]/20">捲軸瀏覽</span>
          </div>

          <div className="flex-1 overflow-y-auto pr-1 md:pr-2 custom-scrollbar">
            {currentMediaList.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pb-8">
                {currentMediaList.map((media, idx) => (
                  <div 
                    key={media.id} 
                    draggable
                    onDragStart={() => onDragStart(idx)}
                    onDragOver={(e) => onDragOver(e, idx)}
                    onDragEnd={() => setDraggedIndex(null)}
                    className={`relative aspect-[16/10] rounded-2xl md:rounded-3xl overflow-hidden glass-card group border-2 transition-all duration-300 cursor-grab active:cursor-grabbing hover:scale-[1.02] ${
                      draggedIndex === idx ? 'opacity-20 scale-95 border-dashed border-white/50' : 'opacity-100 border-white/5 shadow-xl'
                    } ${pinnedMediaIds[editingScheme] === media.id ? 'border-[#E11D48] ring-4 ring-[#E11D48]/20' : ''}`}
                  >
                    <div className="absolute inset-0 z-0 bg-neutral-900 pointer-events-none">
                      {media.type === 'image' ? (
                        <img src={media.url} className={`w-full h-full object-cover transition-all duration-700 ${media.visible ? 'grayscale-0' : 'grayscale brightness-50'}`} alt="" />
                      ) : (
                        <video src={media.url} className={`w-full h-full object-cover transition-all duration-700 ${media.visible ? 'grayscale-0' : 'grayscale brightness-50'}`} />
                      )}
                    </div>

                    <div className="absolute inset-0 bg-black/80 opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center gap-3 z-30">
                      {confirmDeleteId === media.id ? (
                        <div className="flex flex-col items-center gap-3 animate-in zoom-in duration-200">
                          <span className="text-[10px] font-bold text-white uppercase tracking-widest text-center">確定刪除？</span>
                          <div className="flex gap-2">
                            <button 
                              onClick={(e) => executeDeleteMedia(media.id, e)}
                              className="p-2 bg-[#E11D48] text-white rounded-lg"
                            >
                              <Check size={16} />
                            </button>
                            <button 
                              onClick={(e) => { e.preventDefault(); e.stopPropagation(); setConfirmDeleteId(null); }}
                              className="p-2 bg-white/20 text-white rounded-lg"
                            >
                              <X size={16} />
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <button 
                            onMouseDown={(e) => e.stopPropagation()}
                            onClick={(e) => toggleVisibility(media.id, e)}
                            className={`p-2.5 md:p-3 rounded-xl md:rounded-2xl transition-all hover:scale-110 ${media.visible ? 'bg-white/10 text-white' : 'bg-red-500 text-white'}`}
                          >
                            {media.visible ? <Eye size={18} /> : <EyeOff size={18} />}
                          </button>
                          <button 
                            onMouseDown={(e) => e.stopPropagation()}
                            onClick={(e) => handlePinToggle(media.id, e)}
                            className={`p-2.5 md:p-3 rounded-xl md:rounded-2xl transition-all hover:scale-110 ${pinnedMediaIds[editingScheme] === media.id ? 'bg-[#E11D48] text-white' : 'bg-white/10 text-white'}`}
                          >
                            <Pin size={18} />
                          </button>
                          <button 
                            onMouseDown={(e) => e.stopPropagation()}
                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); setConfirmDeleteId(media.id); }}
                            className="p-2.5 md:p-3 bg-white/10 text-white hover:bg-red-600 rounded-xl md:rounded-2xl transition-all hover:scale-110"
                          >
                            <Trash2 size={18} />
                          </button>
                        </>
                      )}
                    </div>

                    <div className="absolute top-2.5 left-2.5 z-10 flex flex-col gap-1 pointer-events-none">
                       <div className={`px-2 py-0.5 md:py-1 rounded-lg text-[8px] md:text-[9px] font-bold text-white flex items-center gap-1 backdrop-blur-md border border-white/20 shadow-lg ${media.type === 'video' ? 'bg-blue-600/60' : 'bg-emerald-600/60'}`}>
                         {media.type === 'video' ? <Video size={10} /> : <ImageIcon size={10} />}
                         {media.type === 'video' ? 'VIDEO' : 'IMAGE'}
                       </div>
                       {pinnedMediaIds[editingScheme] === media.id && (
                         <div className="bg-[#E11D48] px-2 py-0.5 md:py-1 rounded-lg text-[8px] md:text-[9px] font-bold text-white flex items-center gap-1 shadow-lg border border-white/20">
                           <Pin size={10} fill="white" /> PINNED
                         </div>
                       )}
                    </div>
                    
                    <div className="absolute bottom-2.5 left-2.5 z-10 bg-white/90 backdrop-blur-sm text-black px-2 py-0.5 md:py-1 rounded-lg text-[9px] md:text-[10px] font-black pointer-events-none">
                      #{idx + 1}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-full min-h-[250px] flex flex-col items-center justify-center opacity-20 border-2 border-dashed border-white/10 rounded-[1.5rem] md:rounded-[2rem]">
                <ImageIcon size={48} className="mb-4" />
                <p className="font-bold tracking-[0.2em] md:tracking-[0.3em] uppercase text-xs">方案 {editingScheme} 尚未上傳素材</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Scheme Delete Confirmation */}
      {confirmSchemeDeleteId && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/90 backdrop-blur-xl animate-in fade-in duration-300 p-4">
          <div className="glass-card p-8 md:p-12 rounded-[2rem] md:rounded-[3rem] border-red-500/30 flex flex-col items-center gap-6 md:gap-8 max-w-md w-full animate-in zoom-in duration-300">
            <div className="w-16 h-16 md:w-20 md:h-20 bg-red-500/20 text-red-500 rounded-full flex items-center justify-center">
              <AlertCircle size={40} md:size={48} />
            </div>
            <div className="text-center">
              <h3 className="text-xl md:text-2xl font-bold text-white mb-2">確定刪除方案？</h3>
              <p className="text-white/40 text-xs md:text-sm leading-relaxed">
                您即將刪除「<span className="text-white font-bold">{confirmSchemeDeleteId}</span>」。<br/>
                此操作將永久移除該方案內容，且無法復原。
              </p>
            </div>
            <div className="flex gap-4 w-full">
              <button 
                onClick={() => setConfirmSchemeDeleteId(null)}
                className="flex-1 py-3 md:py-4 bg-white/10 text-white rounded-xl md:rounded-2xl font-bold hover:bg-white/20 transition-all text-sm md:text-base"
              >
                取消
              </button>
              <button 
                onClick={() => handleDeleteSchemeExecute(confirmSchemeDeleteId)}
                className="flex-1 py-3 md:py-4 bg-red-500 text-white rounded-xl md:rounded-2xl font-bold hover:bg-red-600 transition-all shadow-lg text-sm md:text-base"
              >
                確定刪除
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: rgba(255, 255, 255, 0.02); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(225, 29, 72, 0.4); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(225, 29, 72, 0.7); }
        .no-scrollbar::-webkit-scrollbar { display: none; }
      `}</style>
    </div>
  );
};

export default ControlPanel;
