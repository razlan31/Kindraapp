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
    // Clear all menstrual cycle queries with different patterns
    await queryClient.invalidateQueries({ queryKey: ['/api/menstrual-cycles'] });
    await queryClient.invalidateQueries({ queryKey: ['cycles'] });
    await queryClient.invalidateQueries({ queryKey: ['menstrual-cycles'] });
    
    // Force immediate refetch to update UI
    await queryClient.refetchQueries({ queryKey: ['/api/menstrual-cycles'] });
    
    // Clear stale data
    queryClient.removeQueries({ queryKey: ['/api/menstrual-cycles'], stale: true });
  },

  /**
   * Removes all cycle data from cache and forces fresh fetch
   * Use this for critical updates where stale data must be eliminated
   */
  clearAndRefetch: async () => {
    console.log('🔄 Clearing all cycle cache data');
    
    // Remove all cycle queries from cache completely
    queryClient.removeQueries({ queryKey: ['/api/menstrual-cycles'] });
    queryClient.removeQueries({ queryKey: ['cycles'] });
    queryClient.removeQueries({ queryKey: ['menstrual-cycles'] });
    
    // Clear the entire query cache to ensure no stale data remains
    queryClient.clear();
    
    // Force a hard refresh of the page to eliminate any remaining frontend state
    setTimeout(() => {
      window.location.reload();
    }, 100);
    
    console.log('✅ Cache cleared and page refresh initiated');
  },

  /**
   * Updates cached cycle data after a successful mutation
   * Optimistically updates the cache without waiting for server refetch
   */
  updateCacheAfterMutation: (updatedCycle: any, action: 'create' | 'update' | 'delete') => {
    console.log(`📝 Updating cache after ${action} mutation for cycle:`, updatedCycle);
    
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
          const newData = oldData.filter((cycle: any) => cycle.id !== updatedCycle.id);
          console.log(`🗑️ Removed cycle ${updatedCycle.id} from cache, ${oldData.length} -> ${newData.length} cycles`);
          return newData;
        default:
          return oldData;
      }
    });
  }
};