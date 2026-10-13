import { apiClient } from "src/services/apiClient";
import useBranchStore from '../stores/index';
import { BASE_URL } from '~/constants/api.js';


const BranchService = {
  /**
   * Fetch all active branches and update the store
   * @returns {Promise<Array>} Array of branches
   */
  getActiveBranches: async () => {
    try {
      const response = await apiClient.get(`/branch/read?status=Active`);
      const data = response?.data || []; // Adjust based on your API response structure
      console.log("gebranchdataaa>>>>>",data)
      // Update Zustand store
     const store = useBranchStore.getState(); // Get the store instance
    store.setBranchData(data); 
      
      return data;
    } catch (error) {
      console.error("Error fetching active branches:", error);
      throw error; // Re-throw to let calling code handle it
    }
  },
 

  /**
   * Fetch branch by ID
   * @param {string} branchId 
   * @returns {Promise<Object>} Branch details
   */
  getBranchById: async (branchId) => {
    try {
      const response = await apiClient.get(`/branch/${branchId}`);
      return response?.data?.data || null;
    } catch (error) {
      console.error(`Error fetching branch ${branchId}:`, error);
      throw error;
    }
  },

  /**
   * Fetch branches with custom filters
   * @param {Object} filters 
   * @returns {Promise<Array>} Filtered branches
   */
//   getBranchesWithFilters: async (filters = {}) => {
//     try {
//       const response = await apiClient.get(`/branch/read`, { 
//         params: filters 
//       });
//       return response?.data?.data || [];
//     } catch (error) {
//       console.error("Error fetching filtered branches:", error);
//       throw error;
//     }
//   }
};

export default BranchService;