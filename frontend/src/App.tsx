import { useEffect, useState } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { Film, Star, MapPin, ChevronRight, Ticket } from 'lucide-react';

interface Movie {
  id: number;
  title: string;
  description: string;
  rating: number;
  image: string;
  genre: string;
}

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
        <a href="#" className="hover:text-white transition-colors">Events</a>
        <a href="#" className="hover:text-white transition-colors">Plays</a>
        <a href="#" className="hover:text-white transition-colors">Activities</a>
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
      <img 
        src={movie.image} 
        alt={movie.title} 
        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent flex flex-col justify-end p-5">
        <div className="flex items-center gap-1.5 bg-yellow-500/90 text-black text-[10px] font-bold px-2 py-0.5 rounded w-fit mb-3">
          <Star className="w-3 h-3 fill-black" /> {movie.rating}
        </div>
        <h3 className="text-xl font-bold text-white mb-1">{movie.title}</h3>
        <p className="text-gray-400 text-xs mb-4">{movie.genre}</p>
        
        <button className="flex items-center justify-center gap-2 w-full bg-white/10 hover:bg-white text-white hover:text-black py-2.5 rounded-xl border border-white/20 text-sm font-bold transition-all backdrop-blur-md">
          <Ticket className="w-4 h-4" /> Book Now
        </button>
      </div>
    </div>
  </motion.div>
);

function App() {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Faking API call for demo if backend is not running
    const fetchMovies = async () => {
      try {
        const res = await axios.get('http://localhost:8000/movies');
        setMovies(res.data);
      } catch (err) {
        setMovies([
          {
            id: 1,
            title: "Interstellar",
            description: "A team of explorers travel through a wormhole in space.",
            rating: 8.7,
            image: "https://images.unsplash.com/photo-1446776811953-b23d57bd21aa",
            genre: "Sci-Fi"
          },
          {
            id: 2,
            title: "The Dark Knight",
            description: "When the menace known as the Joker wreaks havoc.",
            rating: 9.0,
            image: "https://images.unsplash.com/photo-1478720568477-152d9b164e26",
            genre: "Action"
          },
          {
            id: 3,
            title: "Inception",
            description: "A thief who steals corporate secrets through dream-sharing.",
            rating: 8.8,
            image: "https://images.unsplash.com/photo-1536440136628-849c177e76a1",
            genre: "Sci-Fi"
          },
          {
            id: 4,
            title: "Avatar: Way of Water",
            description: "Jake Sully lives with his newfound family formed on the extrasolar moon Pandora.",
            rating: 7.6,
            image: "https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b",
            genre: "Adventure"
          }
        ]);
      } finally {
        setLoading(false);
      }
    };
    fetchMovies();
  }, []);

  return (
    <div className="min-h-screen bg-[#0d0d0d] text-white selection:bg-purple-500/30">
      <Navbar />

      <main className="max-w-7xl mx-auto px-6 pt-32 pb-20">
        <div className="mb-12 flex items-end justify-between">
          <div>
            <h2 className="text-4xl font-black tracking-tight mb-2">Recommended <span className="gradient-text">Movies</span></h2>
            <p className="text-gray-500">Based on your preferences and local popular trends</p>
          </div>
          <button className="flex items-center gap-2 text-purple-400 font-semibold hover:text-purple-300 transition-colors">
            View All <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {loading ? (
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

        <section className="mt-24 rounded-3xl overflow-hidden glass-card neon-border p-1">
           <div className="bg-black/60 rounded-[22px] px-10 py-16 flex flex-col md:flex-row items-center justify-between gap-10">
              <div className="max-w-xl">
                <span className="text-xs font-bold text-purple-500 uppercase tracking-widest mb-4 block">Exclusive Offer</span>
                <h2 className="text-4xl font-bold mb-4 leading-tight">Get <span className="text-purple-500 italic">Unlimited</span> Free Popcorn with CineBook Gold</h2>
                <p className="text-gray-400 mb-8">Join our premium membership today and unlock exclusive benefits, early access, and zero convenience fees on every booking.</p>
                <div className="flex gap-4">
                  <button className="bg-white text-black px-8 py-3 rounded-xl font-bold hover:scale-105 transition-transform">Get Gold Now</button>
                  <button className="bg-white/5 border border-white/10 px-8 py-3 rounded-xl font-bold hover:bg-white/10 transition-colors">See Benefits</button>
                </div>
              </div>
              <div className="relative">
                <div className="w-64 h-64 bg-purple-600/20 blur-[100px] absolute inset-0 rounded-full" />
                <Ticket className="w-48 h-48 text-purple-500 relative z-10 opacity-80" />
              </div>
           </div>
        </section>
      </main>

      <footer className="border-t border-white/5 py-12 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="text-sm text-gray-500 font-medium">
            © 2026 CineBook Entertainment. All rights reserved.
          </div>
          <div className="flex gap-8 text-sm text-gray-500">
            <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-white transition-colors">Security</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
