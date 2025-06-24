import React, { useState, useRef, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Send, Loader2, Clock, Plus, Trash2, MessageCircle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

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

  // Auto-focus textarea
  useEffect(() => {
    if (textareaRef.current && conversation.length === 0) {
      textareaRef.current.focus();
    }
  }, [conversation.length]);

  // Load conversation data
  const { data: conversationData } = useQuery({
    queryKey: ['/api/ai/conversation'],
    staleTime: 1000 * 60 * 5,
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

  // Load saved conversations
  const { data: savedConversations } = useQuery({
    queryKey: ['/api/chat/conversations'],
    staleTime: 1000 * 60 * 5,
  });

  // Chat mutation
  const chatMutation = useMutation({
    mutationFn: async (message: string) => {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message }),
      });
      if (!response.ok) throw new Error('Failed to send message');
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
    <div className="h-screen flex flex-col bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 relative">
      {/* Modern Header */}
      <div className="flex items-center justify-between p-6 backdrop-blur-sm bg-white/80 dark:bg-gray-900/80 border-b border-gray-200/50 dark:border-gray-700/50">
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-violet-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-lg">
              <span className="text-white text-lg font-semibold">L</span>
            </div>
            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white dark:border-gray-900 animate-pulse"></div>
          </div>
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">Luna</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">Your relationship companion</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="group p-3 rounded-xl hover:bg-gray-100/80 dark:hover:bg-gray-800/80 transition-all duration-200 hover:scale-105"
          >
            <Clock className="h-5 w-5 text-gray-600 dark:text-gray-400 group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors" />
          </button>
          
          <button
            onClick={() => newChatMutation.mutate()}
            disabled={newChatMutation.isPending}
            className="group p-3 rounded-xl bg-gradient-to-r from-violet-500 to-purple-500 hover:from-violet-600 hover:to-purple-600 transition-all duration-200 hover:scale-105 shadow-lg hover:shadow-xl disabled:opacity-50"
          >
            <Plus className="h-5 w-5 text-white" />
          </button>
        </div>
      </div>

      {/* Modern History Sidebar */}
      {showHistory && (
        <div className="absolute right-0 top-0 h-full w-80 bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border-l border-gray-200/50 dark:border-gray-700/50 shadow-2xl z-10">
          <div className="p-6 border-b border-gray-200/50 dark:border-gray-700/50">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Chat History</h2>
              <button
                onClick={() => setShowHistory(false)}
                className="p-2 rounded-xl hover:bg-gray-100/80 dark:hover:bg-gray-800/80 transition-all duration-200 hover:scale-105"
              >
                <X className="h-5 w-5 text-gray-600 dark:text-gray-400" />
              </button>
            </div>
          </div>
          
          <div className="p-4 space-y-3 overflow-y-auto h-full pb-24">
            {savedConversations && Array.isArray(savedConversations) && savedConversations.length > 0 ? (
              savedConversations.map((conv: SavedConversation, index) => (
                <div key={conv.id} className="relative group">
                  <button
                    onClick={() => loadConversation(conv)}
                    className="w-full text-left p-4 rounded-2xl hover:bg-gradient-to-r hover:from-violet-50 hover:to-purple-50 dark:hover:from-violet-900/20 dark:hover:to-purple-900/20 transition-all duration-200 border border-transparent hover:border-violet-200 dark:hover:border-violet-800 hover:shadow-md"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold text-gray-900 dark:text-white truncate mb-1">
                          {conv.title}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {format(new Date(conv.createdAt), 'MMM d, HH:mm')}
                        </div>
                      </div>
                      <div className="ml-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        <button
                          onClick={(e) => deleteConversation(conv.id, e)}
                          className="p-1.5 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </button>
                  {index < savedConversations.length - 1 && (
                    <div className="absolute bottom-0 left-4 right-4 h-px bg-gradient-to-r from-transparent via-gray-200 dark:via-gray-700 to-transparent"></div>
                  )}
                </div>
              ))
            ) : (
              <div className="text-center py-12">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-100 to-purple-100 dark:from-violet-900/30 dark:to-purple-900/30 flex items-center justify-center mx-auto mb-4">
                  <MessageCircle className="h-8 w-8 text-violet-500 dark:text-violet-400" />
                </div>
                <p className="text-gray-500 dark:text-gray-400 font-medium">No conversations yet</p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Start chatting to see your history</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto">
        {conversation.length === 0 ? (
          <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-violet-500 to-pink-500 flex items-center justify-center mb-6">
              <span className="text-white text-lg font-semibold">L</span>
            </div>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">
              How can I help you today?
            </h2>
            <p className="text-gray-600 dark:text-gray-400 max-w-md text-sm leading-relaxed">
              I'm Luna, your relationship coach. Ask me anything about your relationships, dating, or personal connections.
            </p>
          </div>
        ) : (
          <div className="p-4 space-y-8">
            {conversation.map((msg, index) => (
              <div key={index} className="max-w-none">
                {msg.role === 'user' ? (
                  <div className="flex justify-end">
                    <div className="bg-gray-900 dark:bg-gray-700 text-white rounded-3xl rounded-br-lg px-6 py-3 max-w-[80%]">
                      <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                    </div>
                  </div>
                ) : (
                  <div className="flex gap-4">
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-500 to-pink-500 flex items-center justify-center flex-shrink-0 mt-1">
                      <span className="text-white text-xs font-semibold">L</span>
                    </div>
                    <div className="flex-1">
                      <div className="prose prose-sm dark:prose-invert max-w-none">
                        <p className="text-gray-900 dark:text-gray-100 leading-relaxed whitespace-pre-wrap text-base">
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
      <div className="border-t border-gray-100 dark:border-gray-800 p-4">
        <form onSubmit={handleSubmit} className="max-w-4xl mx-auto">
          <div className="relative">
            <Textarea
              ref={textareaRef}
              value={message}
              onChange={(e) => {
                setMessage(e.target.value);
                e.target.style.height = 'auto';
                e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
              }}
              onKeyDown={handleKeyDown}
              placeholder="Ask Luna anything about your relationships..."
              className="min-h-[60px] max-h-[120px] resize-none pr-14 border-gray-200 dark:border-gray-700 focus:border-violet-500 dark:focus:border-violet-400 rounded-2xl bg-gray-50 dark:bg-gray-900 text-base leading-relaxed"
              disabled={chatMutation.isPending}
            />
            <Button
              type="submit"
              disabled={!message.trim() || chatMutation.isPending}
              className="absolute right-3 bottom-3 h-10 w-10 p-0 bg-violet-600 hover:bg-violet-700 disabled:bg-gray-300 dark:disabled:bg-gray-600 rounded-xl"
            >
              {chatMutation.isPending ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Send className="h-5 w-5" />
              )}
            </Button>
          </div>
          
          {chatMutation.isPending && (
            <div className="flex items-center gap-2 mt-3 text-gray-500 dark:text-gray-400 text-sm">
              <Loader2 className="h-4 w-4 animate-spin" />
              Luna is thinking...
            </div>
          )}
        </form>
      </div>
    </div>
  );
}