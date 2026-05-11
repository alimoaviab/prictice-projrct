import { ChatOpenAI } from "@langchain/openai";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";

export type AIProviderName = "gemini" | "gemini-pro" | "openai" | "grok";
export type TaskComplexity = "simple" | "moderate" | "complex";

export class ProviderManager {
  private providers: Map<AIProviderName, any> = new Map();

  constructor() {
    this.initializeProviders();
  }

  private initializeProviders() {
    if (process.env.GEMINI_API_KEY) {
      // Primary model: Fast and efficient (Gemini 2.5 Flash)
      this.providers.set(
        "gemini",
        new ChatGoogleGenerativeAI({
          model: process.env.GEMINI_MODEL || "gemini-2.5-flash",
          temperature: 0.1,
          maxRetries: 0,
          apiKey: process.env.GEMINI_API_KEY,
        })
      );
      
      // Pro model: For complex tasks (Gemini 2.5 Pro)
      this.providers.set(
        "gemini-pro",
        new ChatGoogleGenerativeAI({
          model: "gemini-2.5-pro",
          temperature: 0.1,
          maxRetries: 1,
          apiKey: process.env.GEMINI_API_KEY,
        })
      );
    }

    if (process.env.OPENAI_API_KEY) {
      this.providers.set(
        "openai",
        new ChatOpenAI({
          modelName: "gpt-4o-mini",
          temperature: 0.2,
          maxRetries: 2,
          openAIApiKey: process.env.OPENAI_API_KEY,
        })
      );
    }

    if (process.env.GROK_API_KEY) {
      this.providers.set(
        "grok",
        new ChatOpenAI({
          modelName: "grok-beta",
          temperature: 0.2,
          maxRetries: 2,
          configuration: {
            baseURL: "https://api.x.ai/v1",
          },
          openAIApiKey: process.env.GROK_API_KEY
        })
      );
    }
  }

  public async getModelWithFallback(complexity: TaskComplexity = "moderate", tools?: any[]): Promise<any> {
    const preferences: AIProviderName[] = [];

    if (complexity === "complex") {
      preferences.push("openai", "grok", "gemini-pro", "gemini");
    } else if (complexity === "simple") {
      preferences.push("gemini", "gemini-pro", "grok", "openai");
    } else {
      preferences.push("gemini", "gemini-pro", "openai", "grok");
    }

    // We would do healthchecks or fallback routing.
    // For simplicity with Langchain's native error handling, we return the best model
    // LangChain has native fallbacks that we can set up, so we can bind them.

    let available = preferences.filter(p => this.providers.has(p)).map(p => this.providers.get(p));

    if (available.length === 0) {
      throw new Error("No AI providers available. Check API keys.");
    }

    if (tools && tools.length > 0) {
      available = available.map((model: any) => model.bindTools(tools));
    }

    if (available.length > 1) {
       let model = available[0];
       return model.withFallbacks({ fallbacks: available.slice(1) });
    }

    return available[0];
  }
}
