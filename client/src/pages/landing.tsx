import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Heart, Brain, Calendar, TrendingUp, Star, Check, ArrowRight, Users, Shield, Sparkles, Moon, Sun, Zap, Play } from 'lucide-react';
import { useLocation } from 'wouter';
import { AnimatedFeatures } from '@/components/animated-features';
import { PricingModal } from '@/components/subscription/pricing-modal';

export default function LandingPage() {
  const [, setLocation] = useLocation();
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'annual'>('monthly');
  const [showPricingModal, setShowPricingModal] = useState(false);



  const features = [
    {
      icon: <Brain className="h-6 w-6" />,
      title: "Luna AI Coach",
      description: "Your personal relationship expert powered by advanced AI, available 24/7 for instant guidance and insights."
    },
    {
      icon: <Heart className="h-6 w-6" />,
      title: "Menstrual Cycle Tracking",
      description: "Understand how your cycle affects your emotions and relationships with intelligent pattern recognition."
    },
    {
      icon: <Calendar className="h-6 w-6" />,
      title: "Moment Tracking",
      description: "Capture and analyze relationship moments to identify patterns and growth opportunities."
    },
    {
      icon: <TrendingUp className="h-6 w-6" />,
      title: "Relationship Analytics",
      description: "Get deep insights into your relationship patterns with beautiful visualizations and trends."
    },
    {
      icon: <Users className="h-6 w-6" />,
      title: "Multiple Connections",
      description: "Track various relationships simultaneously - romantic, friendships, family connections."
    },
    {
      icon: <Shield className="h-6 w-6" />,
      title: "Privacy First",
      description: "Your data is encrypted and private. Only you have access to your relationship insights."
    }
  ];

  const testimonials = [
    {
      name: "Sarah M.",
      role: "Marketing Professional",
      content: "Kindra helped me understand my communication patterns and saved my relationship. Luna AI feels like having a therapist in my pocket.",
      rating: 5
    },
    {
      name: "Michael R.",
      role: "Software Engineer", 
      content: "The cycle tracking feature is incredible. Finally understanding the connection between hormones and relationship dynamics changed everything.",
      rating: 5
    },
    {
      name: "Jessica T.",
      role: "Teacher",
      content: "I've tried many relationship apps, but Kindra's AI insights are genuinely helpful. It's like having a relationship coach available 24/7.",
      rating: 5
    }
  ];

  const pricingPlans = [
    {
      name: "Free",
      price: "$0",
      period: "forever",
      description: "Perfect for getting started",
      features: [
        "1 relationship connection",
        "3 AI coaching messages/month",
        "Basic moment tracking",
        "Limited insights",
        "Community support"
      ],
      cta: "Sign In / Sign Up",
      popular: false
    },
    {
      name: "Premium",
      price: selectedPlan === 'monthly' ? "$4.99" : "$3.33",
      originalPrice: selectedPlan === 'monthly' ? undefined : "$4.99",
      period: selectedPlan === 'monthly' ? "per month" : "per month (billed annually)",
      description: "Everything you need for relationship growth",
      features: [
        "Unlimited connections",
        "Unlimited AI coaching",
        "Advanced analytics & insights",
        "Menstrual cycle intelligence",
        "Priority support",
        "Export your data",
        "Advanced privacy controls"
      ],
      cta: "Sign In / Sign Up",
      popular: true
    }
  ];

  const handleGetStarted = () => {
    setLocation('/login');
  };

  const handlePremiumSignup = () => {
    setShowPricingModal(true);
  };



  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-indigo-50 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-20 left-10 w-64 h-64 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl animate-blob"></div>
        <div className="absolute top-40 right-10 w-64 h-64 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-20 left-20 w-64 h-64 bg-indigo-300 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-4000"></div>
      </div>
      {/* Header */}
      <header className="container mx-auto px-4 py-6 relative z-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-purple-600 to-pink-600 rounded-lg flex items-center justify-center">
              <Heart className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Kindra
            </span>
          </div>
          <Button onClick={handleGetStarted} className="bg-purple-600 hover:bg-purple-700">
            Sign In
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16 relative overflow-hidden">
        <div className="grid lg:grid-cols-2 gap-16 items-center max-w-7xl mx-auto">
          {/* Left Column - Content */}
          <div className="text-left relative z-20">
            <Badge className="mb-6 bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700 hover:bg-purple-100 border-purple-200">
              <Sparkles className="h-4 w-4 mr-1" />
              AI-Powered Relationship Intelligence
            </Badge>
            
            <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-purple-600 via-pink-600 to-orange-500 bg-clip-text text-transparent leading-tight">
              Transform Your Love Life with AI
            </h1>
            
            <p className="text-xl text-gray-600 mb-8 leading-relaxed">
              Meet Luna AI, your personal relationship coach. Track patterns, understand emotions, and build deeper connections with the power of artificial intelligence.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 mb-8 relative z-30">
              <Button 
                size="lg" 
                onClick={handleGetStarted}
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-lg px-8 py-6 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300"
              >
                Start Free Today
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button 
                variant="outline" 
                size="lg"
                onClick={() => setShowPricingModal(true)}
                className="text-lg px-8 py-6 rounded-2xl border-purple-200 text-purple-700 hover:bg-purple-50 transition-all duration-300"
              >
                View Pricing
              </Button>
            </div>
            
            <div className="flex items-center gap-6 text-sm text-gray-500">
              <div className="flex items-center gap-1">
                <Check className="h-4 w-4 text-green-500" />
                No credit card required
              </div>
              <div className="flex items-center gap-1">
                <Check className="h-4 w-4 text-green-500" />
                5-day free trial
              </div>
              <div className="flex items-center gap-1">
                <Check className="h-4 w-4 text-green-500" />
                Cancel anytime
              </div>
            </div>
          </div>
          
          {/* Right Column - App Preview */}
          <div className="relative">
            {/* Background decorative elements */}
            <div className="absolute -top-12 -right-12 w-64 h-64 bg-gradient-to-br from-purple-300 to-pink-300 rounded-full opacity-20 blur-3xl animate-pulse"></div>
            <div className="absolute -bottom-12 -left-12 w-64 h-64 bg-gradient-to-br from-blue-300 to-purple-300 rounded-full opacity-15 blur-3xl animate-pulse animation-delay-2000"></div>
            
            {/* Phone mockup */}
            <div className="relative bg-slate-900 rounded-[3rem] p-3 shadow-2xl transform rotate-3 hover:rotate-0 transition-transform duration-500">
              <div className="bg-white rounded-[2.5rem] overflow-hidden">
                {/* Phone header */}
                <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-6 text-white">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-3 h-3 bg-white/30 rounded-full"></div>
                    <div className="text-xs font-medium">kindra.app</div>
                    <div className="w-6 h-3 bg-white/30 rounded-full"></div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                      <Brain className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <div className="font-semibold">Luna AI</div>
                      <div className="text-xs text-white/80">Your Relationship Coach</div>
                    </div>
                    <div className="ml-auto w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  </div>
                </div>
                
                {/* Chat messages */}
                <div className="p-6 space-y-4 bg-gradient-to-b from-white to-purple-50">
                  <div className="bg-gray-100 rounded-2xl rounded-bl-lg p-4 max-w-[80%]">
                    <div className="text-sm text-gray-800">
                      "I notice you both communicate better in the evenings. Your last 3 meaningful conversations happened after 7 PM."
                    </div>
                  </div>
                  
                  <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-2xl rounded-br-lg p-4 max-w-[80%] ml-auto">
                    <div className="text-sm">
                      "That's so accurate! How did you know that?"
                    </div>
                  </div>
                  
                  <div className="bg-gray-100 rounded-2xl rounded-bl-lg p-4 max-w-[80%]">
                    <div className="text-sm text-gray-800">
                      "I analyze your interaction patterns and emotional data. Would you like specific timing recommendations for important conversations?"
                    </div>
                  </div>
                </div>
                
                {/* Stats preview */}
                <div className="p-6 bg-white">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-gradient-to-br from-green-50 to-emerald-100 rounded-xl p-4 border border-green-200">
                      <div className="flex items-center gap-2 mb-2">
                        <Heart className="h-4 w-4 text-green-600" />
                        <span className="text-xs font-medium text-green-700">Connection</span>
                      </div>
                      <div className="text-2xl font-bold text-green-900">94%</div>
                      <div className="w-full bg-green-200 rounded-full h-2 mt-2">
                        <div className="bg-gradient-to-r from-green-400 to-green-600 h-2 rounded-full" style={{ width: '94%' }}></div>
                      </div>
                    </div>
                    
                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-200">
                      <div className="flex items-center gap-2 mb-2">
                        <TrendingUp className="h-4 w-4 text-blue-600" />
                        <span className="text-xs font-medium text-blue-700">Growth</span>
                      </div>
                      <div className="text-2xl font-bold text-blue-900">89%</div>
                      <div className="w-full bg-blue-200 rounded-full h-2 mt-2">
                        <div className="bg-gradient-to-r from-blue-400 to-blue-600 h-2 rounded-full" style={{ width: '89%' }}></div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Quick actions */}
                  <div className="grid grid-cols-3 gap-2 mt-4">
                    <div className="bg-gradient-to-r from-pink-500 to-rose-500 rounded-lg p-3 text-center">
                      <Calendar className="h-4 w-4 text-white mx-auto mb-1" />
                      <div className="text-xs text-white font-medium">Track</div>
                    </div>
                    <div className="bg-gradient-to-r from-purple-500 to-indigo-500 rounded-lg p-3 text-center">
                      <Brain className="h-4 w-4 text-white mx-auto mb-1" />
                      <div className="text-xs text-white font-medium">Analyze</div>
                    </div>
                    <div className="bg-gradient-to-r from-orange-500 to-pink-500 rounded-lg p-3 text-center">
                      <Zap className="h-4 w-4 text-white mx-auto mb-1" />
                      <div className="text-xs text-white font-medium">Grow</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Features Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="max-w-6xl mx-auto">
          <AnimatedFeatures />
        </div>
      </section>

      {/* Video Demo Section */}
      <section className="container mx-auto px-4 py-16 bg-gradient-to-br from-slate-50 to-gray-50">
        <div className="max-w-4xl mx-auto text-center">
          <Badge className="mb-6 bg-slate-100 text-slate-700 hover:bg-slate-100">
            <Play className="h-4 w-4 mr-1" />
            See It In Action
          </Badge>
          
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Transform Your Relationship Journey
          </h2>
          
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Watch how Kindra's AI-powered insights help real couples build stronger connections through intelligent cycle tracking and personalized guidance.
          </p>
          
          <div className="relative bg-gradient-to-br from-purple-600 to-pink-600 rounded-2xl p-8 shadow-2xl">
            {/* Couple Illustration */}
            <div className="absolute -top-6 -left-6 w-24 h-24">
              <svg viewBox="0 0 150 150" className="w-full h-full">
                {/* Couple holding hands */}
                <circle cx="45" cy="40" r="15" fill="#FBBF24"/>
                <circle cx="105" cy="40" r="15" fill="#F97316"/>
                <rect x="35" y="60" width="20" height="35" rx="10" fill="#3B82F6"/>
                <rect x="95" y="60" width="20" height="35" rx="10" fill="#EC4899"/>
                <circle cx="40" cy="35" r="1.5" fill="#374151"/>
                <circle cx="50" cy="35" r="1.5" fill="#374151"/>
                <circle cx="100" cy="35" r="1.5" fill="#374151"/>
                <circle cx="110" cy="35" r="1.5" fill="#374151"/>
                <path d="M40 45 Q45 48 50 45" stroke="#374151" strokeWidth="1" fill="none"/>
                <path d="M100 45 Q105 48 110 45" stroke="#374151" strokeWidth="1" fill="none"/>
                <path d="M55 70 L95 70" stroke="#EF4444" strokeWidth="3" fill="none"/>
                <circle cx="75" cy="65" r="3" fill="#EF4444"/>
              </svg>
            </div>
            
            <div className="bg-white rounded-xl p-8 text-left relative z-10">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                  <Brain className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">Luna AI Coaching Demo</h3>
                  <p className="text-gray-600">Experience personalized relationship guidance</p>
                </div>
              </div>
              
              <div className="space-y-4 text-sm">
                <div className="bg-gray-100 rounded-lg p-3">
                  <strong>User:</strong> "My partner seems distant lately. I'm not sure how to approach this."
                </div>
                <div className="bg-purple-100 rounded-lg p-3">
                  <strong>Luna AI:</strong> "I understand this feels concerning. Based on your cycle tracking, you're in your luteal phase, which can affect communication sensitivity. Here's a gentle approach: Try expressing your feelings using 'I' statements during a calm moment. For example, 'I've been feeling like we haven't connected as much lately, and I'd love to understand how you're feeling.' Would you like specific conversation starters?"
                </div>
                <div className="bg-gray-100 rounded-lg p-3">
                  <strong>User:</strong> "Yes, that would help a lot!"
                </div>
              </div>
              
              <Button 
                size="lg" 
                className="w-full mt-6 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                onClick={() => setLocation('/login')}
              >
                Try Luna AI Free
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="container mx-auto px-4 py-16 bg-white/50 relative overflow-hidden">
        {/* Background blobs for features section */}
        <div className="absolute top-10 right-10 w-64 h-64 bg-slate-100 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-10 left-10 w-64 h-64 bg-gray-100 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob animation-delay-4000"></div>
        
        <div className="max-w-6xl mx-auto relative z-20">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Everything You Need for Relationship Growth
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Powerful AI-driven insights, intuitive tracking, and personalized guidance to help you build stronger, healthier relationships.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="p-6 border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-white/80 backdrop-blur-sm group hover:scale-105">
                <CardContent className="p-0">
                  <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mb-6 text-white group-hover:rotate-6 transition-transform duration-300 shadow-lg">
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-bold mb-3 text-gray-900">{feature.title}</h3>
                  <p className="text-gray-600 leading-relaxed">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Luna AI Showcase */}
      <section className="container mx-auto px-4 py-16">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <Badge className="mb-6 bg-indigo-100 text-indigo-700 hover:bg-indigo-100">
                <Moon className="h-4 w-4 mr-1" />
                Meet Luna AI
              </Badge>
              <h2 className="text-3xl md:text-4xl font-bold mb-6">
                Your Personal Relationship Expert
              </h2>
              <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                Luna AI combines the wisdom of relationship experts with the personalization of AI. Get instant insights, expert advice, and personalized strategies tailored to your unique relationship patterns.
              </p>
              
              <div className="space-y-4 mb-8">
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                    <Check className="h-4 w-4 text-green-600" />
                  </div>
                  <span className="text-gray-700">Available 24/7 for instant guidance</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                    <Check className="h-4 w-4 text-green-600" />
                  </div>
                  <span className="text-gray-700">Learns from your relationship patterns</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                    <Check className="h-4 w-4 text-green-600" />
                  </div>
                  <span className="text-gray-700">Provides personalized advice and strategies</span>
                </div>
              </div>
              
              <Button 
                size="lg" 
                onClick={handleGetStarted}
                className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
              >
                Chat with Luna AI
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>
            
            <div className="relative">
              <div className="bg-gradient-to-br from-indigo-100 to-purple-100 rounded-2xl p-8 relative overflow-hidden">
                {/* Character Illustration */}
                <div className="absolute -top-8 -right-4 w-32 h-32 z-20">
                  <svg viewBox="0 0 200 200" className="w-full h-full">
                    {/* Woman with phone */}
                    <circle cx="100" cy="80" r="25" fill="#F3E8FF" stroke="#9333EA" strokeWidth="2"/>
                    <circle cx="100" cy="80" r="20" fill="#FBBF24"/>
                    <rect x="85" y="120" width="30" height="50" rx="15" fill="#E879F9"/>
                    <circle cx="95" cy="75" r="2" fill="#374151"/>
                    <circle cx="105" cy="75" r="2" fill="#374151"/>
                    <path d="M95 85 Q100 90 105 85" stroke="#374151" strokeWidth="2" fill="none"/>
                    <rect x="70" y="95" width="15" height="25" rx="7" fill="#60A5FA"/>
                    <rect x="115" y="95" width="15" height="25" rx="7" fill="#60A5FA"/>
                    <rect x="75" y="92" width="8" height="12" rx="4" fill="#1F2937"/>
                  </svg>
                </div>
                
                {/* Small decorative blob */}
                <div className="absolute top-4 left-4 w-16 h-16 bg-slate-100 rounded-full mix-blend-multiply filter blur-lg opacity-30 animate-blob"></div>
                
                <div className="bg-white rounded-xl p-6 shadow-lg relative z-10">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full flex items-center justify-center">
                      <span className="text-white font-semibold">L</span>
                    </div>
                    <div>
                      <div className="font-semibold">Luna AI</div>
                      <div className="text-sm text-gray-500">Your Relationship Coach</div>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="bg-gray-50 rounded-lg p-3 text-sm">
                      I've noticed you've been feeling uncertain about your relationship lately. Based on your tracking patterns, it seems like communication has been a challenge.
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3 text-sm">
                      Here are three specific strategies that could help improve your connection...
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof Numbers */}
      <section className="container mx-auto px-4 py-16 bg-white">
        <div className="max-w-4xl mx-auto text-center">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="space-y-2">
              <div className="text-3xl md:text-4xl font-bold text-purple-600">10K+</div>
              <div className="text-gray-600">Active Users</div>
            </div>
            <div className="space-y-2">
              <div className="text-3xl md:text-4xl font-bold text-pink-600">95%</div>
              <div className="text-gray-600">Satisfaction Rate</div>
            </div>
            <div className="space-y-2">
              <div className="text-3xl md:text-4xl font-bold text-purple-600">2M+</div>
              <div className="text-gray-600">Moments Tracked</div>
            </div>
            <div className="space-y-2">
              <div className="text-3xl md:text-4xl font-bold text-pink-600">24/7</div>
              <div className="text-gray-600">AI Support</div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="container mx-auto px-4 py-16 bg-gradient-to-br from-gray-50 to-slate-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <Badge className="mb-6 bg-slate-100 text-slate-700 hover:bg-slate-100">
              <Users className="h-4 w-4 mr-1" />
              Success Stories
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Loved by Thousands of Couples
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Real stories from real people who transformed their relationships with Kindra's AI-powered insights.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="border-0 shadow-lg bg-white/80 backdrop-blur-sm hover:shadow-xl transition-all duration-300">
                <CardContent className="p-6">
                  <div className="flex items-center gap-1 mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <p className="text-gray-700 mb-6 leading-relaxed text-lg">
                    "{testimonial.content}"
                  </p>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full flex items-center justify-center text-white font-semibold text-lg">
                      {testimonial.name.charAt(0)}
                    </div>
                    <div>
                      <div className="font-semibold text-lg">{testimonial.name}</div>
                      <div className="text-sm text-gray-600">{testimonial.role}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          
          <div className="text-center mt-12">
            <Button 
              size="lg" 
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-8 py-3"
              onClick={handleGetStarted}
            >
              Join Thousands of Happy Couples
              <Heart className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Simple, Transparent Pricing
            </h2>
            <p className="text-xl text-gray-600 mb-8">
              Start free, upgrade when you're ready for unlimited relationship growth
            </p>
            
            <div className="flex items-center justify-center gap-4 mb-8">
              <span className={`font-medium ${selectedPlan === 'monthly' ? 'text-purple-600' : 'text-gray-500'}`}>
                Monthly
              </span>
              <button
                onClick={() => setSelectedPlan(selectedPlan === 'monthly' ? 'annual' : 'monthly')}
                className="relative w-12 h-6 bg-gray-200 rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
              >
                <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${selectedPlan === 'annual' ? 'transform translate-x-6 bg-purple-600' : ''}`} />
              </button>
              <span className={`font-medium ${selectedPlan === 'annual' ? 'text-purple-600' : 'text-gray-500'}`}>
                Annual
              </span>
              {selectedPlan === 'annual' && (
                <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
                  Save 33%
                </Badge>
              )}
            </div>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8">
            {pricingPlans.map((plan, index) => (
              <Card key={index} className={`relative border-2 ${plan.popular ? 'border-slate-500 shadow-2xl scale-105' : 'border-gray-200 shadow-lg'} bg-white`}>
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-gradient-to-r from-slate-700 to-gray-800 text-white px-4 py-1">
                      <Zap className="h-3 w-3 mr-1" />
                      Most Popular
                    </Badge>
                  </div>
                )}
                
                <CardContent className="p-8">
                  <div className="text-center mb-8">
                    <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                    <p className="text-gray-600 mb-4">{plan.description}</p>
                    <div className="mb-2">
                      {plan.originalPrice && (
                        <span className="text-gray-400 line-through text-lg mr-2">{plan.originalPrice}</span>
                      )}
                      <span className="text-4xl font-bold">{plan.price}</span>
                    </div>
                    <p className="text-gray-500">{plan.period}</p>
                  </div>
                  
                  <ul className="space-y-3 mb-8">
                    {plan.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-center gap-3">
                        <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                        <span className="text-gray-700">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  
                  <Button 
                    className={`w-full ${plan.popular 
                      ? 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700' 
                      : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                    }`}
                    onClick={plan.name === 'Free' ? handleGetStarted : handlePremiumSignup}
                  >
                    {plan.cta}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto text-center">
          <Card className="border-0 shadow-2xl bg-gradient-to-br from-slate-700 via-gray-800 to-slate-900 text-white">
            <CardContent className="p-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-6">
                Ready to Transform Your Relationships?
              </h2>
              <p className="text-xl mb-8 opacity-90">
                Join thousands of users who have already discovered the power of AI-driven relationship intelligence.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button 
                  size="lg" 
                  onClick={handleGetStarted}
                  className="bg-white text-slate-700 hover:bg-gray-100 text-lg px-8 py-6 rounded-xl"
                >
                  Start Your Free Journey
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
                <Button 
                  variant="outline" 
                  size="lg"
                  onClick={handlePremiumSignup}
                  className="border-white text-white hover:bg-white/10 text-lg px-8 py-6 rounded-xl"
                >
                  View Premium Features
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="container mx-auto px-4 py-12 border-t border-gray-200">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="flex items-center gap-2 mb-4 md:mb-0">
              <div className="w-8 h-8 bg-gradient-to-br from-purple-600 to-pink-600 rounded-lg flex items-center justify-center">
                <Heart className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                Kindra
              </span>
            </div>
            
            <div className="flex items-center gap-6 text-sm text-gray-500">
              <button onClick={() => setLocation('/privacy')} className="hover:text-gray-700 transition-colors">Privacy Policy</button>
              <button onClick={() => setLocation('/terms')} className="hover:text-gray-700 transition-colors">Terms of Service</button>
              <button onClick={() => setLocation('/settings')} className="hover:text-gray-700 transition-colors">Support</button>
            </div>
          </div>
          
          <div className="text-center mt-8 pt-8 border-t border-gray-100">
            <p className="text-gray-500">
              © 2025 Kindra. All rights reserved. Transform your relationships with AI-powered insights.
            </p>
          </div>
        </div>
      </footer>

      {/* Pricing Modal */}
      <PricingModal 
        isOpen={showPricingModal} 
        onClose={() => setShowPricingModal(false)} 
      />
    </div>
  );
}