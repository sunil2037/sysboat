export const toFaceImageFile = (asset, timestamp = Date.now()) => {
  if (!asset?.uri) return null;

  const type = asset.type || 'image/jpeg';
  const extension = type.split('/')[1]?.replace('jpeg', 'jpg') || 'jpg';
  return {
    uri: asset.uri,
    type,
    name: asset.fileName || `face_${timestamp}.${extension}`,
  };
};

export const resolveFaceUploadPath = response =>
  response?.url ||
  response?.file_path ||
  response?.data?.url ||
  response?.data?.file_path ||
  null;
