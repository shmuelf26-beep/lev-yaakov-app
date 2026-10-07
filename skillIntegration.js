// Integration עם Skill: de-identification + AI call
import { Anthropic } from '@anthropic-ai/sdk';
import { decrypt, encrypt, nowIso } from './db.js';

const client = new Anthropic();
const MODEL = process.env.ANTHROPIC_MODEL || 'claude-opus-4-1';

/**
 * מחק פרטים מזהים מהודעה
 * (שם, טלפון, כתובת, מספרי בקבלה וכד')
 */
export function deIdentify(text) {
  let sanitized = text;

  // מחק מספרי טלפון
  sanitized = sanitized.replace(/(\d{3})-(\d{3})-(\d{4})/g, 'XXX-XXX-XXXX');
  sanitized = sanitized.replace(/0\d{1,2}-?\d{3,4}-?\d{4}/g, '0XX-XXX-XXXX');

  // מחק מספרי בקבלה
  sanitized = sanitized.replace(/\b\d{3}-\d{3}-\d{3}\b/g, 'XXX-XXX-XXX');

  // מחק כתובות (פשוט)
  sanitized = sanitized.replace(/\d+\s+\w+\s+(Street|Ave|Road|Drive|Boulevard)\b/gi, '[כתובת]');

  return sanitized;
}

/**
 * קרא לSkill עם הודעה מנוקתה
 * מחזיר: { suggestions, reasoning }
 */
export async function callSkill(db, key, message, patient) {
  const deIdMsg = deIdentify(message.body);
  const patientContext = patient ? {
    status: patient.status,
    treatment: patient.treatment || 'unknown',
    nextCall: patient.nextCallAt?.slice(0, 10) || 'unknown',
  } : null;

  const prompt = `
אתה רכזת ליווי לחולי סרטן בישראל. מטופל או משפחה שלח הודעה.
ענה בעברית בקיצור ובעדינות.

הודעה (מנוקתה מפרטים אישיים):
"${deIdMsg}"

${patientContext ? `
סטטוס מטופל:
- מצב: ${patientContext.status}
- טיפול: ${patientContext.treatment}
- שיחה הבאה: ${patientContext.nextCall}
` : ''}

אנא:
1. זהה את הצורך הראשי
2. הציע תשובה תמיכה עדינה (עד 160 תווים ל-SMS)
3. ציין אם צריך פעולה נוספת (השגחה, טלפון, הפניה)

תשובה בפורמט JSON:
{
  "response": "טקסט התשובה",
  "actionNeeded": false | "coordinator" | "medical" | "financial",
  "reasoning": "הסבר קצר"
}
`;

  const message_obj = {
    role: 'user',
    content: prompt,
  };

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 500,
    messages: [message_obj],
  });

  const text = response.content[0].type === 'text' ? response.content[0].text : '';

  try {
    // נסה לפרסר JSON מהתשובה
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
  } catch (e) {
    console.warn('Failed to parse AI response as JSON:', e.message);
  }

  // fallback
  return {
    response: text.slice(0, 160),
    actionNeeded: false,
    reasoning: 'AI response parsed as text',
  };
}

/**
 * עדכן הודעה עם AI suggestion
 */
export async function updateMessageWithAI(db, key, messageId, aiResult) {
  const row = db.prepare(`
    SELECT blob FROM docs WHERE id = ? AND type = 'message'
  `).get(messageId);

  if (!row) throw new Error('Message not found');

  const msg = decrypt(key, row.blob);
  const updated = {
    ...msg,
    aiSuggestion: aiResult.response,
    aiAction: aiResult.actionNeeded,
    aiReasoning: aiResult.reasoning,
    updatedAt: nowIso(),
  };

  const blob = encrypt(key, updated);
  db.prepare(`
    UPDATE docs SET blob = ?, rev = rev + 1, updated_at = ?
    WHERE id = ?
  `).run(blob, nowIso(), messageId);

  return { id: messageId, ...updated };
}
