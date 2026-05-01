import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name:  process.env.CLOUDINARY_CLOUD_NAME,
  api_key:     process.env.CLOUDINARY_API_KEY,
  api_secret:  process.env.CLOUDINARY_API_SECRET,
});

export async function uploadImage(base64: string, mimeType: string): Promise<string> {
  const dataUri = `data:${mimeType};base64,${base64}`;
  const result = await cloudinary.uploader.upload(dataUri, {
    folder: 'hobbyswap-ph',
    resource_type: 'image',
  });
  return result.secure_url;
}

export async function deleteImage(url: string): Promise<void> {
  const match = url.match(/hobbyswap-ph\/([^.]+)/);
  if (!match) return;
  await cloudinary.uploader.destroy(`hobbyswap-ph/${match[1]}`);
}
