import { useState, useEffect, useRef } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Send, Loader2, MessageSquare, X, Trash2, History } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp?: string;
}

interface Conversation {
  id: number;
  title: string;
  lastMessage: string;
  updatedAt: string;
}

export function AIChat() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [message, setMessage] = useState("");
  const [conversation, setConversation] = useState<Message[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Conversation history query
  const { data: conversationHistory = [] } = useQuery<Conversation[]>({
    queryKey: ['/api/chat/conversations'],
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  // Load conversation from API
  const { data: apiConversation = { conversation: [] }, isLoading } = useQuery({
    queryKey: ['/api/ai/conversation'],
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  // Load conversation from API when component mounts
  useEffect(() => {
    if (apiConversation?.conversation) {
      setConversation(apiConversation.conversation);
    }
  }, [apiConversation]);

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [conversation]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [message]);

  const chatMutation = useMutation({
    mutationFn: async (userMessage: string) => {
      const response = await apiRequest('/api/ai/chat', 'POST', {
        message: userMessage,
        context: {
          userId: user?.id,
          conversationHistory: conversation
        }
      });
      return response;
    },
    onSuccess: (data) => {
      if (data.response) {
        setConversation(prev => [
          ...prev,
          { role: 'assistant', content: data.response, timestamp: new Date().toISOString() }
        ]);
      }
      // Invalidate conversation history to refresh with new conversation
      queryClient.invalidateQueries({ queryKey: ['/api/chat/conversations'] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
    }
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || chatMutation.isPending) return;

    const userMessage = message.trim();
    setMessage("");

    // Add user message to conversation
    setConversation(prev => [
      ...prev,
      { role: 'user', content: userMessage, timestamp: new Date().toISOString() }
    ]);

    // Send to API
    await chatMutation.mutateAsync(userMessage);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const loadConversation = async (conversationId: number) => {
    try {
      const response = await apiRequest(`/api/chat/conversations/${conversationId}`, 'GET');
      if (response.messages) {
        setConversation(response.messages);
        setShowHistory(false);
        toast({
          title: "Conversation loaded",
          description: "Previous conversation has been restored.",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load conversation.",
        variant: "destructive",
      });
    }
  };

  const deleteConversation = async (conversationId: number) => {
    try {
      await apiRequest(`/api/chat/conversations/${conversationId}`, 'DELETE');
      queryClient.invalidateQueries({ queryKey: ['/api/chat/conversations'] });
      toast({
        title: "Conversation deleted",
        description: "The conversation has been removed from your history.",
      });
    } catch (error) {
      toast({
        title: "Error", 
        description: "Failed to delete conversation.",
        variant: "destructive",
      });
    }
  };

  const startNewChat = () => {
    setConversation([]);
    setShowHistory(false);
    toast({
      title: "New conversation started",
      description: "You can now start a fresh conversation with Luna.",
    });
  };

  return (
    <div className="flex flex-col h-full max-h-[calc(100vh-8rem)]">
      {/* Header */}
      <div className="flex items-center justify-between p-3 sm:p-4 lg:p-6 border-b border-gray-100 dark:border-gray-800">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 rounded-full bg-gradient-to-br from-violet-500 to-pink-500 flex items-center justify-center">
            <span className="text-white text-sm sm:text-base lg:text-lg font-semibold">L</span>
          </div>
          <div>
            <h2 className="text-lg sm:text-xl lg:text-2xl font-semibold text-gray-900 dark:text-white">Luna AI</h2>
            <p className="text-xs sm:text-sm lg:text-base text-gray-600 dark:text-gray-400">Your relationship coach</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowHistory(!showHistory)}
            className="flex items-center space-x-2"
          >
            <History className="h-4 w-4" />
            <span className="hidden sm:inline">History</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={startNewChat}
            className="flex items-center space-x-2"
          >
            <MessageSquare className="h-4 w-4" />
            <span className="hidden sm:inline">New Chat</span>
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
                variant="ghost"
                size="sm"
                onClick={() => setShowHistory(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            {conversationHistory.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                No conversation history yet. Start chatting with Luna to see your conversations here.
              </p>
            ) : (
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {conversationHistory.map((conv) => (
                  <div
                    key={conv.id}
                    className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    <div 
                      className="flex-1 cursor-pointer"
                      onClick={() => loadConversation(conv.id)}
                    >
                      <h4 className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {conv.title}
                      </h4>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                        {conv.lastMessage}
                      </p>
                      <p className="text-xs text-gray-400 dark:text-gray-500">
                        {new Date(conv.updatedAt).toLocaleDateString()}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteConversation(conv.id);
                      }}
                      className="ml-2 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
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
              placeholder="Ask Luna AI anything about your relationships..."
              className="min-h-[60px] sm:min-h-[70px] lg:min-h-[80px] max-h-[120px] sm:max-h-[140px] lg:max-h-[160px] resize-none pr-14 sm:pr-16 lg:pr-18 border-gray-200 dark:border-gray-700 focus:border-violet-500 dark:focus:border-violet-400 rounded-2xl lg:rounded-3xl bg-gray-50 dark:bg-gray-900 text-base sm:text-lg lg:text-xl leading-relaxed px-4 sm:px-5 lg:px-6 py-3 sm:py-4 lg:py-5"
              disabled={chatMutation.isPending}
            />
            <Button
              type="submit"
              disabled={!message.trim() || chatMutation.isPending}
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
              <span>Luna is thinking...</span>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}