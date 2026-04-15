import { useEffect, useState } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { Film, Star, MapPin, Ticket, Activity, ShieldCheck, Zap, Plus } from 'lucide-react';

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

const Navbar = () => (
  <nav className="fixed top-0 left-0 right-0 z-50 py-4 px-6 glass-card border-none bg-black/40">
    <div className="max-w-7xl mx-auto flex items-center justify-between">
      <div className="flex items-center gap-2">
        <div className="w-10 h-10 bg-gradient-to-tr from-purple-600 to-blue-500 rounded-xl flex items-center justify-center">
          <Film className="text-white w-6 h-6" />
        </div>
        <span className="text-2xl font-bold tracking-tighter text-white">CINE<span className="text-purple-500">BOOK</span></span>
      </div>
      
      <div className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-400">
        <a href="#" className="hover:text-white transition-colors">Movies</a>
        <a href="#" className="hover:text-white transition-colors">Monitoring</a>
        <a href="#" className="hover:text-white transition-colors">Security</a>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1 text-xs text-gray-500 bg-white/5 px-3 py-1.5 rounded-full border border-white/10 uppercase tracking-widest">
          <MapPin className="w-3 h-3" /> Mumbai
        </div>
        <button className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-5 py-2 rounded-lg text-sm font-semibold hover:shadow-lg hover:shadow-purple-500/20 transition-all">
          Sign In
        </button>
      </div>
    </div>
  </nav>
);

