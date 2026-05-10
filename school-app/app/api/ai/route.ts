import { NextResponse } from "next/server";
import { authenticateRequest } from "@edu/shared/auth/middleware";
import { createAgentGraph } from "@edu/shared/ai/core/graph";
import { HumanMessage, AIMessageChunk } from "@langchain/core/messages";

export async function POST(request: Request) {
  try {
    const session = {
      headers: { authorization: request.headers.get("authorization") ?? undefined }
    };

    const ctx = authenticateRequest(session as any, "school");

    if (!ctx) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { message, thread_id } = body;

    if (!message) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    const graph = createAgentGraph();

    let complexity: "simple" | "moderate" | "complex" = "moderate";
    if (message.length < 100 && !message.toLowerCase().includes("analyze")) {
      complexity = "simple";
    } else if (message.length > 500 || message.toLowerCase().includes("deep analysis")) {
      complexity = "complex";
    }

    const config = {
      configurable: {
        thread_id: thread_id || `thread_${Date.now()}`,
        context: ctx
      }
    };

    // Use streamEvents for streaming capability (optional if client wants to read stream)
    // We will return a streaming response.

    const stream = await graph.streamEvents(
      {
        messages: [new HumanMessage({ content: message })],
        context: ctx,
        complexity: complexity
      },
      { ...config, version: "v2" }
    );

    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        controller.enqueue(encoder.encode(`{"thread_id": "${config.configurable.thread_id}", "type": "meta"}\n`));
        try {
          for await (const event of stream) {
            if (event.event === "on_chat_model_stream") {
              const chunk = event.data.chunk as AIMessageChunk;
              if (chunk.content) {
                const text = typeof chunk.content === "string" ? chunk.content : JSON.stringify(chunk.content);
                controller.enqueue(encoder.encode(`{"type": "chunk", "content": ${JSON.stringify(text)}}\n`));
              }
            // } else if (event.event === "on_tool_start") {
            //    controller.enqueue(encoder.encode(`{"type": "tool", "content": "Running tool ${event.name}..."}\n`));
            }
          }
        } catch (err: any) {
           controller.enqueue(encoder.encode(`{"type": "error", "content": ${JSON.stringify(err.message)}}\n`));
        } finally {
          controller.close();
        }
      }
    });

    return new Response(readable, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive"
      }
    });

  } catch (error: any) {
    console.error("AI Assistant Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error", details: error.message },
      { status: 500 }
    );
  }
}
