import { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { BrowserRouter as Router, Routes, Route, Link, Navigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import videojs from 'video.js';
import 'video.js/dist/video-js.css';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, ResponsiveContainer 
} from 'recharts';
import { 
  Film, Star, 
  X, MessageCircle, Send, User, Key,
  Zap, Heart, LogOut, Play
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
  genre: string;
  language?: string;
  quality?: string;
  video_url?: string;
  download_url?: string;
  year?: number;
  collection?: string;
}

interface UserData {
  id: number;
  username: string;
  email: string;
  role: string;
}

interface AuditLog {
  id: number;
  action: string;
  user: string;
  timestamp: string;
  status: string;
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
      videoElement.classList.add('vjs-big-play-centered');
      videoRef.current.appendChild(videoElement);

      playerRef.current = videojs(videoElement, {
        autoplay: false,
        controls: true,
        responsive: true,
        fluid: true,
        sources: [{ src, type: 'application/x-mpegURL' }] // HLS
      }, () => {
        console.log('player is ready');
      });
    } else if (playerRef.current) {
        playerRef.current.src({ src, type: 'application/x-mpegURL' });
    }

    return () => {
      if (playerRef.current) {
        playerRef.current.dispose();
        playerRef.current = null;
      }
    };
  }, [src]);

  return (
    <div data-vjs-player>
      <div ref={videoRef} className="w-full h-full rounded-2xl overflow-hidden" />
    </div>
  );
};

