import { ChatOpenAI } from "@langchain/openai";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";

export type AIProviderName = "gemini" | "openai" | "grok";
export type TaskComplexity = "simple" | "moderate" | "complex";

export class ProviderManager {
  private providers: Map<AIProviderName, any> = new Map();

  constructor() {
    this.initializeProviders();
  }

  private initializeProviders() {
    if (process.env.GEMINI_API_KEY) {
      this.providers.set(
        "gemini",
        new ChatGoogleGenerativeAI({
          model: process.env.GEMINI_MODEL || "gemini-1.5-flash",
          temperature: 0.2,
          maxRetries: 2,
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

  public async getModelWithFallback(complexity: TaskComplexity = "moderate"): Promise<any> {
    const preferences: AIProviderName[] = [];

    if (complexity === "complex") {
      preferences.push("openai", "grok", "gemini");
    } else if (complexity === "simple") {
      preferences.push("gemini", "grok", "openai");
    } else {
      preferences.push("gemini", "openai", "grok");
    }

    // We would do healthchecks or fallback routing.
    // For simplicity with Langchain's native error handling, we return the best model
    // LangChain has native fallbacks that we can set up, so we can bind them.

    const available = preferences.filter(p => this.providers.has(p)).map(p => this.providers.get(p));

    if (available.length === 0) {
      throw new Error("No AI providers available. Check API keys.");
    }

    if (available.length > 1) {
       let model = available[0];
       return model.withFallbacks({ fallbacks: available.slice(1) });
    }

    return available[0];
  }
}
