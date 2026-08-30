const fs = require('fs');
const path = require('path');

const appJsxPath = path.join(__dirname, 'frontend', 'src', 'App.jsx');
let content = fs.readFileSync(appJsxPath, 'utf8');

// 1. Add imports for LandingPage, ExpandedPlayer, and apiFetch
content = content.replace(
  'import React, { useState, useEffect, useRef, useMemo } from "react";',
  `import React, { useState, useEffect, useRef, useMemo } from "react";\nimport LandingPage from "./LandingPage";\nimport ExpandedPlayer from "./ExpandedPlayer";\nimport { apiFetch, getToken, setToken, removeToken } from "./lib/api";`
);

// 2. Add auth state and fetching logic inside BablooApp
const hookReplacement = `export default function BablooApp() {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    const initAuth = async () => {
      const token = getToken();
      if (!token) {
        setAuthLoading(false);
        return;
      }
      try {
        const res = await apiFetch('/api/auth/me');
        setUser(res.user);
        
        // Fetch persisted data
        try {
          const [pl, lk, hist] = await Promise.all([
            apiFetch('/api/me/playlists').catch(()=>[]),
            apiFetch('/api/me/liked-songs').catch(()=>[]),
            apiFetch('/api/me/history').catch(()=>[])
          ]);
          if (pl && pl.length) setPlaylists(pl);
          if (lk && lk.length) {
            const likedMap = {};
            lk.forEach(s => { likedMap[s.id] = true; });
            setLiked(likedMap);
          }
          if (hist && hist.length) setPlayHistory(hist);
          
        } catch (e) {
          console.error('Failed fetching data', e);
        }
      } catch (err) {
        removeToken();
        setUser(null);
      } finally {
        setAuthLoading(false);
      }
    };
    initAuth();
  }, []);

  const [stage, setStage] = useState(() => localStorage.getItem('babloo_stage') || "welcome"); // welcome | onboarding | app
`;

content = content.replace(
  `export default function BablooApp() {\n  const [stage, setStage] = useState(() => localStorage.getItem('babloo_stage') || "welcome"); // welcome | onboarding | app`,
  hookReplacement
);

// 3. Render LandingPage if not authenticated
const renderReplacement = `  if (authLoading) return <div className="min-h-screen bg-[#08070C] flex items-center justify-center text-white">Loading...</div>;
  if (!user) return <LandingPage onLogin={(u) => { setUser(u); window.location.reload(); }} />;
  
  if (stage === "welcome") {`;

content = content.replace(
  `  if (stage === "welcome") {`,
  renderReplacement
);

// 4. Update the player bar onClick to open expanded player
content = content.replace(
  /<div className="w-\[300px\] flex items-center gap-4">/g,
  `<div className="w-[300px] flex items-center gap-4 cursor-pointer" onClick={() => setIsExpanded(true)}>`
);

content = content.replace(
  /<div className="flex-1 flex flex-col justify-center min-w-0 pr-4">/g,
  `<div className="flex-1 flex flex-col justify-center min-w-0 pr-4 cursor-pointer" onClick={() => setIsExpanded(true)}>`
);


// 5. Inject ExpandedPlayer at the bottom of the component
content = content.replace(
  /    <\/PlayerContext\.Provider>\n  \);\n}/,
  `      {isExpanded && (
        <ExpandedPlayer
          song={song}
          isPlaying={isPlaying}
          progress={progress}
          duration={song.duration}
          onPlayPause={() => setIsPlaying(!isPlaying)}
          onSeek={handleSeek}
          onNext={nextSong}
          onPrev={prevSong}
          onClose={() => setIsExpanded(false)}
          liked={liked}
          onToggleLike={handleLike}
          onShuffle={() => setShuffle(!shuffle)}
          onRepeat={() => setRepeat((repeat + 1) % 3)}
          shuffle={shuffle}
          repeat={repeat}
          onAddPlaylist={setAddToPlaylistSong}
        />
      )}
    </PlayerContext.Provider>
  );
}`
);


// 6. Update `handleLike` to persist to backend
const handleLikeRegex = /  const handleLike = \(s\) => {[\s\S]*?  };/;
const newHandleLike = `  const handleLike = (s) => {
    setLiked(prev => {
      const next = { ...prev };
      if (next[s.id]) {
        delete next[s.id];
        apiFetch(\`/api/me/liked-songs/\${s.id}\`, { method: 'DELETE' }).catch(console.error);
      } else {
        next[s.id] = true;
        apiFetch('/api/me/liked-songs', { method: 'POST', body: JSON.stringify({ song: s }) }).catch(console.error);
      }
      return next;
    });
  };`;
content = content.replace(handleLikeRegex, newHandleLike);

fs.writeFileSync(appJsxPath, content);
console.log('App.jsx refactored successfully.');
