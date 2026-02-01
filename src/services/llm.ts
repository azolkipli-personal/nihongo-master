import { Conversation } from '../types';

export interface LLMResponse {
  conversations: Array<{
    title: string;
    dialogue: Array<{
      speaker: string;
      japanese: string;
      japaneseWithFurigana: string;
      romaji: string;
      english: string;
    }>;
  }>;
}

export const FREE_GEMINI_MODELS = [
  { id: 'gemini-3-flash-preview', name: 'Gemini 3 Flash (Free)', provider: 'puter' },
  { id: 'gemini-3-pro-preview', name: 'Gemini 3 Pro (Free)', provider: 'puter' },
  { id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro (Free)', provider: 'puter' },
  { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash (Free)', provider: 'puter' },
  { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash (Free)', provider: 'puter' },
  { id: 'gemini-2.5-flash-lite', name: 'Gemini 2.5 Flash Lite (Free)', provider: 'puter' },
  { id: 'gemini-pro', name: 'Gemini Pro (API)', provider: 'gemini' },
  { id: 'gemini-pro-vision', name: 'Gemini Pro Vision (API)', provider: 'gemini' },
];

// Load Puter.js script for free Gemini access
let puterLoaded = false;
export function loadPuterJS() {
  if (puterLoaded || typeof window === 'undefined') return Promise.resolve();
  
  return new Promise<void>((resolve) => {
    const script = document.createElement('script');
    script.src = 'https://js.puter.com/v2/';
    script.onload = () => {
      puterLoaded = true;
      resolve();
    };
    script.onerror = () => {
      console.error('Failed to load Puter.js');
      resolve(); // Continue without Puter
    };
    document.head.appendChild(script);
  });
}

export async function generateConversation(
  words: string[],
  scenario: string,
  service: string,
  apiKey: string,
  ollamaUrl?: string,
  model?: string
): Promise<LLMResponse> {
  let prompt = buildConversationPrompt(words, scenario);

  // Check if it's a Puter-based free Gemini model
  const geminiModel = FREE_GEMINI_MODELS.find(m => m.id === model && m.provider === 'puter');
  if (geminiModel && service === 'gemini') {
    // Use simpler prompt for Puter that requests alternating lines
    prompt = buildPuterConversationPrompt(words, scenario);
    return callPuterGemini(prompt, geminiModel.id);
  }

  switch (service) {
    case 'gemini':
      return callGemini(prompt, apiKey);
    case 'openrouter':
      return callOpenRouter(prompt, apiKey);
    case 'cohere':
      return callCohere(prompt, apiKey);
    case 'ollama':
      return callOllama(prompt, ollamaUrl || 'http://localhost:11434');
    default:
      throw new Error(`Unknown service: ${service}`);
  }
}

export async function generateSentenceUpgrade(
  sentence: string,
  targetLevel: string,
  service: string,
  apiKey: string,
  ollamaUrl?: string,
  model?: string
): Promise<{ upgraded: string; explanation: string }> {
  const prompt = buildUpgradePrompt(sentence, targetLevel);

  // Check if it's a Puter-based free Gemini model
  const geminiModel = FREE_GEMINI_MODELS.find(m => m.id === model && m.provider === 'puter');
  if (geminiModel && service === 'gemini') {
    return callPuterGeminiForUpgrade(prompt, geminiModel.id);
  }

  switch (service) {
    case 'gemini':
      return callGeminiForUpgrade(prompt, apiKey);
    case 'openrouter':
      return callOpenRouterForUpgrade(prompt, apiKey);
    case 'cohere':
      return callCohereForUpgrade(prompt, apiKey);
    case 'ollama':
      return callOllamaForUpgrade(prompt, ollamaUrl || 'http://localhost:11434');
    default:
      throw new Error(`Unknown service: ${service}`);
  }
}

function buildConversationPrompt(words: string[], scenario: string): string {
  return `Generate 5 Japanese conversations using the following vocabulary words: ${words.join(', ')}

Scenario/Context: ${scenario || 'Daily conversation'}

Requirements:
- Generate 5 different conversations, each with 6-8 exchanges
- Use the vocabulary words naturally in context
- Include both casual and formal speech where appropriate
- Add furigana in format: 漢字[かんじ]
- Include romaji transliteration
- Provide English translations

Return ONLY valid JSON in this exact format:
{
  "conversations": [
    {
      "title": "Brief title in English",
      "dialogue": [
        {
          "speaker": "A",
          "japanese": "Natural Japanese sentence",
          "japaneseWithFurigana": "Japanese with 漢字[かんじ] furigana format",
          "romaji": "Romaji transliteration",
          "english": "English translation"
        }
      ]
    }
  ]
}`;
}

function buildPuterConversationPrompt(words: string[], scenario: string): string {
  const wordList = words.join(', ');
  return `Create a comprehensive Japanese learning resource for these vocabulary words: ${wordList}

Scenario: ${scenario || 'IT engineering company workplace conversations'}

IMPORTANT: Structure your response EXACTLY as shown below. Do not deviate from this format:

=== WORD DETAILS ===
Kanji: ${words[0] || '会議'}
Kana: ${words[0]?.includes('開発') ? 'かいはつ' : words[0]?.includes('不具合') ? 'ふぐあい' : words[0]?.includes('提案') ? 'ていあん' : 'かいぎ'}
Romaji: ${words[0]?.includes('開発') ? 'kaihatsu' : words[0]?.includes('不具合') ? 'fuguai' : words[0]?.includes('提案') ? 'teian' : 'kaigi'}

=== WORD MEANING ===
${words[0] || '会議'} in the context of an IT engineering company refers to ${words[0] || 'meetings and development discussions'}. This term is commonly used when discussing project planning, team coordination, and technical decision-making processes. It encompasses both formal meetings and informal development discussions in professional software development environments.

=== CONVERSATIONS ===
Project Kick-off Meeting
田中[たなか] (Tanaka): 今回[こんかい]のプロジェクトの${words[0] || '会議[かいぎ]'}はいつから始[はじ]まりますか？
English: When will the ${words[0] || 'meeting'} for this project begin?
山田[やまだ] (Yamada): 来週[らいしゅう]の月曜日[げつようび]から始[はじ]める予定[よてい]です。
English: We plan to start from next Monday.

Development Progress Discussion  
佐藤[さとう] (Satou): ${words[0] || '会議[かいぎ]'}の進捗[しんちょく]はどうですか？
English: How is the ${words[0] || 'meeting'} progress?
鈴木[すずき] (Suzuki): 順調[じゅんちょう]に進[すす]んでいます。
English: It's progressing smoothly.

Technical Review Meeting
高橋[たかはし] (Takahashi): ${words[0] || '会議[かいぎ]'}で決定[けってい]した事項[じこう]を確認[かくにん]しましょう。
English: Let's confirm the items decided in the ${words[0] || 'meeting'}.
伊藤[いとう] (Ito): はい、資料[しりょう]を準備[じゅんび]しました。
English: Yes, I have prepared the materials.

Requirements:
- Use ALL vocabulary words: ${wordList}
- Include proper Japanese business etiquette
- Add furigana for names: 田中[たなか] (Tanaka)
- Make conversations realistic for IT workplace
- Provide comprehensive word explanations
- Format EXACTLY as shown above`;
}

function buildUpgradePrompt(sentence: string, targetLevel: string): string {
  return `Upgrade the following Japanese sentence to ${targetLevel} CEFR level business Japanese:

Original sentence: ${sentence}
Target level: ${targetLevel}

Requirements:
- Maintain the same meaning
- Use appropriate ${targetLevel} grammar patterns and vocabulary
- Use formal business register
- Add furigana in format: 漢字[かんじ]
- Explain what changes were made and why

Return ONLY valid JSON in this exact format:
{
  "upgraded": "The upgraded Japanese sentence with 漢字[ふりがな] format",
  "explanation": "Explanation of the grammatical and vocabulary changes made"
}`;
}

async function callPuterGemini(prompt: string, model: string): Promise<LLMResponse> {
  try {
    await loadPuterJS();
    
    if (typeof (window as any).puter === 'undefined') {
      throw new Error('Puter.js failed to load. Please check your internet connection.');
    }

    const response = await (window as any).puter.ai.chat(prompt, { model });
    
    // Handle different response formats from Puter.js
    let responseText = '';
    if (typeof response === 'string') {
      responseText = response;
    } else if (response && response.text) {
      responseText = response.text;
    } else if (response && response.message && response.message.content) {
      // Handle the Google AI Studio format that returns message object
      responseText = response.message.content;
    } else if (response && typeof response === 'object') {
      // Try to extract text from various possible response formats
      responseText = JSON.stringify(response);
    }
    
    if (!responseText) {
      throw new Error('Empty response from Puter.ai');
    }
    
    console.log('Puter response:', responseText); // Debug log
    
    // Parse the structured response
    const lines = responseText.split('\n').filter((line: string) => line.trim());
    const conversations = [];
    
    let currentSection = '';
    let currentConversation = null;
    let wordDetails = { kanji: '', kana: '', romaji: '' };
    let wordMeaning = '';
    
    for (const line of lines) {
      const trimmedLine = line.trim();
      
      if (trimmedLine.includes('=== WORD DETAILS ===')) {
        currentSection = 'wordDetails';
        continue;
      }
      if (trimmedLine.includes('=== WORD MEANING ===')) {
        currentSection = 'wordMeaning';
        continue;
      }
      if (trimmedLine.includes('=== CONVERSATIONS ===')) {
        currentSection = 'conversations';
        continue;
      }
      
      if (currentSection === 'wordDetails') {
        if (trimmedLine.startsWith('Kanji:')) {
          wordDetails.kanji = trimmedLine.replace('Kanji:', '').trim();
        } else if (trimmedLine.startsWith('Kana:')) {
          wordDetails.kana = trimmedLine.replace('Kana:', '').trim();
        } else if (trimmedLine.startsWith('Romaji:')) {
          wordDetails.romaji = trimmedLine.replace('Romaji:', '').trim();
        }
      } else if (currentSection === 'wordMeaning') {
        if (trimmedLine && !trimmedLine.includes('===')) {
          wordMeaning += trimmedLine + ' ';
        }
      } else if (currentSection === 'conversations') {
        if (trimmedLine && !trimmedLine.includes('===') && !trimmedLine.startsWith('---')) {
          if (trimmedLine.includes(':')) {
            // This is a dialogue line
            const parts = trimmedLine.split(':');
            const speaker = parts[0].trim();
            const japanese = parts.slice(1).join(':').trim();
            
            if (currentConversation) {
              const dialogueItem = {
                speaker: speaker,
                japanese: japanese,
                japaneseWithFurigana: japanese,
                romaji: '',
                english: ''
              };
              currentConversation.dialogue.push(dialogueItem);
            }
          } else if (trimmedLine.startsWith('English:')) {
            // This is the English translation for the previous Japanese line
            const english = trimmedLine.replace('English:', '').trim();
            if (currentConversation && currentConversation.dialogue.length > 0) {
              const lastItem = currentConversation.dialogue[currentConversation.dialogue.length - 1];
              (lastItem as any).english = english;
            }
          } else if (!trimmedLine.startsWith('English:') && trimmedLine.length > 0 && !currentConversation) {
            // This might be a conversation title
            currentConversation = {
              title: trimmedLine,
              dialogue: [] as any[],
              wordDetails: wordDetails,
              meaning: wordMeaning.trim()
            };
          }
        }
      }
    }
    
    // If we successfully parsed conversations, return them
    if (currentConversation && currentConversation.dialogue.length > 0) {
      conversations.push(currentConversation);
    }
    
    // If no structured conversations were found, create a simple fallback
    if (conversations.length === 0) {
      // Try to extract any dialogue patterns from the raw text
      const dialogueMatches = responseText.match(/([^:]+):\s*([^\n]+)/g);
      if (dialogueMatches && dialogueMatches.length > 0) {
        const fallbackDialogue = dialogueMatches.map((match: string) => {
          const parts = match.split(':');
          return {
            speaker: parts[0].trim(),
            japanese: parts.slice(1).join(':').trim(),
            japaneseWithFurigana: parts.slice(1).join(':').trim(),
            romaji: '',
            english: ''
          };
        });
        
        conversations.push({
          title: 'Japanese Conversation',
          dialogue: fallbackDialogue,
          wordDetails: { kanji: '', kana: '', romaji: '' },
          meaning: 'Generated conversation'
        });
      } else {
        // Ultimate fallback
        // Try a more sophisticated parsing approach for the raw response
        const japaneseSentences: string[] = [];
        const englishSentences: string[] = [];
        
        // Split by sentence endings and process each sentence
        const sentences = responseText.split(/[。！？.!?]/).filter(s => s.trim());
        
        sentences.forEach(sentence => {
          const cleanSentence = sentence.trim();
          if (cleanSentence.length < 5) return; // Skip very short fragments
          
          // Check if this is primarily Japanese
          const japaneseChars = (cleanSentence.match(/[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/g) || []).length;
          const englishChars = (cleanSentence.match(/[A-Za-z]/g) || []).length;
          
          if (japaneseChars > englishChars && japaneseChars > 3) {
            japaneseSentences.push(cleanSentence);
          } else if (englishChars > 5) {
            englishSentences.push(cleanSentence);
          }
        });
        
        // Create dialogue pairs
        const dialogue: any[] = [];
        const maxLength = Math.max(japaneseSentences.length, englishSentences.length);
        for (let i = 0; i < maxLength; i++) {
          dialogue.push({
            speaker: 'Person A',
            japanese: japaneseSentences[i] || 'Japanese text not available',
            japaneseWithFurigana: japaneseSentences[i] || 'Japanese text not available',
            romaji: '', // Will be added later
            english: englishSentences[i] || 'Translation not available'
          });
        }
        
        conversations.push({
          title: 'Parsed Conversation',
          dialogue: dialogue,
          wordDetails: { kanji: '', kana: '', romaji: '' },
          meaning: 'Generated from mixed Japanese-English response'
        });
      }
    }

    // Format for the app
    const formattedConversations: Conversation[] = conversations.map(conv => ({
      id: Date.now().toString() + Math.random(),
      title: conv.title || 'Japanese Conversation',
      words: [], // Will be populated by the calling function
      scenario: 'IT engineering company workplace',
      service: 'puter',
      createdAt: new Date(),
      dialogue: conv.dialogue.map((d: any) => ({
        speaker: d.speaker,
        japanese: d.japanese,
        japaneseWithFurigana: d.japaneseWithFurigana || d.japanese,
        romaji: d.romaji || '',
        english: d.english
      })),
      wordDetails: conv.wordDetails,
      meaning: conv.meaning
    }));

    return {
      conversations: formattedConversations as any
    };
  } catch (error) {
    console.error('Puter Gemini API error:', error);
    throw new Error(`Failed to generate conversation with ${model}: ${(error as Error).message}`);
  }
}

async function callGemini(prompt: string, apiKey: string): Promise<LLMResponse> {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.7, maxOutputTokens: 8192 },
      }),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Gemini API error: ${error}`);
  }

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
  return parseLLMResponse(text);
}

async function callOpenRouter(prompt: string, apiKey: string): Promise<LLMResponse> {
  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
      'HTTP-Referer': 'https://nihongo-master.app',
      'X-Title': 'Nihongo Master',
    },
    body: JSON.stringify({
      model: 'anthropic/claude-3.5-sonnet',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenRouter API error: ${error}`);
  }

  const data = await response.json();
  const text = data.choices?.[0]?.message?.content || '';
  return parseLLMResponse(text);
}

