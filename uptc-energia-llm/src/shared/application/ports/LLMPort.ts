/**
 * Puerto para interactuar con LLMs (OpenAI-compatible)
 */
export interface LLMMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface LLMCompletionOptions {
  temperature?: number;
  maxTokens?: number;
  stopSequences?: string[];
}

export interface LLMPort {
  /**
   * Generar completion dado un prompt o mensajes
   */
  complete(messages: LLMMessage[], options?: LLMCompletionOptions): Promise<string>;

  /**
   * Generar embeddings para texto
   */
  embed(text: string): Promise<number[]>;
}
