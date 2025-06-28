import React, { useState, useRef, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Send, Loader2, Clock, Plus, Trash2, Crown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/auth-context';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface SavedConversation {
  id: number;
  title: string;
  messages: string;
  createdAt: string;
}

export default function AIChat() {
  const [message, setMessage] = useState('');
  const [conversation, setConversation] = useState<ChatMessage[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  // Auto-focus textarea
  useEffect(() => {
    if (textareaRef.current && conversation.length === 0) {
      textareaRef.current.focus();
    }
  }, [conversation.length]);

  // Load conversation data
  const { data: conversationData } = useQuery({
    queryKey: ['/api/ai/conversation'],
    staleTime: 1000 * 60 * 10,
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    if (conversationData?.conversation) {
      console.log("Loading conversation data:", conversationData);
      const formattedMessages = conversationData.conversation.map((msg: any) => ({
        ...msg,
        timestamp: new Date(msg.timestamp)
      }));
      setConversation(formattedMessages);
      console.log("Setting conversation from API:", formattedMessages);
    }
  }, [conversationData]);

  // Load saved conversations with lazy loading
  const { data: savedConversations } = useQuery({
    queryKey: ['/api/chat/conversations'],
    staleTime: 20 * 60 * 1000, // 20 minutes
    refetchOnWindowFocus: false,
    enabled: showHistory, // Only load when history panel is opened
  });

  // Chat mutation
  const chatMutation = useMutation({
    mutationFn: async (message: string) => {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message }),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        if (response.status === 403) {
          throw new Error(errorData.message || 'AI coaching limit reached');
        }
        throw new Error(errorData.message || 'Failed to send message');
      }
      return response.json();
    },
    onSuccess: (data) => {
      const newMessages = [
        ...conversation,
        { role: 'user' as const, content: message, timestamp: new Date() },
        { role: 'assistant' as const, content: data.response, timestamp: new Date() }
      ];
      setConversation(newMessages);
      setMessage('');
      queryClient.invalidateQueries({ queryKey: ['/api/ai/conversation'] });
      
      // Refresh conversation history only after complete exchange (to show new conversation)
      if (newMessages.length === 2) {
        setTimeout(() => {
          queryClient.invalidateQueries({ queryKey: ['/api/chat/conversations'] });
        }, 500); // Small delay to ensure the save completes first
      }
    },
    onError: (error: Error) => {
      if (error.message.includes('limit')) {
        toast({
          title: "AI Coaching Limit Reached",
          description: "You've used all 3 free AI coaching messages this month. Upgrade to Premium for unlimited access.",
          variant: "destructive",
          duration: 6000,
        });
      } else {
        toast({
          title: "Message Failed",
          description: error.message || "Failed to send message. Please try again.",
          variant: "destructive",
        });
      }
    },
  });

  // New chat mutation
  const newChatMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/ai/conversation/new', { method: 'POST' });
      if (!response.ok) throw new Error('Failed to start new chat');
      return response.json();
    },
    onSuccess: () => {
      setConversation([]);
      // Immediately refresh both conversation and history
      queryClient.invalidateQueries({ queryKey: ['/api/ai/conversation'] });
      queryClient.invalidateQueries({ queryKey: ['/api/chat/conversations'] });
      toast({ 
        title: "New conversation started",
        description: "Conversation saved to history"
      });
    }
  });

  // Load conversation mutation
  const loadConversationMutation = useMutation({
    mutationFn: async (conversationId: number) => {
      const response = await fetch(`/api/ai/conversation/load/${conversationId}`, { method: 'POST' });
      if (!response.ok) throw new Error('Failed to load conversation');
      return response.json();
    },
    onSuccess: (result: { conversation: any[] }) => {
      const parsedMessages = result.conversation.map((msg: any) => ({
        ...msg,
        timestamp: new Date(msg.timestamp)
      }));
      setConversation(parsedMessages);
      setShowHistory(false);
      queryClient.invalidateQueries({ queryKey: ['/api/ai/conversation'] });
      toast({ title: "Conversation loaded" });
    },
  });

  // Delete conversation mutation
  const deleteConversationMutation = useMutation({
    mutationFn: async (conversationId: number) => {
      const response = await fetch(`/api/chat/conversations/${conversationId}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Failed to delete conversation');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/chat/conversations'] });
      toast({ title: "Conversation deleted" });
    }
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [conversation]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || chatMutation.isPending) return;
    chatMutation.mutate(message.trim());
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const loadConversation = (conv: SavedConversation) => {
    loadConversationMutation.mutate(conv.id);
  };

  const deleteConversation = (conversationId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    deleteConversationMutation.mutate(conversationId);
  };

  return (
    <div className="max-w-4xl mx-auto min-h-screen bg-white dark:bg-black">
      {/* Simple Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-800">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-500 to-pink-500 flex items-center justify-center">
            <span className="text-white text-xs font-semibold">L</span>
          </div>
          <h1 className="text-lg font-medium text-gray-900 dark:text-white">Luna AI</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={() => setShowHistory(!showHistory)}
            variant="ghost"
            size="sm"
            className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
          >
            <Clock className="h-4 w-4 mr-1" />
            History
          </Button>
          <Button
            onClick={() => newChatMutation.mutate()}
            disabled={newChatMutation.isPending}
            variant="ghost"
            size="sm"
            className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
          >
            <Plus className="h-4 w-4 mr-1" />
            New
          </Button>
        </div>
      </div>

      {/* History Panel */}
      {showHistory && (
        <div className="border-b border-gray-100 dark:border-gray-800 p-3 sm:p-4 lg:p-6">
          <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 sm:p-5 lg:p-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-medium text-gray-900 dark:text-white">Recent conversations</h3>
              <Button
                onClick={() => {
                  setShowHistory(false);
                  queryClient.invalidateQueries({ queryKey: ['/api/ai/conversation'] });
                }}
                variant="ghost"
                size="sm"
                className="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                Current chat
              </Button>
            </div>
            {savedConversations && Array.isArray(savedConversations) && savedConversations.length > 0 ? (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {savedConversations.map((conv: SavedConversation) => (
                  <div
                    key={conv.id}
                    className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
                    onClick={() => loadConversation(conv)}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm text-gray-900 dark:text-white truncate">{conv.title}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {new Date(conv.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => deleteConversation(conv.id, e)}
                      className="h-8 w-8 p-0 text-gray-400 hover:text-red-500"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 dark:text-gray-400 text-center py-8 text-sm">No conversations yet</p>
            )}
          </div>
        </div>
      )}

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto">
        {conversation.length === 0 ? (
          <div className="flex flex-col items-center justify-center min-h-[55vh] sm:min-h-[65vh] lg:min-h-[70vh] p-6 sm:p-8 lg:p-12 text-center">
            <div className="w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 rounded-full bg-gradient-to-br from-violet-500 to-pink-500 flex items-center justify-center mb-6 sm:mb-8 lg:mb-10">
              <span className="text-white text-lg sm:text-xl lg:text-2xl font-semibold">L</span>
            </div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-semibold text-gray-900 dark:text-white mb-3 lg:mb-4">
              How can I help you today?
            </h2>
            <p className="text-gray-600 dark:text-gray-400 max-w-sm sm:max-w-md lg:max-w-lg text-sm sm:text-base lg:text-lg leading-relaxed px-4">
              Meet Luna AI, the most powerful relationship AI assistant. I'm here to transform your love life with personalized insights, expert guidance, and deep understanding of your unique relationship patterns.
            </p>
          </div>
        ) : (
          <div className="p-3 sm:p-4 lg:p-6 space-y-6 sm:space-y-8 lg:space-y-10">
            {conversation.map((msg, index) => (
              <div key={index} className="max-w-none">
                {msg.role === 'user' ? (
                  <div className="flex justify-end">
                    <div className="bg-gray-900 dark:bg-gray-700 text-white rounded-3xl rounded-br-lg px-4 sm:px-6 lg:px-8 py-3 sm:py-4 lg:py-5 max-w-[80%] sm:max-w-[75%] lg:max-w-[70%]">
                      <p className="text-sm sm:text-base lg:text-lg leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                    </div>
                  </div>
                ) : (
                  <div className="flex gap-3 sm:gap-4 lg:gap-5">
                    <div className="w-8 h-8 sm:w-9 sm:h-9 lg:w-10 lg:h-10 rounded-full bg-gradient-to-br from-violet-500 to-pink-500 flex items-center justify-center flex-shrink-0 mt-1">
                      <span className="text-white text-sm sm:text-base lg:text-lg font-semibold">L</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="prose prose-sm sm:prose-base lg:prose-lg dark:prose-invert max-w-none">
                        <p className="text-gray-900 dark:text-gray-100 leading-relaxed whitespace-pre-wrap text-sm sm:text-base lg:text-lg">
                          {msg.content}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="border-t border-gray-100 dark:border-gray-800 p-3 sm:p-4 lg:p-6">
        {/* AI Coaching Limit Warning */}
        {user && (user.monthlyAiCoaching ?? 0) >= 3 && user.subscriptionStatus === 'free' && (
          <div className="max-w-4xl mx-auto mb-4 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
            <div className="flex items-center gap-3">
              <Crown className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              <div className="flex-1">
                <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                  AI Coaching Limit Reached
                </p>
                <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">
                  You've used all 3 free AI coaching messages this month. Upgrade to Premium for unlimited access.
                </p>
              </div>
            </div>
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="max-w-4xl mx-auto">
          <div className="relative">
            <Textarea
              ref={textareaRef}
              value={message}
              onChange={(e) => {
                setMessage(e.target.value);
                e.target.style.height = 'auto';
                e.target.style.height = Math.min(e.target.scrollHeight, 160) + 'px';
              }}
              onKeyDown={handleKeyDown}
              placeholder={
                user && (user.monthlyAiCoaching ?? 0) >= 3 && user.subscriptionStatus === 'free' 
                  ? "Upgrade to Premium to continue chatting with Luna AI..."
                  : "Ask Luna AI anything about your relationships..."
              }
              className="min-h-[60px] sm:min-h-[70px] lg:min-h-[80px] max-h-[120px] sm:max-h-[140px] lg:max-h-[160px] resize-none pr-14 sm:pr-16 lg:pr-18 border-gray-200 dark:border-gray-700 focus:border-violet-500 dark:focus:border-violet-400 rounded-2xl lg:rounded-3xl bg-gray-50 dark:bg-gray-900 text-base sm:text-lg lg:text-xl leading-relaxed px-4 sm:px-5 lg:px-6 py-3 sm:py-4 lg:py-5"
              disabled={chatMutation.isPending || (user && (user.monthlyAiCoaching ?? 0) >= 3 && user.subscriptionStatus === 'free')}
            />
            <Button
              type="submit"
              disabled={!message.trim() || chatMutation.isPending || (user && (user.monthlyAiCoaching ?? 0) >= 3 && user.subscriptionStatus === 'free')}
              className="absolute right-3 sm:right-4 lg:right-5 bottom-3 sm:bottom-4 lg:bottom-5 h-8 w-8 sm:h-10 sm:w-10 lg:h-12 lg:w-12 p-0 bg-violet-600 hover:bg-violet-700 disabled:bg-gray-300 dark:disabled:bg-gray-600 rounded-xl lg:rounded-2xl"
            >
              {chatMutation.isPending ? (
                <Loader2 className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 animate-spin" />
              ) : (
                <Send className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6" />
              )}
            </Button>
          </div>
          
          {chatMutation.isPending && (
            <div className="flex items-center gap-2 mt-3 text-gray-500 dark:text-gray-400 text-sm">
              <Loader2 className="h-4 w-4 animate-spin" />
              Luna AI is thinking...
            </div>
          )}
        </form>
      </div>
    </div>
  );
}