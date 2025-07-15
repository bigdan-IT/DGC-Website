import React from 'react';
import { Server, Users, Globe, Shield, Zap, Gamepad2 } from 'lucide-react';

const Servers: React.FC = () => {
  const servers = [
    {
      name: "Competitive Arena",
      game: "Valorant",
      players: "24/32",
      status: "online",
      description: "High-level competitive matches and tournaments",
      icon: Shield
    },
    {
      name: "Casual Hub",
      game: "Minecraft",
      players: "45/50",
      status: "online",
      description: "Relaxed gaming and community building",
      icon: Users
    },
    {
      name: "Battle Royale",
      game: "Fortnite",
      players: "18/25",
      status: "online",
      description: "Fast-paced battle royale action",
      icon: Zap
    },
    {
      name: "Strategy Zone",
      game: "League of Legends",
      players: "12/20",
      status: "online",
      description: "Strategic gameplay and team coordination",
      icon: Globe
    }
  ];

  return (
    <div className="min-h-screen py-4 mt-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="gaming-title text-5xl md:text-6xl mb-6">
            Gaming Servers
          </h1>
          <p className="text-xl text-cyan-200 max-w-3xl mx-auto leading-relaxed">
            Join our dedicated gaming servers and connect with fellow players. 
            Find your perfect match and dominate the competition.
          </p>
        </div>

        {/* Server Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-2 gap-8 mb-12">
          {servers.map((server, index) => (
            <div key={index} className="gaming-card p-6 rounded-xl hover:scale-105 transition-transform duration-300">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gradient-to-r from-cyan-400 to-purple-600 rounded-xl flex items-center justify-center neon-glow">
                    <server.icon size={24} className="text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-cyan-300">{server.name}</h3>
                    <p className="text-cyan-100 text-sm">{server.game}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <div className={`w-3 h-3 rounded-full ${server.status === 'online' ? 'bg-green-400' : 'bg-red-400'}`}></div>
                  <span className="text-sm text-cyan-200">{server.players}</span>
                </div>
              </div>
              <p className="text-cyan-100 mb-4">{server.description}</p>
              <button className="gaming-button w-full">
                Join Server
              </button>
            </div>
          ))}
        </div>

        {/* Server Info */}
        <div className="grid md:grid-cols-3 gap-8">
          <div className="gaming-card p-6 rounded-xl text-center">
            <div className="w-16 h-16 bg-gradient-to-r from-cyan-400 to-purple-600 rounded-xl flex items-center justify-center mx-auto mb-4 neon-glow">
              <Users size={32} className="text-white" />
            </div>
            <h3 className="text-xl font-semibold text-cyan-300 mb-2">Active Community</h3>
            <p className="text-cyan-100">Join thousands of active players across multiple games</p>
          </div>
          
          <div className="gaming-card p-6 rounded-xl text-center">
            <div className="w-16 h-16 bg-gradient-to-r from-cyan-400 to-purple-600 rounded-xl flex items-center justify-center mx-auto mb-4 neon-glow">
              <Shield size={32} className="text-white" />
            </div>
            <h3 className="text-xl font-semibold text-cyan-300 mb-2">Moderated</h3>
            <p className="text-cyan-100">Safe and friendly environment with active moderation</p>
          </div>
          
          <div className="gaming-card p-6 rounded-xl text-center">
            <div className="w-16 h-16 bg-gradient-to-r from-cyan-400 to-purple-600 rounded-xl flex items-center justify-center mx-auto mb-4 neon-glow">
              <Zap size={32} className="text-white" />
            </div>
            <h3 className="text-xl font-semibold text-cyan-300 mb-2">24/7 Uptime</h3>
            <p className="text-cyan-100">Reliable servers with high performance and low latency</p>
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center mt-16">
          <div className="max-w-2xl mx-auto">
            <h2 className="gaming-title text-3xl mb-6">
              Ready to Join the Action?
            </h2>
            <p className="text-lg text-cyan-200 mb-8">
              Connect with our Discord community to get server access and join the conversation.
            </p>
            <a
              href="https://discord.com/invite/dans"
              target="_blank"
              rel="noopener noreferrer"
              className="gaming-button text-lg px-8 py-4 inline-flex items-center space-x-2"
            >
              <Gamepad2 size={20} />
              <span>Join Discord Community</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Servers; 