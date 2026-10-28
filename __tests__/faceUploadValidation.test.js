import {
  resolveFaceUploadPath,
  toFaceImageFile,
} from '../src/components/FaceAuthenticate/faceUploadValidation';

describe('face image upload logic', () => {
  it('builds an upload file from gallery or camera image assets', () => {
    expect(toFaceImageFile({
      uri: 'file:///tmp/face.png',
      type: 'image/png',
      fileName: 'employee.png',
    }, 123)).toEqual({
      uri: 'file:///tmp/face.png',
      type: 'image/png',
      name: 'employee.png',
    });
  });

  it('uses a safe fallback filename and rejects assets without a URI', () => {
    expect(toFaceImageFile({ uri: 'file:///tmp/face.jpg' }, 123).name)
      .toBe('face_123.jpg');
    expect(toFaceImageFile(null, 123)).toBeNull();
  });

  it('accepts common cloud upload response shapes and rejects missing paths', () => {
    expect(resolveFaceUploadPath({ url: 'https://cdn.example/face.jpg' }))
      .toBe('https://cdn.example/face.jpg');
    expect(resolveFaceUploadPath({ data: { file_path: '/faces/1.jpg' } }))
      .toBe('/faces/1.jpg');
    expect(resolveFaceUploadPath({ status: true })).toBeNull();
  });
});
