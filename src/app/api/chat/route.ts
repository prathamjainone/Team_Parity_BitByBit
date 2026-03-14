import { google } from '@ai-sdk/google';
import { streamText } from 'ai';

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request) {
  const { messages } = await req.json();

  const result = await streamText({
    model: google('gemini-2.5-flash'),
    system: `You are an Autonomous AI Project Manager. Your job is to act as an intake agent for employers who want to hire freelancers. 
    1. Ask them about their project vision, goals, and technical requirements. 
    2. Guide them to be specific if they are too vague.
    3. Keep responses relatively short and professional. 
    4. Once you have enough context to break the project down into 3-5 clear milestones, politely inform them that you are generating the roadmap and escrow terms.`,
    messages,
  });

  return result.toDataStreamResponse();
}
