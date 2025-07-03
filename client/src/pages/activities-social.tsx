import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Header } from "@/components/layout/header";
import { BottomNavigation } from "@/components/layout/bottom-navigation";
import { Moment, Connection } from "@shared/schema";
import { useAuth } from "@/contexts/auth-context";
import { useRelationshipFocus } from "@/contexts/relationship-focus-context";
import { Button } from "@/components/ui/button";
import { useModal } from "@/contexts/modal-context";
import { Search, Plus, Heart, MessageCircle, Calendar, X, Filter } from "lucide-react";
import { Input } from "@/components/ui/input";

export default function ActivitiesSocial() {
  const { user, loading } = useAuth();
  const { openMomentModal } = useModal();
  const { mainFocusConnection } = useRelationshipFocus();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedConnections, setSelectedConnections] = useState<number[]>([]);
  const [showFilters, setShowFilters] = useState(false);

  // Fetch connections
  const { data: connections = [] } = useQuery<Connection[]>({
    queryKey: ["/api/connections"],
    enabled: !loading && !!user,
  });

  // Fetch moments
  const { data: moments = [] } = useQuery<Moment[]>({
    queryKey: ["/api/moments"],
    enabled: !loading && !!user,
  });

  // Filter moments based on search and selected connections
  const filteredMoments = moments.filter(moment => {
    const matchesSearch = moment.content.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesConnection = selectedConnections.length === 0 || selectedConnections.includes(moment.connectionId);
    return matchesSearch && matchesConnection;
  });

  // Get connection info for moment
  const getConnectionForMoment = (connectionId: number) => {
    return connections.find(c => c.id === connectionId);
  };

  const toggleConnection = (connectionId: number) => {
    setSelectedConnections(prev => 
      prev.includes(connectionId) 
        ? prev.filter(id => id !== connectionId)
        : [...prev, connectionId]
    );
  };

  const clearFilters = () => {
    setSelectedConnections([]);
    setSearchTerm("");
    setShowFilters(false);
  };

  if (loading) {
    return (
      <div className="max-w-md mx-auto bg-gray-50 dark:bg-black min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto bg-gray-50 dark:bg-black min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 overflow-y-auto pb-20">
        {/* Search and Filters Header */}
        <div className="sticky top-0 z-10 bg-gray-50/95 dark:bg-black/95 backdrop-blur-md border-b border-gray-200 dark:border-gray-800">
          <div className="px-4 py-3">
            {/* Search Bar */}
            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search moments..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 rounded-full"
              />
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2">
              <Button
                variant={showFilters ? "default" : "outline"}
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
                className="flex-shrink-0 rounded-full"
              >
                <Filter className="h-3 w-3 mr-1" />
                Filters
              </Button>
              
              {selectedConnections.length > 0 && (
                <div className="flex items-center gap-2">
                  {selectedConnections.map(connectionId => {
                    const connection = connections.find(c => c.id === connectionId);
                    return (
                      <div key={connectionId} className="flex items-center gap-1 bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 px-2 py-1 rounded-full text-xs">
                        <span>{connection?.name}</span>
                        <button
                          onClick={() => toggleConnection(connectionId)}
                          className="hover:bg-purple-200 dark:hover:bg-purple-800 rounded-full p-0.5"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    );
                  })}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearFilters}
                    className="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  >
                    Clear all
                  </Button>
                </div>
              )}
            </div>

            {/* Connection Filter Grid */}
            {showFilters && (
              <div className="mt-3 p-3 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700">
                <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">Filter by Connection</h4>
                <div className="grid grid-cols-2 gap-2">
                  {connections.map(connection => (
                    <button
                      key={connection.id}
                      onClick={() => toggleConnection(connection.id)}
                      className={`flex items-center gap-2 p-2 rounded-xl text-left text-sm transition-colors ${
                        selectedConnections.includes(connection.id)
                          ? 'bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300'
                          : 'bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600'
                      }`}
                    >
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 p-0.5">
                        {connection.profileImage ? (
                          <img 
                            src={connection.profileImage} 
                            alt={connection.name}
                            className="w-full h-full rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full rounded-full bg-white dark:bg-gray-600 flex items-center justify-center">
                            <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                              {connection.name[0]}
                            </span>
                          </div>
                        )}
                      </div>
                      <span className="truncate">{connection.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Add Moment Button */}
        <div className="px-4 py-3">
          <Button
            onClick={() => openMomentModal()}
            className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-2xl py-4 text-lg font-semibold"
          >
            <Plus className="h-5 w-5 mr-2" />
            Share a Moment
          </Button>
        </div>

        {/* Moments Feed */}
        <div className="px-4 space-y-4">
          {filteredMoments.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-20 h-20 mx-auto mb-4 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
                <Heart className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No moments yet</h3>
              <p className="text-gray-500 dark:text-gray-400 mb-4">Start documenting your relationship journey</p>
              <Button
                onClick={() => openMomentModal()}
                className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-full px-6"
              >
                Create Your First Moment
              </Button>
            </div>
          ) : (
            filteredMoments.map((moment) => {
              const connection = getConnectionForMoment(moment.connectionId);
              return (
                <div key={moment.id} className="bg-white dark:bg-gray-800 rounded-3xl overflow-hidden shadow-sm border border-gray-100 dark:border-gray-700">
                  {/* Post Header */}
                  <div className="p-4 flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 p-0.5">
                      {connection?.profileImage ? (
                        <img 
                          src={connection.profileImage} 
                          alt={connection.name}
                          className="w-full h-full rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full rounded-full bg-white dark:bg-gray-700 flex items-center justify-center">
                          <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                            {connection?.name?.[0] || '?'}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-gray-900 dark:text-white">
                          {connection?.name || 'Unknown'}
                        </h3>
                        <span className="text-2xl">{moment.emoji}</span>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {moment.createdAt ? new Date(moment.createdAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          hour: 'numeric',
                          minute: '2-digit'
                        }) : 'Recently'}
                      </p>
                    </div>
                  </div>

                  {/* Post Content */}
                  <div className="px-4 pb-3">
                    <p className="text-gray-900 dark:text-white text-base leading-relaxed">
                      {moment.content}
                    </p>
                  </div>

                  {/* Tags */}
                  {moment.tags && moment.tags.length > 0 && (
                    <div className="px-4 pb-3">
                      <div className="flex flex-wrap gap-2">
                        {moment.tags.map((tag, index) => (
                          <span 
                            key={index}
                            className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs rounded-full"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Action Bar */}
                  <div className="px-4 py-3 border-t border-gray-100 dark:border-gray-700">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <button className="flex items-center gap-1 text-gray-500 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors">
                          <Heart className="h-5 w-5" />
                          <span className="text-sm">Like</span>
                        </button>
                        <button className="flex items-center gap-1 text-gray-500 dark:text-gray-400 hover:text-blue-500 dark:hover:text-blue-400 transition-colors">
                          <MessageCircle className="h-5 w-5" />
                          <span className="text-sm">Reflect</span>
                        </button>
                      </div>
                      <button className="flex items-center gap-1 text-gray-500 dark:text-gray-400 hover:text-purple-500 dark:hover:text-purple-400 transition-colors">
                        <Calendar className="h-5 w-5" />
                        <span className="text-sm">Plan</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Spacer for better scroll */}
        <div className="h-4"></div>
      </main>

      <BottomNavigation />
    </div>
  );
}