import { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { BrowserRouter as Router, Routes, Route, Link, Navigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import videojs from 'video.js';
import 'video.js/dist/video-js.css';
import { 
  Film, Star, X, MessageCircle, User, 
  Zap, LogOut, Play, Search, Heart,
  ChevronRight, ChevronLeft, Settings,
  BarChart, Upload, Users, Monitor
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

interface Category {
  id: number;
  name: string;
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

// --- SHARED COMPONENTS ---

const VideoPlayer = ({ src, options }: { src: string, options?: any }) => {
  const videoRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<any>(null);
  const [quality, setQuality] = useState('1080p');

  useEffect(() => {
    if (!playerRef.current && videoRef.current) {
      const videoElement = document.createElement("video-js");
      videoElement.classList.add('vjs-big-play-centered', 'vjs-netflix-skin');
      videoRef.current.appendChild(videoElement);

      playerRef.current = videojs(videoElement, {
        autoplay: true,
        controls: true,
        responsive: true,
        fluid: true,
        sources: [{ src, type: 'application/x-mpegURL' }],
        ...options
      });
    }

    return () => {
      if (playerRef.current) {
        playerRef.current.dispose();
        playerRef.current = null;
      }
    };
  }, [src]);

  return (
    <div className="relative group">
       <div data-vjs-player>
          <div ref={videoRef} className="rounded-3xl overflow-hidden shadow-2xl border border-white/10" />
       </div>
       <div className="absolute top-6 right-20 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          {['480p', '720p', '1080p'].map(q => (
            <button key={q} onClick={() => setQuality(q)} className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase border transition-all ${quality === q ? 'bg-purple-600 border-purple-500' : 'bg-black/50 border-white/10 text-gray-400'}`}>
              {q}
            </button>
          ))}
       </div>
    </div>
  );
};

// --- PAGES ---

const MovieRow = ({ title, movies, onSelect }: { title: string, movies: Movie[], onSelect: (m: Movie) => void }) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (dir: 'left' | 'right') => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: dir === 'left' ? -400 : 400, behavior: 'smooth' });
    }
  };

  return (
    <div className="mb-12 relative group/row">
       <h2 className="text-xl font-bold mb-6 px-10 flex items-center gap-3">
          <span className="w-1 h-6 bg-purple-600 rounded-full" />
          {title}
       </h2>
       <div className="relative">
          <button onClick={() => scroll('left')} className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-12 h-[calc(100%-24px)] bg-black/60 opacity-0 group-hover/row:opacity-100 transition-opacity flex items-center justify-center">
             <ChevronLeft />
          </button>
          <div ref={scrollRef} className="flex gap-4 overflow-x-hidden px-10">
             {movies.map(movie => (
               <motion.div 
                 key={movie.id} 
                 whileHover={{ scale: 1.05, zIndex: 20 }}
                 className="flex-shrink-0 w-64 aspect-[2/3] rounded-xl overflow-hidden cursor-pointer relative group"
                 onClick={() => onSelect(movie)}
               >
                 <img src={movie.image} className="w-full h-full object-cover" alt="" />
                 <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-black via-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                    <p className="text-xs font-black uppercase truncate">{movie.title}</p>
                    <div className="flex items-center justify-between mt-2">
                       <span className="text-[8px] text-gray-400">{movie.year} • {movie.quality}</span>
                       <div className="flex items-center gap-1">
                          <Star className="w-2 h-2 text-yellow-500 fill-yellow-500" />
                          <span className="text-[8px] font-bold">{movie.rating}</span>
                       </div>
                    </div>
                 </div>
               </motion.div>
             ))}
          </div>
          <button onClick={() => scroll('right')} className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-12 h-[calc(100%-24px)] bg-black/60 opacity-0 group-hover/row:opacity-100 transition-opacity flex items-center justify-center">
             <ChevronRight />
          </button>
       </div>
    </div>
  );
};const HomePage = ({ onSelect }: { onSelect: (m: Movie) => void }) => {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    async function load() {
      const catRes = await axios.get(`${API_BASE}/categories`);
      setCategories(catRes.data);
      
      const movieRes = await axios.get(`${API_BASE}/movies`);
      setMovies(movieRes.data);
    }
    load();
  }, []);

  return (
    <div className="min-h-screen bg-[#050505]">
       {/* Hero Section */}
       {movies.length > 0 && (
         <div className="relative h-[80vh] w-full overflow-hidden">
            <img src={movies[0].image} className="w-full h-full object-cover opacity-40" alt="" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-transparent to-transparent" />
            <div className="absolute inset-y-0 left-0 w-1/2 flex flex-col justify-center px-20">
               <motion.div initial={{ opacity: 0, x: -50 }} animate={{ opacity: 1, x: 0 }}>
                  <span className="bg-purple-600 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest mb-6 inline-block">Featured Highlight</span>
                  <h1 className="text-7xl font-black uppercase italic leading-none mb-6">{movies[0].title}</h1>
                  <p className="text-lg text-gray-400 font-medium max-w-xl mb-10 leading-relaxed">{movies[0].description}</p>
                  <div className="flex gap-4">
                     <button onClick={() => onSelect(movies[0])} className="bg-white text-black px-10 py-4 rounded-xl font-black uppercase flex items-center gap-3 hover:bg-purple-600 hover:text-white transition-all shadow-2xl">
                        <Play className="w-5 h-5 fill-current" /> Initialize Stream
                     </button>
                  </div>
               </motion.div>
            </div>
         </div>
       )}

       {/* Gallery */}
       <div className="-mt-32 relative z-20">
          <MovieRow title="All Movies Library" movies={movies} onSelect={onSelect} />
          {categories.map(cat => (
            <MovieRow 
              key={cat.id} 
              title={`${cat.name} Collection`} 
              movies={movies.filter(m => m.category_id === cat.id)} 
              onSelect={onSelect}
            />
          ))}
       </div>
    </div>
  );
};

const ExplorePage = ({ onSelect }: { onSelect: (m: Movie) => void }) => {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [filters, setFilters] = useState({ language: '', year: '' });
  const [search, setSearch] = useState('');

  const load = async () => {
    const res = await axios.get(`${API_BASE}/movies`, { 
      params: { 
        language: filters.language || undefined,
        year_from: filters.year ? parseInt(filters.year) : undefined,
        q: search || undefined
      } 
    });
    setMovies(res.data);
  };

  useEffect(() => { load(); }, [filters, search]);

  return (
    <div className="pt-32 px-10 min-h-screen">
       <div className="flex items-center justify-between mb-12">
          <h1 className="text-4xl font-black uppercase italic">Latest <span className="text-purple-600">Releases</span></h1>
          <div className="flex gap-4">
             <div className="relative w-80">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 w-4 h-4" />
                <input 
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-3 text-sm focus:border-purple-500 outline-none" 
                  placeholder="Search titles..." 
                />
             </div>
             <select 
               className="bg-white/5 border border-white/10 rounded-xl px-6 py-3 text-[10px] font-black uppercase outline-none"
               onChange={e => setFilters({...filters, language: e.target.value})}
             >
                <option value="">All Languages</option>
                {['Telugu', 'Hindi', 'English', 'Tamil', 'Malayalam', 'Kannada'].map(l => <option key={l} value={l}>{l}</option>)}
             </select>
             <select 
               className="bg-white/5 border border-white/10 rounded-xl px-6 py-3 text-[10px] font-black uppercase outline-none"
               onChange={e => setFilters({...filters, year: e.target.value})}
             >
                <option value="">All Years</option>
                {Array.from({ length: 2026 - 1989 }, (_, i) => 2026 - i).map(y => <option key={y} value={y.toString()}>{y}</option>)}
             </select>
          </div>
       </div>

       <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-7 gap-6">

          {movies.map(movie => (
            <motion.div 
               layout
               key={movie.id} 
               className="glass-card p-2 border-white/5 bg-white/5 hover:bg-white/10 transition-all cursor-pointer"
               onClick={() => onSelect(movie)}
            >
               <div className="aspect-[2/3] rounded-xl overflow-hidden mb-3 relative group">
                  <img src={movie.image} className="w-full h-full object-cover group-hover:scale-105 transition-transform" alt="" />
                  <div className="absolute top-2 left-2 bg-purple-600 px-2 py-1 rounded italic font-black text-[6px] uppercase">{movie.language}</div>
               </div>
               <h3 className="text-[10px] font-black uppercase truncate px-1">{movie.title}</h3>
            </motion.div>
          ))}
       </div>
    </div>
  );
};

const WatchlistPage = ({ onSelect }: { onSelect: (m: Movie) => void }) => {
  const [movies, setMovies] = useState<Movie[]>([]);

  useEffect(() => {
    async function load() {
      const res = await axios.get(`${API_BASE}/favorites`);
      setMovies(res.data);
    }
    load();
  }, []);

  return (
    <div className="pt-32 px-10 min-h-screen">
       <div className="flex items-center justify-between mb-12">
          <h1 className="text-4xl font-black uppercase italic">Saved <span className="text-purple-600">Protocols</span></h1>
       </div>
       {movies.length > 0 ? (
         <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-7 gap-6">
            {movies.map(movie => (
               <div key={movie.id} onClick={() => onSelect(movie)} className="glass-card p-2 border-white/5 bg-white/5 hover:bg-white/10 transition-all cursor-pointer">
                  <img src={movie.image} className="aspect-[2/3] rounded-xl object-cover mb-2" alt="" />
                  <h3 className="text-[10px] font-black uppercase truncate">{movie.title}</h3>
               </div>
            ))}
         </div>
       ) : (
         <div className="py-40 text-center">
            <Heart className="w-16 h-16 text-gray-800 mx-auto mb-6" />
            <p className="text-xs font-black uppercase text-gray-600">No telemetry saved in watchlist</p>
         </div>
       )}
    </div>
  );
};

const AdminDashboard = () => {
  const [tab, setTab] = useState('upload');
  const [formData, setFormData] = useState({ title: '', description: '', language: 'English', year: 2025, category_id: 1, rating: 8.0 });
  const [video, setVideo] = useState<File | null>(null);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    const data = new FormData();
    Object.entries(formData).forEach(([k, v]) => data.append(k, String(v)));
    if (video) data.append('video', video);

    try {
      await axios.post(`${API_BASE}/admin/upload`, data);
      alert('Upload Success!');
    } catch (e) { alert('Upload failed'); }
  };

  return (
    <div className="pt-32 px-10 flex gap-10">
       <aside className="w-64 glass-card p-6 h-fit sticky top-32 border-white/5 bg-[#0a0a0a]">
          <h2 className="text-xs font-black uppercase text-gray-500 mb-8 border-b border-white/5 pb-4">Control Hub</h2>
          <nav className="flex flex-col gap-2">
             {[
               { id: 'upload', icon: Upload, label: 'Upload' },
               { id: 'users', icon: Users, label: 'Userbase' },
               { id: 'monitor', icon: Monitor, label: 'Terminal' },
               { id: 'stats', icon: BarChart, label: 'Metrics' }
             ].map(i => (
               <button key={i.id} onClick={() => setTab(i.id)} className={`flex items-center gap-4 px-6 py-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${tab === i.id ? 'bg-purple-600' : 'hover:bg-white/5 text-gray-400'}`}>
                  <i.icon className="w-4 h-4" /> {i.label}
               </button>
             ))}
          </nav>
       </aside>

       <main className="flex-grow glass-card p-10 border-white/5 bg-[#0a0a0a]">
          {tab === 'upload' && (
            <div className="max-w-2xl">
               <h2 className="text-3xl font-black uppercase mb-10 italic">Secure <span className="text-purple-400">Upload</span></h2>
               <form onSubmit={handleUpload} className="space-y-6">
                  <div className="grid grid-cols-2 gap-6">
                     <div className="space-y-2">
                        <p className="text-[10px] font-black uppercase text-gray-500">Resource Title</p>
                        <input required value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl px-6 py-4 text-sm outline-none focus:border-purple-500" />
                     </div>
                     <div className="space-y-2">
                        <p className="text-[10px] font-black uppercase text-gray-500">Audio Stream</p>
                        <select value={formData.language} onChange={e => setFormData({...formData, language: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl px-6 py-4 text-sm outline-none">
                           {['Telugu', 'Hindi', 'English', 'Tamil'].map(l => <option key={l}>{l}</option>)}
                        </select>
                     </div>
                  </div>
                  <div className="space-y-2">
                     <p className="text-[10px] font-black uppercase text-gray-500">Intelligence Description</p>
                     <textarea required value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl px-6 py-4 text-sm outline-none focus:border-purple-500 h-32" />
                  </div>
                  <div className="space-y-2">
                     <p className="text-[10px] font-black uppercase text-gray-500">Media Hash (Video File)</p>
                     <input type="file" onChange={e => setVideo(e.target.files?.[0] || null)} className="w-full bg-white/5 border border-dashed border-white/20 rounded-xl px-6 py-10 text-xs font-bold text-gray-500 cursor-pointer hover:border-purple-500 transition-colors" />
                  </div>
                  <button type="submit" className="w-full bg-purple-600 py-4 rounded-xl font-black uppercase tracking-widest hover:bg-purple-700 shadow-xl shadow-purple-600/20">Encrypt & Deploy</button>
               </form>
            </div>
          )}
          {tab !== 'upload' && <div className="py-40 text-center font-black uppercase text-gray-600 text-xs">Accessing and decrypting data module...</div>}
       </main>
    </div>
  );
};

// --- AUTH ---

const AuthPage = ({ onAuth }: { onAuth: (u: UserData) => void }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({ username: '', email: '', password: '' });

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (isLogin) {
        const body = new URLSearchParams();
        body.append('username', formData.username);
        body.append('password', formData.password);
        const res = await axios.post(`${API_BASE}/auth/login`, body);
        setAuthToken(res.data.access_token);
        onAuth(res.data.user);
      } else {
        await axios.post(`${API_BASE}/auth/signup`, formData);
        setIsLogin(true);
      }
    } catch (e: any) { alert(e.response?.data?.detail || 'Auth Error'); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#050505] p-10">
       <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 bg-[#0a0a0a] rounded-[2.5rem] overflow-hidden shadow-2xl border border-white/5">
          <div className="p-16 flex flex-col justify-center">
             <div className="mb-10">
                <h1 className="text-4xl font-black uppercase italic mb-2 tracking-tighter">CINE<span className="text-purple-600">STREAM</span></h1>
                <p className="text-[10px] font-black uppercase text-gray-500 tracking-[0.3em]">Quantum Visual Core</p>
             </div>
             
             <h2 className="text-2xl font-black uppercase italic mb-8">{isLogin ? 'Authenticate' : 'Establish Identity'}</h2>
             <form onSubmit={handleAuth} className="space-y-4">
                <input required value={formData.username} onChange={e => setFormData({...formData, username: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-sm outline-none focus:border-purple-500" placeholder="Username" />
                {!isLogin && <input required type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-sm outline-none focus:border-purple-500" placeholder="Email" />}
                <input required type="password" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-sm outline-none focus:border-purple-500" placeholder="Secret Key" />
                <button type="submit" className="w-full bg-gradient-to-r from-purple-600 to-blue-500 py-4 rounded-2xl font-black uppercase tracking-widest hover:opacity-90 transition-all shadow-xl shadow-purple-600/30">Continue</button>
             </form>

             <div className="relative flex items-center py-6">
                <div className="flex-grow border-t border-white/5"></div>
                <span className="flex-shrink mx-4 text-gray-500 text-[10px] font-black uppercase tracking-widest">Or</span>
                <div className="flex-grow border-t border-white/5"></div>
             </div>

             <button 
                type="button" 
                onClick={() => {
                   setAuthToken('google_mock_token');
                   onAuth({ id: 999, username: 'Google User', email: 'user@gmail.com', role: 'user' });
                }}
                className="w-full bg-white text-black py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-3 hover:bg-gray-200 transition-all shadow-xl"
             >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                   <path fill="#EA4335" d="M12 5.04c1.94 0 3.1 1.05 3.85 1.76l2.84-2.84C16.81 2.19 14.61 1 12 1 7.7 1 4.1 3.5 2.5 7.15l3.35 2.6c.79-2.28 2.92-3.71 6.15-3.71z"/>
                   <path fill="#4285F4" d="M23.5 12.2c0-.79-.07-1.54-.19-2.27H12v4.3h6.43c-.28 1.44-1.09 2.65-2.29 3.4l3.56 2.77c2.09-1.92 3.3-4.74 3.3-8.2z"/>
                   <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.34-1.36-.34-2.09s.12-1.43.34-2.09l-3.35-2.6C1.65 8.7 1 10.28 1 12s.65 3.3 1.49 4.65l3.35-2.56z"/>
                   <path fill="#34A853" d="M12 23c3.24 0 5.95-1.08 7.93-2.91l-3.56-2.77c-1.1.74-2.5 1.18-4.37 1.18-3.21 0-5.92-2.16-6.89-5.07l-3.35 2.6c1.6 3.65 5.21 6.15 9.24 6.15z"/>
                </svg>
                Identity with Google
             </button>

             
             <button onClick={() => setIsLogin(!isLogin)} className="mt-8 text-[10px] font-black uppercase text-gray-500 hover:text-purple-400 transition-colors">
                {isLogin ? "Generate new profile" : "Return to authentication"}
             </button>
          </div>
          <div className="hidden md:block bg-purple-600 relative overflow-hidden">
             <img src="https://images.unsplash.com/photo-1485846234645-a62644f84728" className="w-full h-full object-cover opacity-60" alt="" />
             <div className="absolute inset-0 bg-gradient-to-br from-purple-900/80 to-blue-900/80" />
             <div className="absolute inset-0 p-16 flex flex-col justify-end">
                <Zap className="w-12 h-12 text-white mb-6" />
                <h3 className="text-4xl font-black uppercase italic leading-none mb-4">Unleash the <br/> Streaming Engine</h3>
                <p className="text-sm font-medium text-purple-200">Access millions of movie protocols instantly with full 1080p decryption and HLS streaming logic.</p>
             </div>
          </div>
       </div>
    </div>
  );
};

// --- APP ENTRY ---

export default function App() {
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [playerMovie, setPlayerMovie] = useState<Movie | null>(null);
  const [streamUrl, setStreamUrl] = useState('');

  const init = async () => {
    const token = localStorage.getItem('cine_token');
    if (token) {
      setAuthToken(token);
      try {
        const res = await axios.get(`${API_BASE}/auth/me`);
        setUser(res.data);
      } catch (e) { setAuthToken(null); }
    }
    setLoading(false);
  };

  useEffect(() => { init(); }, []);

  const handleStartStream = async (m: Movie) => {
    setPlayerMovie(m);
    try {
      const res = await axios.get(`${API_BASE}/movies/${m.id}/stream`);
      setStreamUrl(res.data.url);
    } catch (e) { alert('Stream decryption failed'); }
  };

  if (loading) return <div className="min-h-screen bg-black flex items-center justify-center"><div className="w-10 h-10 border-2 border-purple-600 border-t-transparent animate-spin rounded-full" /></div>;

  return (
    <Router>
       <div className="bg-[#050505] text-white selection:bg-purple-600 selection:text-white font-sans">
          {!user ? (
            <Routes>
               <Route path="*" element={<AuthPage onAuth={setUser} />} />
            </Routes>
          ) : (
            <>
               {/* Navbar */}
               <nav className="fixed top-0 inset-x-0 z-[100] bg-black/40 backdrop-blur-2xl border-b border-white/5 px-20 py-6 flex items-center justify-between">
                  <div className="flex items-center gap-12">
                     <Link to="/" className="text-3xl font-black italic tracking-tighter flex items-center gap-4">
                        <div className="w-10 h-10 bg-purple-600 rounded-2xl flex items-center justify-center"><Film className="w-6 h-6" /></div>
                        CINE<span className="text-purple-600">STREAM</span>
                     </Link>
                     <div className="flex items-center gap-8">
                        <Link to="/" className="text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-white transition-colors">Home</Link>
                        <Link to="/explore" className="text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-white transition-colors">Explore</Link>
                        <Link to="/watchlist" className="text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-white transition-colors">Watchlist</Link>
                        {user.role === 'admin' && <Link to="/admin" className="text-[10px] font-black uppercase tracking-widest text-purple-400 hover:text-purple-300 transition-colors">Admin Core</Link>}
                     </div>
                  </div>
                  <div className="flex items-center gap-8">
                     <div className="flex items-center gap-4 px-4 py-2 bg-white/5 rounded-full border border-white/10 group cursor-pointer hover:bg-white/10 transition-colors">
                        <User className="w-4 h-4 text-purple-600" />
                        <span className="text-[10px] font-black uppercase tracking-widest">{user.username || user.email}</span>
                        <Settings className="w-4 h-4 text-gray-600 group-hover:rotate-90 transition-transform" />
                     </div>
                     <button onClick={() => { setAuthToken(null); setUser(null); }} className="p-2 text-gray-500 hover:text-red-500 transition-colors">
                        <LogOut className="w-5 h-5" />
                     </button>
                  </div>
               </nav>

               <Routes>
                  <Route path="/" element={<HomePage onSelect={handleStartStream} />} />
                  <Route path="/explore" element={<ExplorePage onSelect={handleStartStream} />} />
                  <Route path="/watchlist" element={<WatchlistPage onSelect={handleStartStream} />} />
                  <Route path="/admin" element={user.role === 'admin' ? <AdminDashboard /> : <Navigate to="/" />} />
                  <Route path="*" element={<Navigate to="/" />} />
               </Routes>


               {/* Video Modal */}
               <AnimatePresence>
                  {playerMovie && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[200] bg-black flex items-center justify-center p-20 backdrop-blur-3xl">
                       <div className="w-full max-w-7xl relative aspect-video">
                          <button 
                            onClick={() => { setPlayerMovie(null); setStreamUrl(''); }}
                            className="absolute -top-16 right-0 p-4 bg-white/5 hover:bg-red-500 rounded-2xl transition-all"
                          >
                             <X />
                          </button>
                          {streamUrl ? (
                            <VideoPlayer src={streamUrl} />
                          ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center gap-6">
                               <div className="w-20 h-20 border-4 border-purple-600 border-t-transparent animate-spin rounded-full" />
                               <p className="text-[10px] font-black uppercase text-purple-600 tracking-widest">Decrypting Streaming Manifest...</p>
                            </div>
                          )}
                          <div className="absolute -bottom-24 left-0">
                             <h2 className="text-4xl font-black uppercase italic leading-none">{playerMovie.title}</h2>
                             <p className="text-gray-400 font-medium max-w-2xl mt-4">{playerMovie.description}</p>
                          </div>
                       </div>
                    </motion.div>
                  )}
               </AnimatePresence>

               {/* Chatbot Overlay */}
               <div className="fixed bottom-10 right-10 z-[100] group">
                  <div className="absolute bottom-20 right-0 w-80 glass-card p-6 border-white/10 opacity-0 group-hover:opacity-100 transition-all scale-95 group-hover:scale-100 pointer-events-none group-hover:pointer-events-auto bg-[#0a0a0a]">
                     <div className="flex flex-col gap-4">
                        <div className="flex items-center gap-3 border-b border-white/5 pb-4">
                           <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center"><BarChart className="w-4 h-4" /></div>
                           <p className="text-[10px] font-black uppercase tracking-tighter">System Intelligence</p>
                        </div>
                        <p className="text-[10px] text-gray-500 uppercase leading-relaxed font-bold">Hello protocol. All visual systems at 100%. Streaming shards fully operational. How can I assist?</p>
                     </div>
                  </div>
                  <button className="w-16 h-16 bg-purple-600 rounded-3xl flex items-center justify-center shadow-2xl shadow-purple-600/40 hover:scale-110 transition-transform">
                     <MessageCircle className="w-8 h-8" />
                  </button>
               </div>
            </>
          )}
       </div>
    </Router>
  );
}
