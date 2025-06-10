import { useState, useEffect, useRef } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Loader2, Send, MessageCircle, Trash2, Heart, Sparkles, Plus, History, Download } from "lucide-react";
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
  const [savedConversations, setSavedConversations] = useState<{id: string, title: string, messages: ChatMessage[], timestamp: Date}[]>([]);
  const [showHistory, setShowHistory] = useState(false);
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
    
    // Load saved conversations from localStorage
    const saved = localStorage.getItem('ai-chat-history');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setSavedConversations(parsed.map((conv: any) => ({
          ...conv,
          timestamp: new Date(conv.timestamp),
          messages: conv.messages.map((msg: any) => ({
            ...msg,
            timestamp: new Date(msg.timestamp)
          }))
        })));
      } catch (error) {
        console.error('Failed to load chat history:', error);
      }
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

  // Save current conversation to history
  const saveConversation = () => {
    if (conversation.length === 0) return;
    
    const title = conversation.length > 0 
      ? conversation[0].content.substring(0, 50) + (conversation[0].content.length > 50 ? '...' : '')
      : 'New Conversation';
    
    const newSaved = {
      id: Date.now().toString(),
      title,
      messages: [...conversation],
      timestamp: new Date()
    };
    
    const updated = [newSaved, ...savedConversations].slice(0, 10); // Keep max 10 conversations
    setSavedConversations(updated);
    localStorage.setItem('ai-chat-history', JSON.stringify(updated));
    
    toast({
      title: "Conversation saved",
      description: "Your chat has been saved to history."
    });
  };

  // Start a new chat
  const startNewChat = () => {
    if (conversation.length > 0) {
      saveConversation();
    }
    clearMutation.mutate();
  };

  // Load a conversation from history
  const loadConversation = (savedConv: any) => {
    clearMutation.mutate();
    setTimeout(() => {
      setConversation(savedConv.messages);
      setShowHistory(false);
      toast({
        title: "Conversation loaded",
        description: "Previous chat has been restored."
      });
    }, 100);
  };

  // Download conversation as text
  const downloadConversation = () => {
    if (conversation.length === 0) {
      toast({
        title: "No conversation to download",
        description: "Start a conversation first.",
        variant: "destructive"
      });
      return;
    }
    
    const formatDate = (date: Date) => {
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    };
    
    let text = `Luna AI Relationship Coach - Conversation Export\n`;
    text += `Exported on: ${formatDate(new Date())}\n`;
    text += `Total messages: ${conversation.length}\n`;
    text += `\n${'='.repeat(50)}\n\n`;
    
    conversation.forEach((msg, index) => {
      const speaker = msg.role === 'user' ? 'You' : 'Luna';
      text += `[${formatDate(msg.timestamp)}] ${speaker}:\n`;
      text += `${msg.content}\n\n`;
      
      if (index < conversation.length - 1) {
        text += `${'-'.repeat(30)}\n\n`;
      }
    });
    
    text += `\n${'='.repeat(50)}\n`;
    text += `End of conversation export`;
    
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `luna-chat-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    toast({
      title: "Conversation downloaded",
      description: "Your chat has been saved as a text file."
    });
  };

  // Delete a saved conversation
  const deleteSavedConversation = (id: string) => {
    const updated = savedConversations.filter(conv => conv.id !== id);
    setSavedConversations(updated);
    localStorage.setItem('ai-chat-history', JSON.stringify(updated));
    
    toast({
      title: "Conversation deleted",
      description: "Chat removed from history."
    });
  };



  const formatTimestamp = (timestamp: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    }).format(timestamp);
  };

  return (
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-2xl p-6 border border-blue-100 dark:border-blue-800">
      {/* Modern Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-xl">
          <MessageCircle className="h-5 w-5 text-white" />
        </div>
        <div>
          <h3 className="font-semibold text-lg bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            Luna - Your Relationship Coach
          </h3>
          <p className="text-sm text-muted-foreground">
            Warm, wise guidance for meaningful connections
          </p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          {/* New Chat Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={startNewChat}
            disabled={clearMutation.isPending}
            className="h-8 px-3 text-muted-foreground hover:text-blue-600 transition-colors"
            title="Start new chat"
          >
            <Plus className="h-4 w-4 mr-1" />
            New
          </Button>
          
          {/* History Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowHistory(!showHistory)}
            className="h-8 px-3 text-muted-foreground hover:text-blue-600 transition-colors"
            title="Chat history"
          >
            <History className="h-4 w-4 mr-1" />
            History
          </Button>
          
          {/* Download Button */}
          {conversation.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={downloadConversation}
              className="h-8 px-3 text-muted-foreground hover:text-green-600 transition-colors"
              title="Download conversation"
            >
              <Download className="h-4 w-4 mr-1" />
              Export
            </Button>
          )}
          
          {/* Clear Button */}
          {conversation.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => clearMutation.mutate()}
              disabled={clearMutation.isPending}
              className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive transition-colors"
              title="Clear current chat"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* History Panel */}
      {showHistory && (
        <div className="mb-4 bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm rounded-xl border border-white/50 dark:border-gray-800/50 overflow-hidden shadow-lg">
          <div className="p-4 border-b border-gray-100 dark:border-gray-800">
            <h4 className="font-medium text-gray-900 dark:text-gray-100">Chat History</h4>
            <p className="text-sm text-muted-foreground">Your recent conversations with Luna</p>
          </div>
          <div className="max-h-60 overflow-y-auto">
            {savedConversations.length === 0 ? (
              <div className="p-8 text-center">
                <History className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                <p className="text-sm text-gray-500 dark:text-gray-400">No saved conversations yet</p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Start chatting to build your history</p>
              </div>
            ) : (
              <div className="p-2 space-y-1">
                {savedConversations.map((conv) => (
                  <div
                    key={conv.id}
                    className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors group"
                  >
                    <div 
                      className="flex-1 cursor-pointer"
                      onClick={() => loadConversation(conv)}
                    >
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                        {conv.title}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {conv.timestamp.toLocaleDateString()} • {conv.messages.length} messages
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteSavedConversation(conv.id)}
                      className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Enhanced Chat Container */}
      <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm rounded-xl border border-white/50 dark:border-gray-800/50 overflow-hidden shadow-lg">
        {/* Messages */}
        <div className="h-80 overflow-y-auto p-4 space-y-4">
          {conversation.length === 0 ? (
            <div className="text-center py-12">
              <div className="relative mb-4">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-200 to-indigo-200 dark:from-blue-700 dark:to-indigo-700 rounded-full opacity-20 animate-pulse"></div>
                <div className="relative w-16 h-16 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 flex items-center justify-center mx-auto">
                  <Sparkles className="h-8 w-8 text-white" />
                </div>
              </div>
              <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed max-w-sm mx-auto">
                Hi! I'm Luna, your personal relationship coach. I analyze your relationship patterns to help you build deeper connections and navigate challenges with wisdom and care. What would you like to explore together?
              </p>
            </div>
          ) : (
            conversation.map((msg, index) => (
              <div
                key={index}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2 duration-300`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-3 shadow-sm ${
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