const AuthForm = ({ onAuth }: { onAuth: (u: UserData) => void }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({ username: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      if (isLogin) {
        const body = new URLSearchParams();
        body.append('username', formData.username);
        body.append('password', formData.password);
        const res = await axios.post(`${API_BASE}/auth/login`, body);
        setAuthToken(res.data.access_token);
        onAuth(res.data.user);
      } else {
        await axios.post(`${API_BASE}/auth/signup`, {
          username: formData.username,
          email: formData.email,
          password: formData.password
        });
        setIsLogin(true);
        setError('Account created! Please login.');
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-[#050505]">
       <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card w-full max-w-md p-10 border-white/5 bg-[#0a0a0a]">
          <div className="text-center mb-8">
            <h2 className="text-4xl font-black uppercase italic leading-none mb-2">{isLogin ? 'Login' : 'Sign Up'}</h2>
            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Access the Pro Streaming Core</p>
          </div>
          
          {error && <div className="bg-red-500/20 text-red-500 p-4 rounded-xl text-[10px] font-bold uppercase mb-6 text-center border border-red-500/30">{error}</div>}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
               <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 w-4 h-4" />
               <input required value={formData.username} onChange={e => setFormData({...formData, username: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-4 text-sm focus:border-purple-500 outline-none" placeholder="Username" />
            </div>
            {!isLogin && (
              <div className="relative">
                 <Send className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 w-4 h-4" />
                 <input required type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-4 text-sm focus:border-purple-500 outline-none" placeholder="Email Address" />
              </div>
            )}
            <div className="relative">
               <Key className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 w-4 h-4" />
               <input required type="password" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-4 text-sm focus:border-purple-500 outline-none" placeholder="Password" />
            </div>
            <button disabled={loading} type="submit" className="w-full bg-gradient-to-r from-purple-600 to-blue-500 text-white py-4 rounded-xl font-black uppercase tracking-widest hover:opacity-90 transition-all shadow-xl shadow-purple-600/20">
              {loading ? 'Processing...' : isLogin ? 'Authorize' : 'Register'}
            </button>

            <div className="relative flex items-center py-4">
               <div className="flex-grow border-t border-white/10"></div>
               <span className="flex-shrink mx-4 text-gray-500 text-[10px] font-black uppercase">Or</span>
               <div className="flex-grow border-t border-white/10"></div>
            </div>

            <button 
               type="button" 
               onClick={() => {
                  setAuthToken('google_mock_token');
                  onAuth({ id: 999, username: 'Google User', email: 'user@gmail.com', role: 'user' });
               }}
               className="w-full bg-white text-black py-4 rounded-xl font-bold text-sm flex items-center justify-center gap-3 hover:bg-gray-200 transition-all"
            >

               <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#EA4335" d="M12 5.04c1.94 0 3.1 1.05 3.85 1.76l2.84-2.84C16.81 2.19 14.61 1 12 1 7.7 1 4.1 3.5 2.5 7.15l3.35 2.6c.79-2.28 2.92-3.71 6.15-3.71z"/>
                  <path fill="#4285F4" d="M23.5 12.2c0-.79-.07-1.54-.19-2.27H12v4.3h6.43c-.28 1.44-1.09 2.65-2.29 3.4l3.56 2.77c2.09-1.92 3.3-4.74 3.3-8.2z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.34-1.36-.34-2.09s.12-1.43.34-2.09l-3.35-2.6C1.65 8.7 1 10.28 1 12s.65 3.3 1.49 4.65l3.35-2.56z"/>
                  <path fill="#34A853" d="M12 23c3.24 0 5.95-1.08 7.93-2.91l-3.56-2.77c-1.1.74-2.5 1.18-4.37 1.18-3.21 0-5.92-2.16-6.89-5.07l-3.35 2.6c1.6 3.65 5.21 6.15 9.24 6.15z"/>
               </svg>
               Continue with Google
            </button>

          </form>

          <div className="text-center pt-6">
             <button onClick={() => setIsLogin(!isLogin)} className="text-[10px] font-black uppercase text-gray-500 hover:text-purple-500 transition-colors">
               {isLogin ? "New user? Create an identity" : "Existing user? Authenticate here"}
             </button>
          </div>
       </motion.div>
    </div>
  );
};

const Navbar = ({ user, onLogout }: { user: UserData | null, onLogout: () => void }) => {
  return (
    <nav className="fixed top-0 inset-x-0 z-[100] bg-black/50 backdrop-blur-xl border-b border-white/5 p-6 flex items-center justify-between">
       <Link to="/" className="flex items-center gap-3">
          <div className="w-10 h-10 bg-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-purple-600/20">
            <Film className="w-6 h-6" />
          </div>
          <span className="text-2xl font-black italic tracking-tighter">CINE<span className="text-purple-600">STREAM</span></span>
       </Link>

       <div className="flex items-center gap-8">
          <Link to="/" className="text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-white">Movies</Link>
          <Link to="/favorites" className="text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-white">Watchlist</Link>
          <Link to="/monitoring" className="text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-white">Metrics</Link>
       </div>

       <div className="flex items-center gap-6">
          <div className="flex items-center gap-3 px-4 py-2 bg-white/5 rounded-full border border-white/10">
             <User className="w-4 h-4 text-purple-500" />
             <span className="text-[10px] font-black uppercase tracking-widest">{user?.username}</span>
          </div>
          <button onClick={onLogout} className="p-2 text-gray-500 hover:text-red-500 transition-colors"><LogOut className="w-4 h-4" /></button>
       </div>
    </nav>
  );
};

const MovieGrid = () => {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [favorites, setFavorites] = useState<number[]>([]);
  const [activeTab, setActiveTab] = useState('All');
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);
  const [streamUrl, setStreamUrl] = useState<string | null>(null);
  const [loadingStream, setLoadingStream] = useState(false);

  const fetchMovies = async () => {
    try {
      const res = await axios.get(`${API_BASE}/movies`, { params: { collection: activeTab } });
      setMovies(res.data);
    } catch (e) { console.error(e); }
  };

  const fetchFavorites = async () => {
    try {
      const res = await axios.get(`${API_BASE}/favorites`);
      setFavorites(res.data.map((m: Movie) => m.id));
    } catch (e) { console.error(e); }
  };

  useEffect(() => { 
    fetchMovies(); 
    fetchFavorites();
  }, [activeTab]);

  const toggleFavorite = async (movieId: number) => {
    const isFav = favorites.includes(movieId);
    try {
      if (isFav) {
        await axios.delete(`${API_BASE}/movies/${movieId}/favorite`);
        setFavorites(f => f.filter(id => id !== movieId));
      } else {
        await axios.post(`${API_BASE}/movies/${movieId}/favorite`);
        setFavorites(f => [...f, movieId]);
      }
    } catch (e) { console.error(e); }
  };

  const startStream = async (movie: Movie) => {
    setLoadingStream(true);
    setSelectedMovie(movie);
    try {
      const res = await axios.get(`${API_BASE}/movies/${movie.id}/stream`);
      setStreamUrl(res.data.url);
    } catch (e) { console.error(e); }
    finally { setLoadingStream(false); }
  };

  return (
    <div className="pt-32 pb-20 px-10">
      <div className="flex items-center gap-4 mb-12">
         {['All', '90s', '2000-2026'].map(tab => (
           <button key={tab} onClick={() => setActiveTab(tab)} className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${activeTab === tab ? 'bg-purple-600 border-purple-500 text-white shadow-lg shadow-purple-600/20' : 'bg-white/5 border-white/5 text-gray-500 hover:text-white'}`}>
             {tab} Movies
           </button>
         ))}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
         {movies.map(movie => (
           <motion.div layout key={movie.id} className="group relative glass-card p-2 border-white/5 bg-white/5 hover:bg-white/10 transition-all">
              <div className="aspect-[2/3] rounded-xl overflow-hidden mb-4 relative">
                 <img src={movie.image} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                 <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-black via-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex justify-between items-center">
                    <button onClick={() => startStream(movie)} className="text-[10px] font-black uppercase text-purple-500 hover:text-white flex items-center gap-2">
                       <Play className="w-3 h-3" /> Stream
                    </button>
                    {movie.download_url && (
                       <a href={movie.download_url} target="_blank" rel="noreferrer" className="text-[10px] font-black uppercase text-gray-500 hover:text-white flex items-center gap-2">
                          <Zap className="w-3 h-3" /> Download
                       </a>
                    )}
                 </div>

                 <button onClick={() => toggleFavorite(movie.id)} className="absolute top-4 right-4 p-2 bg-black/40 backdrop-blur-md rounded-lg hover:text-red-500 transition-colors">
                    <Heart className={`w-4 h-4 ${favorites.includes(movie.id) ? 'fill-red-500 text-red-500' : ''}`} />
                 </button>
              </div>
              <h3 className="text-xs font-black uppercase tracking-tight text-white px-2 truncate">{movie.title}</h3>
              <div className="flex items-center justify-between px-2 mt-2">
                 <span className="text-[8px] font-black text-gray-500 uppercase">{movie.genre} • {movie.year}</span>
                 <div className="flex items-center gap-1">
                    <Star className="w-2 h-2 text-yellow-500 fill-yellow-500" />
                    <span className="text-[8px] font-black text-white">{movie.rating}</span>
                 </div>
              </div>
           </motion.div>
         ))}
      </div>

      <AnimatePresence>
         {selectedMovie && (
           <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[200] bg-black/95 flex items-center justify-center p-10 backdrop-blur-3xl">
              <div className="w-full max-w-6xl aspect-video bg-black rounded-[2rem] overflow-hidden relative shadow-2xl border border-white/10">
                 <button onClick={() => { setSelectedMovie(null); setStreamUrl(null); }} className="absolute top-6 right-6 z-[210] p-4 bg-white/10 hover:bg-red-500 rounded-2xl transition-all"><X /></button>
                 
                 {loadingStream ? (
                   <div className="w-full h-full flex flex-col items-center justify-center gap-6">
                      <div className="w-20 h-20 border-4 border-purple-600 border-t-transparent animate-spin rounded-full" />
                      <p className="text-[10px] font-black uppercase tracking-widest text-purple-400">Decrypting Stream Shard...</p>
                   </div>
                 ) : streamUrl ? (
                   <VideoPlayer src={streamUrl} />
                 ) : (
                   <div className="w-full h-full flex items-center justify-center text-red-500 font-black uppercase text-xs">Failed to initialize player</div>
                 )}

                 <div className="absolute bottom-0 left-0 right-0 p-10 bg-gradient-to-t from-black via-black/80 to-transparent">
                    <h2 className="text-3xl font-black uppercase italic text-white mb-2">{selectedMovie.title}</h2>
                    <p className="text-sm text-gray-400 max-w-2xl font-medium">{selectedMovie.description}</p>
                 </div>
              </div>
           </motion.div>
         )}
      </AnimatePresence>
    </div>
  );
};

const FavoritesPage = () => {
  const [movies, setMovies] = useState<Movie[]>([]);
  
  useEffect(() => {
    axios.get(`${API_BASE}/favorites`).then(res => setMovies(res.data)).catch(e => console.error(e));
  }, []);

  return (
    <div className="pt-32 pb-20 px-10">
       <h1 className="text-5xl font-black uppercase italic mb-12">My <span className="text-red-500">Watchlist</span></h1>
       <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
         {movies.map(movie => (
           <div key={movie.id} className="glass-card p-2 border-white/5 bg-white/5">
              <div className="aspect-[2/3] rounded-xl overflow-hidden mb-4">
                 <img src={movie.image} alt="" className="w-full h-full object-cover" />
              </div>
              <h3 className="text-xs font-black uppercase tracking-tight text-white px-2 truncate">{movie.title}</h3>
           </div>
         ))}
         {movies.length === 0 && <div className="col-span-full py-40 text-center text-gray-600 font-black uppercase text-xs">No favorites saved yet.</div>}
       </div>
    </div>
  );
};

const MonitoringPage = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  useEffect(() => { axios.get(`${API_BASE}/audit`).then(res => setLogs(res.data)).catch(e => console.error(e)); }, []);

  return (
    <div className="pt-32 pb-20 px-10 max-w-7xl mx-auto">
       <h1 className="text-5xl font-black uppercase italic mb-12">Performance <span className="text-purple-500">Analytics</span></h1>
       <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 glass-card p-10 border-white/5 bg-[#111] aspect-video">
             <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={[{n: '00', u: 99}, {n: '04', u: 98}, {n: '08', u: 100}, {n: '12', u: 99}]}>
                   <CartesianGrid strokeDasharray="3 3" stroke="#222" />
                   <XAxis dataKey="n" stroke="#444" />
                   <YAxis stroke="#444" />
                   <Area type="monotone" dataKey="u" stroke="#8b5cf6" fill="#8b5cf620" />
                </AreaChart>
             </ResponsiveContainer>
          </div>
          <div className="glass-card p-10 border-white/5 bg-[#0a0a0a]">
             <h3 className="text-xs font-black uppercase text-gray-500 mb-8 border-b border-white/5 pb-4">Live SecOps Audit</h3>
             <div className="space-y-6">
                {logs.map(log => (
                  <div key={log.id} className="flex flex-col gap-1 border-b border-white/5 pb-4">
                     <p className="text-[10px] font-black uppercase tracking-widest">{log.action}</p>
                     <div className="flex justify-between items-center">
                        <span className="text-[8px] text-gray-500 font-bold uppercase">{log.user}</span>
                        <span className="text-[8px] text-green-500 font-black">{log.status}</span>
                     </div>
                  </div>
                ))}
             </div>
          </div>
       </div>
    </div>
  );
};

// --- APP ENTRY ---
function App() {
  const [user, setUser] = useState<UserData | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('cine_token');
    if (token) {
      setAuthToken(token);
      axios.get(`${API_BASE}/auth/me`)
        .then(res => setUser(res.data))
        .catch(() => setAuthToken(null))
        .finally(() => setChecking(false));
    } else {
      setChecking(false);
    }
  }, []);

  const handleLogout = () => {
    setAuthToken(null);
    setUser(null);
  };

  if (checking) return <div className="min-h-screen bg-black flex items-center justify-center"><div className="w-10 h-10 border-2 border-purple-600 border-t-transparent animate-spin rounded-full" /></div>;

  return (
    <Router>
      <div className="min-h-screen bg-[#050505] text-white selection:bg-purple-500 selection:text-white">
        {!user ? (
          <Routes>
            <Route path="*" element={<AuthForm onAuth={setUser} />} />
          </Routes>
        ) : (
          <>
            <Navbar user={user} onLogout={handleLogout} />
            <Routes>
              <Route path="/" element={<MovieGrid />} />
              <Route path="/favorites" element={<FavoritesPage />} />
              <Route path="/monitoring" element={<MonitoringPage />} />
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
            <Chatbot />
          </>
        )}
      </div>
    </Router>
  );
}

const Chatbot = () => {
  const [isOpen, setOpen] = useState(false);
  const [messages] = useState([{ text: "Pro Streaming Engine Active. How can I assist?", isBot: true }]);

  return (
    <div className="fixed bottom-6 right-6 z-[100]">
      <button onClick={() => setOpen(!isOpen)} className="w-14 h-14 bg-purple-600 rounded-2xl flex items-center justify-center shadow-2xl shadow-purple-600/40 hover:scale-110 transition-transform">
          <MessageCircle className="text-white w-7 h-7" />
      </button>
      <AnimatePresence>
        {isOpen && (
           <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="absolute bottom-20 right-0 w-80 glass-card p-6 border-white/10 bg-[#111]">
              {messages.map((m, i) => (
                <div key={i} className="text-[10px] font-black uppercase text-gray-400">{m.text}</div>
              ))}
           </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default App;
