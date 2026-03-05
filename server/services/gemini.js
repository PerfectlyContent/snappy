import { GoogleGenerativeAI } from '@google/generative-ai';
import { classifyImagePrompt } from '../prompts/classify-image.js';
import { classifyVoicePrompt } from '../prompts/classify-voice.js';
import { composeMessagePrompt } from '../prompts/compose-message.js';
import { composeReachOutPrompt } from '../prompts/compose-reachout.js';

let genAI = null;

function getGenAI() {
  if (!genAI) {
    genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  }
  return genAI;
}

export async function classifyImage(imageBase64, mimeType = 'image/png') {
  const model = getGenAI().getGenerativeModel({ model: 'gemini-2.5-flash' });

  const today = new Date().toISOString().split('T')[0];
  const prompt = classifyImagePrompt.replace('{{TODAY}}', today);

  const result = await model.generateContent([
    { text: prompt },
    {
      inlineData: {
        mimeType,
        data: imageBase64,
      },
    },
  ]);

  const text = result.response.text();
  const jsonMatch = text.match(/```json\s*([\s\S]*?)```/) || text.match(/\{[\s\S]*\}/);
  const jsonStr = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : text;
  return JSON.parse(jsonStr.trim());
}

export async function classifyVoice(transcript) {
  const model = getGenAI().getGenerativeModel({ model: 'gemini-2.5-flash' });

  const today = new Date().toISOString().split('T')[0];
  const prompt = classifyVoicePrompt.replace('{{TRANSCRIPT}}', transcript).replace('{{TODAY}}', today);
  const result = await model.generateContent(prompt);

  const text = result.response.text();
  const jsonMatch = text.match(/```json\s*([\s\S]*?)```/) || text.match(/\{[\s\S]*\}/);
  const jsonStr = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : text;
  return JSON.parse(jsonStr.trim());
}

export async function composeForwardMessage(classificationData) {
  const model = getGenAI().getGenerativeModel({ model: 'gemini-2.5-flash' });

  const prompt = composeMessagePrompt.replace(
    '{{CLASSIFICATION_DATA}}',
    JSON.stringify(classificationData, null, 2)
  );
  const result = await model.generateContent(prompt);

  const text = result.response.text();
  const jsonMatch = text.match(/```json\s*([\s\S]*?)```/) || text.match(/\{[\s\S]*\}/);
  const jsonStr = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : text;
  return JSON.parse(jsonStr.trim());
}

export async function composeReachOutMessage(contactData, channel) {
  const model = getGenAI().getGenerativeModel({ model: 'gemini-2.5-flash' });

  const prompt = composeReachOutPrompt
    .replace('{{CONTACT_DATA}}', JSON.stringify(contactData, null, 2))
    .replace('{{CHANNEL}}', channel);
  const result = await model.generateContent(prompt);

  const text = result.response.text();
  const jsonMatch = text.match(/```json\s*([\s\S]*?)```/) || text.match(/\{[\s\S]*\}/);
  const jsonStr = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : text;
  return JSON.parse(jsonStr.trim());
}
