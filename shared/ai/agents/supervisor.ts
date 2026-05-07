import { ProviderManager } from "../providers/provider-manager";
import { aiTools } from "../tools/registry";
import { studentAnalysisPrompt } from "../skills/student-analysis";

import { systemPrompt } from "../skills/system-prompt";

const providerManager = new ProviderManager();

export async function supervisorNode(state: any, config: any) {
  const complexity = state.complexity || "moderate";
  const modelWithTools = await providerManager.getModelWithFallback(complexity, aiTools);

  const messages = [...state.messages];

  const systemMessage = {
    role: "system",
    content: `${systemPrompt}

Specialized Skills Active:
${studentAnalysisPrompt}
`
  };

  const response = await modelWithTools.invoke([systemMessage, ...messages], config);

  return { messages: [response] };
}
