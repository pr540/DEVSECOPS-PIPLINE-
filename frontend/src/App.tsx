import { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { BrowserRouter as Router, Routes, Route, Link, Navigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import videojs from 'video.js';
import 'video.js/dist/video-js.css';
import { 
  Star, X, User, 
  LogOut, Play, Search,
  ChevronRight, ChevronLeft,
  Monitor, Shield

} from 'lucide-react';

// --- CONSTANTS ---
const API_BASE = import.meta.env.PROD ? '/api' : 'http://localhost:8000/api';

// --- TYPES ---
interface Movie {
  id: number;
  title: string;
  description: string;
  rating: number;
  image: string;
  language: string;
  quality: string;
  video_url: string;
  download_url?: string;
  year: number;
  category_id: number;
}

interface UserData {
  id: number;
  username: string;
  email: string;
  role: string;
}

// --- HELPERS ---
const setAuthToken = (token: string | null) => {
  if (token) {
    localStorage.setItem('cine_token', token);
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    localStorage.removeItem('cine_token');
    delete axios.defaults.headers.common['Authorization'];
  }
};

// --- COMPONENTS ---

const VideoPlayer = ({ src }: { src: string }) => {
  const videoRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<any>(null);

  useEffect(() => {
    if (!playerRef.current && videoRef.current) {
      const videoElement = document.createElement("video-js");
      videoElement.classList.add('vjs-big-play-centered', 'vjs-netflix-skin');
      videoRef.current.appendChild(videoElement);
      playerRef.current = videojs(videoElement, {
        autoplay: true, controls: true, responsive: true, fluid: true,
        sources: [{ src, type: 'application/x-mpegURL' }]
      });
    }
    return () => { if (playerRef.current) { playerRef.current.dispose(); playerRef.current = null; } };
  }, [src]);

  return <div data-vjs-player><div ref={videoRef} className="rounded-3xl overflow-hidden shadow-2xl border border-white/10" /></div>;
};

const MovieRow = ({ title, movies, onSelect }: { title: string, movies: Movie[], onSelect: (m: Movie) => void }) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const scroll = (dir: 'left' | 'right') => scrollRef.current?.scrollBy({ left: dir === 'left' ? -400 : 400, behavior: 'smooth' });

  return (
    <div className="mb-12 relative group/row">
       <h2 className="text-xl font-bold mb-6 px-10 flex items-center gap-3"><span className="w-1 h-6 bg-purple-600 rounded-full" />{title}</h2>
       <div className="relative">
          <button onClick={() => scroll('left')} className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-12 h-[calc(100%-24px)] bg-black/60 opacity-0 group-hover/row:opacity-100 transition-opacity flex items-center justify-center"><ChevronLeft /></button>
          <div ref={scrollRef} className="flex gap-4 overflow-x-hidden px-10">
             {movies.map(movie => (
               <motion.div key={movie.id} whileHover={{ scale: 1.05, zIndex: 20 }} className="flex-shrink-0 w-64 aspect-[2/3] rounded-xl overflow-hidden cursor-pointer relative group" onClick={() => onSelect(movie)}>
                 <img src={movie.image} className="w-full h-full object-cover" alt="" />
                 <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-black via-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                    <p className="text-xs font-black uppercase truncate">{movie.title}</p>
                    <div className="flex items-center justify-between mt-2">
                       <span className="text-[8px] text-gray-400">{movie.year} • {movie.quality}</span>
                       <div className="flex items-center gap-1"><Star className="w-2 h-2 text-yellow-500 fill-yellow-500" /><span className="text-[8px] font-bold">{movie.rating}</span></div>
                    </div>
                 </div>
               </motion.div>
             ))}
          </div>
          <button onClick={() => scroll('right')} className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-12 h-[calc(100%-24px)] bg-black/60 opacity-0 group-hover/row:opacity-100 transition-opacity flex items-center justify-center"><ChevronRight /></button>
       </div>
    </div>
  );
};

const HomePage = ({ onSelect }: { onSelect: (m: Movie) => void }) => {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get(`${API_BASE}/movies`).then(res => { setMovies(res.data); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  if (loading) return <div className="py-40 text-center text-purple-600 animate-pulse font-black uppercase text-xs tracking-[1em]">Establishing Neural Link...</div>;

  const trending = movies.filter(m => m.rating >= 9.0);
  const latest = movies.filter(m => m.year >= 2024);
  const global = movies.filter(m => m.language !== 'English');

  return (
    <div className="min-h-screen bg-[#050505]">
       {movies.length > 0 && (
         <div className="relative h-[85vh] w-full overflow-hidden">
            <img src={trending[0]?.image || movies[0].image} className="w-full h-full object-cover opacity-40 scale-105" alt="" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-transparent to-[#050505]/60" />
            <div className="absolute inset-y-0 left-0 w-full md:w-2/3 flex flex-col justify-center px-10 md:px-20">
               <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
                  <span className="bg-purple-600 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest mb-8 inline-flex items-center gap-2 shadow-lg shadow-purple-600/30">
                    <Star className="w-3 h-3 fill-current" /> Trending Synchronization
                  </span>
                  <h1 className="text-6xl md:text-8xl font-black uppercase italic leading-none mb-6 drop-shadow-2xl">{(trending[0]?.title || movies[0].title).replace(/ \(\d+\)/, '')}</h1>
                  <p className="text-lg md:text-xl text-gray-300 font-medium max-w-2xl mb-12 leading-relaxed opacity-80">{trending[0]?.description || movies[0].description}</p>
                  <div className="flex flex-wrap gap-6">
                    <button onClick={() => onSelect(trending[0] || movies[0])} className="bg-white text-black px-12 py-5 rounded-2xl font-black uppercase flex items-center gap-4 hover:bg-purple-600 hover:text-white transition-all transform hover:scale-105 shadow-2xl">
                       <Play className="w-6 h-6 fill-current" /> Stream in 1080p
                    </button>
                    <div className="flex items-center gap-4 px-8 py-5 border border-white/10 rounded-2xl backdrop-blur-xl bg-white/5">
                        <Monitor className="w-5 h-5 text-purple-500" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Direct Download Active</span>
                    </div>
                  </div>
               </motion.div>
            </div>
         </div>
       )}
       <div className="-mt-48 relative z-20 space-y-20 pb-20">
          <MovieRow title="Trending Syncs" movies={trending.length > 0 ? trending : movies} onSelect={onSelect} />
          <MovieRow title="Latest Released Nodes" movies={latest.length > 0 ? latest : movies.slice(0, 5)} onSelect={onSelect} />
          <MovieRow title="Global Multilingual Cores" movies={global.length > 0 ? global : movies.slice().reverse()} onSelect={onSelect} />
       </div>
    </div>
  );
};


const ExplorePage = ({ onSelect }: { onSelect: (m: Movie) => void }) => {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [filters, setFilters] = useState({ language: '', year: '' });
  const [search, setSearch] = useState('');

  const load = async () => {
    const res = await axios.get(`${API_BASE}/movies`, { params: { 
      language: filters.language || undefined, 
      year_from: filters.year ? parseInt(filters.year) : undefined,
      q: search || undefined
    }});
    setMovies(res.data);
  };
  useEffect(() => { load(); }, [filters, search]);

  return (
    <div className="pt-40 px-6 md:px-20 min-h-screen pb-20">
       <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-16">
          <div>
            <h1 className="text-5xl font-black uppercase italic tracking-tighter mb-2">Neural <span className="text-purple-600">Archive</span></h1>
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.3em]">Full HD 1080p Visual Repository</p>
          </div>
          <div className="flex flex-wrap gap-4">
             <div className="relative w-full md:w-80">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 w-4 h-4" />
                <input value={search} onChange={e => setSearch(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-4 py-4 text-sm focus:border-purple-500 outline-none backdrop-blur-xl transition-all" placeholder="Search Neural Archive..." />
             </div>
             <select onChange={e => setFilters({...filters, language: e.target.value})} className="bg-white/5 border border-white/10 rounded-2xl px-8 py-4 text-[10px] font-black uppercase outline-none focus:border-purple-500 cursor-pointer">
                <option value="" className="bg-black">All Languages</option>
                {['Telugu', 'Hindi', 'English', 'Tamil', 'Malayalam', 'Kannada'].map(l => <option key={l} value={l} className="bg-black">{l}</option>)}
             </select>
             <select onChange={e => setFilters({...filters, year: e.target.value})} className="bg-white/5 border border-white/10 rounded-2xl px-8 py-4 text-[10px] font-black uppercase outline-none focus:border-purple-500 cursor-pointer">
                <option value="" className="bg-black">All Years</option>
                {Array.from({ length: 2026 - 1900 }, (_, i) => 2026 - i).map(y => <option key={y} value={y.toString()} className="bg-black">{y}</option>)}
             </select>
          </div>
       </div>
       <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-8">
          {movies.map(m => (
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} layout key={m.id} onClick={() => onSelect(m)} className="group relative glass-card p-3 border-white/5 bg-white/5 hover:bg-white/10 transition-all cursor-pointer rounded-2xl overflow-hidden hover:scale-105">
               <div className="aspect-[2/3] rounded-xl overflow-hidden mb-4 relative">
                  <img src={m.image} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" alt="" />
                  <div className="absolute top-2 right-2 bg-purple-600 px-2 py-1 rounded text-[8px] font-black uppercase tracking-tighter shadow-lg">1080p</div>
               </div>
               <h3 className="text-xs font-black uppercase tracking-wide truncate group-hover:text-purple-400 transition-colors">{m.title}</h3>
               <div className="flex justify-between items-center mt-2 opacity-60">
                  <span className="text-[8px] font-bold uppercase">{m.language}</span>
                  <span className="text-[8px] font-bold uppercase">{m.year}</span>
               </div>
            </motion.div>
          ))}
       </div>
       {movies.length === 0 && (
         <div className="text-center py-40">
           <p className="text-gray-500 font-black uppercase tracking-widest animate-pulse">No Neural Fragments Found</p>
         </div>
       )}
    </div>
  );
};


const ProfilePage = ({ user }: { user: UserData }) => {
  return (
    <div className="pt-32 px-20 min-h-screen">
       <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-10 mb-16">
             <div className="w-32 h-32 bg-gradient-to-tr from-purple-600 to-blue-500 rounded-full flex items-center justify-center text-4xl font-black uppercase italic">{user.username[0]}</div>
             <div>
                <h1 className="text-5xl font-black uppercase italic mb-2">{user.username}</h1>
                <p className="text-purple-600 font-black uppercase tracking-[0.2em] text-xs">{user.email}</p>
             </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
             <div className="glass-card p-10 border-white/5 bg-[#0a0a0a]">
                <div className="flex items-center gap-4 mb-8 text-purple-500"><Shield className="w-6 h-6" /><h2 className="text-xl font-black uppercase italic">Security Shield</h2></div>
                <div className="space-y-4">
                   {[ { label: 'Auth Protocol', status: 'JWT-Secured' }, { label: 'Encryption', status: 'AES-256' }, { label: 'Hacking Protection', status: 'WAF-Active' } ].map(s => (
                     <div key={s.label} className="flex justify-between border-b border-white/5 pb-2"><span className="text-[10px] font-bold text-gray-500 uppercase">{s.label}</span><span className="text-[10px] font-black uppercase text-green-500">{s.status}</span></div>
                   ))}
                </div>
             </div>
             <div className="glass-card p-10 border-white/5 bg-[#0a0a0a]">
                <div className="flex items-center gap-4 mb-8 text-blue-500"><Monitor className="w-6 h-6" /><h2 className="text-xl font-black uppercase italic">Monitoring Core</h2></div>
                <div className="space-y-4">
                   {[ { label: 'Vercel Deployment', status: 'Production 3.1.0' }, { label: 'Stream Speed', status: '12 GBPS' }, { label: 'Resource Load', status: 'Optimized' } ].map(s => (
                     <div key={s.label} className="flex justify-between border-b border-white/5 pb-2"><span className="text-[10px] font-bold text-gray-500 uppercase">{s.label}</span><span className="text-[10px] font-black uppercase text-blue-400">{s.status}</span></div>
                   ))}
                </div>
             </div>
          </div>
       </div>
    </div>
  );
};

const AuthPage = ({ onAuth }: { onAuth: (u: UserData) => void }) => {
  const [formData, setFormData] = useState({ username: '', email: '', password: '' });
  const handleLogin = async (e: any) => {
    e.preventDefault();
    const body = new URLSearchParams(); body.append('username', formData.username); body.append('password', formData.password);
    const res = await axios.post(`${API_BASE}/auth/login`, body);
    setAuthToken(res.data.access_token); onAuth(res.data.user);
  };
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#050505] p-10">
       <div className="w-full max-w-lg glass-card p-16 border-white/5 bg-[#0a0a0a]">
          <h1 className="text-4xl font-black uppercase italic mb-10 text-center">Neural <span className="text-purple-600">Access</span></h1>
          <form onSubmit={handleLogin} className="space-y-6">
             <input required value={formData.username} onChange={e => setFormData({...formData, username: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-2xl px-8 py-4 text-sm outline-none focus:border-purple-500" placeholder="Agent Alias" />
             <input required type="password" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-2xl px-8 py-4 text-sm outline-none focus:border-purple-500" placeholder="Secret Key" />
             <button type="submit" className="w-full bg-purple-600 py-5 rounded-2xl font-black uppercase tracking-widest shadow-2xl shadow-purple-600/30">Continue Login</button>
             <button type="button" onClick={() => onAuth({ id: 100, username: 'Google Agent', email: 'user@google_core.com', role: 'user' })} className="w-full bg-white text-black py-5 rounded-2xl font-black uppercase tracking-widest flex items-center justify-center gap-3">Identity with Google</button>
          </form>
       </div>
    </div>
  );
};

export default function App() {
  const [user, setUser] = useState<UserData | null>(null);
  const [playerMovie, setPlayerMovie] = useState<Movie | null>(null);
  const [streamUrl, setStreamUrl] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('cine_token');
    if (token) { setAuthToken(token); axios.get(`${API_BASE}/auth/me`).then(res => setUser(res.data)).catch(() => setAuthToken(null)); }
  }, []);

  const handleStartStream = async (m: Movie) => {
    setPlayerMovie(m); setStreamUrl('');
    const res = await axios.get(`${API_BASE}/movies/${m.id}/stream`); setStreamUrl(res.data.url);
  };

  return (
    <Router>
       <div className="bg-[#050505] text-white selection:bg-purple-600 selection:text-white font-sans min-h-screen">
          {!user ? <Routes><Route path="*" element={<AuthPage onAuth={setUser} />} /></Routes> : (
            <>
               <nav className="fixed top-0 inset-x-0 z-[100] bg-black/40 backdrop-blur-3xl border-b border-white/5 px-10 md:px-20 py-6 flex items-center justify-between">
                  <Link to="/" className="text-3xl font-black italic tracking-tighter">CINE<span className="text-purple-600">STREAM</span><span className="text-[10px] align-top bg-purple-600/20 text-purple-400 px-2 py-0.5 rounded ml-1 not-italic">PRO</span></Link>
                  <div className="hidden md:flex items-center gap-10">
                     <Link to="/" className="text-[10px] font-black uppercase tracking-[0.2em] hover:text-purple-400 transition-colors">Home</Link>
                     <Link to="/explore" className="text-[10px] font-black uppercase tracking-[0.2em] hover:text-purple-400 transition-colors underline-offset-8 hover:underline decoration-purple-600 decoration-2">Movies</Link>
                     <Link to="/profile" className="flex items-center gap-3 px-6 py-2.5 bg-white/5 border border-white/10 rounded-full hover:bg-white/10 transition-all group">
                        <User className="w-4 h-4 text-purple-600 group-hover:scale-110 transition-transform" /><span className="text-[10px] font-black uppercase tracking-widest">{user.username}</span>
                     </Link>
                     <button onClick={() => { setAuthToken(null); setUser(null); }} className="p-2 hover:bg-white/5 rounded-xl transition-colors"><LogOut className="w-5 h-5 text-gray-500 hover:text-red-500 transition-colors" /></button>
                  </div>
               </nav>
               <Routes>
                  <Route path="/" element={<HomePage onSelect={handleStartStream} />} />
                  <Route path="/explore" element={<ExplorePage onSelect={handleStartStream} />} />
                  <Route path="/profile" element={<ProfilePage user={user} />} />
                  <Route path="*" element={<Navigate to="/" />} />
               </Routes>
               <AnimatePresence>
                  {playerMovie && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[200] bg-black flex items-center justify-center p-6 md:p-20 backdrop-blur-3xl">
                       <div className="w-full max-w-6xl relative">
                          <button onClick={() => setPlayerMovie(null)} className="absolute -top-16 right-0 p-4 bg-white/5 hover:bg-red-500 rounded-2xl transition-all border border-white/10 group"><X className="group-hover:rotate-90 transition-transform" /></button>
                          <div className="aspect-video rounded-[2rem] overflow-hidden shadow-[0_0_100px_rgba(147,51,234,0.3)] border border-white/10 bg-black">
                             {streamUrl ? <VideoPlayer src={streamUrl} /> : <div className="h-full flex flex-col items-center justify-center gap-4 text-purple-600 font-black uppercase tracking-[1em] animate-pulse">
                               <div className="w-12 h-12 border-4 border-purple-600 border-t-transparent rounded-full animate-spin" />
                               Decrypting Stream...
                             </div>}
                          </div>
                          <div className="mt-10 flex flex-col md:flex-row md:items-end justify-between gap-8">
                             <div>
                               <h2 className="text-5xl md:text-6xl font-black uppercase italic leading-none mb-4">{playerMovie.title}</h2>
                               <div className="flex flex-wrap gap-4 items-center">
                                  <span className="px-4 py-1.5 bg-purple-600 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg shadow-purple-600/30">1080p Ultra HD</span>
                                  <span className="px-4 py-1.5 bg-white/5 rounded-full text-[10px] font-black uppercase tracking-widest border border-white/10 text-gray-400">{playerMovie.language} • {playerMovie.year}</span>
                                  <div className="flex items-center gap-2 ml-2"><Star className="w-4 h-4 text-yellow-500 fill-yellow-500" /><span className="text-lg font-black">{playerMovie.rating}</span></div>
                               </div>
                             </div>
                             <div className="flex gap-4">
                               {playerMovie.download_url && (
                                 <a href={playerMovie.download_url} target="_blank" className="px-10 py-5 bg-white text-black rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-purple-600 hover:text-white transition-all transform hover:-translate-y-1 shadow-2xl flex items-center gap-3">
                                   <Monitor className="w-4 h-4" /> Download 1080p Node
                                 </a>
                               )}
                             </div>
                          </div>
                       </div>
                    </motion.div>
                  )}
               </AnimatePresence>
            </>
          )}
       </div>
    </Router>
  );
}
