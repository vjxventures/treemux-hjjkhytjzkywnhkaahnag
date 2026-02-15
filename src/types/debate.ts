export interface DebateMessage {
  speaker: 'claude' | 'gpt' | 'system';
  content: string;
  timestamp: number;
}

export interface DebateAnalysis {
  claudeScore: number;
  gptScore: number;
  claudeStrengths: string[];
  gptStrengths: string[];
  winner: 'claude' | 'gpt' | 'tie';
  reasoning: string;
}

export interface UserVote {
  choice: 'claude' | 'gpt';
  timestamp: number;
}
