export const hasValidCoordinates = location => {
  if (
    !location ||
    location.latitude == null ||
    location.longitude == null ||
    location.latitude === '' ||
    location.longitude === ''
  ) {
    return false;
  }

  const latitude = Number(location.latitude);
  const longitude = Number(location.longitude);
  return (
    Number.isFinite(latitude) &&
    Number.isFinite(longitude) &&
    latitude >= -90 &&
    latitude <= 90 &&
    longitude >= -180 &&
    longitude <= 180
  );
};

export const getBreakAction = ({
  inTime,
  checkOutTime,
  verificationMode,
  faceAuthenticated,
  breakTime,
  endBreakTime,
}) => {
  if (!inTime || checkOutTime) return 'clock_in_required';
  if (verificationMode === 'loading') return 'profile_loading';
  if (verificationMode === 'unavailable') return 'profile_unavailable';
  if (verificationMode === 'face' && !faceAuthenticated) return 'verify_face';
  if (breakTime && (endBreakTime === '00:00:00' || !endBreakTime)) {
    return 'break_out';
  }
  if (endBreakTime || !breakTime) return 'break_in';
  return 'unavailable';
};

export const parseFaceEmbeddings = embeddings => {
  if (!embeddings) return null;
  if (typeof embeddings !== 'string') return embeddings;
  try {
    return JSON.parse(embeddings);
  } catch (error) {
    return null;
  }
};

export const getFaceRecognitionMode = (faceDetection, liveFaceDetection) => {
  if (!(faceDetection === true || faceDetection === 1 || faceDetection === '1')) {
    return 'disabled';
  }

  if (
    liveFaceDetection === false ||
    liveFaceDetection === 0 ||
    liveFaceDetection === '0'
  ) {
    return 'offline';
  }

  return 'live';
};

export const getPunchAction = ({ inTime, checkOutTime }) => {
  if (!inTime && !checkOutTime) return 'in';
  if (inTime && !checkOutTime) return 'out';
  return null;
};

export const getPunchConfirmationDecision = ({
  inTime,
  checkOutTime,
  verificationMode,
  faceAuthenticated,
  blocked,
}) => {
  const action = getPunchAction({ inTime, checkOutTime });
  if (!action) return 'no_action';
  if (blocked) return 'blocked';
  if (verificationMode === 'loading') return 'profile_loading';
  if (verificationMode === 'unavailable') return 'profile_unavailable';
  if (verificationMode === 'face' && !faceAuthenticated) return 'verify_face';
  if (verificationMode !== 'direct' && verificationMode !== 'face') {
    return 'profile_unavailable';
  }
  return action === 'in' ? 'clock_in' : 'clock_out';
};
