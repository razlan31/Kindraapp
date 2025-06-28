import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Heart, TrendingUp, Brain, Sparkles } from 'lucide-react';

export function AnimatedFeatures() {
  const [activeFeature, setActiveFeature] = useState(0);

  const features = [
    {
      icon: <Brain className="h-8 w-8" />,
      title: "Luna AI Coach",
      description: "24/7 personal relationship expert powered by advanced AI",
      demo: (
        <div className="bg-white rounded-lg p-4 shadow-lg">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
              <span className="text-white text-sm font-semibold">L</span>
            </div>
            <div>
              <div className="font-medium text-sm">Luna AI</div>
              <div className="text-xs text-gray-500">Online</div>
            </div>
          </div>
          <div className="space-y-2">
            <div className="bg-gray-100 rounded-lg p-2 text-xs">
              I've noticed some communication patterns in your recent moments. Would you like some personalized advice?
            </div>
            <div className="bg-purple-100 rounded-lg p-2 text-xs ml-4">
              Yes, I'd love some help!
            </div>
          </div>
        </div>
      )
    },
    {
      icon: <Heart className="h-8 w-8" />,
      title: "Cycle Intelligence",
      description: "Understand how your cycle affects emotions and relationships",
      demo: (
        <div className="bg-white rounded-lg p-4 shadow-lg">
          <div className="text-sm font-medium mb-3">Today's Insights</div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs">Cycle Day</span>
              <span className="text-xs font-medium">14 (Ovulation)</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-1.5">
              <div className="bg-pink-500 h-1.5 rounded-full" style={{ width: '50%' }}></div>
            </div>
            <div className="text-xs text-gray-600 mt-2">
              🌸 Peak communication energy - great time for important conversations
            </div>
          </div>
        </div>
      )
    },
    {
      icon: <TrendingUp className="h-8 w-8" />,
      title: "Relationship Analytics",
      description: "Beautiful insights into your relationship patterns and growth",
      demo: (
        <div className="bg-white rounded-lg p-4 shadow-lg">
          <div className="text-sm font-medium mb-3">This Month</div>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs">Connection Score</span>
              <span className="text-xs font-medium text-green-600">↗ +12%</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs">Communication</span>
              <span className="text-xs font-medium text-blue-600">8.4/10</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs">Moments Tracked</span>
              <span className="text-xs font-medium">23</span>
            </div>
          </div>
        </div>
      )
    }
  ];

  return (
    <div className="grid lg:grid-cols-2 gap-12 items-center">
      <div>
        <Badge className="mb-6 bg-purple-100 text-purple-700 hover:bg-purple-100">
          <Sparkles className="h-4 w-4 mr-1" />
          Interactive Features
        </Badge>
        
        <h2 className="text-3xl md:text-4xl font-bold mb-6">
          See Kindra in Action
        </h2>
        
        <p className="text-xl text-gray-600 mb-8 leading-relaxed">
          Experience how AI-powered relationship intelligence can transform your love life with real-time insights and personalized guidance.
        </p>
        
        <div className="space-y-4">
          {features.map((feature, index) => (
            <Card 
              key={index}
              className={`cursor-pointer transition-all duration-300 hover:shadow-lg ${
                activeFeature === index 
                  ? 'border-purple-500 shadow-lg bg-purple-50' 
                  : 'border-gray-200 hover:border-purple-300'
              }`}
              onClick={() => setActiveFeature(index)}
            >
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    activeFeature === index 
                      ? 'bg-purple-500 text-white' 
                      : 'bg-gray-100 text-gray-600'
                  }`}>
                    {feature.icon}
                  </div>
                  <div>
                    <h3 className="font-semibold">{feature.title}</h3>
                    <p className="text-sm text-gray-600">{feature.description}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
      
      <div className="relative">
        <div className="bg-gradient-to-br from-purple-100 to-pink-100 rounded-2xl p-8 min-h-[400px] flex items-center justify-center">
          <div className="w-full max-w-sm">
            {features[activeFeature].demo}
          </div>
        </div>
        
        <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center shadow-lg">
          <span className="text-white font-bold text-lg">AI</span>
        </div>
      </div>
    </div>
  );
}