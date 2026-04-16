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

  if (loading) return <div className="py-40 text-center text-purple-600 animate-pulse font-black uppercase text-xs">Initializing Neural Link...</div>;

  return (
    <div className="min-h-screen bg-[#050505]">
       {movies.length > 0 && (
         <div className="relative h-[80vh] w-full overflow-hidden">
            <img src={movies[0].image} className="w-full h-full object-cover opacity-30" alt="" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-transparent to-transparent" />
            <div className="absolute inset-y-0 left-0 w-1/2 flex flex-col justify-center px-20">
               <motion.div initial={{ opacity: 0, x: -50 }} animate={{ opacity: 1, x: 0 }}>
                  <span className="bg-purple-600 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest mb-6 inline-block">Direct Global Access</span>
                  <h1 className="text-7xl font-black uppercase italic leading-none mb-6">{movies[0].title}</h1>
                  <p className="text-lg text-gray-400 font-medium max-w-xl mb-10 leading-relaxed">{movies[0].description}</p>
                  <button onClick={() => onSelect(movies[0])} className="bg-white text-black px-10 py-4 rounded-xl font-black uppercase flex items-center gap-3 hover:bg-purple-600 hover:text-white transition-all shadow-2xl">
                     <Play className="w-5 h-5 fill-current" /> Watch Shards (1080p)
                  </button>
               </motion.div>
            </div>
         </div>
       )}
       <div className="-mt-32 relative z-20">
          <MovieRow title="Primary Visual Archive" movies={movies} onSelect={onSelect} />
          <MovieRow title="Global Language Cores" movies={movies.slice().reverse()} onSelect={onSelect} />
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
    <div className="pt-32 px-10 min-h-screen">
       <div className="flex items-center justify-between mb-12">
          <h1 className="text-4xl font-black uppercase italic">Latest <span className="text-purple-600">Syncs</span></h1>
          <div className="flex gap-4">
             <div className="relative w-80">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 w-4 h-4" />
                <input value={search} onChange={e => setSearch(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-3 text-sm focus:border-purple-500 outline-none" placeholder="Search Neural Archive..." />
             </div>
             <select onChange={e => setFilters({...filters, language: e.target.value})} className="bg-white/5 border border-white/10 rounded-xl px-6 py-3 text-[10px] font-black uppercase outline-none">
                <option value="">Languages</option>
                {['Telugu', 'Hindi', 'English', 'Tamil', 'Malayalam', 'Kannada'].map(l => <option key={l} value={l}>{l}</option>)}
             </select>
             <select onChange={e => setFilters({...filters, year: e.target.value})} className="bg-white/5 border border-white/10 rounded-xl px-6 py-3 text-[10px] font-black uppercase outline-none">
                <option value="">Year range</option>
                {Array.from({ length: 2026 - 1900 }, (_, i) => 2026 - i).map(y => <option key={y} value={y.toString()}>{y}</option>)}
             </select>
          </div>
       </div>
       <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-7 gap-6">
          {movies.map(m => (
            <motion.div layout key={m.id} onClick={() => onSelect(m)} className="glass-card p-2 border-white/5 bg-white/5 hover:bg-white/10 transition-all cursor-pointer">
               <img src={m.image} className="aspect-[2/3] rounded-xl object-cover mb-2" alt="" />
               <h3 className="text-[10px] font-black uppercase truncate">{m.title}</h3>
            </motion.div>
          ))}
       </div>
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
               <nav className="fixed top-0 inset-x-0 z-[100] bg-black/40 backdrop-blur-3xl border-b border-white/5 px-20 py-6 flex items-center justify-between">
                  <Link to="/" className="text-3xl font-black italic">CINE<span className="text-purple-600">STREAM</span></Link>
                  <div className="flex items-center gap-12">
                     <Link to="/" className="text-[10px] font-black uppercase tracking-widest hover:text-purple-400">Home</Link>
                     <Link to="/explore" className="text-[10px] font-black uppercase tracking-widest hover:text-purple-400">Latest Releases</Link>
                     <Link to="/profile" className="flex items-center gap-3 px-6 py-3 bg-white/5 border border-white/10 rounded-full hover:bg-white/10 transition-all">
                        <User className="w-4 h-4 text-purple-600" /><span className="text-[10px] font-black uppercase tracking-widest">{user.username}</span>
                     </Link>
                     <button onClick={() => { setAuthToken(null); setUser(null); }}><LogOut className="w-5 h-5 text-gray-500 hover:text-red-500" /></button>
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
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[200] bg-black flex items-center justify-center p-20 backdrop-blur-3xl">
                       <div className="w-full max-w-6xl relative aspect-video">
                          <button onClick={() => setPlayerMovie(null)} className="absolute -top-16 right-0 p-4 hover:bg-red-500 rounded-2xl"><X /></button>
                          {streamUrl ? <VideoPlayer src={streamUrl} /> : <div className="animate-pulse text-purple-600 font-black uppercase">Decrypting Fragment...</div>}
                          <div className="mt-8">
                             <h2 className="text-4xl font-black uppercase italic leading-none">{playerMovie.title}</h2>
                             <div className="flex gap-4 mt-4">
                                <span className="px-3 py-1 bg-white/5 rounded text-[8px] font-black uppercase tracking-widest border border-white/10">1080p Ultra HD</span>
                                {playerMovie.download_url && <a href={playerMovie.download_url} target="_blank" className="px-3 py-1 bg-purple-600 rounded text-[8px] font-black uppercase tracking-widest">Download Node</a>}
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
