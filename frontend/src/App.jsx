import React, { useState, useEffect, useRef, useMemo } from "react";
import LandingPage from "./LandingPage";
import ExpandedPlayer from "./ExpandedPlayer";
import { apiFetch, getToken, setToken, removeToken } from "./lib/api";
import {
  Play, Pause, SkipBack, SkipForward, Heart, Search, Home, Library,
  ListMusic, Plus, Shuffle, Repeat, Volume2, Volume1, VolumeX, ChevronDown,
  X, Settings as SettingsIcon, User, Mic2, ListPlus, MoreHorizontal, Check,
  Crown, Radio, Sparkles, ArrowLeft, GripVertical, Trash2, Menu, Clock,
  BookOpen, Users, Bell, History as HistoryIcon, Smartphone, Speaker,
  Moon, SlidersHorizontal, Pencil, Maximize2, Minimize2, Laptop2, Tv,
} from "lucide-react";

/* ---------------------------------------------------------------------- */
/*  SAREGAMA — mock catalog                                                  */
/* ---------------------------------------------------------------------- */

const ARTISTS = [
  "Nova Wren", "Kilo Static", "Marigold Hex", "The Low Frequency",
  "Sable & Stone", "Half Light", "Ceramic Youth", "Glass Tigers",
];

const GENRES = [
  "Dreamwave", "Neo-Soul", "Midnight Jazz", "Analog Pop", "Deep Focus",
  "Lo-fi Nights", "Desert Funk", "Static Pop",
];

const PALETTE_BY_ARTIST = {
  "Nova Wren": ["#8B5CF6", "#4C1D95"],
  "Kilo Static": ["#2DD9C8", "#0F766E"],
  "Marigold Hex": ["#FF9F45", "#B45309"],
  "The Low Frequency": ["#5B6EE1", "#1E293B"],
  "Sable & Stone": ["#FF6B81", "#7F1D2E"],
  "Half Light": ["#A78BFA", "#312E81"],
  "Ceramic Youth": ["#34D399", "#065F46"],
  "Glass Tigers": ["#F472B6", "#831843"],
};

function makeSongs() {
  const titles = [
    "Aftertone", "Slow Static", "Paper Weather", "Nightbus", "Halflife",
    "Marigold", "Low Orbit", "Loose Thread", "Tidewater", "Grey Room",
    "Neon Commute", "Undertow", "Second Skin", "Rust & Bloom", "Windowseat",
    "Faultline", "Copper Light", "Afterglow", "Quiet Static", "Departures",
  ];
  return titles.map((title, i) => {
    const artist = ARTISTS[i % ARTISTS.length];
    const genre = GENRES[i % GENRES.length];
    const [c1, c2] = PALETTE_BY_ARTIST[artist];
    const durationSec = 150 + ((i * 37) % 140);
    return {
      id: `s${i + 1}`,
      title,
      artist,
      album: `${artist} — Sessions Vol. ${Math.ceil((i + 1) / 4)}`,
      genre,
      duration: durationSec,
      colors: [c1, c2],
      lyrics: [
        "The city hums a little slower now",
        "Static folding into gold",
        "You left the porch light on somehow",
        "A signal I still can't let go",
        "Every window's playing something soft",
        "Every hallway smells like rain",
        "We were never built to last that long",
        "But we're still here, singing anyway",
      ],
    };
  });
}

const SONGS = makeSongs();

const ARTIST_BIOS = {
  "Nova Wren": "Bedroom-pop producer turned dreamwave staple. Known for tape-warped synths and late-night vocals recorded through a cracked window.",
  "Kilo Static": "Instrumental duo building loops from field recordings — subway hum, rain on tin roofs, dial tones nobody answers.",
  "Marigold Hex": "Desert-funk revivalist with a horn section and a habit of naming songs after paint colors.",
  "The Low Frequency": "Ambient collective scoring imaginary films. Built for focus, headphones strongly recommended.",
  "Sable & Stone": "A songwriting pair trading verses about leaving towns and the people who stayed.",
  "Half Light": "Shoegaze reborn with digital reverb. Loud, blurry, and somehow still tender.",
  "Ceramic Youth": "Indie-pop four-piece with a horn loop for a logo and a discography obsessed with growing up.",
  "Glass Tigers": "Synth-pop outfit chasing the sound of an arcade at closing time.",
};

function makePodcasts() {
  const shows = [
    { id: "pc1", title: "Static & Signal", host: "Reya Okafor", category: "Music Culture", colors: PALETTE_BY_ARTIST["Nova Wren"], desc: "Long-form conversations with the people making the records you loop at 2am." },
    { id: "pc2", title: "Low Batteries", host: "Marcus Yun", category: "Technology", colors: PALETTE_BY_ARTIST["Kilo Static"], desc: "A weekly, mostly calm look at the gadgets and ideas draining your attention." },
    { id: "pc3", title: "The Slow Lane", host: "Priya Deshmukh", category: "Wellness", colors: PALETTE_BY_ARTIST["Sable & Stone"], desc: "Twenty-minute episodes built for the walk home." },
    { id: "pc4", title: "Rewind Culture", host: "Dee Alvarez", category: "Nostalgia", colors: PALETTE_BY_ARTIST["Marigold Hex"], desc: "One object, one decade, one deep dive per week." },
    { id: "pc5", title: "Night Shift Notes", host: "Tomas Berg", category: "Fiction", colors: PALETTE_BY_ARTIST["Half Light"], desc: "Serialized audio fiction for people who fall asleep with headphones in." },
  ];
  return shows.map((s) => ({
    ...s,
    episodes: Array.from({ length: 6 }, (_, i) => ({
      id: `${s.id}-e${i + 1}`,
      title: `Episode ${24 - i}: ${["Afterglow", "Static Line", "Return Signal", "Low Tide", "Open Frequency", "Long Exposure"][i]}`,
      duration: 1200 + i * 240,
      date: `${["Aug", "Aug", "Jul", "Jul", "Jun", "Jun"][i]} ${20 - i * 3}`,
      desc: "A conversation that wanders somewhere worth following.",
    })),
  }));
}
const PODCASTS = makePodcasts();

function makeAudiobooks() {
  const books = [
    { id: "ab1", title: "The Long Static", author: "Imani Cole", colors: PALETTE_BY_ARTIST["Ceramic Youth"], narrator: "Imani Cole", desc: "A quiet novel about a radio operator on a coastline no one visits anymore." },
    { id: "ab2", title: "Marigold Season", author: "Petra Voss", colors: PALETTE_BY_ARTIST["Marigold Hex"], narrator: "Devon Ashworth", desc: "Three siblings, one inherited house, one very long summer." },
    { id: "ab3", title: "Low Orbit Diaries", author: "Sam Whitfield", colors: PALETTE_BY_ARTIST["The Low Frequency"], narrator: "Sam Whitfield", desc: "Essays on distance, written from a life spent moving." },
    { id: "ab4", title: "Glass Tiger, Paper Moon", author: "Renata Kade", colors: PALETTE_BY_ARTIST["Glass Tigers"], narrator: "Aiko Tanaka", desc: "A neon-lit mystery set in a city that never turns its signs off." },
  ];
  return books.map((b) => ({
    ...b,
    totalMinutes: 420 + Math.floor(Math.random() * 180),
    progressMinutes: [180, 40, 0, 310][books.indexOf(b)],
    chapters: Array.from({ length: 8 }, (_, i) => ({ id: `${b.id}-c${i + 1}`, title: `Chapter ${i + 1}`, minutes: 22 + i * 3 })),
  }));
}
const AUDIOBOOKS = makeAudiobooks();

const FRIEND_ACTIVITY = [
  { name: "Jules", action: "listening to", target: "Aftertone", by: "Nova Wren", colors: PALETTE_BY_ARTIST["Nova Wren"] },
  { name: "Priya", action: "liked", target: "Low Orbit", by: "The Low Frequency", colors: PALETTE_BY_ARTIST["The Low Frequency"] },
  { name: "Marcus", action: "added to Late Shift", target: "Rust & Bloom", by: "Half Light", colors: PALETTE_BY_ARTIST["Half Light"] },
  { name: "Dee", action: "listening to", target: "Static & Signal", by: "Podcast · Reya Okafor", colors: PALETTE_BY_ARTIST["Kilo Static"] },
  { name: "Tomas", action: "shared", target: "Marigold", by: "Marigold Hex", colors: PALETTE_BY_ARTIST["Marigold Hex"] },
];

const NOTIFICATIONS = [
  { id: "n1", type: "release", title: "New release from Nova Wren", body: "\"Aftertone\" just dropped.", time: "2h" },
  { id: "n2", type: "playlist", title: "Late Shift was updated", body: "3 new tracks added by the community.", time: "5h" },
  { id: "n3", type: "friend", title: "Priya liked a song you shared", body: "\"Low Orbit\" by The Low Frequency.", time: "1d" },
  { id: "n4", type: "system", title: "Your Wrapped is ready", body: "See your 2026 listening recap.", time: "2d" },
  { id: "n5", type: "friend", title: "Marcus followed you", body: "Check out their public playlists.", time: "3d" },
];

const DEVICES = [
  { id: "d1", name: "This device", type: "web", icon: "laptop" },
  { id: "d2", name: "Living Room Speaker", type: "speaker", icon: "speaker" },
  { id: "d3", name: "Kitchen Display", type: "tv", icon: "tv" },
  { id: "d4", name: "Priya's Phone", type: "phone", icon: "phone" },
];

function initialPlaylists() {
  return [
    { id: "p1", name: "Late Shift", desc: "For the 2am thinkers.", songs: SONGS.slice(0, 6), cover: PALETTE_BY_ARTIST["Nova Wren"] },
    { id: "p2", name: "Slow Static", desc: "Warped tape, warm room.", songs: SONGS.slice(3, 9), cover: PALETTE_BY_ARTIST["Kilo Static"] },
    { id: "p3", name: "Focus: Deep Work", desc: "No lyrics, no distractions.", songs: SONGS.slice(8, 14), cover: PALETTE_BY_ARTIST["The Low Frequency"] },
    { id: "p4", name: "Sunday Reset", desc: "Wind down, breathe out.", songs: SONGS.slice(2, 8), cover: PALETTE_BY_ARTIST["Sable & Stone"] },
  ];
}

const fmtTime = (s) => {
  const m = Math.floor(s / 60);
  const r = Math.floor(s % 60);
  return `${m}:${r.toString().padStart(2, "0")}`;
};

/* ---------------------------------------------------------------------- */
/*  Shared bits                                                            */
/* ---------------------------------------------------------------------- */

function Aura({ colors }) {
  const [c1, c2] = colors || ["#8B5CF6", "#2DD9C8"];
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-[#08070C]">
      <div
        className="absolute -top-40 -left-32 w-[560px] h-[560px] rounded-full blur-[120px] opacity-40 transition-colors duration-[1500ms]"
        style={{ background: c1 }}
      />
      <div
        className="absolute bottom-[-200px] right-[-120px] w-[620px] h-[620px] rounded-full blur-[140px] opacity-30 transition-colors duration-[1500ms]"
        style={{ background: c2 }}
      />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,#08070C_75%)]" />
    </div>
  );
}

function Eyebrow({ children }) {
  return (
    <div className="text-[11px] font-semibold tracking-[0.2em] uppercase text-[#9490A8] mb-2">
      {children}
    </div>
  );
}

function CoverArt({ colors, coverArt, alt, size = "w-full aspect-square", rounded = "rounded-xl", icon = true }) {
  if (coverArt) {
    return (
      <img src={coverArt} alt={alt || "Cover"} className={`${size} ${rounded} object-cover bg-white/5`} onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling && (e.target.nextSibling.style.display = 'flex'); }} />
    );
  }
  const [c1, c2] = colors || ["#8B5CF6", "#2DD9C8"];
  return (
    <div
      className={`${size} ${rounded} flex items-center justify-center shrink-0 relative overflow-hidden`}
      style={{ background: `linear-gradient(140deg, ${c1}, ${c2})` }}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.25),transparent_55%)]" />
      {icon && <ListMusic className="w-1/3 h-1/3 text-white/70" strokeWidth={1.5} />}
    </div>
  );
}

