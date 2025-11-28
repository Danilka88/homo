// llm/ollamaService.ts

/**
 * @fileoverview Сервис для взаимодействия с локальным API Ollama.
 * Позволяет генерировать текст с помощью указанной модели и проверять
 * доступность сервера и конкретной модели.
 */

// --- Типы данных для API Ollama ---

/**
 * Тело запроса для генерации текста.
 */
interface OllamaGenerateRequest {
  model: string;
  prompt: string;
  stream: boolean;
}

/**
 * Ответ от API генерации (в не-стриминговом режиме).
 */
interface OllamaGenerateResponse {
  model: string;
  created_at: string;
  response: string;
  done: boolean;
  context: number[];
  total_duration: number;
  load_duration: number;
  prompt_eval_count: number;
  eval_count: number;
  eval_duration: number;
}

/**
 * Ответ от API для получения списка моделей.
 */
interface OllamaTagsResponse {
  models: {
    name: string;
    modified_at: string;
    size: number;
  }[];
}


// --- Константы ---

const OLLAMA_API_BASE_URL = 'http://localhost:11434';
const TARGET_MODEL = 'gemma3:27b';


// --- Публичные функции сервиса ---

/**
 * Проверяет, запущен ли сервер Ollama.
 * @returns {Promise<boolean>} `true`, если сервер отвечает.
 */
export async function isOllamaRunning(): Promise<boolean> {
  try {
    const response = await fetch(OLLAMA_API_BASE_URL, {
      method: 'HEAD', // Используем HEAD для легковесной проверки
      signal: AbortSignal.timeout(1500) // Таймаут, чтобы не ждать вечно
    });
    // Сервер отвечает, даже если это 404, значит он запущен
    return response.status > 0;
  } catch (error) {
    // Ошибка сети означает, что сервер недоступен
    console.warn(`Ollama service is not available at ${OLLAMA_API_BASE_URL}.`, error);
    return false;
  }
}

/**
 * Проверяет, доступна ли на сервере Ollama модель 'gemma3:27b'.
 * @returns {Promise<boolean>} `true`, если модель найдена.
 */
export async function checkOllamaModel(): Promise<boolean> {
  if (!(await isOllamaRunning())) {
    return false;
  }

  try {
    const response = await fetch(`${OLLAMA_API_BASE_URL}/api/tags`);
    if (!response.ok) {
      throw new Error(`Failed to fetch models, status: ${response.status}`);
    }
    const data: OllamaTagsResponse = await response.json();
    
    const modelExists = data.models.some(model => model.name.includes(TARGET_MODEL));
    if (!modelExists) {
        console.warn(`Target model "${TARGET_MODEL}" not found on Ollama server.`);
    }
    return modelExists;

  } catch (error) {
    console.error('Error checking for Ollama model:', error);
    return false;
  }
}

/**
 * Генерирует текст, используя модель 'gemma3:27b' в Ollama.
 * @param {string} prompt - Текстовый запрос для модели.
 * @returns {Promise<string>} Сгенерированный текст.
 */
export async function generateText(prompt: string): Promise<string> {
  if (!(await isOllamaRunning())) {
    throw new Error('Ollama service is not running.');
  }

  try {
    const requestBody: OllamaGenerateRequest = {
      model: TARGET_MODEL,
      prompt: prompt,
      stream: false, // Для простоты используем не-стриминговый ответ
    };

    const response = await fetch(`${OLLAMA_API_BASE_URL}/api/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`Ollama API request failed with status ${response.status}: ${errorBody}`);
    }

    const data: OllamaGenerateResponse = await response.json();
    return data.response;

  } catch (error) {
    console.error('Error generating text with Ollama:', error);
    throw error; // Перебрасываем ошибку для обработки на уровне UI
  }
}
