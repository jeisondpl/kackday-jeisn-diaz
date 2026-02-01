import { LLMPort, LLMMessage, LLMCompletionOptions } from '../application/ports/LLMPort.js';
import { LoggerPort } from '../application/ports/LoggerPort.js';

interface OpenAIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface OpenAIChatCompletionRequest {
  model: string;
  messages: OpenAIMessage[];
  temperature?: number;
  max_tokens?: number;
  stop?: string[];
}

interface OpenAIChatCompletionResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

interface OpenAIEmbeddingRequest {
  model: string;
  input: string;
}

interface OpenAIEmbeddingResponse {
  object: string;
  data: Array<{
    object: string;
    embedding: number[];
    index: number;
  }>;
  model: string;
  usage: {
    prompt_tokens: number;
    total_tokens: number;
  };
}

export class OpenAILLMAdapter implements LLMPort {
  private readonly baseUrl: string;
  private readonly apiKey: string;
  private readonly model: string;
  private readonly embeddingsModel: string;
  private readonly defaultTemperature: number;
  private readonly defaultMaxTokens: number;
  private readonly logger: LoggerPort;

  constructor(
    baseUrl: string,
    apiKey: string,
    model: string,
    embeddingsModel: string,
    defaultTemperature: number,
    defaultMaxTokens: number,
    logger: LoggerPort
  ) {
    this.baseUrl = baseUrl.replace(/\/$/, ''); // Remove trailing slash
    this.apiKey = apiKey;
    this.model = model;
    this.embeddingsModel = embeddingsModel;
    this.defaultTemperature = defaultTemperature;
    this.defaultMaxTokens = defaultMaxTokens;
    this.logger = logger;
  }

  async complete(messages: LLMMessage[], options?: LLMCompletionOptions): Promise<string> {
    try {
      const requestBody: OpenAIChatCompletionRequest = {
        model: this.model,
        messages: messages.map((msg) => ({
          role: msg.role,
          content: msg.content,
        })),
        temperature: options?.temperature ?? this.defaultTemperature,
        max_tokens: options?.maxTokens ?? this.defaultMaxTokens,
        stop: options?.stopSequences,
      };

      this.logger.debug('Sending LLM completion request', {
        model: this.model,
        messageCount: messages.length,
      });

      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`LLM API error: ${response.status} - ${errorText}`);
      }

      const result: OpenAIChatCompletionResponse = await response.json();

      if (!result.choices || result.choices.length === 0) {
        throw new Error('No completion choices returned from LLM');
      }

      const content = result.choices[0].message.content;

      this.logger.debug('LLM completion successful', {
        tokens: result.usage?.total_tokens,
        finishReason: result.choices[0].finish_reason,
      });

      return content;
    } catch (error) {
      this.logger.error('LLM completion failed', error as Error);
      throw error;
    }
  }

  async embed(text: string): Promise<number[]> {
    try {
      const requestBody: OpenAIEmbeddingRequest = {
        model: this.embeddingsModel,
        input: text,
      };

      this.logger.debug('Generating embedding', {
        model: this.embeddingsModel,
        textLength: text.length,
      });

      const response = await fetch(`${this.baseUrl}/embeddings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Embeddings API error: ${response.status} - ${errorText}`);
      }

      const result: OpenAIEmbeddingResponse = await response.json();

      if (!result.data || result.data.length === 0) {
        throw new Error('No embeddings returned from API');
      }

      const embedding = result.data[0].embedding;

      this.logger.debug('Embedding generated successfully', {
        dimensions: embedding.length,
        tokens: result.usage.total_tokens,
      });

      return embedding;
    } catch (error) {
      this.logger.error('Embedding generation failed', error as Error);
      throw error;
    }
  }
}
