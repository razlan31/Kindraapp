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

interface AIChatProps {
  className?: string;
  compact?: boolean;
}

export function AIChat({ className, compact = false }: AIChatProps = {}) {
  const [message, setMessage] = useState("");
  const [conversation, setConversation] = useState<ChatMessage[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<number | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Load draft message from localStorage on component mount
  useEffect(() => {
    const savedDraft = localStorage.getItem('luna-ai-draft-message');
    if (savedDraft) {
      setMessage(savedDraft);
    }
  }, []);

  // Save draft message to localStorage whenever message changes
  useEffect(() => {
    if (message.trim()) {
      localStorage.setItem('luna-ai-draft-message', message);
    } else {
      localStorage.removeItem('luna-ai-draft-message');
    }
  }, [message]);

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
    console.log("Loading conversation data:", conversationData);
    if (conversationData && Array.isArray((conversationData as any).conversation)) {
      const loadedConversation = (conversationData as any).conversation.map((msg: any) => ({
        ...msg,
        timestamp: new Date(msg.timestamp)
      }));
      console.log("Setting conversation from API:", loadedConversation);
      setConversation(loadedConversation);
    } else if (conversationData) {
      console.log("Conversation data format:", conversationData);
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
      // Invalidate both conversation queries to ensure fresh data
      queryClient.invalidateQueries({ queryKey: ['/api/ai/conversation'] });
      queryClient.invalidateQueries({ queryKey: ['/api/chat/conversations'] });
      setMessage("");
      // Clear the draft message from localStorage after successful send
      localStorage.removeItem('luna-ai-draft-message');
      
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
      queryClient.invalidateQueries({ queryKey: ['/api/chat/conversations'] });
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

  // Start new chat mutation
  const newChatMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/ai/conversation/new', {
        method: 'POST',
      });
      if (!response.ok) {
        throw new Error('Failed to start new chat');
      }
      return await response.json();
    },
    onSuccess: () => {
      setConversation([]);
      setCurrentConversationId(null);
      setMessage("");
      queryClient.invalidateQueries({ queryKey: ['/api/ai/conversation'] });
      queryClient.invalidateQueries({ queryKey: ['/api/chat/conversations'] });
      toast({
        title: "New chat started",
        description: "Your previous conversation has been saved",
      });
    }
  });

  const startNewChat = () => {
    newChatMutation.mutate();
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
      <Card className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-sm rounded-lg">
        <CardHeader className="pb-6 bg-gradient-to-r from-violet-50 via-purple-50 to-pink-50 dark:from-violet-900/20 dark:via-purple-900/20 dark:to-pink-900/20 text-gray-800 dark:text-white border-b border-violet-200/50 dark:border-violet-700/50">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-4">
              <div className="bg-gradient-to-r from-violet-400 via-purple-400 to-pink-400 p-3 rounded-xl shadow-lg">
                <MessageCircle className="h-6 w-6 text-white" />
              </div>
              <div className="flex flex-col">
                <span className="text-xl font-semibold bg-gradient-to-r from-violet-600 to-pink-600 bg-clip-text text-transparent">Luna AI</span>
                <span className="text-sm text-violet-600/80 dark:text-violet-300/80">Relationship Coach</span>
              </div>
            </CardTitle>
            <TooltipProvider>
              <div className="flex gap-2">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => setShowHistory(!showHistory)}
                      className="p-2 rounded-lg bg-gradient-to-r from-violet-100 to-purple-100 hover:from-violet-200 hover:to-purple-200 dark:from-violet-800/20 dark:to-purple-800/20 dark:hover:from-violet-700/30 dark:hover:to-purple-700/30 transition-all"
                    >
                      <History className="h-4 w-4 text-violet-600 dark:text-violet-400" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">
                    <p>History</p>
                  </TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={startNewChat}
                      disabled={newChatMutation.isPending || conversation.length === 0}
                      className="p-2 rounded-lg bg-gradient-to-r from-violet-100 to-purple-100 hover:from-violet-200 hover:to-purple-200 dark:from-violet-800/20 dark:to-purple-800/20 dark:hover:from-violet-700/30 dark:hover:to-purple-700/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Plus className="h-4 w-4 text-violet-600 dark:text-violet-400" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">
                    <p>New Chat</p>
                  </TooltipContent>
                </Tooltip>



                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={downloadConversation}
                      disabled={conversation.length === 0}
                      className="p-2 rounded-lg bg-gradient-to-r from-violet-100 to-purple-100 hover:from-violet-200 hover:to-purple-200 dark:from-violet-800/20 dark:to-purple-800/20 dark:hover:from-violet-700/30 dark:hover:to-purple-700/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Download className="h-4 w-4 text-violet-600 dark:text-violet-400" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">
                    <p>Download</p>
                  </TooltipContent>
                </Tooltip>
              </div>
            </TooltipProvider>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 bg-white dark:bg-gray-900">
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

          <div className="h-[calc(100vh-240px)] overflow-y-auto rounded-xl p-4 space-y-4 bg-gradient-to-br from-violet-50/80 via-purple-50/60 to-pink-50/80 dark:from-violet-900/20 dark:via-purple-900/20 dark:to-pink-900/20 border border-violet-100 dark:border-violet-800">
            {conversation.length === 0 ? (
              <div className="text-center py-8">
                <div className="mb-6">
                  <div className="bg-gradient-to-r from-violet-500 to-purple-500 p-3 rounded-2xl w-14 h-14 mx-auto mb-4">
                    <MessageCircle className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                    🌙 Luna AI Coach
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 text-sm px-4">
                    Your intelligent relationship coach
                  </p>
                </div>

                <div className="max-w-2xl mx-auto text-center space-y-6">
                  <div className="flex items-center justify-center gap-8 text-gray-600 dark:text-gray-400">
                    <div className="flex items-center gap-2">
                      <Heart className="h-5 w-5 text-rose-500" />
                      <span className="text-sm">Deep Analysis</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-5 w-5 text-violet-500" />
                      <span className="text-sm">Smart Guidance</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MessageCircle className="h-5 w-5 text-purple-500" />
                      <span className="text-sm">Always Available</span>
                    </div>
                  </div>
                  
                  <div className="text-gray-600 dark:text-gray-400 text-sm">
                    Start a conversation to get personalized relationship insights
                  </div>
                </div>
              </div>
            ) : (
              conversation.map((msg, index) => (
                <div
                  key={index}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] p-3 rounded-lg ${
                      msg.role === 'user'
                        ? 'bg-blue-500 text-white'
                        : 'bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600'
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
              className="flex-1 min-h-[80px] max-h-[120px] resize-none border-violet-200 focus:border-violet-400 focus:ring-violet-100 text-base"
              disabled={chatMutation.isPending}
            />
            <Button
              onClick={handleSubmit}
              disabled={!message.trim() || chatMutation.isPending}
              className="h-[80px] px-6 flex items-center gap-2 bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 text-white border-0 rounded-xl"
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