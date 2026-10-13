import { create } from "zustand";
import { persist } from "zustand/middleware";
import { apiClient } from "src/services/apiClient";

export interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  functionCall?: {
    name: string;
    arguments?: any;
    result: any;
  };
}

export interface ProactiveInsights {
  executive_summary: string;
  key_metrics: {
    total_active_projects: number;
    upcoming_deadlines_7d: number;
    total_pipeline_value: number;
    tasks_completion_rate_pct: number;
  };
  high_priority_action_items: Array<{
    title: string;
    action: string;
    impact: string;
  }>;
  financial_overview: {
    total_paid: number;
    total_pending: number;
  };
}

interface AIAssistantState {
  messages: Message[];
  isLoading: boolean;
  error: string | null;
  isOllamaAvailable: boolean;
  availableModels: string[];
  proactiveInsights: ProactiveInsights | null;
  isLoadingInsights: boolean;

  // Actions
  sendMessage: (message: string) => Promise<void>;
  checkOllamaHealth: () => Promise<void>;
  fetchProactiveInsights: () => Promise<void>;
  clearMessages: () => void;
  clearError: () => void;
}

const useAIAssistantStore = create<AIAssistantState>()(
  persist(
    (set, get) => ({
      messages: [],
      isLoading: false,
      error: null,
      isOllamaAvailable: false,
      availableModels: [],
      proactiveInsights: null,
      isLoadingInsights: false,

      sendMessage: async (message: string) => {
        try {
          set({ isLoading: true, error: null });

          // Add user message
          const userMessage: Message = {
            role: "user",
            content: message,
            timestamp: new Date(),
          };
          set({ messages: [...get().messages, userMessage] });

          const response = await apiClient.post(
            "/ai/chat",
            {
              message,
              conversationHistory: get().messages.map((m) => ({
                role: m.role,
                content: m.content,
              })),
            }
          );

          // Add assistant response
          const assistantMessage: Message = {
            role: "assistant",
            content: response.data.response,
            timestamp: new Date(),
            functionCall: response.data.functionCall,
          };
          set({ messages: [...get().messages, assistantMessage], isLoading: false });

          // Handle automatic client route navigation if returned
          if (response.data.functionCall?.name === "navigate_to") {
            const route = response.data.functionCall.result?.data?.route;
            if (route && typeof window !== "undefined") {
              window.location.href = route;
            }
          }
        } catch (error: any) {
          const errMsg = error.response?.data?.error || error.message || "Failed to send message";
          set({ error: errMsg, isLoading: false });
          throw error;
        }
      },

      checkOllamaHealth: async () => {
        try {
          const response = await apiClient.get("/ai/health");
          set({
            isOllamaAvailable: response.data.isHealthy,
            availableModels: response.data.models || [],
          });
        } catch (error) {
          set({ isOllamaAvailable: false, availableModels: [] });
        }
      },

      fetchProactiveInsights: async () => {
        try {
          set({ isLoadingInsights: true });
          const response = await apiClient.get("/ai/proactive-insights");
          if (response.data?.success) {
            set({ proactiveInsights: response.data.data, isLoadingInsights: false });
          } else {
            set({ isLoadingInsights: false });
          }
        } catch (error) {
          set({ isLoadingInsights: false });
        }
      },

      clearMessages: () => set({ messages: [] }),
      clearError: () => set({ error: null }),
    }),
    {
      name: "ai-assistant-storage",
      partialize: (state) => ({
        messages: state.messages,
      }),
    }
  )
);

export default useAIAssistantStore;