async function callCohere(prompt: string, apiKey: string): Promise<LLMResponse> {
  const response = await fetch('https://api.cohere.ai/v1/generate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'command-r',
      prompt,
      temperature: 0.7,
      max_tokens: 8000,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Cohere API error: ${error}`);
  }

  const data = await response.json();
  const text = data.generations?.[0]?.text || '';
  return parseLLMResponse(text);
}

async function callOllama(prompt: string, url: string): Promise<LLMResponse> {
  const response = await fetch(`${url}/api/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'llama3.2',
      prompt,
      stream: false,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Ollama API error: ${error}`);
  }

  const data = await response.json();
  const text = data.response || '';
  return parseLLMResponse(text);
}

async function callPuterGeminiForUpgrade(prompt: string, model: string): Promise<{ upgraded: string; explanation: string }> {
  try {
    await loadPuterJS();
    
    if (typeof (window as any).puter === 'undefined') {
      throw new Error('Puter.js failed to load. Please check your internet connection.');
    }

    const response = await (window as any).puter.ai.chat(prompt, { model });
    
    // Parse the response to extract upgraded sentence and explanation
    const lines = response.split('\n').filter((line: string) => line.trim());
    
    let upgraded = '';
    let explanation = '';
    
    // Simple parsing - look for common patterns
    for (const line of lines) {
      if (line.toLowerCase().includes('upgraded') || line.toLowerCase().includes('improved')) {
        upgraded = line.replace(/^(upgraded|improved)\s*[:\-]?\s*/i, '');
      } else if (line.toLowerCase().includes('explanation') || line.toLowerCase().includes('because')) {
        explanation = line.replace(/^explanation\s*[:\-]?\s*/i, '');
      }
    }
    
    // Fallback if parsing fails
    if (!upgraded) upgraded = response.split('\n')[0] || response;
    if (!explanation) explanation = response;

    return { upgraded, explanation };
  } catch (error) {
    console.error('Puter Gemini upgrade API error:', error);
    throw new Error(`Failed to upgrade sentence with ${model}: ${(error as Error).message}`);
  }
}

async function callGeminiForUpgrade(
  prompt: string,
  apiKey: string
): Promise<{ upgraded: string; explanation: string }> {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.5, maxOutputTokens: 4096 },
      }),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Gemini API error: ${error}`);
  }

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
  return parseUpgradeResponse(text);
}

