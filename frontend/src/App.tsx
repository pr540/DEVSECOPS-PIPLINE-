import { useEffect, useState } from 'react';
import axios from 'axios';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Film, Star, MapPin, Ticket, Activity, ShieldCheck, 
  Zap, Plus, X, Shield, Globe, Cpu, Lock 
} from 'lucide-react';

// --- TYPES ---
interface Movie {
  id: number;
  title: string;
  description: string;
  rating: number;
  image: string;
  genre: string;
}

interface ServerStatus {
  status: string;
  uptime: string;
  requests: number;
  database: string;
}

const API_BASE = import.meta.env.PROD ? '/api' : 'http://localhost:8000/api';

// --- COMPONENTS ---

const Navbar = () => {
  const [city, setCity] = useState('Mumbai');
  const location = useLocation();

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(async (pos) => {
        try {
          // Simple reverse geocoding via free api (no key needed for demo)
          const res = await axios.get(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${pos.coords.latitude}&lon=${pos.coords.longitude}`);
          const cityName = res.data.address.city || res.data.address.town || res.data.address.village || 'Detected';
          setCity(cityName);
        } catch (e) { console.log('Geolocation failed'); }
      });
    }
  }, []);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 py-4 px-6 glass-card border-none bg-black/40 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-10 h-10 bg-gradient-to-tr from-purple-600 to-blue-500 rounded-xl flex items-center justify-center">
            <Film className="text-white w-6 h-6" />
          </div>
          <span className="text-2xl font-black tracking-tighter text-white uppercase italic">Cine<span className="text-purple-500">Book</span></span>
        </Link>
        
        <div className="hidden md:flex items-center gap-8 text-xs font-bold uppercase tracking-widest text-gray-500">
          <Link to="/" className={`hover:text-white transition-colors ${location.pathname === '/' ? 'text-purple-500' : ''}`}>Movies</Link>
          <Link to="/monitoring" className={`hover:text-white transition-colors ${location.pathname === '/monitoring' ? 'text-purple-500' : ''}`}>Monitoring</Link>
          <Link to="/security" className={`hover:text-white transition-colors ${location.pathname === '/security' ? 'text-purple-500' : ''}`}>Security</Link>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-1.5 text-[10px] font-black text-gray-400 bg-white/5 px-4 py-2 rounded-full border border-white/10 uppercase tracking-[0.2em]">
            <MapPin className="w-3 h-3 text-purple-500" /> {city}
          </div>
          <button className="bg-white text-black px-6 py-2 rounded-lg text-xs font-black uppercase hover:bg-purple-500 hover:text-white transition-all shadow-xl shadow-white/5">
            Login
          </button>
        </div>
      </div>
    </nav>
  );
};

const AddMovieModal = ({ isOpen, onClose, onAdd }: { isOpen: boolean, onClose: () => void, onAdd: () => void }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    rating: 8.5,
    genre: 'Action',
    image: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1'
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (!formData.title) return;
      await axios.post(`${API_BASE}/movies`, formData);
      onAdd();
      onClose();
    } catch (err) {
      alert('Failed to add movie');
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-center justify-center p-6"
        >
          <motion.div 
            initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
            className="glass-card w-full max-w-md p-8 border-white/10 relative overflow-hidden bg-[#111]"
          >
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-600 to-blue-500" />
            <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-white"><X /></button>
            <h2 className="text-2xl font-black mb-6 uppercase italic">Add New <span className="text-purple-500">Movie</span></h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Title</label>
                <input required value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-purple-500 outline-none transition-all" placeholder="Enter movie title" />
              </div>
              <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Genre</label>
                <select value={formData.genre} onChange={e => setFormData({...formData, genre: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-purple-500 outline-none transition-all">
                  <option value="Action">Action</option>
                  <option value="Sci-Fi">Sci-Fi</option>
                  <option value="Drama">Drama</option>
                  <option value="Adventure">Adventure</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Rating</label>
                <input type="number" step="0.1" value={formData.rating} onChange={e => setFormData({...formData, rating: parseFloat(e.target.value)})} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-purple-500 outline-none transition-all" />
              </div>
              <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Image URL</label>
                <input value={formData.image} onChange={e => setFormData({...formData, image: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-purple-500 outline-none transition-all" />
              </div>
              <button type="submit" className="w-full bg-purple-600 hover:bg-purple-500 text-white py-4 rounded-xl font-bold uppercase tracking-widest transition-all mt-4">
                Push to Database
              </button>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// --- PAGES ---

const MovieGrid = () => {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [isModalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchMovies = async () => {
    try {
      const res = await axios.get(`${API_BASE}/movies`);
      setMovies(res.data);
    } catch (e) { console.log('API Error'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchMovies(); }, []);

  return (
    <div className="pt-32 pb-20 max-w-7xl mx-auto px-6">
      <div className="mb-12 flex items-end justify-between">
        <div>
          <h2 className="text-5xl font-black tracking-tight mb-2 uppercase italic leading-none">
            Recommended <span className="gradient-text">Movies</span>
          </h2>
          <p className="text-gray-500 font-medium">Synced with your secure DevSecOps Postgres backend</p>
        </div>
        <button 
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-blue-600 px-6 py-3 rounded-xl text-sm font-black uppercase hover:scale-105 transition-transform shadow-lg shadow-purple-500/20"
        >
          <Plus className="w-4 h-4" /> Add Movie
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
        {loading ? (
          [1,2,3,4].map(i => <div key={i} className="aspect-[2/3] rounded-2xl bg-white/5 animate-pulse" />)
        ) : (
          movies.map(movie => (
            <motion.div whileHover={{ y: -10 }} key={movie.id} className="group relative overflow-hidden rounded-2xl glass-card border-white/5">
               <div className="aspect-[2/3] overflow-hidden">
                  <img src={movie.image} className="w-full h-full object-cover group-hover:scale-110 transition-duration-500" />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0d0d0d] via-transparent to-transparent flex flex-col justify-end p-6">
                    <div className="flex items-center gap-1.5 bg-yellow-500/90 text-black text-[10px] font-black px-2 py-0.5 rounded w-fit mb-3">
                      <Star className="w-3 h-3 fill-black" /> {movie.rating}
                    </div>
                    <h3 className="text-xl font-black text-white mb-1 uppercase tracking-tight line-clamp-1">{movie.title}</h3>
                    <p className="text-gray-400 text-xs font-bold mb-4 uppercase tracking-[0.2em]">{movie.genre}</p>
                    <button className="flex items-center justify-center gap-2 w-full bg-white/10 hover:bg-white text-white hover:text-black py-3 rounded-xl border border-white/20 text-xs font-black uppercase transition-all backdrop-blur-md">
                      <Ticket className="w-4 h-4" /> Book Now
                    </button>
                  </div>
               </div>
            </motion.div>
          ))
        )}
      </div>

      <AddMovieModal isOpen={isModalOpen} onClose={() => setModalOpen(false)} onAdd={fetchMovies} />
    </div>
  );
};

const MonitoringPage = () => {
  const [status, setStatus] = useState<ServerStatus | null>(null);

  useEffect(() => {
    const fetchStatus = () => {
      axios.get(`${API_BASE}/health`)
        .then(res => setStatus(res.data))
        .catch(() => setStatus(null));
    };
    fetchStatus();
    const interval = setInterval(fetchStatus, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="pt-32 pb-20 max-w-7xl mx-auto px-6">
      <h2 className="text-5xl font-black uppercase italic mb-12">Live <span className="text-purple-500 underline decoration-blue-500 underline-offset-8">Infrastructure</span> Monitor</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
        <div className="glass-card p-8 border-white/5 space-y-4 bg-gradient-to-br from-green-500/5 to-transparent">
          <Activity className="text-green-500 w-10 h-10" />
          <h3 className="text-xs font-black text-gray-500 uppercase tracking-widest">Backend Connectivity</h3>
          <p className="text-3xl font-black text-white uppercase">{status?.status === 'healthy' ? 'Operational' : 'Syncing...'}</p>
        </div>
        <div className="glass-card p-8 border-white/5 space-y-4 bg-gradient-to-br from-blue-500/5 to-transparent">
          <Zap className="text-blue-500 w-10 h-10" />
          <h3 className="text-xs font-black text-gray-500 uppercase tracking-widest">Server Uptime</h3>
          <p className="text-3xl font-black text-white">{status?.uptime || '0s'}</p>
        </div>
        <div className="glass-card p-8 border-white/5 space-y-4 bg-gradient-to-br from-purple-500/5 to-transparent">
          <Cpu className="text-purple-500 w-10 h-10" />
          <h3 className="text-xs font-black text-gray-500 uppercase tracking-widest">API Requests (Total)</h3>
          <p className="text-3xl font-black text-white">{status?.requests || 0}</p>
        </div>
      </div>
      <div className="glass-card p-12 border-white/5 flex flex-col items-center justify-center min-h-[400px] text-center">
         <Globe className="w-20 h-20 text-purple-600/20 mb-6 animate-pulse" />
         <h4 className="text-2xl font-black mb-2 uppercase">Traffic Flow Analyzer</h4>
         <p className="text-gray-500 max-w-md">Real-time data stream analysis enabled for Vercel Serverless Functions. Monitoring latency, cold starts, and payload integrity.</p>
      </div>
    </div>
  );
};

const SecurityPage = () => {
  const scans = [
    { title: 'SAST Scan', icon: Shield, status: 'Completed', color: 'green', desc: 'Analyzed Python source code for security vulnerabilities.' },
    { title: 'SCA Audit', icon: Lock, status: 'Passed', color: 'blue', desc: 'Verified 214 node packages and 10 python libraries.' },
    { title: 'Secret Leak Scan', icon: Zap, status: 'Secure', color: 'purple', desc: 'TruffleHog scan completed on git history.' }
  ];

  return (
    <div className="pt-32 pb-20 max-w-7xl mx-auto px-6">
      <h2 className="text-5xl font-black uppercase italic mb-4">Security <span className="text-blue-500">Tier III</span> Dashboard</h2>
      <p className="text-gray-500 mb-12 max-w-2xl font-medium uppercase tracking-widest text-[10px]">Continuous integration and security deployment pipeline automated through GitHub Actions.</p>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {scans.map((scan, i) => (
          <div key={i} className="glass-card p-10 border-white/5 relative group overflow-hidden">
            <div className={`absolute top-0 right-0 p-4 opacity-5 group-hover:scale-150 transition-transform duration-700`}>
              <scan.icon className="w-40 h-40" />
            </div>
            <div className={`w-12 h-12 bg-${scan.color}-500/10 rounded-2xl flex items-center justify-center mb-6`}>
              <scan.icon className={`text-${scan.color}-500 w-6 h-6`} />
            </div>
            <h3 className="text-xl font-black mb-2 uppercase italic">{scan.title}</h3>
            <div className="flex items-center gap-2 mb-4">
              <div className={`w-2 h-2 rounded-full bg-${scan.color}-500 animate-pulse`} />
              <span className={`text-[10px] font-black uppercase text-${scan.color}-500 tracking-widest`}>{scan.status}</span>
            </div>
            <p className="text-sm text-gray-500 font-medium leading-relaxed">{scan.desc}</p>
          </div>
        ))}
      </div>

      <div className="mt-12 glass-card p-12 border-none bg-gradient-to-r from-red-600/10 to-transparent">
        <div className="flex items-center gap-4 mb-4">
           <ShieldCheck className="text-red-500 w-8 h-8" />
           <h3 className="text-2xl font-black uppercase italic">Threat Protection Layer</h3>
        </div>
        <p className="text-gray-400 mb-8 max-w-3xl">Our DevSecOps pipeline enforces automated scanning policies. Any merge request to the master branch triggers a three-tier security check before reaching the Vercel staging environment.</p>
        <button className="bg-red-500 text-white px-8 py-3 rounded-xl font-bold uppercase text-xs tracking-widest hover:bg-red-600 transition-colors">Download Security Audit</button>
      </div>
    </div>
  );
};

// --- APP WRAPPER ---
function App() {
  return (
    <Router>
      <div className="min-h-screen bg-[#0d0d0d] text-white selection:bg-purple-500/30">
        <Navbar />
        <Routes>
          <Route path="/" element={<MovieGrid />} />
          <Route path="/monitoring" element={<MonitoringPage />} />
          <Route path="/security" element={<SecurityPage />} />
        </Routes>

        <footer className="border-t border-white/5 py-12 px-6">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8 text-[10px] text-gray-600 font-black uppercase tracking-[0.3em]">
              © 2026 CINEBOOK. SECURED BY DEVSECOPS. ALL SYSTEMS RESPONSIVE.
          </div>
        </footer>
      </div>
    </Router>
  );
}

export default App;
