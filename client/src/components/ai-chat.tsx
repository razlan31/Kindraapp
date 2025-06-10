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
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Heart className="h-5 w-5 text-pink-500" />
              AI Relationship Coach
              <Sparkles className="h-4 w-4 text-yellow-500" />
            </CardTitle>
            <TooltipProvider>
              <div className="flex gap-1">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => setShowHistory(!showHistory)}
                      className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                    >
                      <History className="h-4 w-4 text-gray-600 dark:text-gray-400" />
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
                      className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                    >
                      <Plus className="h-4 w-4 text-gray-600 dark:text-gray-400" />
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
                      className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Trash2 className="h-4 w-4 text-gray-600 dark:text-gray-400" />
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
                      className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Download className="h-4 w-4 text-gray-600 dark:text-gray-400" />
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
        <CardContent className="space-y-4">
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

          <div className="min-h-[400px] max-h-[500px] overflow-y-auto rounded-lg p-4 space-y-4 bg-gradient-to-b from-slate-50 to-white border">
            {conversation.length === 0 ? (
              <div className="text-center text-gray-500 py-12">
                <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-pink-100 to-purple-100 rounded-full flex items-center justify-center">
                  <Heart className="h-8 w-8 text-pink-500" />
                </div>
                <h3 className="text-lg font-semibold mb-2 text-gray-700">Your AI Relationship Coach</h3>
                <p className="text-sm text-gray-500 max-w-md mx-auto">
                  Share your thoughts, get personalized insights, and receive guidance for your relationships.
                </p>
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