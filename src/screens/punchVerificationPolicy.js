/**
 * Resolve the punch flow only after the employee profile has supplied an
 * explicit face-detection setting. Missing data must never bypass verification.
 */
export const getPunchVerificationMode = (profile, isLoading, isError = false) => {
  if (isLoading) {
    return 'loading';
  }

  const faceDetection = profile?.permission?.face_detection;
  if (!profile) return isError ? 'unavailable' : 'loading';
  if (faceDetection == null) return 'unavailable';
  if (faceDetection === true || faceDetection === 1 || faceDetection === '1') {
    return 'face';
  }
  if (faceDetection === false || faceDetection === 0 || faceDetection === '0') {
    return 'direct';
  }

  return 'unavailable';
};