const MovieCard = ({ movie }: { movie: Movie }) => (
  <motion.div 
    whileHover={{ y: -8 }}
    className="group relative overflow-hidden rounded-2xl glass-card border-white/10"
  >
    <div className="aspect-[2/3] overflow-hidden">
      <img src={movie.image} alt={movie.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent flex flex-col justify-end p-5">
        <div className="flex items-center gap-1.5 bg-yellow-500/90 text-black text-[10px] font-bold px-2 py-0.5 rounded w-fit mb-3">
          <Star className="w-3 h-3 fill-black" /> {movie.rating}
        </div>
        <h3 className="text-xl font-bold text-white mb-1 line-clamp-1">{movie.title}</h3>
        <p className="text-gray-400 text-xs mb-4">{movie.genre}</p>
        <button className="flex items-center justify-center gap-2 w-full bg-white/10 hover:bg-white text-white hover:text-black py-2.5 rounded-xl border border-white/20 text-sm font-bold transition-all backdrop-blur-md">
          <Ticket className="w-4 h-4" /> Book Now
        </button>
      </div>
    </div>
  </motion.div>
);

const MonitoringSystem = ({ status }: { status: ServerStatus | null }) => (
  <section className="mt-8 mb-20">
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="glass-card p-6 border-white/5 flex items-center gap-4">
        <div className="p-3 bg-green-500/10 rounded-xl">
          <Activity className={`w-6 h-6 ${status ? 'text-green-500' : 'text-gray-500 animate-pulse'}`} />
        </div>
        <div>
          <p className="text-xs text-gray-500 uppercase tracking-widest">System Status</p>
          <p className="text-lg font-bold text-white">{status?.status || 'Connecting...'}</p>
        </div>
      </div>
      <div className="glass-card p-6 border-white/5 flex items-center gap-4">
        <div className="p-3 bg-blue-500/10 rounded-xl">
          <Zap className="text-blue-500 w-6 h-6" />
        </div>
        <div>
          <p className="text-xs text-gray-500 uppercase tracking-widest">Server Uptime</p>
          <p className="text-lg font-bold text-white">{status?.uptime || '0s'}</p>
        </div>
      </div>
      <div className="glass-card p-6 border-white/5 flex items-center gap-4">
        <div className="p-3 bg-purple-500/10 rounded-xl">
          <ShieldCheck className="text-purple-500 w-6 h-6" />
        </div>
        <div>
          <p className="text-xs text-gray-500 uppercase tracking-widest">Total Requests</p>
          <p className="text-lg font-bold text-white">{status?.requests || 0}</p>
        </div>
      </div>
    </div>
  </section>
);

function App() {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [status, setStatus] = useState<ServerStatus | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const [movieRes, statusRes] = await Promise.all([
        axios.get(`${API_BASE}/movies`),
        axios.get(`${API_BASE}/health`)
      ]);
      setMovies(movieRes.data);
      setStatus(statusRes.data);
    } catch (err) {
      console.log("Health check failing, possible cold start...");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(() => {
       axios.get(`${API_BASE}/health`)
        .then(res => setStatus(res.data))
        .catch(() => setStatus(null));
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const addMovie = async () => {
    try {
      const newMovie = {
        title: `Dynamic Movie ${movies.length + 1}`,
        description: "Added directly from the UI to show dynamic DB!",
        rating: (Math.random() * 2 + 8).toFixed(1),
        image: `https://images.unsplash.com/photo-${1500000000000 + movies.length}?auto=format&fit=crop&q=80&w=300`,
        genre: "Action"
      };
      await axios.post(`${API_BASE}/movies`, newMovie);
      fetchData();
    } catch (e) {
      alert("Failed to add movie to DB. Check backend.");
    }
  };

  return (
    <div className="min-h-screen bg-[#0d0d0d] text-white selection:bg-purple-500/30">
      <Navbar />

      <main className="max-w-7xl mx-auto px-6 pt-32 pb-20">
        <div className="mb-12 flex items-end justify-between">
          <div>
            <h2 className="text-4xl font-black tracking-tight mb-2 uppercase italic leading-none">
              Recommended <span className="gradient-text">Movies</span>
            </h2>
            <p className="text-gray-500">Live dynamic data from your DevSecOps pipeline</p>
          </div>
          <button 
            onClick={addMovie}
            className="flex items-center gap-2 bg-white/5 border border-white/10 px-4 py-2 rounded-xl text-sm font-bold hover:bg-white/10 transition-colors"
          >
            <Plus className="w-4 h-4" /> Add Dynamic Data
          </button>
        </div>

        {loading && movies.length === 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="aspect-[2/3] rounded-2xl bg-white/5 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {movies.map(movie => (
              <MovieCard key={movie.id} movie={movie} />
            ))}
          </div>
        )}

        <div className="mt-20">
           <h2 className="text-xl font-bold mb-6 flex items-center gap-2 text-gray-400">
             <Activity className="text-purple-500 w-5 h-5" /> Live System Monitor
           </h2>
           <MonitoringSystem status={status} />
        </div>

        <section className="mt-24 rounded-3xl overflow-hidden glass-card neon-border p-1 bg-gradient-to-br from-purple-500/20 to-blue-500/20">
           <div className="bg-black/40 backdrop-blur-3xl rounded-[22px] px-10 py-16 flex flex-col md:flex-row items-center justify-between gap-10 text-center md:text-left">
              <div className="max-w-xl">
                <span className="text-xs font-bold text-purple-500 uppercase tracking-[0.3em] mb-4 block">Exclusive Membership</span>
                <h2 className="text-5xl font-black mb-4 leading-none tracking-tight">CINEBOOK <span className="text-purple-500 italic underline">GOLD</span></h2>
                <p className="text-gray-400 mb-8 text-lg">Experience cinema like never before with zero convenience fees and unlimited perks.</p>
                <div className="flex gap-4 justify-center md:justify-start">
                  <button className="bg-white text-black px-8 py-3 rounded-xl font-bold hover:scale-105 transition-transform">Claim Membership</button>
                </div>
              </div>
           </div>
        </section>
      </main>

      <footer className="border-t border-white/5 py-12 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8 text-sm text-gray-500 font-medium tracking-wide">
            © 2026 CINEBOOK. ALL SYSTEMS RESPONSIVE.
        </div>
      </footer>
    </div>
  );
}

export default App;
