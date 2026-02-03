
import { AgentConfig, AgentMessage } from './types';
import { callGemini, GeminiMessage } from './aiService';

export class BaseAgent {
  config: AgentConfig;
  messages: AgentMessage[];

  constructor(config: AgentConfig) {
    this.config = config;
    this.messages = [];
  }

  async chat(
    userMessage: string,
    onStream?: (chunk: string) => void
  ): Promise<string> {
    const userMsg: AgentMessage = {
      id: `msg_${Date.now()}_u`,
      role: 'user',
      content: userMessage,
      timestamp: Date.now(),
    };
    this.messages.push(userMsg);

    const geminiMessages: GeminiMessage[] = this.messages
      .filter(m => m.role !== 'system')
      .map(msg => ({
        role: (msg.role === 'user' ? 'user' : 'model') as 'user' | 'model',
        parts: [{ text: msg.content }],
      }));

    const response = await callGemini(
      this.config.systemPrompt,
      geminiMessages,
      onStream
    );

    const agentMsg: AgentMessage = {
      id: `msg_${Date.now()}_a`,
      role: 'agent',
      content: response,
      timestamp: Date.now(),
      agentId: this.config.id,
    };
    this.messages.push(agentMsg);

    return response;
  }

  clearHistory() {
    this.messages = [];
  }

  getHistory(): AgentMessage[] {
    return [...this.messages];
  }
}
