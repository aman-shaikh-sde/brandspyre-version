import axios from "axios";

export interface OllamaMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface OllamaResponse {
  message: {
    role: string;
    content: string;
  };
  done: boolean;
}

export interface FunctionCall {
  name: string;
  arguments: Record<string, any>;
}

export class OllamaService {
  private baseUrl: string;
  private model: string;

  constructor(baseUrl: string = "http://localhost:11434", model: string = "llama3") {
    this.baseUrl = baseUrl;
    this.model = model;
  }

  /**
   * Send chat completion request to Ollama
   */
  async chat(messages: OllamaMessage[]): Promise<string> {
    try {
      const response = await axios.post(`${this.baseUrl}/api/chat`, {
        model: this.model,
        messages: messages,
        stream: false,
      });

      return (response.data as any).message.content;
    } catch (error: any) {
      console.error("Ollama chat error:", error.message);
      throw new Error("Failed to communicate with Ollama");
    }
  }

  /**
   * Chat with function calling support
   */
  async chatWithFunctions(
    messages: OllamaMessage[],
    functions: any[]
  ): Promise<{ content: string; functionCall?: FunctionCall }> {
    try {
      const systemPrompt = this.buildSystemPrompt(functions);
      const messagesWithSystem = [
        { role: "system" as const, content: systemPrompt },
        ...messages,
      ];

      const response = await this.chat(messagesWithSystem);
      
      // Parse function call from response
      const functionCall = this.parseFunctionCall(response);
      
      if (functionCall) {
        return { content: "", functionCall };
      }
      
      return { content: response };
    } catch (error: any) {
      console.error("Ollama function chat error:", error.message);
      throw new Error("Failed to communicate with Ollama");
    }
  }

  /**
   * Build system prompt with function definitions
   */
  private buildSystemPrompt(functions: any[]): string {
    const functionDefinitions = functions
      .map((fn) => {
        return `
Function: ${fn.name}
Description: ${fn.description}
Parameters: ${JSON.stringify(fn.parameters, null, 2)}
`;
      })
      .join("\n");

    return `You are an AI assistant for a CRM system. You can help users perform various tasks by calling functions.

When a user asks to perform an action, respond with a function call in this format:
FUNCTION_CALL: {"name": "function_name", "arguments": {...}}

Available functions:
${functionDefinitions}

If you need more information to complete a task, ask the user for clarification.
If the task doesn't match any available function, explain what you can help with and ask for clarification.
`;
  }

  /**
   * Parse function call from AI response
   */
  private parseFunctionCall(response: string): FunctionCall | null {
    const match = response.match(/FUNCTION_CALL:\s*(\{.*\})/s);
    if (match) {
      try {
        return JSON.parse(match[1]);
      } catch (e) {
        console.error("Failed to parse function call:", e);
        return null;
      }
    }
    return null;
  }

  /**
   * Check if Ollama is available
   */
  async checkHealth(): Promise<boolean> {
    try {
      await axios.get(`${this.baseUrl}/api/tags`);
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get available models
   */
  async getModels(): Promise<string[]> {
    try {
      const response = await axios.get(`${this.baseUrl}/api/tags`);
      return (response.data as any).models.map((model: any) => model.name);
    } catch (error) {
      return [];
    }
  }
}

export default new OllamaService();
