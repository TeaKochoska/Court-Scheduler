import 'dotenv/config';

const BOOKING_LABELS: Record<string, string> = {
  training: 'training',
  match: 'match',
  casual: 'casual game',
};

interface BookedSlot {
  startTime: string;
  durationMinutes: number;
  teamName: string | null;
  bookingType: string | null;
  contactName: string | null;
}

const describeTime = (iso: string) =>
  new Date(iso).toLocaleString('en-GB', {
    timeZone: 'Europe/Skopje',
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit',
  });


function fallbackMessage(slot: BookedSlot): string {
  return `Hi ${slot.contactName ?? 'there'}, the hall is booked for ${slot.teamName ?? 'your team'} on ${describeTime(slot.startTime)}. See you there!`;
}

export async function generateConfirmationMessage(slot: BookedSlot): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  const model = process.env.GEMINI_MODEL ?? 'gemini-3.5-flash-lite';
  if (!apiKey) {
    console.warn('AI: GEMINI_API_KEY is missing, using fallback message');
    return fallbackMessage(slot);
  }

  const type = BOOKING_LABELS[slot.bookingType ?? ''] ?? 'session';
  const prompt = [
    'Write a short, friendly booking confirmation for a handball hall reservation.',
    'Maximum 2 sentences. Plain text only, no markdown, no quotes.',
    `Address the contact person by first name, mention the team, the date and time, and give one practical tip that fits a ${type} (for example arrive early to warm up for a match).`,
    '',
    `Contact person: ${slot.contactName}`,
    `Team: ${slot.teamName}`,
    `Type: ${type}`,
    `When: ${describeTime(slot.startTime)}, ${slot.durationMinutes} minutes`,
  ].join('\n');

  const started = Date.now();
  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': apiKey,
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.8, maxOutputTokens: 400 },
        }),
        signal: AbortSignal.timeout(10000),
      }
    );

    if (!res.ok) {
      console.error(`AI: ${model} returned`, res.status, await res.text());
      return fallbackMessage(slot);
    }

    const data = (await res.json()) as {
      candidates?: {
        finishReason?: string;
        content?: { parts?: { text?: string }[] };
      }[];
    };
    const text = data.candidates?.[0]?.content?.parts
      ?.map((p) => p.text ?? '')
      .join('')
      .trim();

    console.log(`AI: ${model} answered in ${Date.now() - started} ms`);

    if (!text) {
      console.warn('AI: empty text, finishReason =', data.candidates?.[0]?.finishReason);
      return fallbackMessage(slot);
    }
    return text;
  } catch (err) {
    console.error(`AI: ${model} failed after ${Date.now() - started} ms`, err);
    return fallbackMessage(slot);
  }
}