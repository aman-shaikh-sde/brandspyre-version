import { apiClient } from "src/services/apiClient";
import { Milestone } from "lucide-react";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { BASE_URL } from "~/constants/api";

const useProjectStore = create(
  persist(
    (set) => ({
      allprojects: [],
      branchProject: [],
      Allmilestone: [],
      branchMilestone: [],
      allProjectcodeOptions: [],
      branchProjectOption: [],
      allMilestonecodeOptions: [],
      branchMilestonecodeOptions: [],
      isLoading: false,
      error: null,
      fetchProject: async (token, branchcode) => {
        try {
          set({ isLoading: true });
          const response = await apiClient.get(
            `/project/overview/read`
          );
          console.log("responseeeprojectzus", response.data.data);

          const branchResponse = await apiClient.get(
            `/project/overview/read`
          );
          console.log("projectbranchzuz", branchResponse);

          //all milestone

          const allMilestoneRes = await apiClient.get(
            `/project/milestone/read`
          );
          const branchMilestoneRes = await apiClient.get(
            `/project/milestone/read?branchcode=${branchcode}`
          );
          const allProjects = response.data.data || [];
          const branchProject = branchResponse.data.data || [];
          const Allmilestone = allMilestoneRes.data.data || [];
          const branchMilestone = branchMilestoneRes.data.data || [];

          const allProjectcodeOptions = [
            ...new Set(
              allProjects.map((project) =>
                JSON.stringify({
                  value: project.project_code,
                  label: project.title,
                })
              )
            ),
          ].map((str) => JSON.parse(str));

          const branchProjectOption = [
            ...new Set(
              branchProject.map((project) =>
                JSON.stringify({
                  value: project.project_code,
                  label: project.title,
                })
              )
            ),
          ].map((str) => JSON.parse(str));

          const allMilestonecodeOptions = [
            ...new Set(
              Allmilestone.map((milestone) =>
                JSON.stringify({
                  value: milestone.milestone_code,
                  label: milestone.miles_title,
                })
              )
            ),
          ].map((str) => JSON.parse(str));

          set({
            allProjects,
            branchProject,
            Allmilestone,
            branchMilestone,
            allProjectcodeOptions,
            branchProjectOption,
            allMilestonecodeOptions,
          });
        } catch (error) {
          set({ error, isLoading: false });
        }
      },
    }),
    { name: "project-storage" }
  )
);
export default useProjectStore;
