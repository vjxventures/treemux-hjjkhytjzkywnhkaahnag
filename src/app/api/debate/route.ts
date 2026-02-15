import { anthropic } from '@ai-sdk/anthropic';
import { openai } from '@ai-sdk/openai';
import { streamText } from 'ai';

export const runtime = 'edge';

interface DebateMessage {
  speaker: 'claude' | 'gpt' | 'system';
  content: string;
  timestamp: number;
}

export async function POST(req: Request) {
  const { topic, round, history } = await req.json();

  const isClaudeTurn = round % 2 === 0;
  const model = isClaudeTurn ? anthropic('claude-3-5-sonnet-20241022') : openai('gpt-4o');
  const currentSpeaker = isClaudeTurn ? 'Claude' : 'GPT-4o';
  const opponent = isClaudeTurn ? 'GPT-4o' : 'Claude';

  // Build conversation context
  const debateHistory = history
    .map((msg: DebateMessage) =>
      `${msg.speaker === 'claude' ? 'Claude' : msg.speaker === 'gpt' ? 'GPT-4o' : 'System'}: ${msg.content}`
    )
    .join('\n\n');

  const systemPrompt = `You are ${currentSpeaker}, participating in a formal debate against ${opponent}.

Topic: ${topic}

${round === 0 ? `This is your opening statement (Round 1). Present your position on this topic in 3-4 concise, compelling paragraphs. Be persuasive and set up your key arguments.` :
  round === 1 ? `This is ${opponent}'s opening statement. Now provide your opening statement (Round 1), taking a different or opposing perspective. Be persuasive and compelling in 3-4 paragraphs.` :
  `This is Round ${Math.floor(round / 2) + 1}. Respond to ${opponent}'s previous argument with:
1. A brief acknowledgment of their point
2. A strong counter-argument or rebuttal
3. New evidence or reasoning to support your position

Keep your response to 3-4 paragraphs. Be direct, persuasive, and engaging.`}

Previous debate exchanges:
${debateHistory || 'No previous exchanges yet.'}

Rules:
- Stay on topic
- Be respectful but assertive
- Use logical reasoning and examples
- Keep responses concise (3-4 paragraphs)
- Make compelling arguments that audiences will appreciate`;

  try {
    const result = streamText({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Provide your ${round < 2 ? 'opening statement' : 'response'} now.` }
      ],
      temperature: 0.8,
      maxTokens: 500,
    });

    return result.toDataStreamResponse({
      headers: {
        'X-Speaker': isClaudeTurn ? 'claude' : 'gpt',
        'X-Round': round.toString(),
      }
    });
  } catch (error) {
    console.error('Debate error:', error);
    return new Response(JSON.stringify({ error: 'Failed to generate debate response' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
