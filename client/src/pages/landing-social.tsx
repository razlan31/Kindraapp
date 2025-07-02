import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Heart, Brain, Calendar, TrendingUp, Star, Check, ArrowRight, Users, Shield, Sparkles, MessageCircle, ThumbsUp, Share2, Bookmark, MoreHorizontal, Play } from 'lucide-react';
import { useLocation } from 'wouter';
import { PricingModal } from '@/components/subscription/pricing-modal';

export default function SocialLandingPage() {
  const [, setLocation] = useLocation();
  const [showPricingModal, setShowPricingModal] = useState(false);

  const features = [
    {
      icon: <Brain className="h-5 w-5" />,
      title: "Luna AI Coach",
      description: "Your personal relationship expert powered by advanced AI, available 24/7 for instant guidance and insights."
    },
    {
      icon: <Heart className="h-5 w-5" />,
      title: "Cycle Tracking",
      description: "Understand how your cycle affects your emotions and relationships with intelligent pattern recognition."
    },
    {
      icon: <Calendar className="h-5 w-5" />,
      title: "Moment Analytics",
      description: "Capture and analyze relationship moments to identify patterns and growth opportunities."
    }
  ];

  const testimonials = [
    {
      name: "Sarah M.",
      role: "Marketing Manager",
      content: "Kindra helped me understand my relationship patterns better. The AI insights are incredibly accurate!"
    },
    {
      name: "Alex Chen",
      role: "Teacher",
      content: "Luna AI is like having a relationship therapist in your pocket. It's transformed how I communicate."
    }
  ];

  const handleGetStarted = () => {
    console.log('Start button clicked - navigating to login');
    setLocation('/login');
  };

  const handlePremiumSignup = () => {
    setShowPricingModal(true);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Social Media Style Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50 backdrop-blur-md bg-white/95">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-pink-500 to-orange-500 rounded-full flex items-center justify-center shadow-lg">
                <Heart className="h-6 w-6 text-white" />
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-pink-600 to-orange-600 bg-clip-text text-transparent">
                Kindra
              </span>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="ghost" onClick={handleGetStarted} className="text-gray-600 hover:bg-gray-100">
                Sign In
              </Button>
              <Button onClick={handleGetStarted} className="bg-gradient-to-r from-pink-500 to-orange-500 hover:from-pink-600 hover:to-orange-600 text-white rounded-full px-6 relative z-30 cursor-pointer">
                Get Started
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Stories-Style Hero Section */}
      <section className="bg-white">
        {/* Story Highlights */}
        <div className="container mx-auto px-4 py-6">
          <div className="flex gap-4 overflow-x-auto scrollbar-hide">
            {['💕 Success Stories', '🤖 Meet Luna AI', '📊 Your Analytics', '🎯 Features', '🔒 Privacy'].map((story, index) => (
              <div key={index} className="flex-shrink-0 text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-pink-400 to-orange-400 rounded-full p-0.5 mb-2">
                  <div className="w-full h-full bg-white rounded-full flex items-center justify-center">
                    <span className="text-2xl">{story.split(' ')[0]}</span>
                  </div>
                </div>
                <p className="text-xs text-gray-600 max-w-[60px] leading-tight">{story.split(' ').slice(1).join(' ')}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Main Feed-Style Hero */}
        <div className="container mx-auto px-4 pb-8">
          <div className="max-w-lg mx-auto">
            {/* Profile Header */}
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-orange-500 rounded-full flex items-center justify-center">
                <Heart className="h-6 w-6 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-lg">kindra.ai</h3>
                <p className="text-gray-500 text-sm">Your AI Relationship Coach</p>
              </div>
              <Button variant="ghost" size="sm">
                <MoreHorizontal className="h-5 w-5" />
              </Button>
            </div>

            {/* Main Content Card */}
            <Card className="mb-4 border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
              <div className="bg-gradient-to-br from-pink-50 to-orange-50 p-8 text-center">
                <h1 className="text-3xl md:text-4xl font-bold mb-4 bg-gradient-to-r from-pink-600 to-orange-600 bg-clip-text text-transparent">
                  Transform Your Love Life with AI
                </h1>
                <p className="text-gray-600 mb-6 leading-relaxed">
                  Meet Luna AI, your personal relationship coach. Track patterns, understand emotions, and build deeper connections.
                </p>
                
                {/* Phone Preview */}
                <div className="relative mx-auto w-48 h-80 bg-black rounded-3xl p-2 mb-6">
                  <div className="w-full h-full bg-white rounded-2xl overflow-hidden">
                    <div className="bg-gradient-to-r from-pink-500 to-orange-500 h-16 flex items-center justify-center">
                      <span className="text-white font-bold">Luna AI Chat</span>
                    </div>
                    <div className="p-3 space-y-2">
                      <div className="bg-gray-100 rounded-lg p-2 text-xs">How can I support you today?</div>
                      <div className="bg-pink-500 text-white rounded-lg p-2 text-xs ml-8">Help me understand my relationship patterns</div>
                      <div className="bg-gray-100 rounded-lg p-2 text-xs">Based on your data, I see you're building deeper connections...</div>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 justify-center">
                  <Button 
                    onClick={handleGetStarted}
                    className="bg-gradient-to-r from-pink-500 to-orange-500 hover:from-pink-600 hover:to-orange-600 text-white rounded-full px-8 relative z-30 cursor-pointer"
                  >
                    Start Free Today
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => setShowPricingModal(true)}
                    className="border-pink-200 text-pink-600 hover:bg-pink-50 rounded-full px-6 relative z-30 cursor-pointer"
                  >
                    View Pricing
                  </Button>
                </div>
              </div>

              {/* Social Actions */}
              <div className="p-4 bg-white border-t border-gray-100">
                <div className="flex items-center justify-between">
                  <div className="flex gap-4">
                    <button className="flex items-center gap-2 text-gray-600 hover:text-pink-600">
                      <ThumbsUp className="h-5 w-5" />
                      <span className="text-sm">2.1k</span>
                    </button>
                    <button className="flex items-center gap-2 text-gray-600 hover:text-pink-600">
                      <MessageCircle className="h-5 w-5" />
                      <span className="text-sm">342</span>
                    </button>
                    <button className="text-gray-600 hover:text-pink-600">
                      <Share2 className="h-5 w-5" />
                    </button>
                  </div>
                  <button className="text-gray-600 hover:text-pink-600">
                    <Bookmark className="h-5 w-5" />
                  </button>
                </div>
                <div className="mt-3">
                  <p className="text-sm text-gray-600">
                    <span className="font-semibold">kindra.ai</span> Join thousands who've transformed their relationships with AI-powered insights 💕
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Social Feed Features */}
      <section className="py-8 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="max-w-lg mx-auto space-y-6">
            {features.map((feature, index) => (
              <Card key={index} className="border border-gray-200 rounded-2xl overflow-hidden shadow-sm bg-white">
                {/* Post Header */}
                <div className="flex items-center gap-3 p-4">
                  <div className="w-10 h-10 bg-gradient-to-br from-pink-500 to-orange-500 rounded-full flex items-center justify-center text-white">
                    {feature.icon}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-base">{feature.title}</h3>
                    <p className="text-gray-500 text-sm">Featured • 2 hours ago</p>
                  </div>
                  <Button variant="ghost" size="sm">
                    <MoreHorizontal className="h-5 w-5" />
                  </Button>
                </div>

                {/* Post Content */}
                <div className="px-4 pb-4">
                  <p className="text-gray-700 mb-4">{feature.description}</p>
                  
                  {/* Feature Preview */}
                  <div className="bg-gradient-to-br from-pink-50 to-orange-50 rounded-xl p-4 mb-4">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-6 h-6 bg-gradient-to-br from-pink-500 to-orange-500 rounded-full flex items-center justify-center text-white">
                        {feature.icon}
                      </div>
                      <span className="font-semibold text-sm">Live Demo</span>
                    </div>
                    <div className="text-xs text-gray-600">
                      {index === 0 && "Luna: Based on your communication patterns, I notice you respond 40% faster to positive messages..."}
                      {index === 1 && "Your cycle shows higher emotional sensitivity during days 14-21. Perfect time for deeper conversations."}
                      {index === 2 && "You've had 12 positive moments this week! Your relationship satisfaction is trending upward 📈"}
                    </div>
                  </div>
                </div>

                {/* Social Actions */}
                <div className="px-4 pb-4 border-t border-gray-100 pt-3">
                  <div className="flex items-center justify-between">
                    <div className="flex gap-4">
                      <button className="flex items-center gap-2 text-gray-600 hover:text-pink-600">
                        <ThumbsUp className="h-4 w-4" />
                        <span className="text-sm">{index === 0 ? '1.2k' : index === 1 ? '890' : '567'}</span>
                      </button>
                      <button className="flex items-center gap-2 text-gray-600 hover:text-pink-600">
                        <MessageCircle className="h-4 w-4" />
                        <span className="text-sm">{index === 0 ? '234' : index === 1 ? '156' : '89'}</span>
                      </button>
                      <button className="text-gray-600 hover:text-pink-600">
                        <Share2 className="h-4 w-4" />
                      </button>
                    </div>
                    <button className="text-gray-600 hover:text-pink-600">
                      <Bookmark className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </Card>
            ))}

            {/* View More Features */}
            <div className="text-center py-6">
              <Button 
                variant="outline" 
                onClick={() => setShowPricingModal(true)}
                className="border-pink-200 text-pink-600 hover:bg-pink-50 rounded-full px-8"
              >
                View All Features
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials as Social Posts */}
      <section className="py-8 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-lg mx-auto space-y-6">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="border border-gray-200 rounded-2xl overflow-hidden shadow-sm bg-white">
                {/* User Header */}
                <div className="flex items-center gap-3 p-4">
                  <div className="w-10 h-10 bg-gradient-to-br from-pink-400 to-orange-400 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold text-sm">{testimonial.name.charAt(0)}</span>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-base">{testimonial.name}</h3>
                    <p className="text-gray-500 text-sm">{testimonial.role} • 1 day ago</p>
                  </div>
                  <Button variant="ghost" size="sm">
                    <MoreHorizontal className="h-5 w-5" />
                  </Button>
                </div>

                {/* Testimonial Content */}
                <div className="px-4 pb-4">
                  <p className="text-gray-700 mb-4">{testimonial.content}</p>
                  
                  {/* Rating */}
                  <div className="flex items-center gap-1 mb-4">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    ))}
                    <span className="text-sm text-gray-600 ml-2">Amazing results!</span>
                  </div>
                </div>

                {/* Social Actions */}
                <div className="px-4 pb-4 border-t border-gray-100 pt-3">
                  <div className="flex items-center justify-between">
                    <div className="flex gap-4">
                      <button className="flex items-center gap-2 text-gray-600 hover:text-pink-600">
                        <ThumbsUp className="h-4 w-4" />
                        <span className="text-sm">{index === 0 ? '456' : '289'}</span>
                      </button>
                      <button className="flex items-center gap-2 text-gray-600 hover:text-pink-600">
                        <MessageCircle className="h-4 w-4" />
                        <span className="text-sm">{index === 0 ? '78' : '45'}</span>
                      </button>
                      <button className="text-gray-600 hover:text-pink-600">
                        <Share2 className="h-4 w-4" />
                      </button>
                    </div>
                    <button className="text-gray-600 hover:text-pink-600">
                      <Bookmark className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-6 bg-gradient-to-r from-pink-600 to-orange-600 bg-clip-text text-transparent">
              Ready to Transform Your Relationships?
            </h2>
            <p className="text-xl mb-8 text-gray-600">
              Join thousands of users who have already discovered the power of AI-driven relationship intelligence.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg" 
                onClick={handleGetStarted}
                className="bg-gradient-to-r from-pink-500 to-orange-500 hover:from-pink-600 hover:to-orange-600 text-white rounded-full px-8 py-6 text-lg relative z-30 cursor-pointer"
              >
                Start Your Free Journey
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button 
                variant="outline" 
                size="lg"
                onClick={handlePremiumSignup}
                className="border-pink-200 text-pink-600 hover:bg-pink-50 rounded-full px-8 py-6 text-lg relative z-30 cursor-pointer"
              >
                View Premium Features
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="flex flex-col md:flex-row items-center justify-between">
              <div className="flex items-center gap-2 mb-4 md:mb-0">
                <div className="w-8 h-8 bg-gradient-to-br from-pink-500 to-orange-500 rounded-lg flex items-center justify-center">
                  <Heart className="h-5 w-5 text-white" />
                </div>
                <span className="text-xl font-bold bg-gradient-to-r from-pink-600 to-orange-600 bg-clip-text text-transparent">
                  Kindra
                </span>
              </div>
              <div className="text-gray-600 text-sm">
                © 2025 Kindra. All rights reserved.
              </div>
            </div>
          </div>
        </div>
      </footer>

      {/* Pricing Modal */}
      <PricingModal 
        isOpen={showPricingModal} 
        onClose={() => setShowPricingModal(false)}
        currentPlan="free"
        showTrialButton={true}
      />
    </div>
  );
}