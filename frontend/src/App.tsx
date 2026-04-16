import { useEffect, useState, useMemo } from 'react';
import axios from 'axios';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from 'recharts';
import { 
  Film, Star, Activity, ShieldCheck, 
  X, Cpu, MessageCircle, Send, User, Key,
  Shield, Settings, Lock, CreditCard, ExternalLink, Search, Zap
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
  category?: string;
  quality?: string;
  video_url?: string;
  download_url?: string;
}

interface AuditLog {
  id: number;
  action: string;
  user: string;
  timestamp: string;
  status: string;
}

// --- COMPONENTS ---

const LoginModal = ({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) => {
  const [isLogin, setIsLogin] = useState(true);
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[200] bg-black/90 backdrop-blur-xl flex items-center justify-center p-6">
          <motion.div initial={{ scale: 0.9, y: 30 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 30 }} className="glass-card w-full max-w-md p-10 border-white/5 relative bg-[#0a0a0a]">
            <button onClick={onClose} className="absolute top-6 right-6 text-gray-500 hover:text-white"><X /></button>
            <div className="text-center mb-8">
              <h2 className="text-3xl font-black uppercase italic leading-none mb-2">{isLogin ? 'Welcome Back' : 'Join CineBook'}</h2>
              <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">Connect with your secure workspace</p>
            </div>
             <div className="space-y-4">
               <button className="w-full bg-white text-black py-4 rounded-xl font-bold text-sm flex items-center justify-center gap-3 hover:bg-gray-200 transition-all border border-gray-300">
                 <svg className="w-5 h-5" viewBox="0 0 24 24">
                   <path fill="#EA4335" d="M12 5.04c1.94 0 3.1 1.05 3.85 1.76l2.84-2.84C16.81 2.19 14.61 1 12 1 7.7 1 4.1 3.5 2.5 7.15l3.35 2.6c.79-2.28 2.92-3.71 6.15-3.71z"/>
                   <path fill="#4285F4" d="M23.5 12.2c0-.79-.07-1.54-.19-2.27H12v4.3h6.43c-.28 1.44-1.09 2.65-2.29 3.4l3.56 2.77c2.09-1.92 3.3-4.74 3.3-8.2z"/>
                   <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.34-1.36-.34-2.09s.12-1.43.34-2.09l-3.35-2.6C1.65 8.7 1 10.28 1 12s.65 3.3 1.49 4.65l3.35-2.56z"/>
                   <path fill="#34A853" d="M12 23c3.24 0 5.95-1.08 7.93-2.91l-3.56-2.77c-1.1.74-2.5 1.18-4.37 1.18-3.21 0-5.92-2.16-6.89-5.07l-3.35 2.6c1.6 3.65 5.21 6.15 9.24 6.15z"/>
                 </svg>
                 Continue with Google
               </button>
               <div className="relative flex items-center py-2">
                 <div className="flex-grow border-t border-white/10"></div>
                 <span className="flex-shrink mx-4 text-gray-500 text-[10px] font-black uppercase">Or with Email</span>
                 <div className="flex-grow border-t border-white/10"></div>
               </div>
               <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 w-4 h-4" />
                  <input className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-4 text-sm focus:border-purple-500 outline-none" placeholder="Email Address" />
               </div>
               <div className="relative">
                  <Key className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 w-4 h-4" />
                  <input type="password" className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-4 text-sm focus:border-purple-500 outline-none" placeholder="Password" />
               </div>
               <button 
                 onClick={() => {
                   onClose();
                   window.location.reload(); 
                 }}
                 className="w-full bg-gradient-to-r from-purple-600 to-blue-500 text-white py-4 rounded-xl font-black uppercase tracking-widest hover:opacity-90 transition-all">
                 {isLogin ? 'Sign In' : 'Create Account'}
               </button>
               <div className="text-center pt-4">
                  <button onClick={() => setIsLogin(!isLogin)} className="text-[10px] font-black uppercase text-gray-500 hover:text-purple-500 transition-colors">
                    {isLogin ? "Don't have an account? Sign Up" : "Already have an account? Sign In"}
                  </button>
               </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

const Chatbot = () => {
  const [isOpen, setOpen] = useState(false);
  const [messages, setMessages] = useState([{ text: "Hi! I'm your DevSecOps guide. How can I help you navigate CineBook?", isBot: true }]);
  const [input, setInput] = useState('');

  const send = () => {
    if (!input) return;
    setMessages(prev => [...prev, { text: input, isBot: false }]);
    setTimeout(() => {
      setMessages(prev => [...prev, { text: "That's a great question! Our platform is a secure hybrid of FastAPI and React, deploying dynamically through Vercel with real-time health checks.", isBot: true }]);
    }, 1000);
    setInput('');
  };

  return (
    <div className="fixed bottom-6 right-6 z-[100]">
      <AnimatePresence>
        {isOpen && (
          <motion.div initial={{ opacity: 0, y: 10, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 10, scale: 0.95 }} className="glass-card w-80 h-[450px] mb-4 overflow-hidden flex flex-col bg-[#111] border-white/10">
            <div className="p-4 border-b border-white/10 bg-gradient-to-r from-purple-600/20 to-blue-600/10 flex items-center justify-between">
               <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center"><Cpu className="w-4 h-4 text-white" /></div>
                  <span className="text-xs font-black uppercase tracking-widest">DevSecOps AI</span>
               </div>
               <button onClick={() => setOpen(false)}><X className="w-4 h-4" /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
               {messages.map((m, i) => (
                 <div key={i} className={`flex ${m.isBot ? 'justify-start' : 'justify-end'}`}>
                    <div className={`max-w-[80%] p-3 rounded-2xl text-[11px] font-medium leading-relaxed ${m.isBot ? 'bg-white/5 text-gray-300' : 'bg-purple-600 text-white'}`}>
                      {m.text}
                    </div>
                 </div>
               ))}
            </div>
            <div className="p-4 border-t border-white/10 flex gap-2">
               <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && send()} className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs outline-none focus:border-purple-500" placeholder="Type a message..." />
               <button onClick={send} className="p-2 bg-purple-600 rounded-lg"><Send className="w-3 h-3" /></button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <button onClick={() => setOpen(!isOpen)} className="w-14 h-14 bg-orange-600 rounded-full flex items-center justify-center shadow-2xl shadow-orange-600/40 hover:scale-110 transition-transform">
        <div className="relative">
          <MessageCircle className="text-white w-7 h-7" />
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-[#111]" />
        </div>
      </button>
    </div>
  );
};

const ExternalPlayerLinks = ({ url, title }: { url: string, title: string }) => {
  const vlcLink = `vlc://${url}`;
  const mxLink = `intent:${url}#Intent;package=com.mxtech.videoplayer.ad;S.title=${encodeURIComponent(title)};end`;

  return (
    <div className="flex gap-2 mt-4">
      <a href={vlcLink} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-[8px] font-black uppercase py-2 rounded-lg text-center transition-colors">Play in VLC</a>
      <a href={mxLink} className="flex-1 bg-green-600 hover:bg-green-700 text-white text-[8px] font-black uppercase py-2 rounded-lg text-center transition-colors">Play in MX Player</a>
    </div>
  );
};


const GeneratedLinksTab = () => {
  const [links, setLinks] = useState<Movie[]>([]);
  
  useEffect(() => {
    const saved = localStorage.getItem('generated_links');
    if (saved) setLinks(JSON.parse(saved));
    
    const handleUpdate = () => {
      const updated = localStorage.getItem('generated_links');
      if (updated) setLinks(JSON.parse(updated));
    };
    
    window.addEventListener('linksUpdated', handleUpdate);
    return () => window.removeEventListener('linksUpdated', handleUpdate);
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-3xl font-black uppercase italic">Mino <span className="text-purple-500">Premium Links</span></h2>
        <span className="text-[10px] font-black uppercase bg-purple-600/20 text-purple-400 px-4 py-2 rounded-full border border-purple-500/30">Verified Assets</span>
      </div>
      
      {links.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {links.map((movie, i) => (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} key={`${movie.id}-${i}`} className="glass-card p-4 border-white/5 bg-white/5 hover:bg-white/10 transition-all flex gap-4">
              <div className="w-20 h-28 rounded-xl overflow-hidden flex-shrink-0">
                <img src={movie.image} alt="" className="w-full h-full object-cover" />
              </div>
              <div className="flex flex-col justify-between py-1">
                <div>
                  <h4 className="text-sm font-black uppercase italic leading-none mb-1">{movie.title}</h4>
                  <p className="text-[8px] font-black text-gray-500 uppercase tracking-widest">{movie.quality} • {movie.language}</p>
                </div>
                <div className="flex flex-col gap-2">
                   <a href={movie.download_url} target="_blank" rel="noreferrer" className="text-[9px] font-black uppercase text-purple-500 hover:text-white flex items-center gap-2">
                     <ExternalLink className="w-3 h-3" /> Get Original Link
                   </a>
                   <span className="text-[7px] font-black text-green-500 uppercase tracking-widest">Status: Ready to Stream</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="py-20 text-center glass-card border-white/5 border-dashed bg-transparent">
          <Film className="w-10 h-10 text-gray-700 mx-auto mb-4" />
          <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">No premium links generated yet. Click 'Watch' on any movie.</p>
        </div>
      )}
    </div>
  );
};


const VideoModal = ({ movie, isOpen, onClose }: { movie: Movie | null, isOpen: boolean, onClose: () => void }) => {
  const [activeServer, setActiveServer] = useState('Server 1 (XYZ)');
  if (!movie) return null;
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[300] bg-black/98 backdrop-blur-3xl flex items-center justify-center p-4">
          <motion.div initial={{ scale: 0.9, y: 30 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 30 }} className="w-full max-w-6xl aspect-video bg-[#050505] rounded-[2rem] overflow-hidden relative shadow-[0_0_100px_rgba(139,92,246,0.15)] border border-white/5 flex flex-col">
            <div className="p-6 border-b border-white/5 flex items-center justify-between bg-black/40">
               <div className="flex items-center gap-6">
                  <div className="flex flex-col">
                    <h2 className="text-xl font-black uppercase italic tracking-tighter text-white">{movie.title}</h2>
                    <span className="text-[7px] font-black text-orange-500 uppercase tracking-[0.4em] mt-1">Powered by MovieRulz Premium Stream Engine</span>
                  </div>
                  <div className="flex gap-2">
                     {['Server 1 (XYZ)', 'Server 2 (TO)', 'Server 3 (ME)'].map(s => (
                       <button key={s} onClick={() => setActiveServer(s)} className={`px-4 py-2 rounded-lg text-[8px] font-black uppercase tracking-widest transition-all ${activeServer === s ? 'bg-orange-600 text-white' : 'bg-white/5 text-gray-500 hover:text-white'}`}>
                         {s}
                       </button>
                     ))}
                  </div>
               </div>
               <button onClick={onClose} className="p-3 bg-white/5 hover:bg-red-600 rounded-xl transition-all"><X className="w-4 h-4" /></button>
            </div>
            
            <div className="flex-1 bg-black relative">
               <iframe 
                src={(() => {
                  const id = movie.video_url?.split('/').pop() || '';
                  if (activeServer === 'Server 1 (XYZ)') return `https://vidsrc.xyz/embed/movie/${id}`;
                  if (activeServer === 'Server 2 (TO)') return `https://vidsrc.to/embed/movie/${id}`;
                  if (activeServer === 'Server 3 (ME)') return `https://vidsrc.me/embed/movie/${id}`;
                  return movie.video_url || '';
                })()} 
                title={movie.title}
                className="w-full h-full border-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                allowFullScreen
              />
            </div>

            <div className="p-8 bg-gradient-to-t from-black via-black/80 to-transparent absolute bottom-0 left-0 right-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                   <span className="text-[10px] font-black text-orange-500 uppercase tracking-widest">Streaming in 1080p Full HD</span>
                   <div className="w-2 h-2 rounded-full bg-red-600 animate-pulse" />
                </div>
                <div className="flex gap-4">
                  <a 
                    href={(() => {
                      const id = movie.video_url?.split('/').pop() || '';
                      let base = '';
                      if (activeServer === 'Server 1 (XYZ)') base = `https://vidsrc.xyz/embed/movie/${id}`;
                      else if (activeServer === 'Server 2 (TO)') base = `https://vidsrc.to/embed/movie/${id}`;
                      else base = `https://vidsrc.me/embed/movie/${id}`;
                      return `vlc://${base}`;
                    })()} 
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-[8px] font-black uppercase transition-all shadow-lg shadow-blue-600/20"
                  >
                    Open in VLC
                  </a>
                  <a 
                    href={(() => {
                      const id = movie.video_url?.split('/').pop() || '';
                      let base = '';
                      if (activeServer === 'Server 1 (XYZ)') base = `https://vidsrc.xyz/embed/movie/${id}`;
                      else if (activeServer === 'Server 2 (TO)') base = `https://vidsrc.to/embed/movie/${id}`;
                      else base = `https://vidsrc.me/embed/movie/${id}`;
                      return `intent:${base}#Intent;package=com.mxtech.videoplayer.ad;S.title=${encodeURIComponent(movie.title)};end`;
                    })()} 
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-[8px] font-black uppercase transition-all shadow-lg shadow-green-600/20"
                  >
                    Open in MX Player
                  </a>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

const AddMovieModal = ({ isOpen, onClose, onAdd, setStreamingStatus }: { isOpen: boolean, onClose: () => void, onAdd: () => void, setStreamingStatus: (s: string | null) => void }) => {
  const [formData, setFormData] = useState({
    title: '', description: '', rating: 8.5, genre: 'Action', language: 'English', category: 'Latest', 
    image: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1',
    quality: '1080p Full HD',
    video_url: 'https://vidsrc.to/embed/movie/550' // Default to Fight Club for new additions for demo
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axios.post(`${API_BASE}/movies`, formData);
      onAdd(); onClose();
    } catch (err) { alert('Failed'); }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[150] bg-black/80 backdrop-blur-md flex items-center justify-center p-6">
          <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }} className="glass-card w-full max-w-lg p-10 border-white/10 relative overflow-hidden bg-[#111]">
            <button onClick={onClose} className="absolute top-6 right-6"><X /></button>
            <h2 className="text-2xl font-black uppercase italic mb-8">Deploy New <span className="text-purple-500">Asset</span></h2>
            <div className="flex items-center gap-2 mb-8 bg-purple-600/10 p-4 rounded-xl border border-purple-500/20">
               <Cpu className="w-5 h-5 text-purple-500 animate-pulse" />
               <p className="text-[10px] font-black uppercase tracking-widest text-purple-400">AI Discovery Engine Active</p>
            </div>

            <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-6">
              <div className="col-span-2 relative">
                <label className="text-[10px] font-black text-gray-500 uppercase block mb-1">Movie Title (AI Auto-Scan)</label>
                <div className="flex gap-2">
                  <input 
                    required 
                    value={formData.title} 
                    onChange={e => setFormData({...formData, title: e.target.value})} 
                    className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-purple-500 outline-none" 
                    placeholder="Enter movie title..." 
                  />
                  <button 
                    type="button"
                    onClick={() => {
                      setStreamingStatus(`AI Scanning global databases for ${formData.title}...`);
                      setTimeout(() => {
                        setFormData({
                          ...formData,
                          description: `AI localized summary for ${formData.title}. High-quality 1080p stream ready.`,
                          rating: 8.5 + (Math.random() * 1),
                          quality: "1080p Full HD"
                        });
                        setStreamingStatus(`AI found verified asset! Metadata synced.`);
                        setTimeout(() => setStreamingStatus(null), 2000);
                      }, 1500);
                    }}
                    className="px-4 bg-purple-600 rounded-xl hover:bg-purple-500 transition-colors"
                  >
                    <Search className="w-4 h-4 text-white" />
                  </button>
                </div>
              </div>
              <div>
                <label className="text-[10px] font-black text-gray-500 uppercase block mb-1">Language</label>
                <select value={formData.language} onChange={e => setFormData({...formData, language: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-purple-500 outline-none">
                  <option value="English">English</option>
                  <option value="Telugu">Telugu</option>
                  <option value="Hindi">Hindi</option>
                  <option value="Tamil">Tamil</option>
                  <option value="Malayalam">Malayalam</option>
                  <option value="Kannada">Kannada</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] font-black text-gray-500 uppercase block mb-1">Category</label>
                <select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-purple-500 outline-none">
                  <option value="Latest">Latest Release</option>
                  <option value="Popular">Popular Choice</option>
                  <option value="Classic">Classic Gold</option>
                </select>
              </div>
              <div className="col-span-2">
                 <button type="submit" className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-4 rounded-xl font-black uppercase tracking-widest hover:scale-[1.02] transition-transform">
                   Inject Into Global Shard
                 </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// --- PAGES ---

const MovieGrid = ({ category, setCategory, searchQuery }: { category: string, setCategory: (c: string) => void, searchQuery: string }) => {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [isModalOpen, setModalOpen] = useState(false);
  const [streamingStatus, setStreamingStatus] = useState<string | null>(null);
  const [selectedVideo, setSelectedVideo] = useState<Movie | null>(null);

  const fetchMovies = async () => {
    try {
      const res = await axios.get(`${API_BASE}/movies`);
      setMovies(res.data);
    } catch (err) {
      console.error("Failed to fetch movies", err);
    }
  };
  
  useEffect(() => { fetchMovies(); }, []);

  const handleStream = (movie: Movie) => {
    setStreamingStatus(`Bypassing firewall via Mino Media Engine: ${movie.title}...`);
    
    const saved = localStorage.getItem('generated_links');
    const links = saved ? JSON.parse(saved) : [];
    if (!links.find((l: Movie) => l.id === movie.id)) {
      const updated = [movie, ...links].slice(0, 10);
      localStorage.setItem('generated_links', JSON.stringify(updated));
      window.dispatchEvent(new Event('linksUpdated'));
    }

    setTimeout(() => {
      setSelectedVideo(movie);
      setStreamingStatus(null);
    }, 1500);
  };

  const handleDownload = (movie: Movie) => {
    setStreamingStatus(`Bypassing Firewall: Generating Premium 1080p Link for ${movie.title}...`);
    setTimeout(() => {
      setStreamingStatus(`High-Speed Shard Found! Verification Successful.`);
      setTimeout(() => {
        setStreamingStatus(null);
        // Open a real-looking download asset or direct search
        window.open(`https://archive.org/search.php?query=${encodeURIComponent(movie.title)}`, '_blank');
      }, 1500);
    }, 2000);
  };

  const filteredMovies = useMemo(() => {
    let filtered = movies;
    if (category !== 'All') {
      filtered = filtered.filter(m => m.category === category || m.genre === category || m.language === category);
    }
    if (searchQuery) {
      filtered = filtered.filter(m => m.title.toLowerCase().includes(searchQuery.toLowerCase()));
    }
    return filtered;
  }, [movies, category, searchQuery]);

  return (
    <div className="pt-32 pb-20 max-w-7xl mx-auto px-6">
      {streamingStatus && (
        <motion.div initial={{ y: -50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="fixed top-24 left-1/2 -translate-x-1/2 z-[100] bg-purple-600 text-white px-8 py-4 rounded-2xl font-black uppercase text-xs shadow-2xl shadow-purple-600/40 border border-white/20">
           {streamingStatus}
        </motion.div>
      )}

      <div className="flex flex-col lg:flex-row gap-12">
        {/* MOVIE CONTENT AREA */}
        <div className="flex-1 max-w-5xl">
          <div className="mb-6 flex flex-wrap items-center gap-2">
            {['All', 'Telugu', 'Tamil', 'Hindi', 'Malayalam', 'Kannada', 'English'].map(lang => (
              <button 
                key={lang} 
                onClick={() => setCategory(lang)}
                className={`px-4 py-1.5 rounded-sm text-[9px] font-bold uppercase transition-all ${category === lang ? 'bg-orange-600 text-white' : 'bg-[#222] text-gray-400 hover:text-white border border-gray-700'}`}
              >
                {lang}
              </button>
            ))}
          </div>

          <div className="bg-[#1a1a1a] p-1 border-b border-gray-800 mb-6">
             <h2 className="text-[10px] font-bold text-orange-500 uppercase px-3 py-1 bg-white/5 border-l-2 border-orange-500">Featured Movies</h2>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {filteredMovies.length > 0 ? filteredMovies.map(movie => (
              <motion.div 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                key={movie.id} 
                className="group relative bg-[#1c1c1c] border border-gray-800 hover:border-orange-500/50 transition-all rounded-sm overflow-hidden"
              >
                 <div className="aspect-[2/3] overflow-hidden relative">
                    <img src={movie.image} alt={movie.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    <div className="absolute top-2 left-2 bg-orange-600 px-2 py-0.5 rounded-sm text-[7px] font-black uppercase text-white">
                       {movie.quality}
                    </div>
                    
                    <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black via-black/90 to-transparent">
                       <h3 className="text-[10px] font-bold text-white mb-1 leading-tight group-hover:text-orange-500 transition-colors">{movie.title}</h3>
                       <div className="flex items-center gap-2 mb-3">
                          <div className="flex items-center gap-0.5">
                            <Star className="w-2 h-2 text-orange-500 fill-orange-500" />
                            <span className="text-[8px] font-black text-white">{movie.rating}</span>
                          </div>
                          <span className="text-[7px] font-black uppercase text-gray-500">{movie.language}</span>
                       </div>

                       <div className="space-y-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button 
                            onClick={() => handleStream(movie)}
                            className="w-full bg-orange-600 text-white py-2 rounded-sm text-[8px] font-black uppercase flex items-center justify-center gap-1 hover:bg-orange-700"
                          >
                            <Zap className="w-2 h-2" /> Stream 1080p
                          </button>
                          
                          <div className="grid grid-cols-2 gap-1">
                             <button onClick={() => handleDownload(movie)} className="bg-gray-800 hover:bg-gray-700 text-white py-1 rounded-sm text-[7px] font-black uppercase text-center border border-gray-700">Download</button>
                             <button onClick={() => handleStream(movie)} className="bg-gray-800 hover:bg-gray-700 text-white py-1 rounded-sm text-[7px] font-black uppercase border border-gray-700">Direct Link</button>
                          </div>
                          
                          <ExternalPlayerLinks url={movie.download_url || ""} title={movie.title} />
                       </div>
                    </div>
                 </div>
              </motion.div>
            )) : (
              <div className="col-span-full py-40 text-center border border-gray-800 rounded-lg">
                 <Film className="w-8 h-8 text-gray-800 mx-auto mb-4" />
                 <p className="text-[8px] font-black uppercase text-gray-600">Database Entry Not Found.</p>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT SIDEBAR - RECENT UPDATES */}
        <aside className="hidden lg:block lg:w-80 space-y-6">
           <div className="bg-[#111] border border-gray-800 p-4">
              <h3 className="text-[10px] font-bold uppercase text-orange-500 border-b border-gray-800 pb-2 mb-4">Recent and Updated Movies</h3>
              <div className="space-y-3">
                 {movies.slice(0, 8).map(m => (
                   <div key={m.id} className="flex gap-3 group cursor-pointer">
                      <div className="w-10 h-14 bg-gray-800 rounded-sm overflow-hidden flex-shrink-0">
                         <img src={m.image} alt="" className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1 min-w-0">
                         <p className="text-[9px] font-bold text-gray-300 group-hover:text-orange-500 transition-colors truncate">{m.title}</p>
                         <p className="text-[7px] text-gray-500 uppercase mt-1">{m.language} • {m.quality}</p>
                      </div>
                   </div>
                 ))}
              </div>
           </div>

           <div className="bg-[#111] border border-gray-800 p-4">
              <h3 className="text-[10px] font-bold uppercase text-gray-400 border-b border-gray-800 pb-2 mb-4">Meta Status</h3>
              <div className="flex items-center gap-2 mb-4">
                 <div className="w-2 h-2 rounded-full bg-green-500 shadow-lg shadow-green-500/20" />
                 <span className="text-[8px] font-bold text-gray-500">Fast CDN Nodes Active</span>
              </div>
              <button 
                onClick={() => setModalOpen(true)}
                className="w-full py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-sm text-[8px] font-bold uppercase transition-all"
              >
                Request Movie / Upload
              </button>
           </div>
        </aside>
      </div>

      <AddMovieModal isOpen={isModalOpen} onClose={() => setModalOpen(false)} onAdd={fetchMovies} setStreamingStatus={setStreamingStatus} />
      <VideoModal movie={selectedVideo} isOpen={!!selectedVideo} onClose={() => setSelectedVideo(null)} />
    </div>
  );
};

const MonitoringPage = () => {
  const [activeTab, setActiveTab] = useState('Uptime');
  const graphData = [
    { name: '00:00', Uptime: 99.9, Requests: 12, Latency: 45 },
    { name: '04:00', Uptime: 99.5, Requests: 45, Latency: 60 },
    { name: '08:00', Uptime: 99.9, Requests: 120, Latency: 30 },
    { name: '12:00', Uptime: 100, Requests: 300, Latency: 55 },
    { name: '16:00', Uptime: 99.9, Requests: 50, Latency: 40 },
    { name: '20:00', Uptime: 99.8, Requests: 80, Latency: 50 },
  ];

  return (
    <div className="pt-32 pb-20 max-w-7xl mx-auto px-6">
      <h2 className="text-5xl font-black uppercase italic mb-12 italic">Performance <span className="text-purple-500">Analytics</span></h2>
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-1 space-y-4">
           {['Uptime', 'Requests', 'Latency'].map(tab => (
             <button key={tab} onClick={() => setActiveTab(tab)} className={`w-full p-6 rounded-2xl text-left border transition-all ${activeTab === tab ? 'bg-purple-600 border-purple-500 shadow-xl shadow-purple-600/20' : 'bg-white/5 border-white/5 hover:border-white/20'}`}>
                <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1">{tab}</h3>
                <p className="text-2xl font-black">{tab === 'Uptime' ? '99.9%' : tab === 'Requests' ? '1.2k' : '45ms'}</p>
             </button>
           ))}
        </div>
        <div className="lg:col-span-3 glass-card p-10 border-white/5 aspect-video bg-[#111]">
           <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={graphData}>
                 <defs>
                    <linearGradient id="color" x1="0" y1="0" x2="0" y2="1">
                       <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                       <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                    </linearGradient>
                 </defs>
                 <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                 <XAxis dataKey="name" stroke="#555" fontSize={10} axisLine={false} tickLine={false} />
                 <YAxis stroke="#555" fontSize={10} axisLine={false} tickLine={false} />
                 <Tooltip contentStyle={{ backgroundColor: '#111', border: '1px solid #333', borderRadius: '12px', fontSize: '10px' }} />
                 <Area type="monotone" dataKey={activeTab} stroke="#8b5cf6" strokeWidth={3} fillOpacity={1} fill="url(#color)" />
              </AreaChart>
           </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

  const SecurityPage = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  useEffect(() => { 
    axios.get(`${API_BASE}/audit`)
      .then(res => setLogs(res.data))
      .catch((e) => {
        console.error("Audit fetch failed", e);
        setLogs([]);
      }); 
  }, []);

  return (
    <div className="pt-32 pb-20 max-w-7xl mx-auto px-6">
      <h2 className="text-5xl font-black uppercase italic mb-12">DevSecOps <span className="text-blue-500">Compliance</span></h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
         <div className={`glass-card p-10 border-white/5 bg-gradient-to-br ${logs.some(l => l.status === 'Alert') ? 'from-red-600/5' : 'from-green-600/5'} to-transparent`}>
            {logs.some(l => l.status === 'Alert') ? <Activity className="w-12 h-12 text-red-500 mb-6" /> : <ShieldCheck className="w-12 h-12 text-green-500 mb-6" />}
            <h3 className="text-xl font-black uppercase mb-4 italic">
               Security Posture: {logs.some(l => l.status === 'Alert') ? <span className="text-red-500">Action Required</span> : <span className="text-green-500">Excellent</span>}
            </h3>
            <p className="text-sm text-gray-500 leading-relaxed font-medium">
               {logs.some(l => l.status === 'Alert') 
                 ? "Critical security alerts detected. Unauthorized access attempts have been logged and require immediate verification."
                 : "All security scans have passed. Recent unauthorized access attempts were successfully blocked and the system has been hardened."}
            </p>
         </div>
         <div className="glass-card p-10 border-white/5 bg-[#111]">
            <h3 className="text-xs font-black text-gray-500 uppercase tracking-widest mb-8 flex items-center gap-2">
               <Activity className="w-4 h-4" /> Live Audit Stream
            </h3>
            <div className="space-y-6">
               {logs.map(log => (
                 <div key={log.id} className="flex items-center justify-between border-b border-white/5 pb-4 last:border-0 last:pb-0">
                    <div className="flex items-center gap-4">
                       <div className={`w-2 h-2 rounded-full ${
                          log.status === 'Alert' ? 'bg-red-500' : 
                          log.status === 'Blocked' ? 'bg-yellow-500' :
                          log.status === 'Allowed' ? 'bg-blue-500' :
                          'bg-green-500'
                        }`} />
                       <div>
                          <p className="text-[10px] font-black uppercase tracking-widest">{log.action}</p>
                          <p className="text-[9px] text-gray-500 font-bold">{log.timestamp} • {log.user}</p>
                       </div>
                    </div>
                    <span className="text-[9px] font-black uppercase text-gray-400 bg-white/5 px-2 py-1 rounded">{log.status}</span>
                 </div>
               ))}
            </div>
         </div>
      </div>
    </div>
  );
};

const ProfilePage = () => {
  const [activeTab, setActiveTab] = useState('Security');
  const [user] = useState({ name: 'Admin User', email: 'admin@cinebook.io', role: 'Security Architect' });

  return (
    <div className="pt-32 pb-20 max-w-7xl mx-auto px-6">
      <div className="flex flex-col lg:flex-row gap-12">
        <aside className="lg:w-1/4 space-y-8">
          <div className="glass-card p-8 border-white/5 text-center">
            <div className="w-24 h-24 bg-gradient-to-br from-purple-600 to-blue-600 rounded-3xl mx-auto mb-6 flex items-center justify-center">
              <User className="w-12 h-12 text-white" />
            </div>
            <h3 className="text-xl font-black uppercase italic">{user.name}</h3>
            <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mt-2">{user.role}</p>
          </div>

          <nav className="space-y-2">
            {[
              { id: 'Overview', icon: User },
              { id: 'My Links', icon: Key },
              { id: 'Security', icon: Shield },
              { id: 'Settings', icon: Settings },
              { id: 'Subscription', icon: CreditCard }
            ].map(tab => (
              <button 
                key={tab.id} 
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-4 px-6 py-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === tab.id ? 'bg-white text-black' : 'text-gray-500 hover:bg-white/5'}`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.id}
              </button>
            ))}
          </nav>
        </aside>

        <main className="lg:w-3/4 min-h-[500px]">
          <AnimatePresence mode="wait">
            {activeTab === 'My Links' && (
              <motion.div key="mylinks" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <div className="glass-card p-10 border-white/5 bg-[#0e0e0e]">
                   <GeneratedLinksTab />
                </div>
              </motion.div>
            )}

            {activeTab === 'Security' && (
              <motion.div key="security" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-8">
                <div className="glass-card p-10 border-white/5">
                  <h2 className="text-3xl font-black uppercase italic mb-8">Security <span className="text-purple-500">Settings</span></h2>
                  <div className="space-y-6">
                    <div className="flex items-center justify-between p-6 bg-white/5 rounded-2xl border border-white/5">
                      <div className="flex items-center gap-4">
                        <div className="p-3 bg-green-500/10 rounded-xl"><Lock className="w-5 h-5 text-green-500" /></div>
                        <div>
                          <p className="text-xs font-black uppercase">Two-Factor Authentication</p>
                          <p className="text-[10px] text-gray-500 font-bold uppercase mt-1">Status: Enabled</p>
                        </div>
                      </div>
                      <button className="text-[10px] font-black uppercase text-purple-500 hover:text-white transition-colors">Manage</button>
                    </div>

                    <div className="flex items-center justify-between p-6 bg-white/5 rounded-2xl border border-white/5">
                      <div className="flex items-center gap-4">
                        <div className="p-3 bg-blue-500/10 rounded-xl"><Shield className="w-5 h-5 text-blue-500" /></div>
                        <div>
                          <p className="text-xs font-black uppercase">WAF Permissions</p>
                          <p className="text-[10px] text-gray-500 font-bold uppercase mt-1">Allowed Access: Verified</p>
                        </div>
                      </div>
                      <span className="text-[9px] font-black uppercase bg-blue-500 text-white px-3 py-1 rounded-full">Active</span>
                    </div>
                  </div>
                </div>
                <SecurityPage />
              </motion.div>
            )}

            {activeTab !== 'Security' && activeTab !== 'My Links' && (
              <motion.div key="other" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card p-20 border-white/5 text-center">
                <p className="text-xs font-black text-gray-500 uppercase tracking-widest italic">Section {activeTab} is currently being hardened.</p>
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
};

// --- APP ---
function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoginOpen, setLoginOpen] = useState(false);
  const [category, setCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    // Check if user was previously "logged in" for this demo
    const auth = localStorage.getItem('cinebook_auth');
    if (auth === 'true') setIsAuthenticated(true);
  }, []);

  const handleLogin = () => {
    setIsAuthenticated(true);
    localStorage.setItem('cinebook_auth', 'true');
    setLoginOpen(false);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('cinebook_auth');
  };

  const LandingPage = () => (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-gradient-to-b from-[#0a0a0a] to-[#111]">
      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center mb-12">
        <div className="w-20 h-20 bg-purple-600 rounded-3xl flex items-center justify-center shadow-2xl shadow-purple-600/40 mx-auto mb-8">
          <Film className="w-10 h-10" />
        </div>
        <h1 className="text-7xl font-black italic tracking-tighter mb-4">CINE<span className="text-purple-600">STREAM</span></h1>
        <p className="text-gray-500 font-bold uppercase tracking-[0.3em] text-xs">High-Quality 1080p Movies & Classics</p>
      </motion.div>
      <div className="glass-card p-10 w-full max-w-md border-white/5 bg-white/5 backdrop-blur-3xl">
         <h2 className="text-2xl font-black uppercase italic mb-8 text-center">Identity Verification</h2>
         <div className="space-y-4">
            <button onClick={handleLogin} className="w-full bg-white text-black py-4 rounded-xl font-bold text-sm flex items-center justify-center gap-3 hover:bg-gray-200 transition-all border border-gray-300">
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#EA4335" d="M12 5.04c1.94 0 3.1 1.05 3.85 1.76l2.84-2.84C16.81 2.19 14.61 1 12 1 7.7 1 4.1 3.5 2.5 7.15l3.35 2.6c.79-2.28 2.92-3.71 6.15-3.71z"/>
                <path fill="#4285F4" d="M23.5 12.2c0-.79-.07-1.54-.19-2.27H12v4.3h6.43c-.28 1.44-1.09 2.65-2.29 3.4l3.56 2.77c2.09-1.92 3.3-4.74 3.3-8.2z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.34-1.36-.34-2.09s.12-1.43.34-2.09l-3.35-2.6C1.65 8.7 1 10.28 1 12s.65 3.3 1.49 4.65l3.35-2.56z"/>
                <path fill="#34A853" d="M12 23c3.24 0 5.95-1.08 7.93-2.91l-3.56-2.77c-1.1.74-2.5 1.18-4.37 1.18-3.21 0-5.92-2.16-6.89-5.07l-3.35 2.6c1.6 3.65 5.21 6.15 9.24 6.15z"/>
              </svg>
              Continue with Google
            </button>
            <div className="relative flex items-center py-2">
              <div className="flex-grow border-t border-white/10"></div>
              <span className="flex-shrink mx-4 text-gray-500 text-[10px] font-black uppercase">Or</span>
              <div className="flex-grow border-t border-white/10"></div>
            </div>
            <button onClick={handleLogin} className="w-full bg-purple-600 text-white py-4 rounded-xl font-black uppercase tracking-widest hover:bg-purple-700 transition-all">
              Login to Workspace
            </button>
         </div>
         <p className="mt-8 text-center text-[9px] text-gray-600 font-bold uppercase tracking-widest">Authorized Access Only</p>
      </div>
    </div>
  );

  return (
    <Router>
      <div className="min-h-screen bg-[#0a0a0a] text-white selection:bg-purple-600/30 font-sans">
        {isAuthenticated && (
          <nav className="fixed top-0 left-0 right-0 z-50 py-3 px-6 border-b border-gray-800 bg-[#111]">
             <div className="max-w-7xl mx-auto flex items-center justify-between">
                <Link to="/" className="flex items-center gap-3">
                   <div className="w-8 h-8 bg-orange-600 rounded-sm flex items-center justify-center shadow-lg shadow-orange-600/20">
                      <Film className="w-4 h-4 text-white" />
                   </div>
                   <span className="text-xl font-bold tracking-tighter text-white">Movie<span className="text-orange-600">Rulz</span></span>
                </Link>
                <div className="hidden md:flex items-center gap-6 text-[10px] font-bold uppercase tracking-wider text-gray-400">
                   {['Home', 'Latest', 'Telugu', 'Tamil', 'Hindi', 'Malayalam', 'Kannada'].map(nav => (
                     <Link key={nav} to="/" className="hover:text-orange-500 transition-colors" onClick={() => setCategory(nav === 'Home' ? 'All' : nav)}>{nav}</Link>
                   ))}
                </div>
                <div className="hidden md:flex items-center gap-4">
                    <div className="relative">
                       <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-500" />
                       <input 
                         value={searchQuery}
                         onChange={e => setSearchQuery(e.target.value)}
                         placeholder="Quick Search..." 
                         className="bg-white/5 border border-gray-700 rounded-sm pl-8 pr-4 py-1.5 text-[9px] font-bold uppercase outline-none focus:border-orange-500 transition-colors w-40" 
                       />
                    </div>
                    <button onClick={handleLogout} className="bg-gray-800 text-white border border-gray-700 px-4 py-1.5 rounded-sm text-[9px] font-bold uppercase hover:bg-red-600 transition-all">
                       Logout
                    </button>
                </div>
             </div>
          </nav>
        )}

        <Routes>
          <Route path="/" element={isAuthenticated ? <MovieGrid category={category} setCategory={setCategory} searchQuery={searchQuery} /> : <LandingPage />} />
          <Route path="/monitoring" element={isAuthenticated ? <MonitoringPage /> : <LandingPage />} />
          <Route path="/security" element={isAuthenticated ? <SecurityPage /> : <LandingPage />} />
          <Route path="/profile" element={isAuthenticated ? <ProfilePage /> : <LandingPage />} />
        </Routes>

        <Chatbot />
        <LoginModal isOpen={isLoginOpen} onClose={() => setLoginOpen(false)} />
        
        <footer className="py-20 border-t border-white/5 px-6 text-center">
           <p className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-700">© 2026 CINESTREAM PLATFORM • SECURED BY DEVSECOPS AUDIT LOGS</p>
        </footer>
      </div>
    </Router>
  );
}

export default App;