async function callOpenRouterForUpgrade(
  prompt: string,
  apiKey: string
): Promise<{ upgraded: string; explanation: string }> {
  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'anthropic/claude-3.5-sonnet',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.5,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenRouter API error: ${error}`);
  }

  const data = await response.json();
  const text = data.choices?.[0]?.message?.content || '';
  return parseUpgradeResponse(text);
}

async function callCohereForUpgrade(
  prompt: string,
  apiKey: string
): Promise<{ upgraded: string; explanation: string }> {
  const response = await fetch('https://api.cohere.ai/v1/generate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'command-r',
      prompt,
      temperature: 0.5,
      max_tokens: 4000,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Cohere API error: ${error}`);
  }

  const data = await response.json();
  const text = data.generations?.[0]?.text || '';
  return parseUpgradeResponse(text);
}

async function callOllamaForUpgrade(
  prompt: string,
  url: string
): Promise<{ upgraded: string; explanation: string }> {
  const response = await fetch(`${url}/api/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'llama3.2',
      prompt,
      stream: false,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Ollama API error: ${error}`);
  }

  const data = await response.json();
  const text = data.response || '';
  return parseUpgradeResponse(text);
}

function parseLLMResponse(text: string): LLMResponse {
  try {
    // Extract JSON from markdown code blocks if present
    const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
    const jsonStr = jsonMatch ? jsonMatch[1] : text;
    return JSON.parse(jsonStr);
  } catch (error) {
    console.error('Failed to parse LLM response:', text);
    throw new Error('Failed to parse AI response. Please try again.');
  }
}

function parseUpgradeResponse(text: string): { upgraded: string; explanation: string } {
  try {
    const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
    const jsonStr = jsonMatch ? jsonMatch[1] : text;
    return JSON.parse(jsonStr);
  } catch (error) {
    console.error('Failed to parse upgrade response:', text);
    throw new Error('Failed to parse AI response. Please try again.');
  }
}
