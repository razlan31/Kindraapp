import React, { useState, useRef, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Send, Loader2, Clock, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';

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
      queryClient.invalidateQueries({ queryKey: ['/api/chat/conversations'] });
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
      queryClient.invalidateQueries({ queryKey: ['/api/ai/conversation'] });
      queryClient.invalidateQueries({ queryKey: ['/api/chat/conversations'] });
      toast({ title: "New conversation started" });
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
          <h1 className="text-lg font-medium text-gray-900 dark:text-white">Luna</h1>
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
        <div className="border-b border-gray-100 dark:border-gray-800 p-4">
          <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
            <h3 className="font-medium mb-3 text-gray-900 dark:text-white">Recent conversations</h3>
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