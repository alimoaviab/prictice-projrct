import { StateGraph, MemorySaver } from "@langchain/langgraph";
import { AgentState } from "./state";
import { supervisorNode } from "../agents/supervisor";
import { toolsNode } from "../tools/registry";

// Create the memory saver OUTSIDE the graph builder to persist across calls in serverless/api route
export const checkpointer = new MemorySaver();

export function createAgentGraph() {
  const workflow = new StateGraph(AgentState)
    .addNode("agent", supervisorNode)
    .addNode("tools", toolsNode)
    .addEdge("__start__", "agent");

  workflow.addConditionalEdges(
    "agent",
    (state) => {
      const lastMessage = state.messages[state.messages.length - 1];
      if ("tool_calls" in lastMessage && Array.isArray(lastMessage.tool_calls) && lastMessage.tool_calls.length > 0) {
        return "tools";
      }
      return "__end__";
    },
    {
      tools: "tools",
      __end__: "__end__"
    }
  );

  workflow.addEdge("tools", "agent");

  return workflow.compile({ checkpointer });
}
