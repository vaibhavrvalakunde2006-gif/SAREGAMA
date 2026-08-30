const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, 'frontend', 'src', 'App.jsx');
let code = fs.readFileSync(file, 'utf8');

// Inject progress syncing effect
const syncEffect = `
  // Sync podcast/audiobook progress
  useEffect(() => {
    let interval;
    if (isPlaying && (activeEpisodeId || activeChapterId)) {
      interval = setInterval(() => {
        if (activeEpisodeId) {
          apiFetch('/api/me/podcasts/progress', {
            method: 'POST',
            body: JSON.stringify({ podcastId: openPodcastId || 'unknown', episodeId: activeEpisodeId, progress: Math.floor(progress) })
          }).catch(console.error);
        } else if (activeChapterId) {
          apiFetch('/api/me/audiobooks/progress', {
            method: 'POST',
            body: JSON.stringify({ bookId: openAudiobookId || 'unknown', chapterId: activeChapterId, progress: Math.floor(progress) })
          }).catch(console.error);
        }
      }, 5000);
    }
    return () => clearInterval(interval);
  }, [isPlaying, activeEpisodeId, activeChapterId, progress, openPodcastId, openAudiobookId]);
`;

code = code.replace(
  /const \[repeat, setRepeat\] = useState\(0\);/,
  `const [repeat, setRepeat] = useState(0);\n${syncEffect}`
);

fs.writeFileSync(file, code);
console.log('Added progress syncing effect for podcasts and audiobooks.');
