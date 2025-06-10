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
      <Card className="bg-gradient-to-br from-blue-50 via-slate-50 to-indigo-50 dark:from-gray-900 dark:via-blue-900/10 dark:to-indigo-900/10 border border-blue-200/20 dark:border-blue-700/20 shadow-lg overflow-hidden">
        <CardHeader className="pb-3 bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-600 text-white">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-full backdrop-blur-sm">
                <MessageCircle className="h-6 w-6" />
              </div>
              <div className="flex flex-col">
                <span className="text-xl font-bold">Luna AI Coach</span>
                <span className="text-sm opacity-90 font-normal">Your Relationship Assistant</span>
              </div>
              <Sparkles className="h-5 w-5 text-blue-200" />
            </CardTitle>
            <TooltipProvider>
              <div className="flex gap-1">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => setShowHistory(!showHistory)}
                      className="p-2 rounded-md hover:bg-white/30 backdrop-blur-sm transition-all duration-200"
                    >
                      <History className="h-4 w-4 text-white/90 hover:text-white" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>View conversation history</p>
                  </TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={startNewChat}
                      className="p-2 rounded-md hover:bg-white/30 backdrop-blur-sm transition-all duration-200"
                    >
                      <Plus className="h-4 w-4 text-white/90 hover:text-white" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Start new chat</p>
                  </TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => clearMutation.mutate()}
                      disabled={conversation.length === 0 || clearMutation.isPending}
                      className="p-2 rounded-md hover:bg-white/30 backdrop-blur-sm transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent"
                    >
                      <Trash2 className="h-4 w-4 text-white/90 hover:text-white" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Clear current chat</p>
                  </TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={downloadConversation}
                      disabled={conversation.length === 0}
                      className="p-2 rounded-md hover:bg-white/30 backdrop-blur-sm transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent"
                    >
                      <Download className="h-4 w-4 text-white/90 hover:text-white" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Download conversation</p>
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

          <div className="min-h-[400px] max-h-[500px] overflow-y-auto rounded-xl p-6 space-y-4 bg-gradient-to-br from-white via-blue-50/20 to-slate-50/30 dark:from-gray-800 dark:via-blue-900/10 dark:to-slate-900/20 border-0">
            {conversation.length === 0 ? (
              <div className="text-center py-12">
                <div className="relative mb-6">
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-indigo-500 rounded-full blur-xl opacity-10"></div>
                  <div className="relative bg-gradient-to-r from-blue-500 to-indigo-600 p-4 rounded-full inline-block shadow-lg">
                    <MessageCircle className="h-12 w-12 text-white" />
                  </div>
                </div>
                <h3 className="text-2xl font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-3">
                  Luna AI Coach
                </h3>
                <p className="text-gray-600 dark:text-gray-300 mb-6 max-w-md mx-auto">
                  Your intelligent relationship companion for personalized insights and guidance
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-lg mx-auto">
                  <div className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-lg p-3 border border-blue-100/30 dark:border-blue-800/30">
                    <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-2 rounded-md mb-2 inline-block">
                      <Heart className="h-4 w-4 text-white" />
                    </div>
                    <h4 className="font-medium text-gray-800 dark:text-gray-200 text-sm mb-1">Deep Insights</h4>
                    <p className="text-xs text-gray-600 dark:text-gray-400">Analyze relationship patterns</p>
                  </div>
                  <div className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-lg p-3 border border-blue-100/30 dark:border-blue-800/30">
                    <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 p-2 rounded-md mb-2 inline-block">
                      <Sparkles className="h-4 w-4 text-white" />
                    </div>
                    <h4 className="font-medium text-gray-800 dark:text-gray-200 text-sm mb-1">Smart Advice</h4>
                    <p className="text-xs text-gray-600 dark:text-gray-400">Personalized recommendations</p>
                  </div>
                  <div className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-lg p-3 border border-blue-100/30 dark:border-blue-800/30">
                    <div className="bg-gradient-to-br from-slate-500 to-slate-600 p-2 rounded-md mb-2 inline-block">
                      <MessageCircle className="h-4 w-4 text-white" />
                    </div>
                    <h4 className="font-medium text-gray-800 dark:text-gray-200 text-sm mb-1">Always Here</h4>
                    <p className="text-xs text-gray-600 dark:text-gray-400">24/7 relationship support</p>
                  </div>
                </div>
                <div className="mt-6 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg p-3 border border-blue-100/50 dark:border-blue-800/50">
                  <p className="text-sm text-gray-600 dark:text-gray-400 italic">
                    "Share what's on your mind about your relationships..."
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