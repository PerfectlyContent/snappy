import { GoogleGenerativeAI } from '@google/generative-ai';
import { classifyImagePrompt } from '../prompts/classify-image.js';
import { classifyVoicePrompt } from '../prompts/classify-voice.js';
import { composeMessagePrompt } from '../prompts/compose-message.js';
import { composeReachOutPrompt } from '../prompts/compose-reachout.js';
import { dailySnapPrompt } from '../prompts/daily-snap.js';

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

export async function generateDailySnap(events, notes) {
  const model = getGenAI().getGenerativeModel({ model: 'gemini-2.0-flash' });

  const today = new Date().toISOString().split('T')[0];
  const now = new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });

  const eventsText = events.length > 0
    ? events.map(e => {
        const start = e.start?.dateTime
          ? new Date(e.start.dateTime).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
          : 'All day';
        const end = e.end?.dateTime
          ? new Date(e.end.dateTime).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
          : '';
        const loc = e.location ? ` (${e.location})` : '';
        return `- ${start}${end ? ` – ${end}` : ''}: ${e.summary}${loc}`;
      }).join('\n')
    : 'No events scheduled today.';

  const notesText = notes.length > 0
    ? notes.map(n => {
        const tag = n.source === 'voice' ? ' [voice]' : '';
        const body = n.content ? ': ' + n.content.slice(0, 300) : '';
        return `- ${n.title}${body}${tag}`;
      }).join('\n')
    : 'No notes.';

  const prompt = dailySnapPrompt
    .replace('{{TODAY}}', today)
    .replace('{{NOW}}', now)
    .replace('{{EVENTS}}', eventsText)
    .replace('{{NOTES}}', notesText);

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
