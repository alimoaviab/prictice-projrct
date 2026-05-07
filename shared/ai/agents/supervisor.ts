import { ProviderManager } from "../providers/provider-manager";
import { aiTools } from "../tools/registry";
import { studentAnalysisPrompt } from "../skills/student-analysis";

const providerManager = new ProviderManager();

export async function supervisorNode(state: any, config: any) {
  const complexity = state.complexity || "moderate";
  const baseModel = await providerManager.getModelWithFallback(complexity);

  const modelWithTools = baseModel.bindTools(aiTools);

  const messages = [...state.messages];

  const systemMessage = {
    role: "system",
    content: `You are an intelligent Copilot for a School ERP System.
You have access to tools that fetch live data from the ERP.
Never invent data. Use the provided tools.
Return responses in a clear, concise manner, ideally using Markdown.
If a user asks about adding a student or performing an action, provide guidance and actionable next steps.

Specialized Skills Active:
${studentAnalysisPrompt}
`
  };

  const response = await modelWithTools.invoke([systemMessage, ...messages], config);

  return { messages: [response] };
}
