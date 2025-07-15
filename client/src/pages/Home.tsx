import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Gamepad2, Users, Calendar, Trophy, ArrowRight, Star } from 'lucide-react';

const Home: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen mt-8">
      {/* Hero Section */}
      <section className="relative py-12 overflow-hidden floating-particles">
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-purple-600/5"></div>
        <div className="relative z-10 container mx-auto px-4 text-center">
          <div className="max-w-4xl mx-auto">
            <h1 className="gaming-title text-5xl md:text-7xl mb-6">
              Welcome to Dan's Gaming Community
            </h1>
            <p className="text-xl md:text-2xl text-cyan-200 mb-8 leading-relaxed">
              The ultimate gaming community where players unite, compete, and create legendary moments together.
            </p>
            <div className="flex flex-col sm:flex-row gap-6 justify-center">
                              <a
                  href="https://discord.com/invite/dans"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="gaming-button text-lg px-10 py-4 flex items-center justify-center space-x-2"
                >
                  <span>Join Our Discord</span>
                  <ArrowRight size={20} />
                </a>
              <Link
                to="/servers"
                className="glass text-cyan-300 px-10 py-4 rounded-lg text-lg font-semibold hover:bg-cyan-500/20 transition-all duration-300 border border-cyan-500/30"
              >
                View Servers
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <h2 className="gaming-title text-4xl text-center mb-16">
            What We Offer
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="gaming-card p-8 rounded-xl">
              <div className="w-16 h-16 bg-gradient-to-r from-cyan-400 to-purple-600 rounded-xl flex items-center justify-center mb-6 neon-glow">
                <Users size={32} className="text-white" />
              </div>
              <h3 className="text-2xl font-semibold mb-4 text-cyan-300">Community Hub</h3>
              <p className="text-cyan-100 leading-relaxed">
                Connect with fellow gamers, share strategies, and build lasting friendships in our vibrant community.
              </p>
            </div>
            
            <div className="gaming-card p-8 rounded-xl">
              <div className="w-16 h-16 bg-gradient-to-r from-cyan-400 to-purple-600 rounded-xl flex items-center justify-center mb-6 neon-glow">
                <Trophy size={32} className="text-white" />
              </div>
              <h3 className="text-2xl font-semibold mb-4 text-cyan-300">Tournaments</h3>
              <p className="text-cyan-100 leading-relaxed">
                Compete in exciting tournaments, climb the leaderboards, and earn recognition for your skills.
              </p>
            </div>
            
            <div className="gaming-card p-8 rounded-xl">
              <div className="w-16 h-16 bg-gradient-to-r from-cyan-400 to-purple-600 rounded-xl flex items-center justify-center mb-6 neon-glow">
                <Calendar size={32} className="text-white" />
              </div>
              <h3 className="text-2xl font-semibold mb-4 text-cyan-300">Servers</h3>
              <p className="text-cyan-100 leading-relaxed">
                Join our dedicated gaming servers, find your perfect match, and play with fellow community members.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-gradient-to-r from-black/30 to-gray-900/30">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8 text-center">
            <div className="gaming-card p-6 rounded-xl">
              <div className="text-4xl font-bold text-cyan-400 mb-2">500+</div>
              <div className="text-cyan-200">Active Players</div>
            </div>
            <div className="gaming-card p-6 rounded-xl">
              <div className="text-4xl font-bold text-cyan-400 mb-2">50+</div>
              <div className="text-cyan-200">Tournaments</div>
            </div>
            <div className="gaming-card p-6 rounded-xl">
              <div className="text-4xl font-bold text-cyan-400 mb-2">1000+</div>
              <div className="text-cyan-200">Posts Shared</div>
            </div>
            <div className="gaming-card p-6 rounded-xl">
              <div className="text-4xl font-bold text-cyan-400 mb-2">24/7</div>
              <div className="text-cyan-200">Community Support</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-3xl mx-auto">
            <h2 className="gaming-title text-4xl mb-6">
              Ready to Join the Action?
            </h2>
            <p className="text-xl text-cyan-200 mb-8">
              Become part of the most exciting gaming community and start your journey today.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="https://discord.com/invite/dans"
                target="_blank"
                rel="noopener noreferrer"
                className="gaming-button text-lg px-8 py-4 flex items-center justify-center space-x-2"
              >
                <Users size={20} />
                <span>Join Discord</span>
              </a>
              <Link
                to="/servers"
                className="glass text-cyan-300 px-8 py-4 rounded-lg text-lg font-semibold hover:bg-cyan-500/20 transition-all duration-300 border border-cyan-500/30 flex items-center justify-center space-x-2"
              >
                <Calendar size={20} />
                <span>View Servers</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-cyan-500/20">
        <div className="container mx-auto px-4 text-center">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <div className="w-8 h-8 bg-gradient-to-r from-cyan-400 to-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">D</span>
            </div>
            <span className="text-xl font-bold gaming-title">Dan's Gaming Community</span>
          </div>
          <p className="text-cyan-300 mb-4">
            The ultimate gaming community for competitive players and casual gamers alike.
          </p>
          <div className="flex justify-center space-x-6 text-cyan-400">
            <span>© 2024 Dan's Gaming Community</span>
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