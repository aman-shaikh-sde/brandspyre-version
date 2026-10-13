import { create } from 'zustand';
import { persist } from 'zustand/middleware';
export interface Branch {
  id: string;
  name: string;
 location:string;
 email:string;

}

export interface BranchStore {
  branchAllData: Branch[];
  dropdownBranch: Array<{ id: string; name: string }>;
  setBranchData: (data: Branch[]) => void;
  getBranchAllData: () => Branch[];
  getDropdownBranch: () => Array<{ id: string; name: string }>;
  getBranchById: (id: string) => Branch | undefined;
  clearBranchData: () => void;
}
const useBranchStore = create(
  persist(
    (set, get) => ({
      branchAllData: [],
      dropdownBranch: [],
    
      
      // Action to set branch data
      setBranchData: (data) => {
        console.log("dattaaa",data)
        set({
          branchAllData: data,
          dropdownBranch: data.map(({ id, name }) => ({ id, name })),
        
        });
      },
      
      getBranchAllData: () => get().branchAllData,
     
      
      getDropdownBranch: () => get().dropdownBranch,
      
      getBranchById: (id) => {
        return get().branchAllData.find(branch => branch.id === id);
      },
      
      // Clear all branch data
      clearBranchData: () => {
        set({
          branchAllData: [],
          dropdownBranch: [],
          branchListData:[]
        });
      },
    }),
    {
      name: 'branch-storage',
      getStorage:()=>localStorage
       // unique name for localStorage key
      // Optional: You can whitelist or blacklist specific keys
      // partialize: (state) => ({ branchAllData: state.branchAllData }),
    }
  )
);

export default useBranchStore;