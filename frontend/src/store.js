import { create } from 'zustand';

export const usePlayerStore = create((set) => ({
  currentSong: null,       // Holds the title, artist, cover, and audio URL
  isPlaying: false,        // Tracks if the music is actively playing
  
  // Action to play a brand new song
  playSong: (song) => set({ currentSong: song, isPlaying: true }),
  
  // Action to toggle pause/play on the current song
  togglePlay: () => set((state) => ({ isPlaying: !state.isPlaying })),
}));