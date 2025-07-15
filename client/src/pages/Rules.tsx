import React, { useState } from 'react';
import { Shield, Users, Sword, Hammer, Gamepad2, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';

const Rules: React.FC = () => {
  const [activeTab, setActiveTab] = useState('general');

  const rulesData = {
    discord: {
      title: "Discord Rules",
      icon: Users,
      description: "Guidelines for our Discord community",
      rules: [
        {
          type: "required",
          title: "Use Common Sense",
          description: "You are responsible for obvious decisions. Think before you act."
        },
        {
          type: "required",
          title: "Be Respectful",
          description: "Remember, it's just the internet. Don't fight over stupid things."
        },
        {
          type: "prohibited",
          title: "No Racism, Bigotry, or Prejudice",
          description: "There is no exception; it has no place here!"
        },
        {
          type: "prohibited",
          title: "No Spam",
          description: "Do not spam messages, emojis, or any form of excessive content."
        },
        {
          type: "prohibited",
          title: "No Ban Evasion",
          description: "Do not join on another account to avoid a ban or use alternate accounts."
        },
        {
          type: "prohibited",
          title: "No Server Disruption",
          description: "Do not disturb normal server & Discord operations."
        },
        {
          type: "required",
          title: "Listen to Staff",
          description: "Always listen to staff. If you don't agree, follow their direction and make a ticket afterwards."
        },
        {
          type: "prohibited",
          title: "No Solicitation",
          description: "Do not solicit to other users of this Discord."
        },
        {
          type: "prohibited",
          title: "No Ping Abuse",
          description: "Do not abuse pings or mention users unnecessarily."
        },
        {
          type: "prohibited",
          title: "No Self-Promotion",
          description: "Do not self-promote or advertise without permission."
        },
        {
          type: "prohibited",
          title: "No Lying to Staff",
          description: "Do not lie to staff members under any circumstances."
        },
        {
          type: "prohibited",
          title: "No NSFW Channel Violations",
          description: "Do not break NSFW channel codes or post inappropriate content."
        },
        {
          type: "prohibited",
          title: "No Ticket System Abuse",
          description: "Do not abuse the ticket system or create unnecessary tickets."
        },
        {
          type: "prohibited",
          title: "No Staff Impersonation",
          description: "Under no circumstance should you pretend to be staff."
        },
        {
          type: "prohibited",
          title: "No Toxicity or Trolling",
          description: "Do not be toxic or troll other members."
        },
        {
          type: "prohibited",
          title: "No Illegal Content",
          description: "Do not post illegal content of any kind."
        },
        {
          type: "prohibited",
          title: "No Channel Code Violations",
          description: "Do not break channel codes or guidelines."
        }
      ]
    },
    mordhau: {
      title: "Mordhau Server Rules",
      icon: Sword,
      description: "Rules for our Mordhau gaming servers",
      rules: [
        {
          type: "required",
          title: "Proper Duel Initiation",
          description: "Press X+1 to flourish & initiate a duel. Do not RDM (Random Death Match) or engage in revenge RDM."
        },
        {
          type: "prohibited",
          title: "No RDM",
          description: "Do not RDM (Random Death Match). Press X+1 to flourish & initiate a duel. No revenge RDM either!"
        },
        {
          type: "prohibited",
          title: "No Interrupting Duels",
          description: "Do not interrupt other duels."
        }
      ]
    },
    rust: {
      title: "Rust Server Rules",
      icon: Hammer,
      description: "Guidelines for our Rust survival servers",
      rules: [
        {
          type: "required",
          title: "No Offline Raiding",
          description: "Raiding players who are offline is not allowed. Only raid active players."
        },
        {
          type: "required",
          title: "Respect Build Zones",
          description: "Do not build too close to other players' bases without permission."
        },
        {
          type: "required",
          title: "No Stream Sniping",
          description: "If you recognize a streamer, do not use their stream to gain advantages."
        },
        {
          type: "required",
          title: "Fair PvP",
          description: "No camping spawn points, exit zones, or using unfair tactics."
        },
        {
          type: "prohibited",
          title: "No Hacking/Cheating",
          description: "Any form of cheating, hacking, or using third-party software is banned."
        },
        {
          type: "prohibited",
          title: "No Toxic Behavior",
          description: "Racism, sexism, homophobia, and other forms of discrimination are not tolerated."
        }
      ]
    },
    general: {
      title: "General Gaming Rules",
      icon: Gamepad2,
      description: "Universal rules for all our gaming servers",
      rules: [
        {
          type: "required",
          title: "Sportsmanship",
          description: "Display good sportsmanship. Congratulate winners and accept losses gracefully."
        },
        {
          type: "required",
          title: "Report Issues",
          description: "Report bugs, cheaters, or rule violations to staff members."
        },
        {
          type: "required",
          title: "Listen to Staff",
          description: "Always listen to staff; if you don't agree with something, follow their direction and make a ticket on the Discord."
        },
        {
          type: "required",
          title: "Respect Server Capacity",
          description: "Do not attempt to crash servers or cause performance issues."
        },
        {
          type: "prohibited",
          title: "No Spam",
          description: "Do not spam in chat, voice, or any other communication method."
        },
        {
          type: "prohibited",
          title: "No Ban Evasion",
          description: "Do not ban evade (ban evasion is joining on another account to avoid a ban)."
        },
        {
          type: "prohibited",
          title: "No Lying to Staff",
          description: "Do not lie to staff."
        },
        {
          type: "prohibited",
          title: "No Staff Impersonation",
          description: "Do not impersonate staff."
        },
        {
          type: "prohibited",
          title: "No Toxicity or Trolling",
          description: "Do not be toxic or troll other players."
        },
        {
          type: "prohibited",
          title: "No DDoS Threats",
          description: "Threatening to DDoS servers or players will result in immediate ban."
        },
        {
          type: "prohibited",
          title: "No Account Sharing",
          description: "Do not share your account credentials with others."
        }
      ]
    }
  };

  const getRuleIcon = (type: string) => {
    switch (type) {
      case 'required':
        return <CheckCircle size={20} className="text-green-400" />;
      case 'prohibited':
        return <XCircle size={20} className="text-red-400" />;
      default:
        return <AlertTriangle size={20} className="text-yellow-400" />;
    }
  };

  const getRuleColor = (type: string) => {
    switch (type) {
      case 'required':
        return 'border-green-500/30 bg-green-500/10';
      case 'prohibited':
        return 'border-red-500/30 bg-red-500/10';
      default:
        return 'border-yellow-500/30 bg-yellow-500/10';
    }
  };

  const tabs = [
    { id: 'general', label: 'General', icon: Gamepad2 },
    { id: 'discord', label: 'Discord', icon: Users },
    { id: 'mordhau', label: 'Mordhau', icon: Sword },
    { id: 'rust', label: 'Rust', icon: Hammer }
  ];

  const currentRules = rulesData[activeTab as keyof typeof rulesData];

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="text-center mb-12" style={{ paddingTop: '80px', marginTop: '20px' }}>
        <h1 className="gaming-title text-5xl md:text-6xl mb-6" style={{ marginTop: '0' }}>
          Community Rules
        </h1>
          <p className="text-xl text-cyan-200 max-w-3xl mx-auto leading-relaxed">
            Our community is built on respect, fair play, and fun. 
            Please familiarize yourself with these rules to ensure everyone has a great experience.
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex flex-wrap justify-center gap-4 mb-12">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 px-6 py-3 rounded-xl transition-all duration-300 ${
                  activeTab === tab.id
                    ? 'gaming-button'
                    : 'glass text-cyan-300 hover:bg-cyan-500/20 border border-cyan-500/30'
                }`}
              >
                <Icon size={20} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Rules Content */}
        <div className="max-w-4xl mx-auto">
          <div className="gaming-card p-8 rounded-xl mb-8">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-12 h-12 bg-gradient-to-r from-cyan-400 to-purple-600 rounded-xl flex items-center justify-center neon-glow">
                <currentRules.icon size={24} className="text-white" />
              </div>
              <div>
                <h2 className="text-3xl font-semibold text-cyan-300">{currentRules.title}</h2>
                <p className="text-cyan-200">{currentRules.description}</p>
              </div>
            </div>

            <div className="space-y-8">
              {/* Required Rules */}
              <div>
                <h3 className="text-2xl font-semibold text-green-400 mb-4 flex items-center">
                  <CheckCircle size={24} className="mr-2" />
                  Required Rules
                </h3>
                <div className="grid gap-4">
                  {currentRules.rules
                    .filter(rule => rule.type === 'required')
                    .map((rule, index) => (
                      <div
                        key={index}
                        className={`p-6 rounded-xl border ${getRuleColor(rule.type)} transition-all duration-300 hover:scale-105`}
                      >
                        <div className="flex items-start space-x-4">
                          <div className="flex-shrink-0 mt-1">
                            {getRuleIcon(rule.type)}
                          </div>
                          <div>
                            <h4 className="text-xl font-semibold text-cyan-300 mb-2">
                              {rule.title}
                            </h4>
                            <p className="text-cyan-100 leading-relaxed">
                              {rule.description}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </div>

              {/* Prohibited Rules */}
              <div>
                <h3 className="text-2xl font-semibold text-red-400 mb-4 flex items-center">
                  <XCircle size={24} className="mr-2" />
                  Prohibited Rules
                </h3>
                <div className="grid gap-4">
                  {currentRules.rules
                    .filter(rule => rule.type === 'prohibited')
                    .map((rule, index) => (
                      <div
                        key={index}
                        className={`p-6 rounded-xl border ${getRuleColor(rule.type)} transition-all duration-300 hover:scale-105`}
                      >
                        <div className="flex items-start space-x-4">
                          <div className="flex-shrink-0 mt-1">
                            {getRuleIcon(rule.type)}
                          </div>
                          <div>
                            <h4 className="text-xl font-semibold text-cyan-300 mb-2">
                              {rule.title}
                            </h4>
                            <p className="text-cyan-100 leading-relaxed">
                              {rule.description}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          </div>

          {/* Enforcement Notice */}
          <div className="gaming-card p-8 rounded-xl border border-yellow-500/30 bg-yellow-500/10">
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0 mt-1">
                <Shield size={24} className="text-yellow-400" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-yellow-300 mb-2">
                  Rule Enforcement
                </h3>
                <p className="text-cyan-100 leading-relaxed mb-4">
                  Our staff team actively monitors all platforms and servers. Violations of these rules may result in warnings, temporary suspensions, or permanent bans depending on the severity and frequency of the offense.
                </p>
                <p className="text-cyan-200 text-sm">
                  If you witness a rule violation, please report it to a staff member with evidence (screenshots, recordings, etc.) for proper investigation.
                </p>
              </div>
            </div>
          </div>

          {/* Contact Section */}
          <div className="text-center mt-12">
            <div className="max-w-2xl mx-auto">
              <h2 className="gaming-title text-3xl mb-6">
                Questions About Rules?
              </h2>
              <p className="text-lg text-cyan-200 mb-8">
                If you have questions about any of these rules or need clarification, 
                don't hesitate to reach out to our staff team on Discord.
              </p>
              <a
                href="https://discord.com/invite/dans"
                target="_blank"
                rel="noopener noreferrer"
                className="gaming-button text-lg px-8 py-4 inline-flex items-center space-x-2"
              >
                <Users size={20} />
                <span>Contact Staff on Discord</span>
              </a>
            </div>
          </div>
        </div>
    </div>
  );
};

export default Rules; 