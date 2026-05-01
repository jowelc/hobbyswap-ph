import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextRequest, NextResponse } from 'next/server';

const SUPPORTED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'] as const;
type SupportedMime = typeof SUPPORTED_TYPES[number];

export async function POST(req: NextRequest) {
  if (!process.env.GEMINI_API_KEY) {
    return NextResponse.json(
      { error: 'GEMINI_API_KEY is not set. Add it to .env.local to enable AI card identification.' },
      { status: 500 }
    );
  }

  try {
    const body = await req.json();
    const { imageBase64, mimeType } = body as { imageBase64?: string; mimeType?: string };

    if (!imageBase64 || !mimeType) {
      return NextResponse.json({ error: 'Missing imageBase64 or mimeType' }, { status: 400 });
    }

    const resolvedType: SupportedMime = SUPPORTED_TYPES.includes(mimeType as SupportedMime)
      ? (mimeType as SupportedMime)
      : 'image/jpeg';

    const modelName = process.env.GEMINI_MODEL ?? 'gemini-2.0-flash';
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: modelName });

    const result = await model.generateContent([
      { inlineData: { data: imageBase64, mimeType: resolvedType } },
      `You are a trading card expert serving the Philippine market. Analyze this card image and return ONLY a valid JSON object — no markdown, no code fences, no extra text. Use this exact shape:
{
  "name": "full card name e.g. LeBron James RC Exquisite",
  "category": "one of: Basketball Cards | Pokemon Cards | One Piece Cards | Football Cards | Baseball Cards | MMA Cards | WWE Cards | Others",
  "playerName": "player or character name, or null",
  "team": "team name, or null",
  "brand": "card brand e.g. Upper Deck Exquisite, or null",
  "year": 2003,
  "condition": "one of: Raw | Graded | Sealed | Used | Brand New",
  "estimatedValue": 5000,
  "description": "1-2 sentence description",
  "tags": ["tag1", "tag2"]
}
IMPORTANT: estimatedValue must be in Philippine Peso (PHP). Convert any USD market price using approximately 56 PHP per 1 USD. For example, a card worth $100 USD should be 5600.
If you cannot identify the card, still return the JSON with your best guesses and null for unknown fields.`,
    ]);

    const text = result.response.text().trim();
    const jsonMatch = text.match(/\{[\s\S]*\}/);

    if (!jsonMatch) {
      if (process.env.NODE_ENV === 'development') {
        console.error('[identify-card] Unexpected AI response format:', text);
      }
      return NextResponse.json({ error: 'AI returned an unexpected format', raw: text }, { status: 422 });
    }

    const parsed = JSON.parse(jsonMatch[0]);
    return NextResponse.json(parsed);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);

    if (process.env.NODE_ENV === 'development') {
      console.error('[identify-card] Error:', message);
    }

    // Detect quota / rate-limit errors
    if (/429|quota|resource.?exhausted|rate.?limit/i.test(message)) {
      // Read retry delay from structured Gemini error details (e.g. google.rpc.RetryInfo)
      // Avoid parsing raw message strings — they contain IDs/timestamps that look like seconds
      let retryAfterSeconds: number | null = null;
      if (err && typeof err === 'object') {
        type GeminiErr = { errorDetails?: Array<{ '@type'?: string; retryDelay?: string }> };
        const details = (err as GeminiErr).errorDetails;
        const retryInfo = details?.find((d) => d['@type']?.includes('RetryInfo'));
        if (retryInfo?.retryDelay) {
          const m = retryInfo.retryDelay.match(/^(\d+)s?$/);
          if (m) {
            const secs = parseInt(m[1]);
            // Only trust values between 1 second and 24 hours
            if (secs > 0 && secs <= 86400) retryAfterSeconds = secs;
          }
        }
      }
      return NextResponse.json(
        { error: 'API quota exceeded. Try again shortly.', errorType: 'quota', retryAfterSeconds },
        { status: 429 }
      );
    }

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
