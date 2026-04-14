import { google } from '@ai-sdk/google';
import { convertToModelMessages, streamText } from 'ai';
import { buildWorkflowSystemPrompt } from '@/lib/workflow-ai/systemPrompt';

export const maxDuration = 30;

export async function POST(req: Request) {
  const { messages, workflowContext } = await req.json();
  const modelMessages = await convertToModelMessages(messages ?? []);

  const result = streamText({
    model: google('gemini-2.5-flash'),
    messages: modelMessages,
    system: buildWorkflowSystemPrompt(workflowContext),
  });

  return result.toUIMessageStreamResponse();
}
