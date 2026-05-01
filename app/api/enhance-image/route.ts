import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextRequest, NextResponse } from 'next/server';

const SUPPORTED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'] as const;
type SupportedMime = typeof SUPPORTED_TYPES[number];

export async function POST(req: NextRequest) {
  try {
    const { imageBase64, mimeType } = await req.json() as { imageBase64?: string; mimeType?: string };

    if (!imageBase64 || !mimeType) {
      return NextResponse.json({ error: 'Missing imageBase64 or mimeType' }, { status: 400 });
    }

    const resolvedType: SupportedMime = SUPPORTED_TYPES.includes(mimeType as SupportedMime)
      ? (mimeType as SupportedMime)
      : 'image/jpeg';

    let rotation = 0;
    let bgRemovedBase64: string | null = null;

    // ── Rotation detection via Gemini ───────────────────────────────────────
    if (process.env.GEMINI_API_KEY) {
      try {
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: process.env.GEMINI_MODEL ?? 'gemini-2.5-flash' });

        const result = await model.generateContent([
          { inlineData: { data: imageBase64, mimeType: resolvedType } },
          `Look at this trading card image. Is the card properly oriented (portrait, text readable)?
Return ONLY a JSON object — no markdown, no extra text:
{ "rotation": 0 }
Where rotation is the degrees clockwise needed to make the card upright: 0, 90, 180, or 270.
Only use a non-zero value if the card is clearly sideways or upside down. When in doubt, return 0.`,
        ]);

        const text = result.response.text().trim();
        const match = text.match(/\{[\s\S]*?\}/);
        if (match) {
          const parsed = JSON.parse(match[0]);
          const deg = parseInt(parsed.rotation);
          if ([0, 90, 180, 270].includes(deg)) rotation = deg;
        }
      } catch (err) {
        if (process.env.NODE_ENV === 'development') {
          console.error('[enhance-image] Gemini rotation error:', err);
        }
      }
    }

    // ── Background removal via remove.bg ────────────────────────────────────
    if (process.env.REMOVE_BG_API_KEY) {
      try {
        const form = new FormData();
        form.append('image_file_b64', imageBase64);
        form.append('size', 'auto');

        const res = await fetch('https://api.remove.bg/v1.0/removebg', {
          method: 'POST',
          headers: { 'X-Api-Key': process.env.REMOVE_BG_API_KEY },
          body: form,
        });

        if (res.ok) {
          const buffer = await res.arrayBuffer();
          bgRemovedBase64 = Buffer.from(buffer).toString('base64');
        } else if (process.env.NODE_ENV === 'development') {
          const err = await res.json().catch(() => ({}));
          console.error('[enhance-image] remove.bg error:', res.status, err);
        }
      } catch (err) {
        if (process.env.NODE_ENV === 'development') {
          console.error('[enhance-image] remove.bg fetch error:', err);
        }
      }
    }

    return NextResponse.json({ rotation, bgRemovedBase64 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    if (process.env.NODE_ENV === 'development') console.error('[enhance-image]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