function Glass({ className = "", children, ...rest }) {
  return (
    <div
      className={`bg-white/[0.045] backdrop-blur-2xl border border-white/[0.08] shadow-[0_8px_32px_rgba(0,0,0,0.35)] ${className}`}
      {...rest}
    >
      {children}
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/*  Welcome / Onboarding                                                   */
/* ---------------------------------------------------------------------- */

function WelcomeScreen({ onEnter }) {
  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center relative px-6">
      <Aura colors={["#8B5CF6", "#2DD9C8"]} />
      <div className="flex items-center justify-center mb-10 h-24">
        <img src="/logo.png" alt="SAREGAMA" className="h-full object-contain scale-[1.3]" />
      </div>

      <Glass className="w-full max-w-sm rounded-3xl p-8 text-center">
        <h1 className="text-2xl font-black text-[#EDEBF7] tracking-tight mb-1">
          Music that reads the room.
        </h1>
        <p className="text-sm text-[#9490A8] mb-8">
          Stream, discover, and drift — SAREGAMA adapts to whatever you're into tonight.
        </p>

        <button
          onClick={() => onEnter("onboarding")}
          className="w-full py-3 rounded-full bg-gradient-to-r from-[#8B5CF6] to-[#6D28D9] text-white text-sm font-semibold tracking-wide mb-3 hover:opacity-90 transition-opacity shadow-[0_0_24px_rgba(139,92,246,0.35)]"
        >
          Sign up free
        </button>
        <button
          onClick={() => onEnter("app")}
          className="w-full py-3 rounded-full border border-white/15 text-[#EDEBF7] text-sm font-semibold tracking-wide mb-6 hover:bg-white/5 transition-colors"
        >
          Log in
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="h-px flex-1 bg-white/10" />
          <span className="text-[11px] uppercase tracking-widest text-[#6b6780]">or continue with</span>
          <div className="h-px flex-1 bg-white/10" />
        </div>

        <div className="grid grid-cols-3 gap-3 mb-6">
          {["Google", "Apple", "Facebook"].map((p) => (
            <button
              key={p}
              onClick={() => onEnter("onboarding")}
              className="py-2.5 rounded-xl border border-white/10 text-xs font-medium text-[#c9c6d8] hover:bg-white/5 transition-colors"
            >
              {p}
            </button>
          ))}
        </div>

        <button onClick={() => onEnter("app")} className="text-xs text-[#9490A8] hover:text-[#EDEBF7] transition-colors">
          Continue as guest →
        </button>
      </Glass>
    </div>
  );
}

function OnboardingScreen({ onDone }) {
  const [step, setStep] = useState(0);
  const [genres, setGenres] = useState(new Set());
  const [artists, setArtists] = useState(new Set());

  const toggle = (set, setSet, val) => {
    const next = new Set(set);
    next.has(val) ? next.delete(val) : next.add(val);
    setSet(next);
  };

  const steps = [
    {
      title: "Pick a few genres",
      sub: "We'll tune your home page around these.",
      body: (
        <div className="flex flex-wrap gap-2.5 justify-center max-w-md">
          {GENRES.map((g) => (
            <button
              key={g}
              onClick={() => toggle(genres, setGenres, g)}
              className={`px-4 py-2 rounded-full text-sm font-medium border transition-all ${
                genres.has(g)
                  ? "bg-[#8B5CF6] border-[#8B5CF6] text-white"
                  : "border-white/15 text-[#c9c6d8] hover:bg-white/5"
              }`}
            >
              {g}
            </button>
          ))}
        </div>
      ),
      canNext: genres.size > 0,
    },
    {
      title: "Follow some artists",
      sub: "Pick at least three to get started.",
      body: (
        <div className="grid grid-cols-2 gap-3 max-w-md w-full">
          {ARTISTS.map((a) => (
            <button
              key={a}
              onClick={() => toggle(artists, setArtists, a)}
              className={`flex items-center gap-3 p-2.5 rounded-xl border transition-all ${
                artists.has(a) ? "border-[#2DD9C8] bg-[#2DD9C8]/10" : "border-white/10 hover:bg-white/5"
              }`}
            >
              <CoverArt colors={PALETTE_BY_ARTIST[a]} size="w-10 h-10" rounded="rounded-full" icon={false} />
              <span className="text-sm text-[#EDEBF7] font-medium">{a}</span>
              {artists.has(a) && <Check className="w-4 h-4 text-[#2DD9C8] ml-auto" />}
            </button>
          ))}
        </div>
      ),
      canNext: artists.size >= 3,
    },
  ];

  const cur = steps[step];

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center relative px-6">
      <Aura colors={["#2DD9C8", "#8B5CF6"]} />
      <div className="flex gap-1.5 mb-8">
        {steps.map((_, i) => (
          <div key={i} className={`h-1 rounded-full transition-all ${i === step ? "w-8 bg-[#8B5CF6]" : "w-4 bg-white/15"}`} />
        ))}
      </div>
      <h2 className="text-2xl font-black text-[#EDEBF7] tracking-tight mb-1 text-center">{cur.title}</h2>
      <p className="text-sm text-[#9490A8] mb-8 text-center">{cur.sub}</p>
      <div className="mb-10 flex justify-center w-full">{cur.body}</div>
      <button
        disabled={!cur.canNext}
        onClick={() => (step === steps.length - 1 ? onDone() : setStep(step + 1))}
        className="px-10 py-3 rounded-full bg-gradient-to-r from-[#8B5CF6] to-[#2DD9C8] text-white text-sm font-semibold tracking-wide disabled:opacity-30 disabled:cursor-not-allowed hover:opacity-90 transition-opacity"
      >
        {step === steps.length - 1 ? "Start listening" : "Continue"}
      </button>
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/*  Song row                                                               */
/* ---------------------------------------------------------------------- */

function SongRow({ song, index, isActive, isPlaying, liked, onPlay, onLike, onQueue, onAddToPlaylist, showIndex = true }) {
  return (
    <div
      className={`group flex items-center gap-2 md:gap-3 px-3 py-2 rounded-xl transition-colors cursor-pointer ${
        isActive ? "bg-white/[0.07]" : "hover:bg-white/[0.04]"
      }`}
      onClick={() => onPlay(song)}
    >
      {showIndex ? (
        <div className="text-xs text-[#7d7891] w-6 text-center shrink-0">
          {isActive && isPlaying ? (
            <div className="flex items-end gap-[2px] justify-center h-3">
              <span className="w-[2px] bg-[#2DD9C8] animate-[pulse_0.8s_ease-in-out_infinite] h-2" />
              <span className="w-[2px] bg-[#2DD9C8] animate-[pulse_0.9s_ease-in-out_infinite] h-3" />
              <span className="w-[2px] bg-[#2DD9C8] animate-[pulse_0.7s_ease-in-out_infinite] h-1.5" />
            </div>
          ) : (
            index
          )}
        </div>
      ) : song.coverArt ? (
        <img src={song.coverArt} alt={song.title} className="w-9 h-9 rounded-lg object-cover bg-white/5 shrink-0" onError={(e) => { e.target.style.display = 'none'; }} />
      ) : (
        <CoverArt colors={song.colors} size="w-9 h-9" rounded="rounded-lg shrink-0" />
      )}
      <div className="min-w-0 flex-1">
        <div className={`text-sm font-medium truncate ${isActive ? "text-[#2DD9C8]" : "text-[#EDEBF7]"}`}>{song.title}</div>
        <div className="text-xs text-[#9490A8] truncate">{song.artist}</div>
      </div>
      
      <div className="flex items-center gap-2 md:gap-3 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={(e) => { e.stopPropagation(); onLike(song); }}
          className="p-1"
        >
          <Heart className={`w-4 h-4 ${liked ? "fill-[#FF6B81] text-[#FF6B81]" : "text-[#9490A8]"}`} />
        </button>
        {onAddToPlaylist && (
          <button
            onClick={(e) => { e.stopPropagation(); onAddToPlaylist(song); }}
            className="p-1 hidden md:block text-[#9490A8] hover:text-[#EDEBF7]"
            title="Add to playlist"
          >
            <Plus className="w-4 h-4" />
          </button>
        )}
        <button
          onClick={(e) => { e.stopPropagation(); onQueue(song); }}
          className="p-1 hidden sm:block text-[#9490A8] hover:text-[#EDEBF7]"
          title="Add to queue"
        >
          <ListPlus className="w-4 h-4" />
        </button>
      </div>
      <div className="text-xs text-[#7d7891] w-10 text-right shrink-0">{fmtTime(song.duration)}</div>
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/*  Sidebar                                                                */
/* ---------------------------------------------------------------------- */

function Sidebar({ view, setView, playlists, collapsed, setCollapsed, onCreatePlaylist, openPlaylist }) {
  const nav = [
    { id: "home", label: "Home", icon: Home },
    { id: "search", label: "Search", icon: Search },
    { id: "library", label: "Library", icon: Library },
  ];
  const lower = [
    { id: "liked", label: "Liked Songs", icon: Heart },
    { id: "history", label: "History", icon: HistoryIcon },
    { id: "podcasts", label: "Podcasts", icon: Radio },
    { id: "audiobooks", label: "Audiobooks", icon: BookOpen },
    { id: "downloads", label: "Downloads", icon: Clock },
    { id: "wrapped", label: "Wrapped", icon: Sparkles },
    { id: "premium", label: "Premium", icon: Crown },
    { id: "settings", label: "Settings", icon: SettingsIcon },
  ];

  return (
    <Glass className={`hidden md:flex flex-col h-full rounded-3xl m-3 mr-0 transition-all duration-300 ${collapsed ? "w-[76px]" : "w-64"}`}>
      <div className="flex items-center gap-2 px-5 pt-5 pb-6">
        <div className="flex-1 flex items-center h-12">
          {!collapsed && <img src="/logo.png" alt="SAREGAMA" className="h-full object-contain scale-125 origin-left" />}
        </div>
        <button onClick={() => setCollapsed(!collapsed)} className="ml-auto text-[#7d7891] hover:text-white">
          <Menu className="w-4 h-4" />
        </button>
      </div>

      <div className="px-3 flex flex-col gap-1">
        {nav.map((n) => (
          <button
            key={n.id}
            onClick={() => setView(n.id)}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
              view === n.id ? "bg-white/10 text-[#EDEBF7]" : "text-[#9490A8] hover:text-[#EDEBF7] hover:bg-white/5"
            }`}
          >
            <n.icon className="w-[18px] h-[18px] shrink-0" />
            {!collapsed && n.label}
          </button>
        ))}
      </div>

      <div className="h-px bg-white/10 mx-4 my-4" />

      <div className="px-3 flex flex-col gap-1">
        {lower.map((n) => (
          <button
            key={n.id}
            onClick={() => setView(n.id)}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
              view === n.id ? "bg-white/10 text-[#EDEBF7]" : "text-[#9490A8] hover:text-[#EDEBF7] hover:bg-white/5"
            }`}
          >
            <n.icon className="w-[18px] h-[18px] shrink-0" />
            {!collapsed && n.label}
          </button>
        ))}
      </div>

      <div className="h-px bg-white/10 mx-4 my-4" />

      <div className="px-3 flex-1 overflow-y-auto pb-4">
        <button
          onClick={onCreatePlaylist}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-[#9490A8] hover:text-[#EDEBF7] hover:bg-white/5 w-full transition-colors"
        >
          <div className="w-[18px] h-[18px] rounded-[4px] bg-white/10 flex items-center justify-center shrink-0">
            <Plus className="w-3 h-3" />
          </div>
          {!collapsed && "Create playlist"}
        </button>
        {!collapsed && (
          <div className="mt-2 flex flex-col gap-0.5">
            {playlists.map((p) => (
              <button
                key={p.id}
                onClick={() => openPlaylist(p.id)}
                className="text-left px-3 py-2 rounded-lg text-sm text-[#9490A8] hover:text-[#EDEBF7] hover:bg-white/5 truncate transition-colors"
              >
                {p.name}
              </button>
            ))}
          </div>
        )}
      </div>
    </Glass>
  );
}

/* ---------------------------------------------------------------------- */
/*  Views                                                                   */
/* ---------------------------------------------------------------------- */

function SectionRow({ title, subtitle, children }) {
  return (
    <div className="mb-9">
      <div className="flex items-baseline justify-between mb-3">
        <h3 className="text-lg font-bold text-[#EDEBF7] tracking-tight">{title}</h3>
        {subtitle && <span className="text-xs text-[#7d7891]">{subtitle}</span>}
      </div>
      <div className="flex gap-4 overflow-x-auto pb-2 -mx-1 px-1 [scrollbar-width:none]">{children}</div>
    </div>
  );
}

function PlaylistCard({ playlist, onClick }) {
  return (
    <button onClick={onClick} className="group w-[168px] shrink-0 text-left">
      <div className="relative rounded-xl overflow-hidden mb-2 shadow-lg">
        <CoverArt colors={playlist.cover} rounded="rounded-xl" />
        <div className="absolute bottom-2 right-2 w-9 h-9 rounded-full bg-[#2DD9C8] flex items-center justify-center opacity-0 group-hover:opacity-100 translate-y-1 group-hover:translate-y-0 transition-all shadow-lg">
          <Play className="w-4 h-4 text-black fill-black ml-0.5" />
        </div>
      </div>
      <div className="text-sm font-semibold text-[#EDEBF7] truncate">{playlist.name}</div>
      <div className="text-xs text-[#9490A8] truncate">{playlist.desc}</div>
    </button>
  );
}

function SongCard({ song, onClick }) {
  return (
    <button onClick={onClick} className="group w-[168px] shrink-0 text-left">
      <div className="relative rounded-xl overflow-hidden mb-2 shadow-lg">
        {song.coverArt ? (
          <img src={song.coverArt} alt={song.title} className="w-full aspect-square rounded-xl object-cover bg-white/5" onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling && (e.target.nextSibling.style.display = 'flex'); }} />
        ) : null}
        <div style={song.coverArt ? { display: 'none' } : {}}>
          <CoverArt colors={song.colors} rounded="rounded-xl" />
        </div>
        <div className="absolute bottom-2 right-2 w-9 h-9 rounded-full bg-[#2DD9C8] flex items-center justify-center opacity-0 group-hover:opacity-100 translate-y-1 group-hover:translate-y-0 transition-all shadow-lg">
          <Play className="w-4 h-4 text-black fill-black ml-0.5" />
        </div>
      </div>
      <div className="text-sm font-semibold text-[#EDEBF7] truncate">{song.title}</div>
      <div className="text-xs text-[#9490A8] truncate">{song.artist}</div>
    </button>
  );
}

function HomeView({ playlists, greeting, onPlaySong, onOpenPlaylist }) {
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const fetchedRef = useRef(false);

  useEffect(() => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;
    const categories = [
      { key: 'kannada', title: 'Kannada Hits', subtitle: 'Best of Kannada music' },
      { key: 'hindi', title: 'Hindi & Bollywood', subtitle: 'Top Hindi tracks' },
      { key: 'english', title: 'English Picks', subtitle: 'Popular English music' },
      { key: 'classical', title: 'Classical', subtitle: 'Timeless ragas & compositions' },
      { key: 'devotional', title: 'Devotional', subtitle: 'Spiritual & peaceful' },
      { key: 'lofi', title: 'Lo-Fi & Chill', subtitle: 'Low tempo, high comfort' },
    ];
    Promise.all(
      categories.map(cat =>
        fetch(`/api/browse/${cat.key}`).then(r => r.json()).then(tracks => ({ ...cat, tracks: Array.isArray(tracks) ? tracks.slice(0, 8) : [] })).catch(() => ({ ...cat, tracks: [] }))
      )
    ).then(results => {
      setSections(results.filter(s => s.tracks.length > 0));
      setLoading(false);
    });
  }, []);

  const timeGreeting = useMemo(() => {
    const h = new Date().getHours();
    if (h < 12) return 'Your morning, tuned for you.';
    if (h < 18) return 'Your afternoon, mixed for you.';
    return 'Your evening, mixed for you.';
  }, []);

  return (
    <div>
      <Eyebrow>{greeting}</Eyebrow>
      <h1 className="text-3xl font-black text-[#EDEBF7] tracking-tight mb-8">{timeGreeting}</h1>

      <SectionRow title="Made for You">
        {playlists.map((p) => <PlaylistCard key={p.id} playlist={p} onClick={() => onOpenPlaylist(p.id)} />)}
      </SectionRow>

      {loading && (
        <div className="flex items-center gap-3 py-12 justify-center">
          <div className="w-5 h-5 border-2 border-[#8B5CF6] border-t-transparent rounded-full animate-spin" />
          <span className="text-sm text-[#9490A8]">Loading music for you...</span>
        </div>
      )}

      {sections.map(section => (
        <SectionRow key={section.key} title={section.title} subtitle={section.subtitle}>
          {section.tracks.map((s) => <SongCard key={s.id} song={s} onClick={() => onPlaySong(s, section.tracks)} />)}
        </SectionRow>
      ))}
    </div>
  );
}

