import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { uploadImage } from '@/lib/cloudinary';

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { imageBase64, mimeType } = await req.json() as { imageBase64: string; mimeType: string };
  if (!imageBase64 || !mimeType) {
    return NextResponse.json({ error: 'Missing imageBase64 or mimeType' }, { status: 400 });
  }

  const url = await uploadImage(imageBase64, mimeType);
  return NextResponse.json({ url });
}
