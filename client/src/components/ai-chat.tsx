import { useState, useEffect, useRef } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Loader2, Send, MessageCircle, Trash2, Heart, Sparkles, Plus, History, Download } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
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

interface SavedConversation {
  id: number;
  userId: number;
  title: string;
  messages: ChatMessage[];
  createdAt: string;
  updatedAt: string;
}

export function AIChat() {
  const [message, setMessage] = useState("");
  const [conversation, setConversation] = useState<ChatMessage[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<number | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Load saved conversations
  const { data: savedConversations } = useQuery({
    queryKey: ['/api/chat/conversations'],
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Load conversation history from in-memory storage
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
        body: JSON.stringify({ message: userMessage }),
      });
      if (!response.ok) {
        throw new Error('Failed to send message');
      }
      return await response.json() as ChatResponse;
    },
    onSuccess: (response) => {
      const newUserMessage: ChatMessage = {
        role: 'user',
        content: message,
        timestamp: new Date()
      };
      
      const newAssistantMessage: ChatMessage = {
        role: 'assistant',
        content: response.message,
        timestamp: new Date(response.timestamp)
      };
      
      setConversation(prev => [...prev, newUserMessage, newAssistantMessage]);
      queryClient.invalidateQueries({ queryKey: ['/api/ai/conversation'] });
      setMessage("");
      
      toast({
        title: "Response received",
        description: "Your AI coach has responded",
      });
    },
    onError: (error) => {
      console.error('Chat error:', error);
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
    }
  });

  // Clear conversation mutation
  const clearMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/ai/conversation', {
        method: 'DELETE',
      });
      if (!response.ok) {
        throw new Error('Failed to clear conversation');
      }
      return await response.json();
    },
    onSuccess: () => {
      setConversation([]);
      queryClient.invalidateQueries({ queryKey: ['/api/ai/conversation'] });
      toast({
        title: "Conversation cleared",
        description: "Your chat history has been cleared",
      });
    }
  });

  // Save conversation mutation
  const saveConversationMutation = useMutation({
    mutationFn: async (conversationToSave: ChatMessage[]) => {
      if (conversationToSave.length === 0) {
        throw new Error("No conversation to save");
      }
      
      const title = conversationToSave[0]?.content.slice(0, 50) + "..." || "New Conversation";
      
      const response = await fetch('/api/chat/conversations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title,
          messages: JSON.stringify(conversationToSave)
        }),
      });
      if (!response.ok) {
        throw new Error('Failed to save conversation');
      }
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/chat/conversations'] });
      toast({
        title: "Conversation saved",
        description: "Your chat has been saved to history",
      });
    }
  });

  // Load conversation mutation
  const loadConversationMutation = useMutation({
    mutationFn: async (conversationId: number) => {
      const response = await fetch(`/api/chat/conversations/${conversationId}`);
      if (!response.ok) {
        throw new Error('Failed to load conversation');
      }
      return await response.json() as SavedConversation;
    },
    onSuccess: (loadedConversation: SavedConversation) => {
      const parsedMessages = JSON.parse(loadedConversation.messages as any).map((msg: any) => ({
        ...msg,
        timestamp: new Date(msg.timestamp)
      }));
      setConversation(parsedMessages);
      setCurrentConversationId(loadedConversation.id);
      setShowHistory(false);
      toast({
        title: "Conversation loaded",
        description: "Previous conversation has been restored",
      });
    }
  });

  // Delete conversation mutation
  const deleteConversationMutation = useMutation({
    mutationFn: async (conversationId: number) => {
      const response = await fetch(`/api/chat/conversations/${conversationId}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        throw new Error('Failed to delete conversation');
      }
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/chat/conversations'] });
      toast({
        title: "Conversation deleted",
        description: "The conversation has been removed from history",
      });
    }
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [conversation]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || chatMutation.isPending) return;
    
    chatMutation.mutate(message.trim());
    
    // Auto-resize textarea
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const startNewChat = () => {
    if (conversation.length > 0) {
      saveConversationMutation.mutate(conversation);
    }
    setConversation([]);
    setCurrentConversationId(null);
    setMessage("");
    clearMutation.mutate();
  };

  const downloadConversation = () => {
    if (conversation.length === 0) {
      toast({
        title: "No conversation",
        description: "There's nothing to download yet",
        variant: "destructive",
      });
      return;
    }

    const formatDate = (date: Date) => {
      return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
    };

    const conversationText = conversation
      .map((msg, index) => {
        const speaker = msg.role === 'user' ? 'You' : 'AI Coach';
        const timestamp = formatDate(msg.timestamp);
        return `[${timestamp}] ${speaker}: ${msg.content}`;
      })
      .join('\n\n');

    const blob = new Blob([conversationText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ai-conversation-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "Download started",
      description: "Your conversation has been downloaded",
    });
  };

  const loadConversation = (conv: SavedConversation) => {
    loadConversationMutation.mutate(conv.id);
  };

  const deleteConversation = (conversationId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    deleteConversationMutation.mutate(conversationId);
  };

  const formatTimestamp = (timestamp: Date) => {
    return timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-4">
      <Card className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl border-0 shadow-2xl overflow-hidden rounded-2xl">
        <CardHeader className="pb-4 bg-gradient-to-r from-rose-100 via-pink-50 to-purple-100 dark:from-rose-900/30 dark:via-pink-900/30 dark:to-purple-900/30 text-gray-800 dark:text-white relative overflow-hidden border-b border-rose-200/30 dark:border-rose-700/30">
          {/* Soft animated background elements */}
          <div className="absolute inset-0 opacity-5">
            <div className="absolute top-0 left-1/4 w-32 h-32 bg-rose-300 rounded-full blur-3xl animate-pulse"></div>
            <div className="absolute bottom-0 right-1/4 w-24 h-24 bg-purple-300 rounded-full blur-2xl animate-pulse" style={{animationDelay: '1s'}}></div>
          </div>
          
          <div className="flex items-center justify-between relative z-10">
            <CardTitle className="flex items-center gap-4">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-rose-300 to-purple-300 rounded-2xl blur-lg opacity-30"></div>
                <div className="relative bg-gradient-to-r from-rose-400 to-purple-400 p-3 rounded-2xl shadow-lg">
                  <MessageCircle className="h-7 w-7 text-white" />
                </div>
              </div>
              <div className="flex flex-col">
                <span className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">Luna AI</span>
                <span className="text-sm opacity-70 font-light tracking-wide text-gray-700 dark:text-gray-300">Relationship Intelligence</span>
              </div>
            </CardTitle>
            <TooltipProvider>
              <div className="flex gap-2">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => setShowHistory(!showHistory)}
                      className="group p-2.5 rounded-xl bg-rose-50/50 hover:bg-rose-100/70 dark:bg-rose-800/20 dark:hover:bg-rose-700/30 backdrop-blur-sm transition-all duration-300 hover:scale-105"
                    >
                      <History className="h-4 w-4 text-rose-600/80 group-hover:text-rose-700 dark:text-rose-300/80 dark:group-hover:text-rose-200 transition-colors" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="bg-rose-600 text-white border-0 rounded-lg">
                    <p>History</p>
                  </TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={startNewChat}
                      className="group p-2.5 rounded-xl bg-purple-50/50 hover:bg-purple-100/70 dark:bg-purple-800/20 dark:hover:bg-purple-700/30 backdrop-blur-sm transition-all duration-300 hover:scale-105"
                    >
                      <Plus className="h-4 w-4 text-purple-600/80 group-hover:text-purple-700 dark:text-purple-300/80 dark:group-hover:text-purple-200 transition-colors" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="bg-purple-600 text-white border-0 rounded-lg">
                    <p>New Chat</p>
                  </TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => clearMutation.mutate()}
                      disabled={conversation.length === 0 || clearMutation.isPending}
                      className="group p-2.5 rounded-xl bg-pink-50/50 hover:bg-pink-100/70 dark:bg-pink-800/20 dark:hover:bg-pink-700/30 backdrop-blur-sm transition-all duration-300 hover:scale-105 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:bg-pink-50/50"
                    >
                      <Trash2 className="h-4 w-4 text-pink-600/80 group-hover:text-pink-700 dark:text-pink-300/80 dark:group-hover:text-pink-200 transition-colors" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="bg-pink-600 text-white border-0 rounded-lg">
                    <p>Clear</p>
                  </TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={downloadConversation}
                      disabled={conversation.length === 0}
                      className="group p-2.5 rounded-xl bg-indigo-50/50 hover:bg-indigo-100/70 dark:bg-indigo-800/20 dark:hover:bg-indigo-700/30 backdrop-blur-sm transition-all duration-300 hover:scale-105 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:bg-indigo-50/50"
                    >
                      <Download className="h-4 w-4 text-indigo-600/80 group-hover:text-indigo-700 dark:text-indigo-300/80 dark:group-hover:text-indigo-200 transition-colors" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="bg-indigo-600 text-white border-0 rounded-lg">
                    <p>Download</p>
                  </TooltipContent>
                </Tooltip>
              </div>
            </TooltipProvider>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 bg-white/60 dark:bg-gray-900/60 backdrop-blur-sm">
          {showHistory && (
            <Card className="mb-4">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Conversation History</CardTitle>
              </CardHeader>
              <CardContent>
                {savedConversations && Array.isArray(savedConversations) && savedConversations.length > 0 ? (
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {savedConversations.map((conv: SavedConversation) => (
                      <div
                        key={conv.id}
                        className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
                        onClick={() => loadConversation(conv)}
                      >
                        <div className="flex-1">
                          <div className="font-medium text-sm">{conv.title}</div>
                          <div className="text-xs text-gray-500">
                            {new Date(conv.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => deleteConversation(conv.id, e)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-4">No saved conversations yet</p>
                )}
              </CardContent>
            </Card>
          )}

          <div className="min-h-[400px] max-h-[500px] overflow-y-auto rounded-2xl p-8 space-y-6 bg-gradient-to-br from-gray-50/80 via-white to-gray-100/80 dark:from-gray-800/80 dark:via-gray-900/80 dark:to-black/80 backdrop-blur-xl border-0">
            {conversation.length === 0 ? (
              <div className="text-center py-16">
                <div className="relative mb-10 group">
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 rounded-3xl blur-2xl opacity-20 group-hover:opacity-30 transition-opacity duration-500 animate-pulse"></div>
                  <div className="relative bg-gradient-to-br from-gray-900 via-black to-gray-800 p-6 rounded-3xl shadow-2xl">
                    <div className="bg-gradient-to-r from-blue-400 to-purple-500 p-3 rounded-2xl inline-block">
                      <MessageCircle className="h-8 w-8 text-white" />
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4 mb-10">
                  <h3 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-gray-900 via-black to-gray-800 dark:from-white dark:via-gray-100 dark:to-gray-300 bg-clip-text text-transparent">
                    Luna AI
                  </h3>
                  <p className="text-xl font-light text-gray-600 dark:text-gray-400 max-w-lg mx-auto leading-relaxed">
                    Advanced relationship intelligence designed to understand your emotional patterns and provide personalized guidance
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto mb-10">
                  <div className="group relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-rose-300 to-rose-400 rounded-2xl blur opacity-15 group-hover:opacity-25 transition-opacity"></div>
                    <div className="relative bg-rose-50/90 dark:bg-rose-900/30 backdrop-blur-sm rounded-2xl p-6 border border-rose-200/60 dark:border-rose-700/40 hover:shadow-xl transition-all duration-500 hover:-translate-y-1">
                      <div className="bg-gradient-to-br from-rose-400 to-rose-500 p-3 rounded-xl mb-4 inline-block shadow-lg">
                        <Heart className="h-6 w-6 text-white" />
                      </div>
                      <h4 className="font-semibold text-gray-900 dark:text-gray-100 text-lg mb-3 text-left">Deep Analysis</h4>
                      <p className="text-gray-600 dark:text-gray-400 leading-relaxed text-left">Understand your relationship patterns through advanced behavioral analysis</p>
                    </div>
                  </div>
                  
                  <div className="group relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-purple-300 to-purple-400 rounded-2xl blur opacity-15 group-hover:opacity-25 transition-opacity"></div>
                    <div className="relative bg-purple-50/90 dark:bg-purple-900/30 backdrop-blur-sm rounded-2xl p-6 border border-purple-200/60 dark:border-purple-700/40 hover:shadow-xl transition-all duration-500 hover:-translate-y-1">
                      <div className="bg-gradient-to-br from-purple-400 to-purple-500 p-3 rounded-xl mb-4 inline-block shadow-lg">
                        <Sparkles className="h-6 w-6 text-white" />
                      </div>
                      <h4 className="font-semibold text-gray-900 dark:text-gray-100 text-lg mb-3 text-left">Smart Guidance</h4>
                      <p className="text-gray-600 dark:text-gray-400 leading-relaxed text-left">Receive personalized recommendations tailored to your unique situation</p>
                    </div>
                  </div>
                  
                  <div className="group relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-pink-300 to-pink-400 rounded-2xl blur opacity-15 group-hover:opacity-25 transition-opacity"></div>
                    <div className="relative bg-pink-50/90 dark:bg-pink-900/30 backdrop-blur-sm rounded-2xl p-6 border border-pink-200/60 dark:border-pink-700/40 hover:shadow-xl transition-all duration-500 hover:-translate-y-1">
                      <div className="bg-gradient-to-br from-pink-400 to-pink-500 p-3 rounded-xl mb-4 inline-block shadow-lg">
                        <MessageCircle className="h-6 w-6 text-white" />
                      </div>
                      <h4 className="font-semibold text-gray-900 dark:text-gray-100 text-lg mb-3 text-left">Always Available</h4>
                      <p className="text-gray-600 dark:text-gray-400 leading-relaxed text-left">24/7 emotional support whenever you need relationship guidance</p>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-gray-100 via-white to-gray-100 dark:from-gray-800 dark:via-gray-900 dark:to-gray-800 rounded-2xl p-6 border border-gray-200/50 dark:border-gray-700/50 shadow-inner">
                  <p className="text-gray-700 dark:text-gray-300 text-lg font-medium italic">
                    "Ready to explore your relationship dynamics together?"
                  </p>
                </div>
              </div>
            ) : (
              conversation.map((msg, index) => (
                <div
                  key={index}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] p-4 rounded-2xl ${
                      msg.role === 'user'
                        ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg'
                        : 'bg-white border border-gray-200 shadow-sm'
                    }`}
                  >
                    <div className="text-sm leading-relaxed whitespace-pre-wrap">
                      {msg.content}
                    </div>
                    <div
                      className={`text-xs mt-2 ${
                        msg.role === 'user' ? 'text-blue-100' : 'text-gray-400'
                      }`}
                    >
                      {formatTimestamp(msg.timestamp)}
                    </div>
                  </div>
                </div>
              ))
            )}
            {chatMutation.isPending && (
              <div className="flex justify-start">
                <div className="bg-white border border-gray-200 p-4 rounded-2xl flex items-center gap-3 shadow-sm">
                  <Loader2 className="h-4 w-4 animate-spin text-pink-500" />
                  <span className="text-sm text-gray-600">AI is thinking...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="flex gap-3 items-end">
            <Textarea
              ref={textareaRef}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask your AI relationship coach anything..."
              className="flex-1 min-h-[60px] max-h-[120px] resize-none"
              disabled={chatMutation.isPending}
            />
            <Button
              onClick={handleSubmit}
              disabled={!message.trim() || chatMutation.isPending}
              className="h-[60px] px-6 flex items-center gap-2"
            >
              {chatMutation.isPending ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Send className="h-5 w-5" />
              )}
              Send
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}