const fs = require('fs');
const path = require('path');

const appJsxPath = path.join(__dirname, 'frontend', 'src', 'App.jsx');
let content = fs.readFileSync(appJsxPath, 'utf8');

// Inject ExpandedPlayer
if (!content.includes('<ExpandedPlayer')) {
  content = content.replace(
    /      \{\/\* Hidden Real Audio Engine/,
    `      {isExpanded && (
        <ExpandedPlayer
          song={song}
          isPlaying={isPlaying}
          progress={progress}
          duration={song?.duration}
          onPlayPause={handleToggle}
          onSeek={handleSeek}
          onNext={handleNext}
          onPrev={handlePrev}
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
      {/* Hidden Real Audio Engine`
  );
  fs.writeFileSync(appJsxPath, content);
  console.log('App.jsx ExpandedPlayer injected successfully.');
} else {
  console.log('ExpandedPlayer already injected.');
}
