// utils/faceDetection.js
import { useState, useCallback, useEffect } from 'react';
import * as ort from 'onnxruntime-react-native';
import RNFS from 'react-native-fs';
import FaceDetection from '@react-native-ml-kit/face-detection';
import { Platform } from 'react-native';
import { Buffer } from 'buffer';
import ImageResizer from '@bam.tech/react-native-image-resizer';
import jpeg from 'jpeg-js';

const INPUT_WIDTH = 160;
const INPUT_HEIGHT = 160;

export const useFaceDetection = () => {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [sessionLoading, setSessionLoading] = useState(true);

  useEffect(() => {
    const loadSession = async () => {
      try {
        setSessionLoading(true);
        const modelName = 'faceNet.onnx';
        const modelPath = `${RNFS.DocumentDirectoryPath}/${modelName}`;

        // Copy model if not already in Documents
        if (!(await RNFS.exists(modelPath))) {
          await RNFS.copyFileAssets(modelName, modelPath);
        }

        // Load ONNX model
        const loadedSession = await ort.InferenceSession.create(modelPath);
        setSession(loadedSession);


        setError(null);
      } catch (err) {
        setError(err.message);
      } finally {
        setSessionLoading(false);
      }
    };
    loadSession();
  }, []);

  const downloadImage = async url => {
    const filePath = `${RNFS.CachesDirectoryPath}/ref_${Date.now()}.jpg`;
    await RNFS.downloadFile({ fromUrl: url, toFile: filePath }).promise;
    return Platform.OS === 'android' ? `file://${filePath}` : filePath;
  };

  const detectFace = useCallback(
    async (imageUri, options = {}) => {
      if (!session) {
        return { embedding: null, faceUri: null, error: 'Session not loaded' };
      }

      setLoading(true);
      setError(null);

      try {
        let path = imageUri;
        if (path.startsWith('https')) {
          path = await downloadImage(path);
        }
        if (!path.startsWith('file://')) {
          path = `file://${path}`;
        }

        // Detect faces
        const faces = await FaceDetection.detect(path);
        const face = faces?.[0];
        if (!face || !face.frame) throw new Error('No face detected');

        const { width, height, left, top } = face.frame;
        if (width <= 0 || height <= 0) throw new Error('Invalid bounding box');

        const { default: ImageEditor } = await import(
          '@react-native-community/image-editor'
        );
        const crop = {
          offset: { x: left, y: top },
          size: { width, height },
          displaySize: { width: INPUT_WIDTH, height: INPUT_HEIGHT },
          resizeMode: 'contain',
        };
        const cropResult = await ImageEditor.cropImage(path, crop);
        const resized = await ImageResizer.createResizedImage(
          path,
          INPUT_WIDTH,
          INPUT_HEIGHT,
          'JPEG',
          100,
        );

        const faceUri = resized.uri;

        const base64Img = await RNFS.readFile(
          faceUri.replace('file://', ''),
          'base64',
        );
        const rawImageData = jpeg.decode(Buffer.from(base64Img, 'base64'), {
          useTArray: true,
        });

        const floatData = new Float32Array(INPUT_WIDTH * INPUT_HEIGHT * 3);
        let i = 0;
        for (let j = 0; j < rawImageData.data.length; j += 4) {
          floatData[i++] = rawImageData.data[j] / 255; // R
          floatData[i++] = rawImageData.data[j + 1] / 255; // G
          floatData[i++] = rawImageData.data[j + 2] / 255; // B
        }

        const inputTensor = new ort.Tensor('float32', floatData, [
          1,
          INPUT_HEIGHT,
          INPUT_WIDTH,
          3,
        ]);

        const feeds = {};
        feeds[session.inputNames[0]] = inputTensor;

        const output = await session.run(feeds);
        const embedding = Array.from(output[session.outputNames[0]].data);

        return { embedding, faceUri, isLiveFace: true, error: null };
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Unknown error';
        setError(msg);
        return { embedding: null, faceUri: null, isLiveFace: false, error: msg };
      } finally {
        setLoading(false);
      }
    },
    [session],
  );

  const cosineSimilarity = useCallback((a, b) => {
    if (!a || !b || a.length !== b.length) return 0;

    const dot = a.reduce((acc, val, i) => acc + val * b[i], 0);
    const magA = Math.sqrt(a.reduce((acc, val) => acc + val * val, 0));
    const magB = Math.sqrt(b.reduce((acc, val) => acc + val * val, 0));
    if (magA === 0 || magB === 0) return 0;

    return dot / (magA * magB);
  }, []);

  return {
    loading: loading || sessionLoading,
    detectFace,
    cosineSimilarity,
    error,
    sessionLoaded: !!session,
  };
};