function SearchView({ query, setQuery, onPlaySong, liked, onLike, onQueue, onAddToPlaylist }) {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

 // Listen for typing and search our Node backend!
  useEffect(() => {
    const fetchSongs = async () => {
      if (!query.trim()) {
        setResults([]);
        return;
      }
      setLoading(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
        const data = await res.json();
        
        // SAFETY CHECK: Ensure the backend sent us an array, not an error object!
        if (Array.isArray(data)) {
          setResults(data);
        } else {
          console.error("Backend returned an error:", data);
          setResults([]);
        }
      } catch (err) {
        console.error("Failed to fetch from backend:", err);
        setResults([]);
      } finally {
        setLoading(false);
      }
    };

    const timeout = setTimeout(fetchSongs, 500); // 500ms delay so we don't spam the server
    return () => clearTimeout(timeout);
  }, [query]);

  const q = query.trim().toLowerCase();

  return (
    <div>
      <div className="relative mb-8 max-w-xl">
        <Search className="w-4 h-4 text-[#7d7891] absolute left-4 top-1/2 -translate-y-1/2" />
        <input
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search for any song, artist, or language..."
          className="w-full bg-white/[0.06] border border-white/10 rounded-full pl-11 pr-4 py-3 text-sm text-[#EDEBF7] placeholder:text-[#7d7891] outline-none focus:border-[#8B5CF6]/60 transition-colors"
        />
      </div>

      {!q && (
        <>
          <Eyebrow>Browse by language & genre</Eyebrow>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
            {[
              { name: 'Kannada', colors: ['#FF6B81', '#7F1D2E'] },
              { name: 'Hindi', colors: ['#FF9F45', '#B45309'] },
              { name: 'English', colors: ['#5B6EE1', '#1E293B'] },
              { name: 'Bollywood', colors: ['#F472B6', '#831843'] },
              { name: 'Tamil', colors: ['#2DD9C8', '#0F766E'] },
              { name: 'Telugu', colors: ['#A78BFA', '#312E81'] },
              { name: 'Devotional', colors: ['#34D399', '#065F46'] },
              { name: 'Classical', colors: ['#8B5CF6', '#4C1D95'] },
              { name: 'Lo-Fi', colors: ['#5B6EE1', '#1E293B'] },
              { name: 'Jazz', colors: ['#FF9F45', '#B45309'] },
              { name: 'Pop', colors: ['#F472B6', '#831843'] },
              { name: 'Rock', colors: ['#FF6B81', '#7F1D2E'] },
            ].map((cat) => (
              <button
                key={cat.name}
                onClick={() => setQuery(cat.name)}
                className="h-24 rounded-2xl p-4 text-left font-bold text-white text-sm relative overflow-hidden"
                style={{ background: `linear-gradient(135deg, ${cat.colors[0]}, ${cat.colors[1]})` }}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </>
      )}

      {q && (
        <div>
          <Eyebrow>{loading ? "Searching YouTube..." : `${results.length} results for "${query}"`}</Eyebrow>
          <div className="flex flex-col gap-0.5 mt-3">
            {results.map((s, i) => (
              <SongRow
                key={s.id}
                song={s}
                index={i + 1}
                showIndex={false}
                isActive={false}
                isPlaying={false}
                liked={liked.has(s.id)}
                onPlay={() => onPlaySong(s, results)}
                onLike={onLike}
                onQueue={onQueue}
                onAddToPlaylist={onAddToPlaylist}
              />
            ))}
            {!loading && results.length === 0 && <div className="text-sm text-[#7d7891]">No matches. Try a different search.</div>}
          </div>
        </div>
      )}
    </div>
  );
}
function LibraryView({ playlists, onOpenPlaylist, onOpenArtist }) {
  const [tab, setTab] = useState("playlists");
  const tabs = ["playlists", "artists", "albums"];
  return (
    <div>
      <h1 className="text-2xl font-black text-[#EDEBF7] tracking-tight mb-5">Your Library</h1>
      <div className="flex gap-2 mb-6">
        {tabs.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold capitalize transition-colors ${
              tab === t ? "bg-[#EDEBF7] text-[#08070C]" : "bg-white/[0.06] text-[#c9c6d8] hover:bg-white/10"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "playlists" && (
        playlists.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
            {playlists.map((p) => (
              <button key={p.id} onClick={() => onOpenPlaylist(p.id)} className="text-left group">
                <div className="rounded-xl overflow-hidden mb-2"><CoverArt colors={p.cover} /></div>
                <div className="text-sm font-semibold text-[#EDEBF7] truncate">{p.name}</div>
                <div className="text-xs text-[#9490A8]">{p.songs?.length || 0} songs</div>
              </button>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <ListPlus className="w-16 h-16 text-[#9490A8] mb-4" />
            <h2 className="text-xl font-bold text-[#EDEBF7] mb-2">No playlists yet</h2>
            <p className="text-sm text-[#7d7891] max-w-sm">
              Create your first playlist and start building your collection.
            </p>
          </div>
        )
      )}
      {tab === "artists" && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
          {ARTISTS.map((a) => (
            <button key={a} onClick={() => onOpenArtist(a)} className="text-center group">
              <CoverArt colors={PALETTE_BY_ARTIST[a]} rounded="rounded-full" size="w-full aspect-square" icon={false} />
              <div className="text-sm font-semibold text-[#EDEBF7] mt-2 truncate">{a}</div>
              <div className="text-xs text-[#9490A8]">Artist</div>
            </button>
          ))}
        </div>
      )}
      {tab === "albums" && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
          {ARTISTS.map((a) => (
            <div key={a}>
              <CoverArt colors={PALETTE_BY_ARTIST[a]} rounded="rounded-xl" />
              <div className="text-sm font-semibold text-[#EDEBF7] mt-2 truncate">{a} — Sessions Vol. 1</div>
              <div className="text-xs text-[#9490A8]">{a}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function PlaylistView({ playlist, songs, onBack, onPlaySong, activeSong, isPlaying, liked, onLike, onQueue, onUpdatePlaylist }) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(playlist.name);
  const [desc, setDesc] = useState(playlist.desc);
  const total = songs.reduce((a, s) => a + s.duration, 0);
  const genreCounts = songs.reduce((acc, s) => { acc[s.genre] = (acc[s.genre] || 0) + 1; return acc; }, {});
  const topGenre = Object.entries(genreCounts).sort((a, b) => b[1] - a[1])[0]?.[0];

  function save() {
    onUpdatePlaylist(playlist.id, { name: name.trim() || playlist.name, desc: desc.trim() });
    setEditing(false);
  }

  return (
    <div>
      <button onClick={onBack} className="flex items-center gap-1.5 text-xs text-[#9490A8] hover:text-[#EDEBF7] mb-6">
        <ArrowLeft className="w-3.5 h-3.5" /> Back
      </button>
      <div className="flex items-end gap-6 mb-6 flex-col sm:flex-row">
        <CoverArt colors={playlist.cover} size="w-40 h-40" rounded="rounded-2xl" />
        <div className="flex-1 w-full">
          <div className="flex items-center gap-2 mb-1">
            <Eyebrow>{playlist.collaborative ? "Collaborative Playlist" : "Playlist"}</Eyebrow>
          </div>
          {editing ? (
            <div className="flex flex-col gap-2 max-w-md">
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="bg-white/[0.06] border border-white/10 rounded-lg px-3 py-2 text-2xl font-black text-[#EDEBF7] outline-none focus:border-[#8B5CF6]/60"
              />
              <textarea
                value={desc}
                onChange={(e) => setDesc(e.target.value)}
                rows={2}
                className="bg-white/[0.06] border border-white/10 rounded-lg px-3 py-2 text-sm text-[#EDEBF7] outline-none focus:border-[#8B5CF6]/60 resize-none"
              />
              <div className="flex gap-2">
                <button onClick={save} className="px-4 py-1.5 rounded-full bg-[#8B5CF6] text-white text-xs font-semibold">Save</button>
                <button onClick={() => setEditing(false)} className="px-4 py-1.5 rounded-full text-xs font-semibold text-[#9490A8] hover:text-[#EDEBF7]">Cancel</button>
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-2">
                <h1 className="text-4xl font-black text-[#EDEBF7] tracking-tight mb-2">{playlist.name}</h1>
                <button onClick={() => setEditing(true)} className="text-[#9490A8] hover:text-[#EDEBF7] mb-2"><Pencil className="w-4 h-4" /></button>
              </div>
              <p className="text-sm text-[#9490A8] mb-1">{playlist.desc}</p>
              <p className="text-xs text-[#7d7891]">{songs.length} songs · {Math.round(total / 60)} min{topGenre ? ` · mostly ${topGenre}` : ""}</p>
            </>
          )}
        </div>
      </div>

      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => songs.length && onPlaySong(songs[0], songs)}
          className="w-12 h-12 rounded-full bg-[#2DD9C8] flex items-center justify-center hover:scale-105 transition-transform shadow-[0_0_24px_rgba(45,217,200,0.4)]"
        >
          <Play className="w-5 h-5 text-black fill-black ml-0.5" />
        </button>
        <button
          onClick={() => onUpdatePlaylist(playlist.id, { collaborative: !playlist.collaborative })}
          className={`flex items-center gap-2 px-4 py-2 rounded-full border text-xs font-semibold transition-colors ${
            playlist.collaborative ? "border-[#2DD9C8]/60 text-[#2DD9C8]" : "border-white/15 text-[#9490A8] hover:text-[#EDEBF7]"
          }`}
        >
          <Users className="w-3.5 h-3.5" /> {playlist.collaborative ? "Collaborative on" : "Make collaborative"}
        </button>
        <button
          onClick={() => onUpdatePlaylist(playlist.id, { isPublic: !(playlist.isPublic ?? true) })}
          className="px-4 py-2 rounded-full border border-white/15 text-xs font-semibold text-[#9490A8] hover:text-[#EDEBF7]"
        >
          {(playlist.isPublic ?? true) ? "Public" : "Private"}
        </button>
      </div>

      <div className="flex flex-col gap-0.5">
        {songs.map((s, i) => (
          <SongRow
            key={s.id}
            song={s}
            index={i + 1}
            isActive={activeSong?.id === s.id}
            isPlaying={isPlaying}
            liked={liked.has(s.id)}
            onPlay={() => onPlaySong(s, songs)}
            onLike={onLike}
            onQueue={onQueue}
          />
        ))}
        {songs.length === 0 && <div className="text-sm text-[#7d7891] mt-2">No songs yet — add some from search or an album.</div>}
      </div>
    </div>
  );
}

function LikedView({ likedSongs, activeSong, isPlaying, liked, onPlaySong, onLike, onQueue, onAddToPlaylist }) {
  return (
    <div>
      <div className="flex items-end gap-6 mb-8">
        <div className="w-40 h-40 rounded-2xl bg-gradient-to-br from-[#FF6B81] to-[#7F1D2E] flex items-center justify-center shrink-0">
          <Heart className="w-14 h-14 text-white fill-white" />
        </div>
        <div>
          <Eyebrow>Playlist</Eyebrow>
          <h1 className="text-4xl font-black text-[#EDEBF7] tracking-tight mb-2">Liked Songs</h1>
          <p className="text-xs text-[#7d7891]">{likedSongs.length} songs</p>
        </div>
      </div>
      <div className="flex flex-col gap-0.5">
        {likedSongs.map((s, i) => (
          <SongRow
            key={s.id}
            song={s}
            index={i + 1}
            isActive={activeSong?.id === s.id}
            isPlaying={isPlaying}
            liked={liked.has(s.id)}
            onPlay={() => onPlaySong(s, likedSongs)}
            onLike={onLike}
            onQueue={onQueue}
            onAddToPlaylist={onAddToPlaylist}
          />
        ))}
        {likedSongs.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Heart className="w-16 h-16 text-[#9490A8] mb-4" />
            <h2 className="text-xl font-bold text-[#EDEBF7] mb-2">No liked songs yet</h2>
            <p className="text-sm text-[#7d7891] max-w-sm">
              Songs you like will show up here. Tap the heart on any track to add it to your Liked Songs.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function PremiumView() {
  const tiers = [
    { name: "Free", price: "$0", features: ["Shuffle play", "Ads between songs", "Standard audio"] },
    { name: "Premium", price: "$10.99/mo", features: ["Ad-free listening", "Offline downloads", "Hi-fi audio", "Unlimited skips"], highlight: true },
    { name: "Family", price: "$16.99/mo", features: ["6 premium accounts", "Parental controls", "Blend playlists"] },
  ];
  return (
    <div>
      <Eyebrow>Premium</Eyebrow>
      <h1 className="text-3xl font-black text-[#EDEBF7] tracking-tight mb-8">Listen without limits.</h1>
      <div className="grid sm:grid-cols-3 gap-5">
        {tiers.map((t) => (
          <Glass key={t.name} className={`rounded-2xl p-6 flex flex-col ${t.highlight ? "border-[#8B5CF6]/60" : ""}`}>
            {t.highlight && <div className="text-[10px] font-bold tracking-widest uppercase text-[#8B5CF6] mb-2">Most popular</div>}
            <div className="text-lg font-bold text-[#EDEBF7] mb-1">{t.name}</div>
            <div className="text-2xl font-black text-[#EDEBF7] mb-4">{t.price}</div>
            <div className="flex flex-col gap-2 mb-6 flex-1">
              {t.features.map((f) => (
                <div key={f} className="flex items-center gap-2 text-xs text-[#c9c6d8]">
                  <Check className="w-3.5 h-3.5 text-[#2DD9C8] shrink-0" /> {f}
                </div>
              ))}
            </div>
            <button className={`py-2.5 rounded-full text-sm font-semibold transition-opacity ${t.highlight ? "bg-gradient-to-r from-[#8B5CF6] to-[#2DD9C8] text-white hover:opacity-90" : "border border-white/15 text-[#EDEBF7] hover:bg-white/5"}`}>
              {t.name === "Free" ? "Current plan" : "Upgrade"}
            </button>
          </Glass>
        ))}
      </div>
    </div>
  );
}

function SettingsView() {
  const [quality, setQuality] = useState("High");
  const [crossfade, setCrossfade] = useState(4);
  return (
    <div className="max-w-xl">
      <h1 className="text-2xl font-black text-[#EDEBF7] tracking-tight mb-6">Settings</h1>

      <Eyebrow>Playback</Eyebrow>
      <Glass className="rounded-2xl p-5 mb-6">
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm text-[#EDEBF7]">Streaming quality</span>
          <div className="flex gap-1.5">
            {["Low", "Normal", "High", "Hi-Fi"].map((q) => (
              <button
                key={q}
                onClick={() => setQuality(q)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${quality === q ? "bg-[#8B5CF6] text-white" : "bg-white/[0.06] text-[#9490A8]"}`}
              >
                {q}
              </button>
            ))}
          </div>
        </div>
        <div className="mb-1 flex items-center justify-between">
          <span className="text-sm text-[#EDEBF7]">Crossfade</span>
          <span className="text-xs text-[#9490A8]">{crossfade}s</span>
        </div>
        <input
          type="range" min="0" max="12" value={crossfade}
          onChange={(e) => setCrossfade(e.target.value)}
          className="w-full accent-[#8B5CF6]"
        />
      </Glass>

      <Eyebrow>Account</Eyebrow>
      <Glass className="rounded-2xl p-5 mb-6 flex flex-col gap-3">
        {["Private session", "Explicit content", "Show friend activity"].map((s) => (
          <label key={s} className="flex items-center justify-between text-sm text-[#EDEBF7]">
            {s}
            <input type="checkbox" defaultChecked={s !== "Private session"} className="accent-[#8B5CF6] w-4 h-4" />
          </label>
        ))}
      </Glass>
    </div>
  );
}

function DownloadsView() {
  return (
    <div>
      <h1 className="text-2xl font-black text-[#EDEBF7] tracking-tight mb-6">Downloads</h1>
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <Clock className="w-16 h-16 text-[#9490A8] mb-4" />
        <h2 className="text-xl font-bold text-[#EDEBF7] mb-2">Coming Soon</h2>
        <p className="text-sm text-[#7d7891] max-w-sm">
          Actual downloading is not currently supported for YouTube streams. Downloads will be available soon!
        </p>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/*  Player bar + Queue/Lyrics panel                                        */
/* ---------------------------------------------------------------------- */

function HistoryView({ history, activeSong, isPlaying, liked, onPlaySong, onLike, onQueue, onAddToPlaylist }) {
  return (
    <div>
      <h1 className="text-2xl font-black text-[#EDEBF7] tracking-tight mb-1">Listening History</h1>
      <p className="text-sm text-[#9490A8] mb-6">Everything you've played this session, most recent first.</p>
      <div className="flex flex-col gap-0.5">
        {history.map((s, i) => (
          <SongRow
            key={s.id + i}
            song={s}
            index={i + 1}
            showIndex={false}
            isActive={activeSong?.id === s.id}
            isPlaying={isPlaying}
            liked={liked.has(s.id)}
            onPlay={() => onPlaySong(s, history)}
            onLike={onLike}
            onQueue={onQueue}
            onAddToPlaylist={onAddToPlaylist}
          />
        ))}
        {history.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <HistoryIcon className="w-16 h-16 text-[#9490A8] mb-4" />
            <h2 className="text-xl font-bold text-[#EDEBF7] mb-2">No history yet</h2>
            <p className="text-sm text-[#7d7891] max-w-sm">
              Nothing played yet — start listening to some songs and they'll show up here.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function PodcastsView({ onOpenPodcast }) {
  return (
    <div>
      <h1 className="text-2xl font-black text-[#EDEBF7] tracking-tight mb-1">Podcasts</h1>
      <p className="text-sm text-[#9490A8] mb-6">Shows worth the commute.</p>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-5">
        {PODCASTS.map((p) => (
          <button key={p.id} onClick={() => onOpenPodcast(p.id)} className="text-left group">
            <div className="rounded-xl overflow-hidden mb-2"><CoverArt colors={p.colors} /></div>
            <div className="text-sm font-semibold text-[#EDEBF7] truncate">{p.title}</div>
            <div className="text-xs text-[#9490A8] truncate">{p.host}</div>
          </button>
        ))}
      </div>
    </div>
  );
}

function PodcastDetailView({ podcast, onBack, onPlayEpisode, activeEpisodeId, isPlaying }) {
  return (
    <div>
      <button onClick={onBack} className="flex items-center gap-1.5 text-xs text-[#9490A8] hover:text-[#EDEBF7] mb-6">
        <ArrowLeft className="w-3.5 h-3.5" /> Back
      </button>
      <div className="flex items-end gap-6 mb-8 flex-col sm:flex-row">
        <CoverArt colors={podcast.colors} size="w-40 h-40" rounded="rounded-2xl" />
        <div>
          <Eyebrow>Podcast · {podcast.category}</Eyebrow>
          <h1 className="text-3xl font-black text-[#EDEBF7] tracking-tight mb-2">{podcast.title}</h1>
          <p className="text-sm text-[#9490A8] mb-1 max-w-md">{podcast.desc}</p>
          <p className="text-xs text-[#7d7891]">Hosted by {podcast.host}</p>
        </div>
      </div>
      <button className="flex items-center gap-2 px-5 py-2 rounded-full border border-white/15 text-sm font-semibold text-[#EDEBF7] hover:bg-white/5 mb-6 w-fit">
        <Plus className="w-4 h-4" /> Follow
      </button>
      <Eyebrow>Episodes</Eyebrow>
      <div className="flex flex-col gap-1 mt-2">
        {podcast.episodes.map((ep) => (
          <button
            key={ep.id}
            onClick={() => onPlayEpisode(ep, podcast)}
            className={`text-left flex items-center gap-4 px-3 py-3 rounded-xl transition-colors ${activeEpisodeId === ep.id ? "bg-white/[0.07]" : "hover:bg-white/[0.04]"}`}
          >
            <div className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center shrink-0">
              {activeEpisodeId === ep.id && isPlaying ? <Pause className="w-3.5 h-3.5 text-[#2DD9C8] fill-[#2DD9C8]" /> : <Play className="w-3.5 h-3.5 text-[#EDEBF7] fill-[#EDEBF7] ml-0.5" />}
            </div>
            <div className="min-w-0 flex-1">
              <div className={`text-sm font-medium truncate ${activeEpisodeId === ep.id ? "text-[#2DD9C8]" : "text-[#EDEBF7]"}`}>{ep.title}</div>
              <div className="text-xs text-[#9490A8] truncate">{ep.date} · {ep.desc}</div>
            </div>
            <div className="text-xs text-[#7d7891] shrink-0">{fmtTime(ep.duration)}</div>
          </button>
        ))}
      </div>
    </div>
  );
}

function AudiobooksView({ onOpenBook }) {
  return (
    <div>
      <h1 className="text-2xl font-black text-[#EDEBF7] tracking-tight mb-1">Audiobooks</h1>
      <p className="text-sm text-[#9490A8] mb-6">Pick up where you left off.</p>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
        {AUDIOBOOKS.map((b) => {
          const pct = Math.round((b.progressMinutes / b.totalMinutes) * 100);
          return (
            <button key={b.id} onClick={() => onOpenBook(b.id)} className="text-left group">
              <div className="rounded-xl overflow-hidden mb-2 relative"><CoverArt colors={b.colors} /></div>
              <div className="text-sm font-semibold text-[#EDEBF7] truncate">{b.title}</div>
              <div className="text-xs text-[#9490A8] truncate mb-1.5">{b.author}</div>
              {pct > 0 && (
                <div className="h-1 rounded-full bg-white/10 overflow-hidden">
                  <div className="h-full bg-[#2DD9C8] rounded-full" style={{ width: `${pct}%` }} />
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function AudiobookDetailView({ book, onBack, onPlayChapter, activeChapterId, isPlaying }) {
  const pct = Math.round((book.progressMinutes / book.totalMinutes) * 100);
  return (
    <div>
      <button onClick={onBack} className="flex items-center gap-1.5 text-xs text-[#9490A8] hover:text-[#EDEBF7] mb-6">
        <ArrowLeft className="w-3.5 h-3.5" /> Back
      </button>
      <div className="flex items-end gap-6 mb-6 flex-col sm:flex-row">
        <CoverArt colors={book.colors} size="w-40 h-40" rounded="rounded-2xl" />
        <div>
          <Eyebrow>Audiobook</Eyebrow>
          <h1 className="text-3xl font-black text-[#EDEBF7] tracking-tight mb-2">{book.title}</h1>
          <p className="text-sm text-[#9490A8] mb-1 max-w-md">{book.desc}</p>
          <p className="text-xs text-[#7d7891]">By {book.author} · Narrated by {book.narrator}</p>
        </div>
      </div>
      {pct > 0 && (
        <div className="max-w-sm mb-6">
          <div className="flex justify-between text-xs text-[#9490A8] mb-1.5">
            <span>{pct}% complete</span>
            <span>{book.progressMinutes} of {book.totalMinutes} min</span>
          </div>
          <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
            <div className="h-full bg-[#2DD9C8] rounded-full" style={{ width: `${pct}%` }} />
          </div>
        </div>
      )}
      <button 
        onClick={() => onPlayChapter(book.chapters[0], book)}
        className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-[#2DD9C8] text-black text-sm font-semibold mb-6 w-fit hover:opacity-90"
      >
        <Play className="w-4 h-4 fill-black" /> {pct > 0 ? "Resume" : "Start listening"}
      </button>
      <Eyebrow>Chapters</Eyebrow>
      <div className="flex flex-col gap-0.5 mt-2">
        {book.chapters.map((c, i) => (
          <button
            key={c.id}
            onClick={() => onPlayChapter(c, book)}
            className={`text-left flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors ${activeChapterId === c.id ? "bg-white/[0.07]" : "hover:bg-white/[0.04]"}`}
          >
            <div className="w-5 flex items-center justify-center shrink-0">
              {activeChapterId === c.id && isPlaying ? (
                <Pause className="w-3 h-3 text-[#2DD9C8] fill-[#2DD9C8]" />
              ) : activeChapterId === c.id ? (
                <Play className="w-3 h-3 text-[#2DD9C8] fill-[#2DD9C8]" />
              ) : (
                <span className="text-xs text-[#7d7891]">{i + 1}</span>
              )}
            </div>
            <span className={`text-sm flex-1 truncate ${activeChapterId === c.id ? "text-[#2DD9C8]" : "text-[#EDEBF7]"}`}>{c.title}</span>
            <span className="text-xs text-[#7d7891]">{c.minutes} min</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function ArtistView({ name, onBack, onPlaySong, activeSong, isPlaying, liked, onLike, onQueue }) {
  const colors = PALETTE_BY_ARTIST[name] || ['#8B5CF6', '#2DD9C8'];
  const localSongs = useMemo(() => SONGS.filter((s) => s.artist === name), [name]);
  const [topSongs, setTopSongs] = useState(localSongs);
  const [loading, setLoading] = useState(false);
  const listeners = useMemo(() => 800000 + (name.length * 61234) % 4200000, [name]);

  useEffect(() => {
    if (localSongs.length === 0) {
      setLoading(true);
      fetch(`/api/search?q=${encodeURIComponent(name)}`)
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) {
            setTopSongs(data);
          } else {
            setTopSongs([]);
          }
        })
        .catch(err => {
          console.error("Failed to fetch artist songs:", err);
          setTopSongs([]);
        })
        .finally(() => setLoading(false));
    } else {
      setTopSongs(localSongs);
    }
  }, [name, localSongs]);

  const bio = ARTIST_BIOS[name] || `Check out the top tracks and latest releases from ${name}. Stream their best hits and dive into their catalog.`;

  return (
    <div>
      <button onClick={onBack} className="flex items-center gap-1.5 text-xs text-[#9490A8] hover:text-[#EDEBF7] mb-6">
        <ArrowLeft className="w-3.5 h-3.5" /> Back
      </button>
      <div className="relative rounded-3xl overflow-hidden mb-6 h-52 flex items-end p-6" style={{ background: `linear-gradient(160deg, ${colors[0]}, ${colors[1]})` }}>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_75%_15%,rgba(255,255,255,0.25),transparent_55%)]" />
        <div className="relative">
          <div className="flex items-center gap-1.5 mb-1">
            <Check className="w-4 h-4 text-[#2DD9C8] bg-black/30 rounded-full p-0.5" />
            <span className="text-xs font-semibold text-white/80">Verified Artist</span>
          </div>
          <h1 className="text-4xl font-black text-white tracking-tight">{name}</h1>
          <p className="text-xs text-white/70 mt-1">{listeners.toLocaleString()} monthly listeners</p>
        </div>
      </div>
      <p className="text-sm text-[#9490A8] max-w-xl mb-6">{bio}</p>
      <button
        onClick={() => topSongs.length && onPlaySong(topSongs[0], topSongs)}
        className="w-12 h-12 rounded-full bg-[#2DD9C8] flex items-center justify-center mb-6 hover:scale-105 transition-transform shadow-[0_0_24px_rgba(45,217,200,0.4)]"
      >
        <Play className="w-5 h-5 text-black fill-black ml-0.5" />
      </button>
      <Eyebrow>Popular</Eyebrow>
      <div className="flex flex-col gap-0.5 mb-8">
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="w-6 h-6 border-2 border-[#2DD9C8] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : topSongs.length > 0 ? (
          topSongs.map((s, i) => (
            <SongRow
              key={s.id}
              song={s}
              index={i + 1}
              isActive={activeSong?.id === s.id}
              isPlaying={isPlaying}
              liked={liked.has(s.id)}
              onPlay={() => onPlaySong(s, topSongs)}
              onLike={onLike}
              onQueue={onQueue}
            />
          ))
        ) : (
          <p className="text-sm text-[#7d7891] py-4 text-center">No songs found for this artist.</p>
        )}
      </div>
      <Eyebrow>Similar artists</Eyebrow>
      <div className="flex gap-4 overflow-x-auto pb-2">
        {ARTISTS.filter((a) => a !== name).slice(0, 5).map((a) => (
          <div key={a} className="w-[130px] shrink-0 text-center">
            <CoverArt colors={PALETTE_BY_ARTIST[a]} rounded="rounded-full" icon={false} />
            <div className="text-xs font-medium text-[#EDEBF7] mt-2 truncate">{a}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function WrappedView({ likedSongs }) {
  const [card, setCard] = useState(0);
  const topArtist = ARTISTS[2];
  const cards = [
    {
      colors: PALETTE_BY_ARTIST["Nova Wren"],
      eyebrow: "Your SAREGAMA Wrapped",
      big: "2026",
      sub: "was a year in static, static, and more static. Let's look back.",
    },
    {
      colors: PALETTE_BY_ARTIST["Marigold Hex"],
      eyebrow: "Minutes listened",
      big: "38,214",
      sub: "That's roughly 26 straight days of music.",
    },
    {
      colors: PALETTE_BY_ARTIST["The Low Frequency"],
      eyebrow: "Top genre",
      big: "Dreamwave",
      sub: "Nearly a third of your listening lived here.",
    },
    {
      colors: PALETTE_BY_ARTIST[topArtist],
      eyebrow: "Top artist",
      big: topArtist,
      sub: "You kept coming back, week after week.",
    },
    {
      colors: PALETTE_BY_ARTIST["Sable & Stone"],
      eyebrow: "Listening streak",
      big: "47 days",
      sub: "Your longest run without missing a day.",
    },
    {
      colors: PALETTE_BY_ARTIST["Ceramic Youth"],
      eyebrow: "Songs you liked",
      big: String(likedSongs.length || 0),
      sub: likedSongs.length ? "Saved straight to Liked Songs." : "Start liking tracks to fill this in.",
    },
  ];
  const c = cards[card];

  return (
    <div className="flex flex-col items-center">
      <div
        className="w-full max-w-sm h-[480px] rounded-3xl relative overflow-hidden flex flex-col justify-end p-8 cursor-pointer select-none shadow-2xl"
        style={{ background: `linear-gradient(155deg, ${c.colors[0]}, ${c.colors[1]})` }}
        onClick={() => setCard((card + 1) % cards.length)}
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(255,255,255,0.3),transparent_50%)]" />
        <div className="absolute top-5 left-5 right-5 flex gap-1.5">
          {cards.map((_, i) => (
            <div key={i} className={`h-[3px] flex-1 rounded-full ${i <= card ? "bg-white" : "bg-white/25"}`} />
          ))}
        </div>
        <div className="relative">
          <div className="text-xs font-bold uppercase tracking-widest text-white/80 mb-2">{c.eyebrow}</div>
          <div className="text-5xl font-black text-white tracking-tight mb-3 leading-none">{c.big}</div>
          <p className="text-sm text-white/85 max-w-[85%]">{c.sub}</p>
        </div>
      </div>
      <p className="text-xs text-[#7d7891] mt-4">Tap the card to continue · card {card + 1} of {cards.length}</p>
      <button className="mt-4 flex items-center gap-2 px-5 py-2 rounded-full border border-white/15 text-xs font-semibold text-[#EDEBF7] hover:bg-white/5">
        <Sparkles className="w-3.5 h-3.5" /> Share this card
      </button>
    </div>
  );
}

function ProfileView({ playlists, likedSongs, history, user, onLogout }) {
  const totalMinutes = history.reduce((a, s) => a + (s.duration || 0), 0) / 60;
  return (
    <div>
      <div className="flex items-center gap-5 mb-8">
        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#FF9F45] to-[#B45309] flex items-center justify-center shrink-0">
          <User className="w-10 h-10 text-white" />
        </div>
        <div>
          <Eyebrow>Profile</Eyebrow>
          <h1 className="text-3xl font-black text-[#EDEBF7] tracking-tight mb-1">{user?.name || 'You'}</h1>
          <div className="text-sm text-[#9490A8] mb-2">{user?.email || ''}</div>
          <button
            onClick={onLogout}
            className="text-xs font-semibold px-4 py-1.5 rounded-full border border-white/10 text-[#9490A8] hover:text-[#FF6B81] hover:border-[#FF6B81]/40 transition-colors"
          >
            Logout
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-8 max-w-md">
        <Glass className="rounded-2xl p-4 text-center">
          <div className="text-xl font-black text-[#EDEBF7]">{Math.round(totalMinutes)}</div>
          <div className="text-[10px] uppercase tracking-wide text-[#9490A8] mt-1">Minutes played</div>
        </Glass>
        <Glass className="rounded-2xl p-4 text-center">
          <div className="text-xl font-black text-[#EDEBF7]">{likedSongs.length}</div>
          <div className="text-[10px] uppercase tracking-wide text-[#9490A8] mt-1">Liked songs</div>
        </Glass>
        <Glass className="rounded-2xl p-4 text-center">
          <div className="text-xl font-black text-[#EDEBF7]">{playlists.length}</div>
          <div className="text-[10px] uppercase tracking-wide text-[#9490A8] mt-1">Playlists</div>
        </Glass>
      </div>

      <Eyebrow>Public playlists</Eyebrow>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-5 mb-8">
        {playlists.map((p) => (
          <div key={p.id}>
            <CoverArt colors={p.cover} rounded="rounded-xl" />
            <div className="text-sm font-semibold text-[#EDEBF7] mt-2 truncate">{p.name}</div>
            <div className="text-xs text-[#9490A8]">{p.songs?.length || 0} songs</div>
          </div>
        ))}
      </div>

      <Eyebrow>Recently played</Eyebrow>
      <div className="flex flex-col gap-0.5">
        {history.slice(0, 5).map((s, i) => (
          <div key={s.id + i} className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-white/[0.04]">
            <CoverArt colors={s.colors} size="w-9 h-9" rounded="rounded-lg" />
            <div className="min-w-0">
              <div className="text-sm font-medium text-[#EDEBF7] truncate">{s.title}</div>
              <div className="text-xs text-[#9490A8] truncate">{s.artist}</div>
            </div>
          </div>
        ))}
        {history.length === 0 && <div className="text-xs text-[#7d7891]">Nothing played yet.</div>}
      </div>
    </div>
  );
}

function NotificationsDropdown({ onClose }) {
  const iconFor = (type) => {
    if (type === "release") return Sparkles;
    if (type === "playlist") return ListMusic;
    if (type === "friend") return Users;
    return Bell;
  };
  return (
    <div className="fixed inset-0 z-40" onClick={onClose}>
      <Glass className="absolute top-16 right-6 w-80 rounded-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="px-4 py-3 border-b border-white/10 text-sm font-bold text-[#EDEBF7]">Notifications</div>
        <div className="max-h-96 overflow-y-auto">
          {NOTIFICATIONS.map((n) => {
            const Icon = iconFor(n.type);
            return (
              <div key={n.id} className="flex gap-3 px-4 py-3 hover:bg-white/[0.04] border-b border-white/[0.04] last:border-0">
                <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                  <Icon className="w-3.5 h-3.5 text-[#2DD9C8]" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-semibold text-[#EDEBF7]">{n.title}</div>
                  <div className="text-xs text-[#9490A8] mt-0.5">{n.body}</div>
                  <div className="text-[10px] text-[#5f5b70] mt-1">{n.time} ago</div>
                </div>
              </div>
            );
          })}
        </div>
      </Glass>
    </div>
  );
}

function DeviceSwitcherModal({ activeDevice, onSelect, onClose }) {
  const iconFor = (t) => (t === "speaker" ? Speaker : t === "tv" ? Tv : t === "phone" ? Smartphone : Laptop2);
  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm px-4" onClick={onClose}>
      <Glass className="rounded-2xl p-5 w-full max-w-sm mb-4 sm:mb-0" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-[#EDEBF7]">Connect to a device</h3>
          <button onClick={onClose}><X className="w-4 h-4 text-[#9490A8]" /></button>
        </div>
        <div className="flex flex-col gap-1">
          {DEVICES.map((d) => {
            const Icon = iconFor(d.icon);
            const active = activeDevice === d.id;
            return (
              <button
                key={d.id}
                onClick={() => { onSelect(d.id); onClose(); }}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-colors ${active ? "bg-white/[0.08]" : "hover:bg-white/[0.04]"}`}
              >
                <Icon className="w-4 h-4 text-[#9490A8] shrink-0" />
                <span className="text-sm text-[#EDEBF7] flex-1">{d.name}</span>
                {active && <span className="text-[10px] uppercase tracking-wide text-[#2DD9C8] font-semibold">Active</span>}
              </button>
            );
          })}
        </div>
      </Glass>
    </div>
  );
}

function SleepTimerModal({ value, onSelect, onClose }) {
  const options = [null, 15, 30, 45, 60];
  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm px-4" onClick={onClose}>
      <Glass className="rounded-2xl p-5 w-full max-w-sm mb-4 sm:mb-0" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-[#EDEBF7] flex items-center gap-2"><Moon className="w-4 h-4" /> Sleep timer</h3>
          <button onClick={onClose}><X className="w-4 h-4 text-[#9490A8]" /></button>
        </div>
        <div className="flex flex-col gap-1">
          {options.map((m) => (
            <button
              key={m ?? "off"}
              onClick={() => { onSelect(m); onClose(); }}
              className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-sm transition-colors ${value === m ? "bg-white/[0.08] text-[#2DD9C8]" : "text-[#EDEBF7] hover:bg-white/[0.04]"}`}
            >
              {m ? `${m} minutes` : "Off"}
              {value === m && <Check className="w-4 h-4" />}
            </button>
          ))}
        </div>
      </Glass>
    </div>
  );
}

function EqualizerModal({ onClose, bands, setBands }) {
  const [preset, setPreset] = useState("Flat");
  const presetValues = {
    "Flat": { bass: 0, mid: 0, treble: 0 },
    "Bass Boost": { bass: 8, mid: 0, treble: -2 },
    "Vocal": { bass: -3, mid: 6, treble: 2 },
    "Treble Boost": { bass: -2, mid: 0, treble: 8 },
  };
  const presets = Object.keys(presetValues);

  function applyPreset(name) {
    setPreset(name);
    setBands(presetValues[name]);
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm px-4" onClick={onClose}>
      <Glass className="rounded-2xl p-5 w-full max-w-sm mb-4 sm:mb-0" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-[#EDEBF7] flex items-center gap-2"><SlidersHorizontal className="w-4 h-4" /> Equalizer</h3>
          <button onClick={onClose}><X className="w-4 h-4 text-[#9490A8]" /></button>
        </div>
        <div className="flex gap-1.5 mb-5 flex-wrap">
          {presets.map((p) => (
            <button key={p} onClick={() => applyPreset(p)} className={`px-3 py-1 rounded-full text-xs font-medium ${preset === p ? "bg-[#8B5CF6] text-white" : "bg-white/[0.06] text-[#9490A8]"}`}>
              {p}
            </button>
          ))}
        </div>
        {["bass", "mid", "treble"].map((band) => (
          <div key={band} className="mb-4">
            <div className="flex justify-between text-xs mb-1">
              <span className="capitalize text-[#EDEBF7]">{band}</span>
              <span className="text-[#9490A8]">{bands[band] > 0 ? "+" : ""}{bands[band]} dB</span>
            </div>
            <input
              type="range" min="-10" max="10" value={bands[band]}
              onChange={(e) => { setPreset("Custom"); setBands((b) => ({ ...b, [band]: +e.target.value })); }}
              className="w-full accent-[#8B5CF6]"
            />
          </div>
        ))}
      </Glass>
    </div>
  );
}

function NowPlayingScreen({ song, isPlaying, progress, onToggle, onNext, onPrev, liked, onLike, onClose, panel, setPanel, shuffle, setShuffle, repeat, setRepeat, onOpenDevices, onOpenSleep, onOpenEq }) {
  if (!song) return null;
  const pct = (progress / song.duration) * 100;
  return (
    <div className="fixed inset-0 z-[70] flex flex-col text-[#EDEBF7]">
      <Aura colors={song.colors} />
      <div className="flex items-center justify-between px-6 pt-6">
        <button onClick={onClose} className="text-[#9490A8] hover:text-[#EDEBF7]"><Minimize2 className="w-5 h-5" /></button>
        <span className="text-xs font-semibold uppercase tracking-widest text-[#9490A8]">Now Playing</span>
        <button onClick={onOpenDevices} className="text-[#9490A8] hover:text-[#EDEBF7]"><Speaker className="w-5 h-5" /></button>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-8">
        <CoverArt colors={song.colors} size="w-full max-w-xs aspect-square" rounded="rounded-3xl" />
        <div className="w-full max-w-xs mt-8">
          <div className="flex items-center justify-between mb-1">
            <div className="min-w-0">
              <div className="text-xl font-black text-[#EDEBF7] truncate">{song.title}</div>
              <div className="text-sm text-[#9490A8] truncate">{song.artist}</div>
            </div>
            <button onClick={() => onLike(song)} className="shrink-0 ml-3">
              <Heart className={`w-5 h-5 ${liked ? "fill-[#FF6B81] text-[#FF6B81]" : "text-[#9490A8]"}`} />
            </button>
          </div>

          <div className="mt-6">
            <input
              type="range"
              min="0"
              max={song.duration || 0}
              step="0.1"
              value={progress}
              onChange={(e) => {
                const t = +e.target.value;
                if (window.__bablooAudioRef) window.__bablooAudioRef.currentTime = t;
              }}
              className="w-full h-1 accent-[#EDEBF7] cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-[#7d7891] mt-1.5">
              <span>{fmtTime(progress)}</span>
              <span>{fmtTime(song.duration)}</span>
            </div>
          </div>

          <div className="flex items-center justify-between mt-6">
            <button onClick={() => setShuffle(!shuffle)} className={shuffle ? "text-[#2DD9C8]" : "text-[#9490A8]"}><Shuffle className="w-4 h-4" /></button>
            <button onClick={onPrev} className="text-[#EDEBF7]"><SkipBack className="w-6 h-6" /></button>
            <button onClick={onToggle} className="w-14 h-14 rounded-full bg-white flex items-center justify-center">
              {isPlaying ? <Pause className="w-6 h-6 text-black fill-black" /> : <Play className="w-6 h-6 text-black fill-black ml-0.5" />}
            </button>
            <button onClick={onNext} className="text-[#EDEBF7]"><SkipForward className="w-6 h-6" /></button>
            <button onClick={() => setRepeat((repeat + 1) % 3)} className={repeat ? "text-[#2DD9C8]" : "text-[#9490A8]"}><Repeat className="w-4 h-4" /></button>
          </div>

          <div className="flex items-center justify-center gap-8 mt-8">
            <button onClick={() => setPanel(panel === "lyrics" ? null : "lyrics")} className={panel === "lyrics" ? "text-[#2DD9C8]" : "text-[#9490A8]"}>
              <Mic2 className="w-5 h-5" />
            </button>
            <button onClick={() => setPanel(panel === "queue" ? null : "queue")} className={panel === "queue" ? "text-[#2DD9C8]" : "text-[#9490A8]"}>
              <ListMusic className="w-5 h-5" />
            </button>
            <button onClick={onOpenSleep} className="text-[#9490A8] hover:text-[#EDEBF7]"><Moon className="w-5 h-5" /></button>
            <button onClick={onOpenEq} className="text-[#9490A8] hover:text-[#EDEBF7]"><SlidersHorizontal className="w-5 h-5" /></button>
          </div>
        </div>
      </div>
    </div>
  );
}

function VolumeIcon({ vol }) {
  if (vol === 0) return <VolumeX className="w-4 h-4" />;
  if (vol < 50) return <Volume1 className="w-4 h-4" />;
  return <Volume2 className="w-4 h-4" />;
}

function PlayerBar({ song, isPlaying, progress, onToggle, onNext, onPrev, liked, onLike, panel, setPanel, shuffle, setShuffle, repeat, setRepeat, onExpand, vol, setVol }) {
  if (!song) return null;
  const pct = (progress / song.duration) * 100;

  return (
    <Glass className="rounded-2xl mx-2 md:mx-3 mb-2 md:mb-3 px-3 md:px-4 py-2 md:py-3 flex items-center justify-between md:justify-start gap-2 md:gap-4 cursor-pointer md:cursor-auto" onClick={(e) => {
      // Expand player on mobile when clicking the bar
      if (window.innerWidth < 768) {
        onExpand();
      }
    }}>
      {/* Left side (Song Info) */}
      <div className="flex items-center gap-3 w-auto md:w-1/4 md:min-w-[180px] flex-1 min-w-0">
        <button onClick={(e) => { e.stopPropagation(); onExpand(); }} className="shrink-0">
          <CoverArt colors={song.colors} size="w-10 h-10 md:w-12 md:h-12" rounded="rounded-lg md:rounded-lg" />
        </button>
        <div className="min-w-0 flex-1 flex flex-col justify-center">
          <div className="text-sm font-semibold text-[#EDEBF7] truncate">{song.title}</div>
          <div className="text-xs text-[#9490A8] truncate">{song.artist}</div>
        </div>
        <button onClick={(e) => { e.stopPropagation(); onLike(song); }} className="hidden md:block">
          <Heart className={`w-4 h-4 shrink-0 ${liked ? "fill-[#FF6B81] text-[#FF6B81]" : "text-[#9490A8]"}`} />
        </button>
      </div>

      {/* Center (Controls) - Hidden on Mobile */}
      <div className="hidden md:flex flex-1 flex-col items-center gap-1.5 max-w-xl mx-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-5">
          <button onClick={() => setShuffle(!shuffle)} className={shuffle ? "text-[#2DD9C8]" : "text-[#9490A8] hover:text-[#EDEBF7]"}>
            <Shuffle className="w-4 h-4" />
          </button>
          <button onClick={onPrev} className="text-[#EDEBF7] hover:scale-110 transition-transform"><SkipBack className="w-4.5 h-4.5" /></button>
          <button
            onClick={onToggle}
            className="w-9 h-9 rounded-full bg-white flex items-center justify-center hover:scale-105 transition-transform"
          >
            {isPlaying ? <Pause className="w-4 h-4 text-black fill-black" /> : <Play className="w-4 h-4 text-black fill-black ml-0.5" />}
          </button>
          <button onClick={onNext} className="text-[#EDEBF7] hover:scale-110 transition-transform"><SkipForward className="w-4.5 h-4.5" /></button>
          <button onClick={() => setRepeat((repeat + 1) % 3)} className={repeat ? "text-[#2DD9C8]" : "text-[#9490A8] hover:text-[#EDEBF7]"}>
            <Repeat className="w-4 h-4" />
            {repeat === 2 && <span className="text-[8px] absolute -mt-2 ml-1">1</span>}
          </button>
        </div>
        <div className="flex items-center gap-2 w-full">
          <span className="text-[10px] text-[#7d7891] w-8 text-right">{fmtTime(progress)}</span>
          <input
            type="range"
            min="0"
            max={song.duration || 0}
            step="0.1"
            value={progress}
            onChange={(e) => {
              const t = +e.target.value;
              if (window.__bablooAudioRef) window.__bablooAudioRef.currentTime = t;
            }}
            className="flex-1 h-1 accent-[#EDEBF7] cursor-pointer"
          />
          <span className="text-[10px] text-[#7d7891] w-8">{fmtTime(song.duration)}</span>
        </div>
      </div>

      {/* Right (Extra Tools) - Hidden on Mobile */}
      <div className="hidden md:flex items-center gap-3 w-1/4 min-w-[160px] justify-end" onClick={(e) => e.stopPropagation()}>
        <button onClick={() => setPanel(panel === "lyrics" ? null : "lyrics")} className={panel === "lyrics" ? "text-[#2DD9C8]" : "text-[#9490A8] hover:text-[#EDEBF7]"}>
          <Mic2 className="w-4 h-4" />
        </button>
        <button onClick={() => setPanel(panel === "queue" ? null : "queue")} className={panel === "queue" ? "text-[#2DD9C8]" : "text-[#9490A8] hover:text-[#EDEBF7]"}>
          <ListMusic className="w-4 h-4" />
        </button>
        <button onClick={() => setPanel(panel === "devices" ? null : "devices")} className={panel === "devices" ? "text-[#2DD9C8]" : "text-[#9490A8] hover:text-[#EDEBF7]"}>
          <Speaker className="w-4 h-4" />
        </button>
        <div className="flex items-center gap-1.5 w-24 group relative">
          <VolumeIcon vol={vol} />
          <input
            type="range"
            min="0"
            max="100"
            value={vol}
            onChange={(e) => setVol(+e.target.value)}
            className="flex-1 h-1 accent-[#EDEBF7] cursor-pointer opacity-80 group-hover:opacity-100"
          />
        </div>
      </div>

      {/* Mobile Right Controls (Play/Pause/Like) */}
      <div className="flex md:hidden items-center gap-3 shrink-0 pr-1">
        <button onClick={(e) => { e.stopPropagation(); onLike(song); }} className="p-1">
          <Heart className={`w-5 h-5 ${liked ? "fill-[#FF6B81] text-[#FF6B81]" : "text-[#9490A8]"}`} />
        </button>
        <button onClick={(e) => { e.stopPropagation(); onToggle(); }} className="p-1 text-white">
          {isPlaying ? <Pause className="w-6 h-6 fill-white" /> : <Play className="w-6 h-6 fill-white ml-0.5" />}
        </button>
      </div>
    </Glass>
  );
}

function SidePanel({ panel, setPanel, queue, song, progress, onRemoveFromQueue, onPlayFromQueue }) {
  if (!panel) return null;
  const activeLine = song ? Math.min(Math.floor((progress / song.duration) * song.lyrics.length), song.lyrics.length - 1) : 0;

  return (
    <Glass className="hidden lg:flex flex-col w-80 rounded-3xl m-3 ml-0 overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
        <span className="text-sm font-bold text-[#EDEBF7] capitalize">
          {panel === "queue" ? "Up Next" : panel === "activity" ? "Friend Activity" : "Lyrics"}
        </span>
        <button onClick={() => setPanel(null)} className="text-[#9490A8] hover:text-[#EDEBF7]"><X className="w-4 h-4" /></button>
      </div>

      {panel === "queue" && (
        <div className="flex-1 overflow-y-auto p-3">
          {song && (
            <div className="mb-3">
              <Eyebrow>Now Playing</Eyebrow>
              <div className="flex items-center gap-3 px-2 py-1.5 rounded-lg bg-white/[0.05]">
                <CoverArt colors={song.colors} size="w-9 h-9" rounded="rounded-lg" />
                <div className="min-w-0">
                  <div className="text-sm font-medium text-[#2DD9C8] truncate">{song.title}</div>
                  <div className="text-xs text-[#9490A8] truncate">{song.artist}</div>
                </div>
              </div>
            </div>
          )}
          <Eyebrow>Next up</Eyebrow>
          <div className="flex flex-col gap-0.5">
            {queue.length === 0 && <div className="text-xs text-[#7d7891] px-2">Queue is empty — add songs with the queue icon.</div>}
            {queue.map((s, i) => (
              <div key={s.id + i} className="group flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-white/[0.04]">
                <GripVertical className="w-3.5 h-3.5 text-[#5f5b70] shrink-0" />
                <button onClick={() => onPlayFromQueue(i)} className="flex items-center gap-2 min-w-0 flex-1 text-left">
                  <CoverArt colors={s.colors} size="w-8 h-8" rounded="rounded-md" />
                  <div className="min-w-0">
                    <div className="text-xs font-medium text-[#EDEBF7] truncate">{s.title}</div>
                    <div className="text-[10px] text-[#9490A8] truncate">{s.artist}</div>
                  </div>
                </button>
                <button onClick={() => onRemoveFromQueue(i)} className="opacity-0 group-hover:opacity-100 text-[#9490A8] hover:text-[#FF6B81]">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {panel === "lyrics" && song && song.lyrics.length === 0 && (
        <div className="flex-1 flex items-center justify-center p-6 text-center text-xs text-[#7d7891]">
          No lyrics for this episode.
        </div>
      )}

      {panel === "lyrics" && song && song.lyrics.length > 0 && (
        <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-4">
          {song.lyrics.map((line, i) => (
            <p key={i} className={`text-base font-semibold leading-snug transition-colors duration-300 ${i === activeLine ? "text-[#EDEBF7]" : "text-[#5f5b70]"}`}>
              {line}
            </p>
          ))}
        </div>
      )}

      {panel === "lyrics" && !song && (
        <div className="flex-1 flex items-center justify-center p-6 text-center text-xs text-[#7d7891]">
          Play a song to see its lyrics here.
        </div>
      )}

      {panel === "activity" && (
        <div className="flex-1 overflow-y-auto p-3">
          <Eyebrow>Friend Activity</Eyebrow>
          <div className="flex flex-col gap-1 mt-2">
            {FRIEND_ACTIVITY.map((f, i) => (
              <div key={i} className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-white/[0.04]">
                <CoverArt colors={f.colors} size="w-9 h-9" rounded="rounded-full" icon={false} />
                <div className="min-w-0">
                  <div className="text-xs text-[#EDEBF7]">
                    <span className="font-semibold">{f.name}</span> <span className="text-[#9490A8]">{f.action}</span>
                  </div>
                  <div className="text-xs text-[#9490A8] truncate">{f.target} · {f.by}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </Glass>
  );
}

/* ---------------------------------------------------------------------- */
/*  Create playlist modal                                                  */
/* ---------------------------------------------------------------------- */

function CreatePlaylistModal({ onClose, onCreate }) {
  const [name, setName] = useState("");
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4" onClick={onClose}>
      <Glass className="rounded-2xl p-6 w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-lg font-bold text-[#EDEBF7] mb-4">New playlist</h3>
        <input
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="My new playlist"
          className="w-full bg-white/[0.06] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-[#EDEBF7] placeholder:text-[#7d7891] outline-none focus:border-[#8B5CF6]/60 mb-4"
        />
        <div className="flex gap-2 justify-end">
          <button onClick={onClose} className="px-4 py-2 rounded-full text-xs font-semibold text-[#9490A8] hover:text-[#EDEBF7]">Cancel</button>
          <button
            disabled={!name.trim()}
            onClick={() => name.trim() && onCreate(name.trim())}
            className="px-5 py-2 rounded-full text-xs font-semibold bg-[#8B5CF6] text-white disabled:opacity-30"
          >
            Create
          </button>
        </div>
      </Glass>
    </div>
  );
}

function AddToPlaylistModal({ song, playlists, onAdd, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4" onClick={onClose}>
      <Glass className="rounded-2xl p-6 w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-lg font-bold text-[#EDEBF7] mb-1">Add to playlist</h3>
        <p className="text-xs text-[#9490A8] mb-4 truncate">"{song.title}" by {song.artist}</p>
        <div className="flex flex-col gap-1 max-h-60 overflow-y-auto">
          {playlists.map((p) => {
            const alreadyIn = p.songs?.some((s) => s.id === song.id);
            return (
              <button
                key={p.id}
                onClick={() => !alreadyIn && onAdd(p.id, song)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-colors ${
                  alreadyIn ? "opacity-40 cursor-not-allowed" : "hover:bg-white/[0.06]"
                }`}
                disabled={alreadyIn}
              >
                <CoverArt colors={p.cover} size="w-8 h-8" rounded="rounded-md" />
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium text-[#EDEBF7] truncate">{p.name}</div>
                  <div className="text-[10px] text-[#9490A8]">{p.songs?.length || 0} songs</div>
                </div>
                {alreadyIn && <Check className="w-3.5 h-3.5 text-[#2DD9C8]" />}
              </button>
            );
          })}
          {playlists.length === 0 && (
            <div className="text-sm text-[#7d7891] py-4 text-center">No playlists yet. Create one first!</div>
          )}
        </div>
        <div className="flex justify-end mt-4">
          <button onClick={onClose} className="px-4 py-2 rounded-full text-xs font-semibold text-[#9490A8] hover:text-[#EDEBF7]">Cancel</button>
        </div>
      </Glass>
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/*  App shell                                                              */
/* ---------------------------------------------------------------------- */

export default function BablooApp() {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
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
          if (pl && pl.length) {
            setPlaylists(pl.map(p => ({
              ...p,
              cover: p.cover_image ? p.cover_image.split(',') : (p.cover || ['#8B5CF6', '#2DD9C8']),
              songs: p.songs || []
            })));
          }
          if (lk && lk.length) {
            setLiked(new Set(lk.map(s => s.id)));
            setLikedData(lk.map(s => ({...s, duration: s.duration || 180, colors: s.colors || ['#8B5CF6', '#2DD9C8']})));
          }
          if (hist && hist.length) {
            setPlayHistory(hist.map(s => ({...s, duration: s.duration || 180, colors: s.colors || ['#8B5CF6', '#2DD9C8']})));
          }
          
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

  const [view, setView] = useState("home");
  const [collapsed, setCollapsed] = useState(false);
  const [query, setQuery] = useState("");
  const [playlists, setPlaylists] = useState(() => {
    try { 
      const saved = JSON.parse(localStorage.getItem('babloo_playlists')); 
      if (saved) {
        return saved.map(p => {
          if (p.songIds) {
            p.songs = p.songIds.map(id => SONGS.find(s => s.id === id)).filter(Boolean);
            delete p.songIds;
          }
          return p;
        });
      }
      return initialPlaylists(); 
    } catch { return initialPlaylists(); }
  });
  const [openPlaylistId, setOpenPlaylistId] = useState(null);
  const [openArtistName, setOpenArtistName] = useState(null);
  const [openPodcastId, setOpenPodcastId] = useState(null);
  const [openAudiobookId, setOpenAudiobookId] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [liked, setLiked] = useState(() => {
    try { const saved = JSON.parse(localStorage.getItem('babloo_liked') || '[]'); return new Set(saved); } catch { return new Set(); }
  });

  const [song, setSong] = useState(null);
  const [activeEpisodeId, setActiveEpisodeId] = useState(null);
  const [activeChapterId, setActiveChapterId] = useState(null);
  const [queueList, setQueueList] = useState([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [panel, setPanel] = useState(null);
  const [shuffle, setShuffle] = useState(false);
  const [repeat, setRepeat] = useState(0);

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

  const [playHistory, setPlayHistory] = useState(() => {
    try { return JSON.parse(localStorage.getItem('babloo_history') || '[]'); } catch { return []; }
  });
  const [showNotifications, setShowNotifications] = useState(false);
  const [showNowPlaying, setShowNowPlaying] = useState(false);
  const [activeDevice, setActiveDevice] = useState("d1");
  const [showDevices, setShowDevices] = useState(false);
  const [sleepMinutes, setSleepMinutes] = useState(null);
  const [showSleepTimer, setShowSleepTimer] = useState(false);
  const [showEqualizer, setShowEqualizer] = useState(false);
  const contextRef = useRef([]);

  const greeting = useMemo(() => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 18) return "Good afternoon";
    return "Good evening";
  }, []);

  useEffect(() => {
    if (!sleepMinutes || !isPlaying) return;
    const id = setTimeout(() => setIsPlaying(false), sleepMinutes * 60 * 1000);
    return () => clearTimeout(id);
  }, [sleepMinutes, isPlaying, song]);

  // Persist to localStorage
  useEffect(() => { localStorage.setItem('babloo_stage', stage); }, [stage]);
  useEffect(() => { localStorage.setItem('babloo_liked', JSON.stringify([...liked])); }, [liked]);
  useEffect(() => { localStorage.setItem('babloo_playlists', JSON.stringify(playlists)); }, [playlists]);
  useEffect(() => { localStorage.setItem('babloo_history', JSON.stringify(playHistory.slice(0, 50))); }, [playHistory]);

  // Real Audio Player Ref
  const audioRef = useRef(null);
  const [vol, setVol] = useState(70);

  // Equalizer state (lifted from EqualizerModal so it persists)
  const [eqBands, setEqBands] = useState({ bass: 0, mid: 0, treble: 0 });
  const eqNodesRef = useRef(null); // { source, bass, mid, treble, ctx }

  // Expose audioRef globally for seek bars and equalizer
  useEffect(() => {
    if (audioRef.current) {
      window.__bablooAudioRef = audioRef.current;
    }
  });

  // Sync Volume
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = vol / 100;
    }
  }, [vol, song]);

  // Web Audio API Equalizer setup
  useEffect(() => {
    if (!audioRef.current || eqNodesRef.current) return;
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const source = ctx.createMediaElementSource(audioRef.current);
      
      const bass = ctx.createBiquadFilter();
      bass.type = 'lowshelf';
      bass.frequency.value = 200;
      bass.gain.value = 0;
      
      const mid = ctx.createBiquadFilter();
      mid.type = 'peaking';
      mid.frequency.value = 1000;
      mid.Q.value = 1;
      mid.gain.value = 0;
      
      const treble = ctx.createBiquadFilter();
      treble.type = 'highshelf';
      treble.frequency.value = 4000;
      treble.gain.value = 0;
      
      source.connect(bass);
      bass.connect(mid);
      mid.connect(treble);
      treble.connect(ctx.destination);
      
      eqNodesRef.current = { source, bass, mid, treble, ctx };
    } catch (e) {
      console.log('Web Audio EQ setup skipped:', e.message);
    }
  }, []);

  // Sync EQ band values to Web Audio nodes
  useEffect(() => {
    if (!eqNodesRef.current) return;
    const { bass, mid, treble } = eqNodesRef.current;
    bass.gain.value = eqBands.bass;
    mid.gain.value = eqBands.mid;
    treble.gain.value = eqBands.treble;
  }, [eqBands]);

  // Sync audio src when song changes
  useEffect(() => {
    if (!audioRef.current || !song) return;
    const streamUrl = song.audioStream || `/api/stream/${song.id}?title=${encodeURIComponent(song.title || '')}&artist=${encodeURIComponent(song.artist || '')}`;
    // Only update src if it actually changed to avoid reloading the same track
    if (audioRef.current.src !== streamUrl && !audioRef.current.src.endsWith(streamUrl)) {
      audioRef.current.src = streamUrl;
      audioRef.current.load();
    }
    if (isPlaying) {
      if (eqNodesRef.current?.ctx.state === 'suspended') {
        eqNodesRef.current.ctx.resume();
      }
      audioRef.current.play().catch(e => console.log("Playback error:", e));
    }
  }, [song]);

  // Play/Pause Sync
  useEffect(() => {
    if (audioRef.current) {
      if (isPlaying) {
        if (eqNodesRef.current?.ctx.state === 'suspended') {
          eqNodesRef.current.ctx.resume();
        }
        audioRef.current.play().catch(e => console.log("Playback error:", e));
      } else {
        audioRef.current.pause();
      }
    }
  }, [isPlaying]);

  function playSong(s, context = []) {
    setSong(s);
    setProgress(0);
    setIsPlaying(true);
    contextRef.current = context.length ? context : [s];
    setPlayHistory((h) => [s, ...h.filter((x) => x.id !== s.id)].slice(0, 40));
    apiFetch('/api/me/history', { method: 'POST', body: JSON.stringify({ song: s }) }).catch(console.error);
  }

  function handleToggle() {
    if (!song) return;
    setIsPlaying((p) => !p);
  }

  function handleNext() {
    if (repeat === 2 && audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(console.error);
      return;
    }
    if (queueList.length > 0) {
      const [next, ...rest] = queueList;
      setQueueList(rest);
      playSong(next, contextRef.current);
      return;
    }
    const ctx = contextRef.current;
    if (!song || ctx.length === 0) return;
    const idx = ctx.findIndex((s) => s.id === song.id);
    const nextIdx = shuffle ? Math.floor(Math.random() * ctx.length) : (idx + 1) % ctx.length;
    playSong(ctx[nextIdx], ctx);
  }

  function handlePrev() {
    if (progress > 3) { setProgress(0); return; }
    const ctx = contextRef.current;
    if (!song || ctx.length === 0) return;
    const idx = ctx.findIndex((s) => s.id === song.id);
    const prevIdx = (idx - 1 + ctx.length) % ctx.length;
    playSong(ctx[prevIdx], ctx);
  }

  const [likedData, setLikedData] = useState(() => {
    try { 
      const data = JSON.parse(localStorage.getItem('babloo_liked_data'));
      if (data) return data;
      // migrate from old liked ids if necessary
      const oldIds = JSON.parse(localStorage.getItem('babloo_liked') || '[]');
      return oldIds.map(id => SONGS.find(s => s.id === id)).filter(Boolean);
    } catch { return []; }
  });

  useEffect(() => { localStorage.setItem('babloo_liked_data', JSON.stringify(likedData)); }, [likedData]);

  function toggleLike(songObj) {
    if (!songObj) return;
    const id = songObj.id;
    setLiked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
        setLikedData(d => d.filter(s => s.id !== id));
      } else {
        next.add(id);
        setLikedData(d => [songObj, ...d]);
      }
      return next;
    });
    apiFetch(`/api/me/liked-songs`, { method: 'POST', body: JSON.stringify({ song: songObj }) }).catch(console.error);
  }

  function addToQueue(s) {
    setQueueList((q) => [...q, s]);
    setPanel("queue");
  }

  function removeFromQueue(i) {
    setQueueList((q) => q.filter((_, idx) => idx !== i));
  }

  function playFromQueue(i) {
    const target = queueList[i];
    setQueueList((q) => q.filter((_, idx) => idx !== i));
    playSong(target, contextRef.current);
  }

  function playEpisode(ep, podcast) {
    const pseudoSong = {
      id: ep.id,
      title: ep.title,
      artist: podcast.host,
      duration: ep.duration,
      colors: podcast.colors,
      lyrics: [],
    };
    setActiveEpisodeId(ep.id);
    playSong(pseudoSong, [pseudoSong]);
  }

  function playChapter(ch, book) {
    const pseudoSong = {
      id: ch.id,
      title: ch.title,
      artist: book.author,
      duration: ch.minutes * 60,
      colors: book.colors,
      lyrics: [],
    };
    setActiveChapterId(ch.id);
    playSong(pseudoSong, [pseudoSong]);
  }

  function updatePlaylist(id, patch) {
    setPlaylists((p) => p.map((pl) => (pl.id === id ? { ...pl, ...patch } : pl)));
  }

  async function createPlaylist(name) {
    const cols = Object.values(PALETTE_BY_ARTIST)[playlists.length % 8];
    setShowCreate(false);
    setView("library");
    
    // Optimistic update
    const tempId = `p${Date.now()}`;
    const pl = { id: tempId, name, desc: "Your new playlist.", songs: [], cover: cols };
    setPlaylists((p) => [...p, pl]);
    
    try {
      const res = await apiFetch('/api/me/playlists', {
        method: 'POST',
        body: JSON.stringify({ name, description: "Your new playlist.", cover_image: cols.join(',') })
      });
      // Update with real ID from backend
      if (res && res.id) {
        setPlaylists((p) => p.map(p => p.id === tempId ? { ...p, id: res.id } : p));
      }
    } catch (e) {
      console.error(e);
    }
  }

  // Add to playlist state and function
  const [addToPlaylistSong, setAddToPlaylistSong] = useState(null);

  function addSongToPlaylist(playlistId, songObj) {
    setPlaylists((prev) =>
      prev.map((pl) => {
        if (pl.id !== playlistId) return pl;
        if (pl.songs.some((s) => s.id === songObj.id)) return pl;
        return { ...pl, songs: [...pl.songs, songObj] };
      })
    );
    setAddToPlaylistSong(null);
    apiFetch(`/api/me/playlists/${playlistId}/songs`, { method: 'POST', body: JSON.stringify({ song: songObj }) }).catch(console.error);
  }

  if (authLoading) return (
    <div className="min-h-screen bg-[#08070C] flex items-center justify-center text-white">
      <div className="animate-pulse text-xl font-semibold tracking-wider">SAREGAMA</div>
    </div>
  );
  if (!user) return <LandingPage onLogin={(u) => setUser(u)} />;

  if (stage === "welcome") return <WelcomeScreen onEnter={setStage} />;
  if (stage === "onboarding") return <OnboardingScreen onDone={() => setStage("app")} />;

  const likedSongs = likedData;
  const openPlaylist = playlists.find((p) => p.id === openPlaylistId);
  const openPlaylistSongs = openPlaylist ? openPlaylist.songs : [];
  const openPodcast = PODCASTS.find((p) => p.id === openPodcastId);
  const openAudiobook = AUDIOBOOKS.find((b) => b.id === openAudiobookId);

  const auraColors = song ? song.colors : ["#8B5CF6", "#2DD9C8"];

  function clearDetails() {
    setOpenPlaylistId(null);
    setOpenArtistName(null);
    setOpenPodcastId(null);
    setOpenAudiobookId(null);
  }

  let content = null;
  if (openPlaylistId) {
    content = (
      <PlaylistView
        playlist={openPlaylist}
        songs={openPlaylistSongs}
        onBack={clearDetails}
        onPlaySong={playSong}
        activeSong={song}
        isPlaying={isPlaying}
        liked={liked}
        onLike={toggleLike}
        onQueue={addToQueue}
        onUpdatePlaylist={updatePlaylist}
      />
    );
  } else if (openArtistName) {
    content = (
      <ArtistView
        name={openArtistName}
        onBack={clearDetails}
        onPlaySong={playSong}
        activeSong={song}
        isPlaying={isPlaying}
        liked={liked}
        onLike={toggleLike}
        onQueue={addToQueue}
      />
    );
  } else if (openPodcastId && openPodcast) {
    content = (
      <PodcastDetailView
        podcast={openPodcast}
        onBack={clearDetails}
        onPlayEpisode={playEpisode}
        activeEpisodeId={activeEpisodeId}
        isPlaying={isPlaying}
      />
    );
  } else if (openAudiobookId && openAudiobook) {
    content = (
      <AudiobookDetailView 
        book={openAudiobook} 
        onBack={clearDetails} 
        onPlayChapter={playChapter}
        activeChapterId={activeChapterId}
        isPlaying={isPlaying}
      />
    );
  } else if (view === "home") {
    content = <HomeView playlists={playlists} greeting={greeting} onPlaySong={playSong} onOpenPlaylist={setOpenPlaylistId} />;
  } else if (view === "search") {
    content = <SearchView query={query} setQuery={setQuery} onPlaySong={playSong} liked={liked} onLike={toggleLike} onQueue={addToQueue} onAddToPlaylist={setAddToPlaylistSong} />;
  } else if (view === "library") {
    content = <LibraryView playlists={playlists} onOpenPlaylist={setOpenPlaylistId} onOpenArtist={setOpenArtistName} />;
  } else if (view === "liked") {
    content = <LikedView likedSongs={likedSongs} activeSong={song} isPlaying={isPlaying} liked={liked} onPlaySong={playSong} onLike={toggleLike} onQueue={addToQueue} onAddToPlaylist={setAddToPlaylistSong} />;
  } else if (view === "history") {
    content = <HistoryView history={playHistory} activeSong={song} isPlaying={isPlaying} liked={liked} onPlaySong={playSong} onLike={toggleLike} onQueue={addToQueue} onAddToPlaylist={setAddToPlaylistSong} />;
  } else if (view === "profile") {
    content = <ProfileView playlists={playlists} likedSongs={likedSongs} history={playHistory} user={user} onLogout={() => { removeToken(); setUser(null); }} />;
  } else if (view === "podcasts") {
    content = <PodcastsView onOpenPodcast={setOpenPodcastId} />;
  } else if (view === "audiobooks") {
    content = <AudiobooksView onOpenBook={setOpenAudiobookId} />;
  } else if (view === "wrapped") {
    content = <WrappedView likedSongs={likedSongs} />;
  } else if (view === "premium") {
    content = <PremiumView />;
  } else if (view === "settings") {
    content = <SettingsView />;
  } else if (view === "downloads") {
    content = <DownloadsView likedSongs={likedSongs} />;
  }

  return (
    <div className="h-screen w-full flex flex-col text-[#EDEBF7] overflow-hidden" style={{ fontFamily: "ui-sans-serif, system-ui, -apple-system, sans-serif" }}>
      <Aura colors={auraColors} />
      <div className="flex flex-1 min-h-0">
        <Sidebar
          view={(openPlaylistId || openArtistName || openPodcastId || openAudiobookId) ? null : view}
          setView={(v) => { clearDetails(); setView(v); }}
          playlists={playlists}
          collapsed={collapsed}
          setCollapsed={setCollapsed}
          onCreatePlaylist={() => setShowCreate(true)}
          openPlaylist={setOpenPlaylistId}
        />

        <main className="flex-1 min-w-0 flex flex-col">
          {/* mobile top bar */}
          <div className="md:hidden flex items-center justify-between px-4 pt-4 pb-1">
            <div className="h-8 flex items-center -ml-2">
              <img src="/logo.png" alt="SAREGAMA" className="h-full object-contain scale-110 origin-left" />
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => { clearDetails(); setView("search"); }}
                className="w-8 h-8 rounded-full border border-white/10 flex items-center justify-center text-[#9490A8] hover:text-[#EDEBF7] hover:bg-white/5"
                title="Search"
              >
                <Search className="w-4 h-4" />
              </button>
              <button
                onClick={() => setShowNotifications((v) => !v)}
                className="relative w-8 h-8 rounded-full border border-white/10 flex items-center justify-center text-[#9490A8] hover:text-[#EDEBF7] hover:bg-white/5"
              >
                <Bell className="w-4 h-4" />
                <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-[#FF6B81]" />
              </button>
              <button
                onClick={() => { clearDetails(); setView("profile"); }}
                className="w-8 h-8 rounded-full bg-gradient-to-br from-[#FF9F45] to-[#B45309] flex items-center justify-center cursor-pointer"
              >
                <User className="w-4 h-4 text-white" />
              </button>
            </div>
          </div>

          <div className="hidden md:flex items-center justify-end gap-3 px-6 pt-5 pb-2">
            <button
              onClick={() => setPanel(panel === "activity" ? null : "activity")}
              className={`hidden sm:flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full border transition-colors ${panel === "activity" ? "border-[#2DD9C8]/60 text-[#2DD9C8]" : "border-white/10 text-[#9490A8] hover:text-[#EDEBF7] hover:bg-white/5"}`}
            >
              <Users className="w-3.5 h-3.5" /> Friend Activity
            </button>
            <button
              onClick={() => setShowNotifications((v) => !v)}
              className="relative w-8 h-8 rounded-full border border-white/10 flex items-center justify-center text-[#9490A8] hover:text-[#EDEBF7] hover:bg-white/5"
              title="Notifications"
            >
              <Bell className="w-4 h-4" />
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-[#FF6B81]" />
            </button>
            <button
              onClick={() => { clearDetails(); setView("profile"); }}
              className="w-8 h-8 rounded-full bg-gradient-to-br from-[#FF9F45] to-[#B45309] flex items-center justify-center cursor-pointer"
              title="Profile"
            >
              <User className="w-4 h-4 text-white" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-6 pb-4">{content}</div>
        </main>

        <SidePanel
          panel={panel}
          setPanel={setPanel}
          queue={queueList}
          song={song}
          progress={progress}
          onRemoveFromQueue={removeFromQueue}
          onPlayFromQueue={playFromQueue}
        />
      </div>

      <PlayerBar
        song={song}
        isPlaying={isPlaying}
        progress={progress}
        onToggle={handleToggle}
        onNext={handleNext}
        onPrev={handlePrev}
        liked={song ? liked.has(song.id) : false}
        onLike={toggleLike}
        panel={panel}
        setPanel={setPanel}
        shuffle={shuffle}
        setShuffle={setShuffle}
        repeat={repeat}
        setRepeat={setRepeat}
        onExpand={() => setIsExpanded(true)}
        vol={vol}
        setVol={setVol}
      />

      {/* Mobile Bottom Navigation */}
      <div className="md:hidden flex items-center justify-around px-2 py-3 bg-[#08070C]/90 backdrop-blur-md border-t border-white/5 pb-safe z-40">
         {[
           ["home", "Home", Home], 
           ["search", "Search", Search], 
           ["library", "Library", Library], 
           ["menu", "Menu", Menu]
         ].map(([id, label, Icon]) => (
            <button key={id} onClick={() => { 
                if (id === 'menu') setShowMobileMenu(true);
                else { clearDetails(); setView(id); }
            }} className={`flex flex-col items-center gap-1 ${view === id && !openPlaylistId && id !== 'menu' ? "text-[#2DD9C8]" : "text-[#9490A8] hover:text-[#EDEBF7]"}`}>
               <Icon className="w-6 h-6" />
               <span className="text-[10px] font-medium">{label}</span>
            </button>
         ))}
      </div>

      {!song && (
        <div className="text-center text-[10px] text-[#5f5b70] pb-2 hidden md:block">Pick any track to start listening</div>
      )}

      {showMobileMenu && (
        <div className="md:hidden fixed inset-0 z-50 bg-[#08070C]/95 backdrop-blur-xl flex flex-col p-6 overflow-y-auto">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl font-black text-[#EDEBF7]">Menu</h2>
            <button onClick={() => setShowMobileMenu(false)} className="text-[#9490A8] hover:text-[#EDEBF7]"><X className="w-7 h-7" /></button>
          </div>
          <div className="flex flex-col gap-2">
             {[
               { id: "liked", label: "Liked Songs", icon: Heart },
               { id: "history", label: "History", icon: HistoryIcon },
               { id: "podcasts", label: "Podcasts", icon: Radio },
               { id: "audiobooks", label: "Audiobooks", icon: BookOpen },
               { id: "downloads", label: "Downloads", icon: Clock },
               { id: "wrapped", label: "Wrapped", icon: Sparkles },
               { id: "premium", label: "Premium", icon: Crown },
               { id: "settings", label: "Settings", icon: SettingsIcon },
             ].map(item => (
                <button 
                  key={item.id} 
                  onClick={() => { clearDetails(); setView(item.id); setShowMobileMenu(false); }} 
                  className={`flex items-center gap-4 px-4 py-4 rounded-xl text-lg font-medium transition-colors ${view === item.id ? 'bg-white/10 text-[#EDEBF7]' : 'text-[#9490A8] hover:text-[#EDEBF7] hover:bg-white/[0.04]'}`}
                >
                   <item.icon className="w-6 h-6 text-[#2DD9C8]" /> {item.label}
                </button>
             ))}
          </div>
        </div>
      )}

      {showCreate && <CreatePlaylistModal onClose={() => setShowCreate(false)} onCreate={createPlaylist} />}
      {addToPlaylistSong && <AddToPlaylistModal song={addToPlaylistSong} playlists={playlists} onAdd={addSongToPlaylist} onClose={() => setAddToPlaylistSong(null)} />}
      {showNotifications && <NotificationsDropdown onClose={() => setShowNotifications(false)} />}
      {showDevices && <DeviceSwitcherModal activeDevice={activeDevice} onSelect={setActiveDevice} onClose={() => setShowDevices(false)} />}
      {showSleepTimer && <SleepTimerModal value={sleepMinutes} onSelect={setSleepMinutes} onClose={() => setShowSleepTimer(false)} />}
      {showEqualizer && <EqualizerModal onClose={() => setShowEqualizer(false)} bands={eqBands} setBands={setEqBands} />}
      {showNowPlaying && song && (
        <NowPlayingScreen
          song={song}
          isPlaying={isPlaying}
          progress={progress}
          onToggle={handleToggle}
          onNext={handleNext}
          onPrev={handlePrev}
          liked={liked.has(song.id)}
          onLike={toggleLike}
          onClose={() => setShowNowPlaying(false)}
          panel={panel}
          setPanel={setPanel}
          shuffle={shuffle}
          setShuffle={setShuffle}
          repeat={repeat}
          setRepeat={setRepeat}
          onOpenDevices={() => setShowDevices(true)}
          onOpenSleep={() => setShowSleepTimer(true)}
          onOpenEq={() => setShowEqualizer(true)}
        />
      )}
      {isExpanded && (
        <ExpandedPlayer
          song={song}
          isPlaying={isPlaying}
          progress={progress}
          duration={song?.duration}
          onPlayPause={handleToggle}
          onSeek={(t) => { if (window.__bablooAudioRef) window.__bablooAudioRef.currentTime = t; }}
          onNext={handleNext}
          onPrev={handlePrev}
          onClose={() => setIsExpanded(false)}
          liked={liked}
          onToggleLike={toggleLike}
          onShuffle={() => setShuffle(!shuffle)}
          onRepeat={() => setRepeat((repeat + 1) % 3)}
          shuffle={shuffle}
          repeat={repeat}
          onAddPlaylist={setAddToPlaylistSong}
        />
      )}
      {/* Hidden Real Audio Engine — always mounted so audioRef is stable */}
      <audio 
        ref={audioRef}
        crossOrigin="anonymous"
        onTimeUpdate={(e) => setProgress(e.target.currentTime)}
        onLoadedMetadata={(e) => {
          const realDuration = e.target.duration;
          if (realDuration && isFinite(realDuration)) {
            setSong(prev => prev ? { ...prev, duration: realDuration } : prev);
          }
        }}
        onEnded={handleNext}
        onError={(e) => console.error('Audio playback error:', e.target.error)}
        preload="auto"
      />
    </div>
  );
}