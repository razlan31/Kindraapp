import { queryClient } from './queryClient';

/**
 * Centralized cache management for cycle-related data
 * Ensures all pages stay synchronized when cycles are modified
 */
export const cycleCache = {
  /**
   * Invalidates all cycle-related queries across the application
   * Call this after any cycle mutation (create, update, delete)
   */
  invalidateAll: async () => {
    // Clear all menstrual cycle queries
    await queryClient.invalidateQueries({ queryKey: ['/api/menstrual-cycles'] });
    await queryClient.invalidateQueries({ queryKey: ['cycles'] });
    await queryClient.invalidateQueries({ queryKey: ['menstrual-cycles'] });
    
    // Force immediate refetch to update UI
    await queryClient.refetchQueries({ queryKey: ['/api/menstrual-cycles'] });
    
    // Also clear any stale data
    queryClient.removeQueries({ queryKey: ['/api/menstrual-cycles'], stale: true });
  },

  /**
   * Removes all cycle data from cache and forces fresh fetch
   * Use this for critical updates where stale data must be eliminated
   */
  clearAndRefetch: async () => {
    // Remove all cycle queries from cache
    queryClient.removeQueries({ queryKey: ['/api/menstrual-cycles'] });
    queryClient.removeQueries({ queryKey: ['cycles'] });
    queryClient.removeQueries({ queryKey: ['menstrual-cycles'] });
    
    // Fetch fresh data
    await queryClient.prefetchQuery({ queryKey: ['/api/menstrual-cycles'] });
  },

  /**
   * Updates cached cycle data after a successful mutation
   * Optimistically updates the cache without waiting for server refetch
   */
  updateCacheAfterMutation: (updatedCycle: any, action: 'create' | 'update' | 'delete') => {
    queryClient.setQueryData(['/api/menstrual-cycles'], (oldData: any) => {
      if (!oldData) return oldData;
      
      switch (action) {
        case 'create':
          return [...oldData, updatedCycle];
        case 'update':
          return oldData.map((cycle: any) => 
            cycle.id === updatedCycle.id ? updatedCycle : cycle
          );
        case 'delete':
          return oldData.filter((cycle: any) => cycle.id !== updatedCycle.id);
        default:
          return oldData;
      }
    });
  }
};