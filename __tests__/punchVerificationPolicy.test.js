import { getPunchVerificationMode } from '../src/screens/punchVerificationPolicy';
import {
  getBreakAction,
  getFaceRecognitionMode,
  getPunchAction,
  getPunchConfirmationDecision,
  hasValidCoordinates,
  parseFaceEmbeddings,
} from '../src/screens/attendanceValidation';

describe('getPunchVerificationMode', () => {
  it('waits while profile is loading and rejects a profile without a policy', () => {
    expect(getPunchVerificationMode(undefined, true)).toBe('loading');
    expect(getPunchVerificationMode(undefined, false)).toBe('loading');
    expect(getPunchVerificationMode({ permission: {} }, false)).toBe('unavailable');
  });

  it('requires face verification when the profile enables it', () => {
    expect(
      getPunchVerificationMode({ permission: { face_detection: 1 } }, false),
    ).toBe('face');
  });

  it('allows direct punch only when the profile explicitly disables it', () => {
    expect(
      getPunchVerificationMode({ permission: { face_detection: 0 } }, false),
    ).toBe('direct');
    expect(
      getPunchVerificationMode({ permission: { face_detection: '0' } }, false),
    ).toBe('direct');
  });

  it('fails closed when the profile request fails', () => {
    expect(getPunchVerificationMode(undefined, false, true)).toBe('unavailable');
  });
});

describe('hasValidCoordinates', () => {
  it('accepts valid boundary coordinates including zero', () => {
    expect(hasValidCoordinates({ latitude: 0, longitude: 0 })).toBe(true);
    expect(hasValidCoordinates({ latitude: -90, longitude: 180 })).toBe(true);
  });

  it('rejects missing and out-of-range coordinates', () => {
    expect(hasValidCoordinates({ latitude: null, longitude: 2 })).toBe(false);
    expect(hasValidCoordinates({ latitude: 91, longitude: 2 })).toBe(false);
    expect(hasValidCoordinates({ latitude: 1, longitude: Infinity })).toBe(false);
  });
});

describe('getBreakAction', () => {
  const activeShift = {
    inTime: '09:00:00',
    checkOutTime: '',
    breakTime: '',
    endBreakTime: '',
  };

  it('requires an active shift before starting or ending a break', () => {
    expect(getBreakAction({ ...activeShift, inTime: '', verificationMode: 'direct' }))
      .toBe('clock_in_required');
    expect(getBreakAction({ ...activeShift, checkOutTime: '17:00:00', verificationMode: 'direct' }))
      .toBe('clock_in_required');
  });

  it('waits for the face policy and requires face verification when enabled', () => {
    expect(getBreakAction({ ...activeShift, verificationMode: 'loading' })).toBe('profile_loading');
    expect(getBreakAction({ ...activeShift, verificationMode: 'unavailable' })).toBe('profile_unavailable');
    expect(getBreakAction({ ...activeShift, verificationMode: 'face' })).toBe('verify_face');
  });

  it('starts or ends the break only after the policy is resolved', () => {
    expect(getBreakAction({ ...activeShift, verificationMode: 'direct' })).toBe('break_in');
    expect(getBreakAction({
      ...activeShift,
      verificationMode: 'face',
      faceAuthenticated: true,
      breakTime: '12:00:00',
      endBreakTime: '',
    })).toBe('break_out');
  });
});

describe('parseFaceEmbeddings', () => {
  it('parses JSON embeddings and preserves already-parsed values', () => {
    expect(parseFaceEmbeddings('{"vector":[0.1,0.2]}')).toEqual({ vector: [0.1, 0.2] });
    expect(parseFaceEmbeddings({ vector: [0.1, 0.2] })).toEqual({ vector: [0.1, 0.2] });
  });

  it('returns null for missing or malformed embeddings instead of throwing', () => {
    expect(parseFaceEmbeddings('')).toBeNull();
    expect(parseFaceEmbeddings('{broken-json')).toBeNull();
  });
});

describe('getFaceRecognitionMode', () => {
  it('normalizes numeric and string flags from the server', () => {
    expect(getFaceRecognitionMode(1, 0)).toBe('offline');
    expect(getFaceRecognitionMode('1', '0')).toBe('offline');
    expect(getFaceRecognitionMode(true, false)).toBe('offline');
    expect(getFaceRecognitionMode(1, 1)).toBe('live');
    expect(getFaceRecognitionMode(0, 1)).toBe('disabled');
  });
});

describe('getPunchAction', () => {
  it('selects start, stop, or no action from the current shift state', () => {
    expect(getPunchAction({ inTime: '', checkOutTime: '' })).toBe('in');
    expect(getPunchAction({ inTime: '09:00', checkOutTime: '' })).toBe('out');
    expect(getPunchAction({ inTime: '09:00', checkOutTime: '17:00' })).toBeNull();
  });
});

describe('getPunchConfirmationDecision', () => {
  const punchIn = { inTime: '', checkOutTime: '' };

  it('routes direct confirmation to the correct clock action', () => {
    expect(getPunchConfirmationDecision({ ...punchIn, verificationMode: 'direct' }))
      .toBe('clock_in');
    expect(getPunchConfirmationDecision({
      inTime: '09:00', checkOutTime: '', verificationMode: 'direct',
    })).toBe('clock_out');
  });

  it('requires face verification after confirmation when policy enables it', () => {
    expect(getPunchConfirmationDecision({ ...punchIn, verificationMode: 'face' }))
      .toBe('verify_face');
    expect(getPunchConfirmationDecision({
      ...punchIn, verificationMode: 'face', faceAuthenticated: true,
    })).toBe('clock_in');
  });

  it('blocks duplicate, manager-blocked, and unresolved actions', () => {
    expect(getPunchConfirmationDecision({
      inTime: '09:00', checkOutTime: '17:00', verificationMode: 'direct',
    })).toBe('no_action');
    expect(getPunchConfirmationDecision({ ...punchIn, verificationMode: 'direct', blocked: true }))
      .toBe('blocked');
    expect(getPunchConfirmationDecision({ ...punchIn, verificationMode: 'loading' }))
      .toBe('profile_loading');
    expect(getPunchConfirmationDecision({ ...punchIn, verificationMode: 'unavailable' }))
      .toBe('profile_unavailable');
  });
});
