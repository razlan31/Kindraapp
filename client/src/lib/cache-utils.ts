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

    
    // Remove all cycle queries from cache completely
    queryClient.removeQueries({ queryKey: ['/api/menstrual-cycles'] });
    queryClient.removeQueries({ queryKey: ['cycles'] });
    queryClient.removeQueries({ queryKey: ['menstrual-cycles'] });
    
    // Invalidate and refetch to ensure fresh data
    await queryClient.invalidateQueries({ queryKey: ['/api/menstrual-cycles'] });
    await queryClient.refetchQueries({ queryKey: ['/api/menstrual-cycles'] });
    

  },

  /**
   * Verifies deletion was successful by checking if cycle still exists
   * Use after delete operations to ensure data consistency
   */
  verifyDeletion: async (cycleId: number): Promise<boolean> => {
    try {

      
      // Force a fresh fetch from server
      await queryClient.invalidateQueries({ queryKey: ['/api/menstrual-cycles'] });
      const cycles = await queryClient.fetchQuery({
        queryKey: ['/api/menstrual-cycles'],
        queryFn: () => fetch('/api/menstrual-cycles').then(res => res.json())
      });
      
      const stillExists = cycles.some((cycle: any) => cycle.id === cycleId);
      
      if (stillExists) {

        return false;
      } else {

        return true;
      }
    } catch (error) {
      console.error(`❌ Error verifying deletion of cycle ${cycleId}:`, error);
      return false;
    }
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