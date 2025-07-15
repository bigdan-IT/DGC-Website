import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Gamepad2, Users, Calendar, Trophy, ArrowRight, Star } from 'lucide-react';

const Home: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative py-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-gaming-purple/20 to-gaming-pink/20"></div>
        <div className="relative z-10 container mx-auto px-4 text-center">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-5xl md:text-7xl font-bold mb-6 gradient-text">
              Welcome to Dans Duels
            </h1>
            <p className="text-xl md:text-2xl text-gray-300 mb-8 leading-relaxed">
              The ultimate gaming community where players unite, compete, and create legendary moments together.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {!user ? (
                <>
                  <Link
                    to="/register"
                    className="bg-gradient-to-r from-gaming-purple to-gaming-pink text-white px-8 py-4 rounded-lg text-lg font-semibold hover:shadow-neon transition-all duration-300 flex items-center justify-center space-x-2"
                  >
                    <span>Join the Community</span>
                    <ArrowRight size={20} />
                  </Link>
                  <Link
                    to="/login"
                    className="glass text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-white/20 transition-all duration-300"
                  >
                    Sign In
                  </Link>
                </>
              ) : (
                <Link
                  to="/posts"
                  className="bg-gradient-to-r from-gaming-purple to-gaming-pink text-white px-8 py-4 rounded-lg text-lg font-semibold hover:shadow-neon transition-all duration-300 flex items-center justify-center space-x-2"
                >
                  <span>Explore Community</span>
                  <ArrowRight size={20} />
                </Link>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-bold text-center mb-16 gradient-text">
            What We Offer
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="glass p-8 rounded-xl hover:shadow-neon transition-all duration-300">
              <div className="w-16 h-16 bg-gradient-to-r from-gaming-purple to-gaming-pink rounded-lg flex items-center justify-center mb-6">
                <Users size={32} className="text-white" />
              </div>
              <h3 className="text-2xl font-semibold mb-4 text-white">Community Hub</h3>
              <p className="text-gray-300 leading-relaxed">
                Connect with fellow gamers, share strategies, and build lasting friendships in our vibrant community.
              </p>
            </div>
            
            <div className="glass p-8 rounded-xl hover:shadow-neon transition-all duration-300">
              <div className="w-16 h-16 bg-gradient-to-r from-gaming-purple to-gaming-pink rounded-lg flex items-center justify-center mb-6">
                <Trophy size={32} className="text-white" />
              </div>
              <h3 className="text-2xl font-semibold mb-4 text-white">Tournaments</h3>
              <p className="text-gray-300 leading-relaxed">
                Compete in exciting tournaments, climb the leaderboards, and earn recognition for your skills.
              </p>
            </div>
            
            <div className="glass p-8 rounded-xl hover:shadow-neon transition-all duration-300">
              <div className="w-16 h-16 bg-gradient-to-r from-gaming-purple to-gaming-pink rounded-lg flex items-center justify-center mb-6">
                <Calendar size={32} className="text-white" />
              </div>
              <h3 className="text-2xl font-semibold mb-4 text-white">Events</h3>
              <p className="text-gray-300 leading-relaxed">
                Join regular gaming events, meetups, and special occasions organized by our community.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-gradient-to-r from-gaming-dark/50 to-gaming-darker/50">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8 text-center">
            <div className="glass p-6 rounded-xl">
              <div className="text-4xl font-bold text-gaming-neon mb-2">500+</div>
              <div className="text-gray-300">Active Players</div>
            </div>
            <div className="glass p-6 rounded-xl">
              <div className="text-4xl font-bold text-gaming-neon mb-2">50+</div>
              <div className="text-gray-300">Tournaments</div>
            </div>
            <div className="glass p-6 rounded-xl">
              <div className="text-4xl font-bold text-gaming-neon mb-2">1000+</div>
              <div className="text-gray-300">Posts Shared</div>
            </div>
            <div className="glass p-6 rounded-xl">
              <div className="text-4xl font-bold text-gaming-neon mb-2">24/7</div>
              <div className="text-gray-300">Community Support</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-4xl font-bold mb-6 gradient-text">
              Ready to Join the Action?
            </h2>
            <p className="text-xl text-gray-300 mb-8">
              Become part of the most exciting gaming community and start your journey today.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/events"
                className="bg-gradient-to-r from-gaming-purple to-gaming-pink text-white px-8 py-4 rounded-lg text-lg font-semibold hover:shadow-neon transition-all duration-300 flex items-center justify-center space-x-2"
              >
                <Calendar size={20} />
                <span>View Events</span>
              </Link>
              <Link
                to="/posts"
                className="glass text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-white/20 transition-all duration-300 flex items-center justify-center space-x-2"
              >
                <Users size={20} />
                <span>Browse Community</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-white/10">
        <div className="container mx-auto px-4 text-center">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <div className="w-8 h-8 bg-gradient-to-r from-gaming-purple to-gaming-pink rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">D</span>
            </div>
            <span className="text-xl font-bold gradient-text">Dans Duels</span>
          </div>
          <p className="text-gray-400 mb-4">
            The ultimate gaming community for competitive players and casual gamers alike.
          </p>
          <div className="flex justify-center space-x-6 text-gray-400">
            <span>© 2024 Dans Duels</span>
            <span>•</span>
            <span>Privacy Policy</span>
            <span>•</span>
            <span>Terms of Service</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home; 