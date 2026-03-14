import { google } from '@ai-sdk/google';
import { generateObject } from 'ai';
import { z } from 'zod';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { transcript } = await req.json();

    const result = await generateObject({
      model: google('gemini-2.5-flash'),
      schema: z.object({
        projectTitle: z.string().describe("A concise specific title for the project."),
        totalBudget: z.number().describe("The estimated total budget based on the conversation context, or a default reasonable amount (e.g. 1000)."),
        milestonesJSON: z.string().describe("A stringified JSON array of milestone objects: [{title: string, description: string, deliverables: string[], estimatedDays: number, payoutAmount: number}]")
      }),
      prompt: `Analyze the following transcript between an Employer and the AI Project Manager. 
      Generate a structured project roadmap containing 3-5 well-defined, time-bound milestones.
      Ensure the total of all milestone payoutAmounts equals the totalBudget.
      Make the deliverables strictly verifiable strings (e.g., 'GitHub PR URL provided', 'Figma link provided').
      
      CRITICAL INSTRUCTION: You MUST return a single JSON object with EXACTLY three properties at the root level:
      1. "projectTitle": A concise string title for the project.
      2. "totalBudget": A number representing the total cost.
      3. "milestonesJSON": A stringified JSON array of the milestones. Do not use markdown backticks around the JSON string.
      
      Transcript:
      ${transcript}
      `,
    });

    const response = result.object as { projectTitle: string; totalBudget: number; milestonesJSON: string; };
    
    let milestones = [];
    try {
      milestones = JSON.parse(response.milestonesJSON);
    } catch (parseError) {
      console.error("Failed to parse milestonesJSON", parseError);
      throw new Error("Invalid milestones format from AI");
    }

    const cleanedResult = {
      projectTitle: response.projectTitle,
      totalBudget: response.totalBudget,
      milestones: milestones,
    };

    return NextResponse.json(cleanedResult);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to generate roadmap' }, { status: 500 });
  }
}
