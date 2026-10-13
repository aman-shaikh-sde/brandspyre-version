import { apiClient } from "src/services/apiClient";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { BASE_URL } from "~/constants/api";

const useLeadsStore = create(
  persist(
    (set) => ({
      leads: [],
      campaigns: [],
      campaigncodeOptions: [],
      branchCampaign: [],
      branchCampaigncodeOptions: [],
      leadcodeOptions: [],
      isLoading: false,
      error: null,
      fetchLeads: async (token, branchcode) => {
        try {
          set({ isLoading: true });

          // Fetch leads
          const response = await apiClient.get(
            `/campaign/leads/read?limit=1000`
          );

          // Fetch campaigns
          const camResponse = await apiClient.get(
            `/campaign/overview/read?limit=1000`
          );
          const branchcamResponse = await apiClient.get(
            `/campaign/overview/read?branchcode=${branchcode}&limit=1000`
          );
          console.log(
            "response for the zustand stored datas for leads",
            response?.data?.data,
            camResponse?.data?.data,
            branchcamResponse?.data?.data
          );

          const leads = response?.data?.data || [];
          const campaigns = camResponse?.data?.data || []; // Note: using camResponse here
          const branchCampaign = branchcamResponse?.data?.data || [];
          // Create lead code options
          const leadcodeOptions = [
            ...new Set(
              leads.map((lead) =>
                JSON.stringify({
                  value: lead.id,
                  label: lead.lead_name,
                })
              )
            ),
          ].map((str) => JSON.parse(str));

          // Create campaign code options
          const campaigncodeOptions = [
            ...new Set(
              campaigns.map((camp) =>
                JSON.stringify({
                  value: camp.campaign_code,
                  label: camp.campaignname, // Make sure this matches your API response
                })
              )
            ),
          ].map((str) => JSON.parse(str));
          // Create campaign code options
          const branchCampaigncodeOptions = [
            ...new Set(
              branchCampaign.map((camp) =>
                JSON.stringify({
                  value: camp.campaign_code,
                  label: camp.campaignname, // Make sure this matches your API response
                })
              )
            ),
          ].map((str) => JSON.parse(str));
          console.log("lead options", leadcodeOptions);
          console.log("campaign options", campaigncodeOptions);

          set({
            leads,
            campaigns, // Changed from campaign to campaigns for clarity
            campaigncodeOptions,
            leadcodeOptions,
            branchCampaigncodeOptions,
            isLoading: false,
          });
        } catch (error) {
          set({ error, isLoading: false });
        }
      },
    }),
    { name: "lead-storage" }
  )
);

export default useLeadsStore;
