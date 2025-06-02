import { useState, useEffect, useRef } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Loader2, Send, MessageCircle, Trash2, Heart, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface ConversationResponse {
  conversation: ChatMessage[];
}

interface ChatResponse {
  message: string;
  timestamp: string;
}

export function AIChat() {
  const [message, setMessage] = useState("");
  const [conversation, setConversation] = useState<ChatMessage[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Load conversation history
  const { data: conversationData } = useQuery({
    queryKey: ['/api/ai/conversation'],
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  useEffect(() => {
    if (conversationData && (conversationData as any).conversation) {
      setConversation((conversationData as any).conversation.map((msg: any) => ({
        ...msg,
        timestamp: new Date(msg.timestamp)
      })));
    }
  }, [conversationData]);

  // Chat mutation
  const chatMutation = useMutation({
    mutationFn: async (userMessage: string) => {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ message: userMessage })
      });
      if (!response.ok) throw new Error('Failed to send message');
      return response.json();
    },
    onSuccess: (data: any, userMessage) => {
      const newUserMessage: ChatMessage = {
        role: 'user',
        content: userMessage,
        timestamp: new Date()
      };
      const newAssistantMessage: ChatMessage = {
        role: 'assistant',
        content: data.message,
        timestamp: new Date(data.timestamp)
      };
      
      setConversation(prev => [...prev, newUserMessage, newAssistantMessage]);
      queryClient.invalidateQueries({ queryKey: ['/api/ai/conversation'] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive"
      });
    }
  });

  // Clear conversation mutation
  const clearMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/ai/conversation', {
        method: 'DELETE',
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to clear conversation');
      return response.json();
    },
    onSuccess: () => {
      setConversation([]);
      queryClient.invalidateQueries({ queryKey: ['/api/ai/conversation'] });
      toast({
        title: "Conversation cleared",
        description: "Your chat history has been reset."
      });
    }
  });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [conversation]);

  const handleSendMessage = async () => {
    if (!message.trim() || chatMutation.isPending) return;
    
    const userMessage = message.trim();
    setMessage("");
    
    // Auto-resize textarea
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
    
    chatMutation.mutate(userMessage);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };



  const formatTimestamp = (timestamp: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    }).format(timestamp);
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Minimalist Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-rose-400 to-pink-500 flex items-center justify-center">
            <Heart className="h-4 w-4 text-white" />
          </div>
          <h1 className="text-lg font-medium text-gray-900 dark:text-gray-100">Relationship Coach</h1>
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400 ml-11">
          Your personal guide to healthier relationships
        </p>
      </div>

      {/* Clean Chat Container */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden shadow-sm">
        {/* Minimal Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-50 dark:border-gray-800">
          <div className="flex items-center gap-2">
            <MessageCircle className="h-4 w-4 text-gray-400" />
            <span className="text-sm font-medium text-gray-600 dark:text-gray-300">Chat</span>
          </div>
          {conversation.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => clearMutation.mutate()}
              disabled={clearMutation.isPending}
              className="h-8 w-8 p-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          )}
        </div>

        {/* Messages */}
        <div className="h-80 overflow-y-auto p-6 space-y-6">
          {conversation.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-12 h-12 rounded-full bg-gray-50 dark:bg-gray-800 flex items-center justify-center mx-auto mb-4">
                <MessageCircle className="h-6 w-6 text-gray-400" />
              </div>
              <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed max-w-xs mx-auto">
                Hi! I'm here to help you understand your relationship patterns and build stronger connections. What's on your mind?
              </p>
            </div>
          ) : (
            conversation.map((msg, index) => (
              <div
                key={index}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                    msg.role === 'user'
                      ? 'bg-gradient-to-r from-rose-500 to-pink-500 text-white'
                      : 'bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100'
                  }`}
                >
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">
                    {msg.content}
                  </p>
                  <p className="text-xs opacity-60 mt-2">
                    {formatTimestamp(msg.timestamp)}
                  </p>
                </div>
              </div>
            ))
          )}
          
          {chatMutation.isPending && (
            <div className="flex justify-start">
              <div className="bg-gray-50 dark:bg-gray-800 rounded-2xl px-4 py-3 max-w-[85%]">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                  <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                  <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"></div>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="border-t border-gray-50 dark:border-gray-800 p-4">
          <div className="flex gap-3">
            <Textarea
              ref={textareaRef}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Share what's on your mind..."
              className="flex-1 min-h-[40px] max-h-28 resize-none border-0 bg-gray-50 dark:bg-gray-800 focus:ring-1 focus:ring-rose-200 dark:focus:ring-rose-800 rounded-xl text-sm"
              rows={1}
            />
            <Button
              onClick={handleSendMessage}
              disabled={!message.trim() || chatMutation.isPending}
              className="px-4 py-2 bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white border-0 rounded-xl shadow-sm"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}