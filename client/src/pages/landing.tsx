import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Heart, Brain, Calendar, TrendingUp, Star, Check, ArrowRight, Users, Shield, Sparkles, Moon, Sun, Zap, Play } from 'lucide-react';
import { useLocation } from 'wouter';
import { AnimatedFeatures } from '@/components/animated-features';

export default function LandingPage() {
  const [, setLocation] = useLocation();
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'annual'>('monthly');

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
      cta: "Get Started Free",
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
      cta: "Start Premium Trial",
      popular: true
    }
  ];

  const handleGetStarted = () => {
    setLocation('/login');
  };

  const handlePremiumSignup = () => {
    setLocation('/subscription');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-indigo-50">
      {/* Header */}
      <header className="container mx-auto px-4 py-6">
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
      <section className="container mx-auto px-4 py-16 text-center">
        <div className="max-w-4xl mx-auto">
          <Badge className="mb-6 bg-purple-100 text-purple-700 hover:bg-purple-100">
            <Sparkles className="h-4 w-4 mr-1" />
            AI-Powered Relationship Intelligence
          </Badge>
          
          <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-purple-600 via-pink-600 to-indigo-600 bg-clip-text text-transparent leading-tight">
            Transform Your Love Life with AI
          </h1>
          
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto leading-relaxed">
            Meet Luna AI, your personal relationship coach. Track patterns, understand emotions, and build deeper connections with the power of artificial intelligence.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
            <Button 
              size="lg" 
              onClick={handleGetStarted}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-lg px-8 py-6 rounded-xl"
            >
              Start Free Today
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button 
              variant="outline" 
              size="lg"
              onClick={handlePremiumSignup}
              className="text-lg px-8 py-6 rounded-xl border-purple-200 text-purple-700 hover:bg-purple-50"
            >
              View Pricing
            </Button>
          </div>
          
          <div className="flex items-center justify-center gap-6 text-sm text-gray-500">
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
      </section>

      {/* Interactive Features Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="max-w-6xl mx-auto">
          <AnimatedFeatures />
        </div>
      </section>

      {/* Video Demo Section */}
      <section className="container mx-auto px-4 py-16 bg-gradient-to-br from-purple-50 to-pink-50">
        <div className="max-w-4xl mx-auto text-center">
          <Badge className="mb-6 bg-purple-100 text-purple-700 hover:bg-purple-100">
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
            <div className="bg-white rounded-xl p-8 text-left">
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
      <section className="container mx-auto px-4 py-16 bg-white/50">
        <div className="max-w-6xl mx-auto">
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
              <Card key={index} className="p-6 border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-white/70 backdrop-blur-sm">
                <CardContent className="p-0">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-100 to-pink-100 rounded-lg flex items-center justify-center mb-4 text-purple-600">
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
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
              <div className="bg-gradient-to-br from-indigo-100 to-purple-100 rounded-2xl p-8">
                <div className="bg-white rounded-xl p-6 shadow-lg">
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

      {/* Testimonials */}
      <section className="container mx-auto px-4 py-16">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Loved by Thousands of Users
            </h2>
            <p className="text-xl text-gray-600">
              Real stories from people who transformed their relationships with Kindra
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="border-0 shadow-lg bg-white/70 backdrop-blur-sm">
                <CardContent className="p-6">
                  <div className="flex items-center gap-1 mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <p className="text-gray-700 mb-4 leading-relaxed">
                    "{testimonial.content}"
                  </p>
                  <div>
                    <div className="font-semibold">{testimonial.name}</div>
                    <div className="text-sm text-gray-500">{testimonial.role}</div>
                  </div>
                </CardContent>
              </Card>
            ))}
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
              <Card key={index} className={`relative border-2 ${plan.popular ? 'border-purple-500 shadow-2xl scale-105' : 'border-gray-200 shadow-lg'} bg-white`}>
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 py-1">
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
          <Card className="border-0 shadow-2xl bg-gradient-to-br from-purple-600 via-pink-600 to-indigo-600 text-white">
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
                  className="bg-white text-purple-600 hover:bg-gray-100 text-lg px-8 py-6 rounded-xl"
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
              <a href="#" className="hover:text-gray-700 transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-gray-700 transition-colors">Terms of Service</a>
              <a href="#" className="hover:text-gray-700 transition-colors">Support</a>
            </div>
          </div>
          
          <div className="text-center mt-8 pt-8 border-t border-gray-100">
            <p className="text-gray-500">
              © 2025 Kindra. All rights reserved. Transform your relationships with AI-powered insights.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}