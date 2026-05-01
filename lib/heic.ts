function isHeic(file: File): boolean {
  return (
    file.type === 'image/heic' ||
    file.type === 'image/heif' ||
    /\.(heic|heif)$/i.test(file.name)
  );
}

export async function convertIfHeic(file: File): Promise<File> {
  if (!isHeic(file)) return file;

  const { default: heic2any } = await import('heic2any');
  const result = await heic2any({ blob: file, toType: 'image/jpeg', quality: 0.92 });
  const blob = Array.isArray(result) ? result[0] : result;
  const jpegName = file.name.replace(/\.(heic|heif)$/i, '.jpg');
  return new File([blob], jpegName, { type: 'image/jpeg' });
}
