import { anthropic } from '@ai-sdk/anthropic';
import { generateObject } from 'ai';
import { z } from 'zod';

export const runtime = 'edge';

const analysisSchema = z.object({
  claudeScore: z.number().min(0).max(10).describe('Score for Claude (0-10)'),
  gptScore: z.number().min(0).max(10).describe('Score for GPT-4o (0-10)'),
  claudeStrengths: z.array(z.string()).describe('Key strengths of Claude arguments'),
  gptStrengths: z.array(z.string()).describe('Key strengths of GPT-4o arguments'),
  winner: z.enum(['claude', 'gpt', 'tie']).describe('Who made stronger arguments overall'),
  reasoning: z.string().describe('Brief explanation of the verdict'),
});

export async function POST(req: Request) {
  try {
    const { topic, history } = await req.json();

    const debateTranscript = history
      .map((msg: any) => {
        const speaker = msg.speaker === 'claude' ? 'Claude' : msg.speaker === 'gpt' ? 'GPT-4o' : 'System';
        return `${speaker}: ${msg.content}`;
      })
      .join('\n\n---\n\n');

    const result = await generateObject({
      model: anthropic('claude-3-5-sonnet-20241022'),
      schema: analysisSchema,
      messages: [
        {
          role: 'system',
          content: `You are an impartial debate judge. Analyze the following debate and score each participant.

Evaluation criteria:
- Logical reasoning and evidence
- Persuasiveness and clarity
- Addressing opponent's arguments
- Staying on topic
- Originality of ideas

Be fair and objective. Provide scores from 0-10 for each participant.`
        },
        {
          role: 'user',
          content: `Topic: ${topic}\n\nDebate Transcript:\n${debateTranscript}\n\nProvide your analysis and scores.`
        }
      ],
    });

    return Response.json(result.object);
  } catch (error) {
    console.error('Analysis error:', error);
    return new Response(JSON.stringify({ error: 'Failed to analyze debate' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
