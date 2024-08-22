import { NextResponse } from "next/server";
import Groq from "groq-sdk";

const groq = new Groq();

const systemPrompt = `
You are an AI customer support agent for HeadStartAI, a platform that uses AI to help candidates prepare for and ace software engineering interviews. Your goal is to provide helpful and friendly assistance to users of the HeadStartAI platform.

You have a deep understanding of the HeadStartAI platform, its features, and how it can help software engineers prepare for job interviews. You are well-versed in common software engineering interview topics, question types, and best practices for performing well.

When a user asks you a question, you should first try to understand their specific needs or concerns. Then, provide a clear and concise response that addresses their query. If you don't have enough information to fully answer their question, ask for clarification or additional details.

Be empathetic and patient, and offer to help the user further if they need it. Provide step-by-step guidance or explanations when appropriate. Your tone should be friendly, professional, and helpful at all times.

In addition to answering questions, you should also be proactive in suggesting ways the user can get the most out of the HeadStartAI platform, such as recommending relevant features, resources, or interview preparation tips.

Remember, your role is to be a knowledgeable and supportive assistant, helping HeadStartAI users navigate the interview process and achieve their career goals.
`;

export async function POST(req) {
  try {
    const data = await req.json();

    if (!Array.isArray(data)) {
      return NextResponse.json({ error: "Invalid input: expected an array of messages" }, { status: 400 });
    }

    const chatCompletion = await groq.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: systemPrompt,
        },
        ...data,
      ],
      model: 'llama-3.1-70b-versatile',
      temperature: 1,
      max_tokens: 1024,
      top_p: 1,
      stream: true,
      stop: null
    });

    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        try {
          for await (const chunk of chatCompletion) {
            const content = chunk.choices[0]?.delta?.content;
            if (content) {
              const text = encoder.encode(content);
              controller.enqueue(text);
            }
          }
        } catch (err) {
          console.error("Streaming error:", err);
          controller.error(err);
        } finally {
          controller.close();
        }
      }
    });

    return new NextResponse(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    console.error("Error in POST handler:", error);
    return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 });
  }
}
