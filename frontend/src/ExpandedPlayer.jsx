import { useState, useEffect } from 'react';
import { ChevronDown, Heart, SkipBack, SkipForward, Play, Pause, Repeat, Shuffle, ListPlus } from 'lucide-react';

export default function ExpandedPlayer({ 
  song, isPlaying, progress, duration, onPlayPause, onSeek, onNext, onPrev, 
  onClose, liked, onToggleLike, onShuffle, onRepeat, shuffle, repeat, onAddPlaylist 
}) {
  const [lyrics, setLyrics] = useState(null);
  const [loadingLyrics, setLoadingLyrics] = useState(false);
  const [showLyrics, setShowLyrics] = useState(false);

  useEffect(() => {
    if (showLyrics && song && song.id) {
      setLoadingLyrics(true);
      fetch(`/api/lyrics/${song.id}`)
        .then(res => res.json())
        .then(data => {
          setLyrics(data.text);
          setLoadingLyrics(false);
        })
        .catch(() => {
          setLyrics(null);
          setLoadingLyrics(false);
        });
    }
  }, [showLyrics, song]);

  if (!song) return null;

  const fmtTime = (s) => {
    const m = Math.floor(s / 60);
    const r = Math.floor(s % 60);
    return `${m}:${r.toString().padStart(2, "0")}`;
  };

  const isLiked = liked && typeof liked.has === 'function' ? liked.has(song.id) : false;

  return (
    <div className="fixed inset-0 z-50 bg-[#08070C] flex flex-col transition-transform duration-300 transform translate-y-0 text-white overflow-hidden">
      {/* Background blur using cover art colors */}
      <div 
        className="absolute inset-0 opacity-40 blur-[100px] pointer-events-none transition-colors duration-1000"
        style={{
          background: `linear-gradient(to bottom right, ${song.colors?.[0] || '#8B5CF6'}, ${song.colors?.[1] || '#2DD9C8'})`
        }}
      />
      
      {/* Header */}
      <div className="relative z-10 flex items-center justify-between p-6">
        <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
          <ChevronDown className="w-6 h-6" />
        </button>
        <span className="text-xs font-semibold tracking-widest text-white/70 uppercase">
          {song.album || 'Now Playing'}
        </span>
        <button className="p-2 hover:bg-white/10 rounded-full transition-colors" onClick={(e) => { e.stopPropagation(); onAddPlaylist(song); }}>
          <ListPlus className="w-6 h-6" />
        </button>
      </div>

      {/* Main Content */}
      <div className="relative z-10 flex-1 flex flex-col lg:flex-row items-center justify-center p-6 gap-12 overflow-hidden">
        
        {/* Left/Top: Cover Art */}
        <div className={`flex flex-col items-center justify-center w-full max-w-md ${showLyrics ? 'hidden lg:flex' : 'flex'}`}>
          <div 
            className="w-full aspect-square rounded-2xl overflow-hidden shadow-2xl relative transition-transform duration-500 ease-out"
            style={{
              background: `linear-gradient(140deg, ${song.colors?.[0] || '#8B5CF6'}, ${song.colors?.[1] || '#2DD9C8'})`
            }}
          >
            {song.coverArt && (
              <img src={song.coverArt} alt={song.title} className="w-full h-full object-cover" />
            )}
          </div>
        </div>

        {/* Right/Bottom: Info, Lyrics & Controls */}
        <div className="w-full max-w-md flex flex-col">
          
          {/* Info */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex flex-col">
              <h2 className="text-2xl font-bold line-clamp-1">{song.title}</h2>
              <p className="text-white/70 text-lg">{song.artist}</p>
            </div>
            <button 
              onClick={() => onToggleLike(song)}
              className="p-3 rounded-full hover:bg-white/10 transition-colors"
            >
              <Heart className={`w-7 h-7 ${isLiked ? 'fill-[#8B5CF6] text-[#8B5CF6]' : 'text-white/70'}`} />
            </button>
          </div>

          {/* Lyrics View */}
          {showLyrics && (
            <div className="flex-1 min-h-[200px] max-h-[40vh] overflow-y-auto mb-8 pr-4 custom-scrollbar">
              {loadingLyrics ? (
                <div className="flex items-center justify-center h-full">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                </div>
              ) : lyrics ? (
                <p className="text-lg leading-relaxed text-white/90 whitespace-pre-wrap font-medium">
                  {lyrics}
                </p>
              ) : (
                <div className="flex items-center justify-center h-full text-white/50">
                  Lyrics aren't available for this song yet.
                </div>
              )}
            </div>
          )}

          <div className="mt-auto">
            {/* Progress */}
            <div className="mb-8">
              <div 
                className="h-2 bg-white/20 rounded-full overflow-hidden cursor-pointer flex items-center group relative"
                onClick={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const pct = (e.clientX - rect.left) / rect.width;
                  onSeek(pct * duration);
                }}
              >
                <div 
                  className="h-full bg-white transition-all duration-100 ease-linear rounded-full"
                  style={{ width: `${(progress / (duration || 1)) * 100}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-white/50 mt-2 font-medium">
                <span>{fmtTime(progress)}</span>
                <span>{fmtTime(duration)}</span>
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center justify-between">
              <button 
                onClick={onShuffle}
                className={`p-3 rounded-full transition-colors ${shuffle ? 'text-[#8B5CF6]' : 'text-white/50 hover:text-white'}`}
              >
                <Shuffle className="w-5 h-5" />
              </button>
              
              <button onClick={onPrev} className="p-3 text-white hover:text-[#8B5CF6] transition-colors">
                <SkipBack className="w-8 h-8 fill-current" />
              </button>
              
              <button 
                onClick={onPlayPause}
                className="w-16 h-16 flex items-center justify-center bg-white text-black rounded-full hover:scale-105 transition-transform"
              >
                {isPlaying ? (
                  <Pause className="w-8 h-8 fill-current" />
                ) : (
                  <Play className="w-8 h-8 fill-current ml-1" />
                )}
              </button>
              
              <button onClick={onNext} className="p-3 text-white hover:text-[#8B5CF6] transition-colors">
                <SkipForward className="w-8 h-8 fill-current" />
              </button>

              <button 
                onClick={onRepeat}
                className={`p-3 rounded-full transition-colors ${repeat > 0 ? 'text-[#8B5CF6]' : 'text-white/50 hover:text-white'}`}
              >
                <Repeat className="w-5 h-5" />
                {repeat === 2 && <span className="absolute text-[10px] ml-[-6px] mt-[4px]">1</span>}
              </button>
            </div>

            {/* Bottom Actions */}
            <div className="flex justify-center mt-8">
              <button 
                onClick={() => setShowLyrics(!showLyrics)}
                className={`px-4 py-2 rounded-full text-sm font-semibold transition-colors ${showLyrics ? 'bg-white text-black' : 'bg-white/10 text-white hover:bg-white/20'}`}
              >
                Lyrics
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
