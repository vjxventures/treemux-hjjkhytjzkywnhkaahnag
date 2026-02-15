'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import type { DebateMessage, DebateAnalysis, UserVote } from '@/types/debate';

export default function DebateArena() {
  const [topic, setTopic] = useState('');
  const [debateStarted, setDebateStarted] = useState(false);
  const [messages, setMessages] = useState<DebateMessage[]>([]);
  const [currentRound, setCurrentRound] = useState(0);
  const [isStreaming, setIsStreaming] = useState(false);
  const [analysis, setAnalysis] = useState<DebateAnalysis | null>(null);
  const [userVote, setUserVote] = useState<UserVote | null>(null);
  const [showResults, setShowResults] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const maxRounds = 6; // 3 rounds each (opening + 2 rebuttals)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const startDebate = () => {
    if (!topic.trim()) return;
    setDebateStarted(true);
    setMessages([
      {
        speaker: 'system',
        content: `Debate Topic: "${topic}"`,
        timestamp: Date.now(),
      },
    ]);
    setCurrentRound(0);
    performDebateRound(0, []);
  };

  const performDebateRound = async (round: number, history: DebateMessage[]) => {
    if (round >= maxRounds) {
      // Debate complete, analyze
      await analyzeDebate(history);
      return;
    }

    setIsStreaming(true);

    try {
      const response = await fetch('/api/debate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic, round, history }),
      });

      if (!response.ok) throw new Error('Failed to get response');

      const speaker = response.headers.get('X-Speaker') as 'claude' | 'gpt';
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      let accumulatedText = '';

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          accumulatedText += chunk;

          setMessages((prev) => {
            const newMessages = [...prev];
            const lastMessage = newMessages[newMessages.length - 1];

            if (lastMessage && lastMessage.speaker === speaker && lastMessage.timestamp === -1) {
              lastMessage.content = accumulatedText;
            } else {
              newMessages.push({
                speaker,
                content: accumulatedText,
                timestamp: -1,
              });
            }

            return newMessages;
          });
        }
      }

      // Finalize message
      setMessages((prev) => {
        const newMessages = [...prev];
        const lastMessage = newMessages[newMessages.length - 1];
        if (lastMessage && lastMessage.timestamp === -1) {
          lastMessage.timestamp = Date.now();
        }
        return newMessages;
      });

      const finalHistory = [
        ...history,
        { speaker, content: accumulatedText, timestamp: Date.now() },
      ];

      setIsStreaming(false);
      setCurrentRound(round + 1);

      // Continue to next round after a pause
      setTimeout(() => performDebateRound(round + 1, finalHistory), 1500);
    } catch (error) {
      console.error('Debate round error:', error);
      setIsStreaming(false);
    }
  };

  const analyzeDebate = async (history: DebateMessage[]) => {
    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic, history }),
      });

      if (!response.ok) throw new Error('Failed to analyze');

      const result = await response.json();
      setAnalysis(result);
      setShowResults(true);
    } catch (error) {
      console.error('Analysis error:', error);
    }
  };

  const handleVote = (choice: 'claude' | 'gpt') => {
    setUserVote({ choice, timestamp: Date.now() });
  };

  const reset = () => {
    setTopic('');
    setDebateStarted(false);
    setMessages([]);
    setCurrentRound(0);
    setAnalysis(null);
    setUserVote(null);
    setShowResults(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 text-white">
      {/* Animated background effects */}
      <div className="fixed inset-0 opacity-20">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(120,119,198,0.3),rgba(255,255,255,0))]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(255,184,108,0.2),rgba(255,255,255,0))]" />
      </div>

      {/* Header */}
      <header className="relative border-b border-white/10 backdrop-blur-sm">
        <div className="container mx-auto px-6 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-5xl font-serif font-bold tracking-tight bg-gradient-to-r from-blue-200 via-amber-200 to-blue-200 bg-clip-text text-transparent animate-in fade-in slide-in-from-top-4 duration-1000">
                DebateAI Arena
              </h1>
              <p className="mt-2 text-slate-400 font-light animate-in fade-in slide-in-from-top-4 duration-1000 delay-150">
                Watch Claude and GPT-4o debate in real-time
              </p>
            </div>
            {debateStarted && (
              <Button
                onClick={reset}
                variant="outline"
                className="border-amber-500/50 text-amber-200 hover:bg-amber-500/10"
              >
                New Debate
              </Button>
            )}
          </div>
        </div>
      </header>

      <main className="relative container mx-auto px-6 py-12">
        {!debateStarted ? (
          <div className="max-w-2xl mx-auto animate-in fade-in zoom-in-95 duration-700">
            <Card className="bg-slate-900/50 border-white/10 backdrop-blur-xl p-12">
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-blue-500/20 to-amber-500/20 mb-6 animate-pulse">
                  <svg
                    className="w-12 h-12 text-amber-300"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3"
                    />
                  </svg>
                </div>
                <h2 className="text-3xl font-serif font-bold mb-3">Choose Your Topic</h2>
                <p className="text-slate-400">
                  Enter any topic and watch two AI minds debate it in real-time
                </p>
              </div>

              <div className="space-y-6">
                <div>
                  <Input
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && startDebate()}
                    placeholder="e.g., Is AI beneficial for humanity?"
                    className="bg-slate-800/50 border-white/20 text-lg py-6 text-white placeholder:text-slate-500"
                  />
                </div>

                <Button
                  onClick={startDebate}
                  disabled={!topic.trim()}
                  className="w-full bg-gradient-to-r from-blue-600 to-amber-600 hover:from-blue-500 hover:to-amber-500 text-white font-semibold py-6 text-lg shadow-lg shadow-blue-500/25"
                >
                  Start Debate
                </Button>

                <div className="grid grid-cols-3 gap-4 pt-6">
                  {['Universal basic income', 'Remote work vs office', 'Space exploration priority'].map(
                    (suggestion, i) => (
                      <button
                        key={i}
                        onClick={() => setTopic(suggestion)}
                        className="text-xs text-slate-400 hover:text-amber-300 border border-white/10 rounded-lg px-3 py-2 hover:border-amber-500/50 transition-all"
                      >
                        {suggestion}
                      </button>
                    )
                  )}
                </div>
              </div>
            </Card>
          </div>
        ) : (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
            {/* Round indicator */}
            <div className="flex items-center justify-center gap-6">
              <div className="text-center">
                <p className="text-sm text-slate-400 uppercase tracking-wider font-mono mb-2">
                  Round Progress
                </p>
                <div className="flex items-center gap-3">
                  <Progress value={(currentRound / maxRounds) * 100} className="w-64 h-2" />
                  <span className="text-sm font-mono text-slate-300">
                    {currentRound}/{maxRounds}
                  </span>
                </div>
              </div>
            </div>

            {/* Debate messages */}
            <div className="space-y-6">
              {messages.map((msg, idx) => {
                if (msg.speaker === 'system') {
                  return (
                    <div
                      key={idx}
                      className="text-center py-6 animate-in fade-in zoom-in-95 duration-500"
                    >
                      <Badge className="bg-gradient-to-r from-blue-500/20 to-amber-500/20 text-amber-200 border-amber-500/30 px-6 py-2 text-base">
                        {msg.content}
                      </Badge>
                    </div>
                  );
                }

                const isClaude = msg.speaker === 'claude';
                const isGPT = msg.speaker === 'gpt';

                return (
                  <div
                    key={idx}
                    className={`flex gap-6 animate-in fade-in slide-in-from-${
                      isClaude ? 'left' : 'right'
                    }-8 duration-700`}
                    style={{ animationDelay: `${idx * 100}ms` }}
                  >
                    <div
                      className={`flex-1 ${isClaude ? 'order-1' : 'order-2'} ${
                        isGPT ? 'text-right' : ''
                      }`}
                    >
                      <Card
                        className={`p-6 ${
                          isClaude
                            ? 'bg-blue-950/30 border-blue-500/30'
                            : 'bg-amber-950/30 border-amber-500/30'
                        } backdrop-blur-sm`}
                      >
                        <div className="flex items-center gap-3 mb-4">
                          <div
                            className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                              isClaude
                                ? 'bg-gradient-to-br from-blue-500 to-blue-600'
                                : 'bg-gradient-to-br from-amber-500 to-amber-600'
                            }`}
                          >
                            {isClaude ? 'C' : 'G'}
                          </div>
                          <div>
                            <p className="font-semibold">
                              {isClaude ? 'Claude 3.5 Sonnet' : 'GPT-4o'}
                            </p>
                            <p className="text-xs text-slate-400 font-mono">
                              {msg.timestamp > 0
                                ? new Date(msg.timestamp).toLocaleTimeString()
                                : 'Speaking...'}
                            </p>
                          </div>
                        </div>
                        <p className="text-slate-200 leading-relaxed whitespace-pre-wrap">
                          {msg.content}
                        </p>
                      </Card>
                    </div>
                    <div className={`w-1/3 ${isClaude ? 'order-2' : 'order-1'}`} />
                  </div>
                );
              })}

              {isStreaming && (
                <div className="text-center py-4">
                  <div className="inline-flex items-center gap-2 text-slate-400">
                    <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                    <div
                      className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"
                      style={{ animationDelay: '0.2s' }}
                    />
                    <div
                      className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"
                      style={{ animationDelay: '0.4s' }}
                    />
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Results panel */}
            {showResults && analysis && (
              <div className="mt-12 animate-in fade-in zoom-in-95 duration-1000">
                <Card className="bg-gradient-to-br from-slate-900/80 to-slate-800/80 border-white/20 backdrop-blur-xl p-8">
                  <h2 className="text-3xl font-serif font-bold text-center mb-8 bg-gradient-to-r from-blue-200 to-amber-200 bg-clip-text text-transparent">
                    Debate Analysis
                  </h2>

                  <div className="grid md:grid-cols-2 gap-8 mb-8">
                    {/* Claude scores */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-xl font-semibold text-blue-300">Claude 3.5 Sonnet</h3>
                        <span className="text-3xl font-bold">{analysis.claudeScore}/10</span>
                      </div>
                      <Progress
                        value={analysis.claudeScore * 10}
                        className="h-3 bg-slate-700"
                      />
                      <div className="space-y-2">
                        {analysis.claudeStrengths.map((strength, i) => (
                          <div key={i} className="flex items-start gap-2 text-sm text-slate-300">
                            <span className="text-blue-400">✓</span>
                            <span>{strength}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* GPT scores */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-xl font-semibold text-amber-300">GPT-4o</h3>
                        <span className="text-3xl font-bold">{analysis.gptScore}/10</span>
                      </div>
                      <Progress value={analysis.gptScore * 10} className="h-3 bg-slate-700" />
                      <div className="space-y-2">
                        {analysis.gptStrengths.map((strength, i) => (
                          <div key={i} className="flex items-start gap-2 text-sm text-slate-300">
                            <span className="text-amber-400">✓</span>
                            <span>{strength}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Winner announcement */}
                  <div className="text-center py-8 border-t border-white/10">
                    <p className="text-sm text-slate-400 uppercase tracking-wider mb-3">
                      Verdict
                    </p>
                    <p className="text-2xl font-serif font-bold mb-4">
                      {analysis.winner === 'tie' ? (
                        <span className="text-slate-300">Tied Debate</span>
                      ) : (
                        <span
                          className={
                            analysis.winner === 'claude' ? 'text-blue-300' : 'text-amber-300'
                          }
                        >
                          {analysis.winner === 'claude' ? 'Claude 3.5 Sonnet' : 'GPT-4o'} Wins
                        </span>
                      )}
                    </p>
                    <p className="text-slate-400 max-w-2xl mx-auto">{analysis.reasoning}</p>
                  </div>

                  {/* User voting */}
                  {!userVote && (
                    <div className="mt-8 pt-8 border-t border-white/10">
                      <p className="text-center text-slate-300 mb-4 font-semibold">
                        Who do you think won?
                      </p>
                      <div className="flex gap-4 justify-center">
                        <Button
                          onClick={() => handleVote('claude')}
                          className="bg-blue-600 hover:bg-blue-500 px-8"
                        >
                          Claude
                        </Button>
                        <Button
                          onClick={() => handleVote('gpt')}
                          className="bg-amber-600 hover:bg-amber-500 px-8"
                        >
                          GPT-4o
                        </Button>
                      </div>
                    </div>
                  )}

                  {userVote && (
                    <div className="mt-8 pt-8 border-t border-white/10 text-center">
                      <p className="text-slate-400">
                        You voted for:{' '}
                        <span
                          className={`font-bold ${
                            userVote.choice === 'claude' ? 'text-blue-300' : 'text-amber-300'
                          }`}
                        >
                          {userVote.choice === 'claude' ? 'Claude' : 'GPT-4o'}
                        </span>
                      </p>
                    </div>
                  )}
                </Card>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="relative mt-24 border-t border-white/10 backdrop-blur-sm">
        <div className="container mx-auto px-6 py-8 text-center text-slate-500 text-sm">
          <p>Built for TreeHacks 2026 • Powered by Claude & GPT-4o via AI SDK</p>
        </div>
      </footer>
    </div>
  );
}
