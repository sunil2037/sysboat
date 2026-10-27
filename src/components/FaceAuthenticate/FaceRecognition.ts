import { NativeModules, NativeEventEmitter, Platform } from 'react-native';

const { FaceRecognitionModule } = NativeModules;

export interface RecognitionResult {
  name: string;
  distance: number;
  recognized: boolean;
  employeeId?: string;
  secondNearest?: string;
  secondDistance?: number;
  timestamp?: number;
}

export interface FaceInfo {
  name: string;
  employeeId?: string;
  success: boolean;
  embeddings?: number[];
  faceImage?: string;
  embeddingSize?: number;
}

export interface FaceData {
  embeddings: number[];
  faceImage: string;
  embeddingSize: number;
}

export interface ContinuousRecognitionEvent {
  type: 'FACE_DETECTED' | 'FACE_RECOGNIZED' | 'FACE_NOT_RECOGNIZED' | 'NO_FACE';
  result?: RecognitionResult;
  timestamp: number;
}

class FaceRecognition {
  private eventEmitter: NativeEventEmitter;
  private listeners: Map<string, any> = new Map();

  constructor() {
    if (Platform.OS === 'android') {
      this.eventEmitter = new NativeEventEmitter(FaceRecognitionModule);
    }
    // else {
    //   this.eventEmitter = new NativeEventEmitter();
    // }
  }

  async extractFromFile(imagePath: any): Promise<any> {
    try {
      const result = await FaceRecognitionModule.extractEmbeddingsFromImage(imagePath);
      return result;
    } catch (error) {
    }
  };

  async extractFromBase64(base64Image: any): Promise<any> {
    try {
      const result = await FaceRecognitionModule.extractEmbeddingsFromBase64(base64Image);
      return result;
    } catch (error) {
    }
  };

  /**
   * Check and request camera permission
   */
  async requestCameraPermission(): Promise<boolean> {
    try {
      if (Platform.OS === 'android') {
        return await FaceRecognitionModule.requestCameraPermission();
      } else {
        return true;
      }
    } catch (error) {
      throw error;
    }
  }

  /**
   * Check if camera permission is granted
   */
  async checkCameraPermission(): Promise<boolean> {
    try {
      if (Platform.OS === 'android') {
        return await FaceRecognitionModule.checkCameraPermission();
      }
      return false;
    } catch (error) {
      return false;
    }
  }

  /**
   * Start the camera
   */
  async startCamera(): Promise<boolean> {
    try {
      return await FaceRecognitionModule.startCamera();
    } catch (error) {
      throw error;
    }
  }

  /**
   * Switch between front and back camera
   */
  async switchCamera(): Promise<{ facing: 'front' | 'back' }> {
    try {
      return await FaceRecognitionModule.switchCamera();
    } catch (error) {
      throw error;
    }
  }

  /**
   * Start face recognition (static mode - single capture)
   */
  async startRecognition(): Promise<boolean> {
    try {
      return await FaceRecognitionModule.startRecognition();
    } catch (error) {
      throw error;
    }
  }

  /**
   * Stop face recognition
   */
  async stopRecognition(): Promise<boolean> {
    try {
      return await FaceRecognitionModule.stopRecognition();
    } catch (error) {
      throw error;
    }
  }

  /**
   * Start continuous real-time face recognition
   */
  async startContinuousRecognition(): Promise<boolean> {
    try {
      return await FaceRecognitionModule.startContinuousRecognition();
    } catch (error) {
      throw error;
    }
  }

  /**
   * Stop continuous recognition
   */
  async stopContinuousRecognition(): Promise<boolean> {
    try {
      return await FaceRecognitionModule.stopContinuousRecognition();
    } catch (error) {
      throw error;
    }
  }

  /**
   * Add a face with a given name and optional employee ID
   * Returns face data including embeddings and image for server storage
   */
  async addFace(name: string, employeeId?: string): Promise<FaceInfo> {
    try {
      return await FaceRecognitionModule.addFace(name, employeeId);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get current detected face data without saving
   * Useful for getting embeddings before sending to server
   */
  async getCurrentFaceData(): Promise<FaceData> {
    try {
      return await FaceRecognitionModule.getCurrentFaceData();
    } catch (error) {
      throw error;
    }
  }

  /**
   * Add face from server data (embeddings array)
   * Use this to add faces that are stored on your server
   */
  async addFaceFromServer(
    name: string,
    employeeId: string | undefined,
    embeddings: number[]
  ): Promise<FaceInfo> {
    try {
      return await FaceRecognitionModule.addFaceFromServer(name, employeeId, embeddings);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Recognize face using embeddings array
   * Useful for offline recognition or when embeddings come from server
   */
  async recognizeWithEmbeddings(embeddings: number[]): Promise<RecognitionResult> {
    try {
      return await FaceRecognitionModule.recognizeWithEmbeddings(embeddings);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Extract embeddings from an image URI
   * Returns face data including embeddings and cropped face image
   */
  async extractEmbeddingsFromUri(imageUri: string): Promise<FaceData> {
    try {
      return await FaceRecognitionModule.extractEmbeddingsFromUri(imageUri);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Delete a face by name
   */
  async deleteFace(name: string): Promise<boolean> {
    try {
      return await FaceRecognitionModule.deleteFace(name);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get all registered faces with employee IDs
   */
  async getAllFaces(): Promise<Array<{ name: string; employeeId?: string }>> {
    try {
      return await FaceRecognitionModule.getAllFaces();
    } catch (error) {
      throw error;
    }
  }

  /**
   * Clear all registered faces
   */
  async clearAllFaces(): Promise<boolean> {
    try {
      return await FaceRecognitionModule.clearAllFaces();
    } catch (error) {
      throw error;
    }
  }

  /**
   * Set the maximum distance threshold for recognition
   */
  async setDistance(distance: number): Promise<number> {
    try {
      return await FaceRecognitionModule.setDistance(distance);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get the current distance threshold
   */
  async getDistance(): Promise<number> {
    try {
      return await FaceRecognitionModule.getDistance();
    } catch (error) {
      throw error;
    }
  }

  /**
   * Recognize face from an image URI
   */
  async recognizeFromUri(imageUri: string): Promise<RecognitionResult> {
    try {
      return await FaceRecognitionModule.recognizeFromUri(imageUri);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Set minimum time between continuous recognitions
   */
  async setRecognitionCooldown(milliseconds: number): Promise<boolean> {
    try {
      return await FaceRecognitionModule.setRecognitionCooldown(milliseconds);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Add event listener for continuous recognition events
   */
  addListener(eventName: string, callback: (data: any) => void) {
    if (Platform.OS === 'android') {
      const subscription = this.eventEmitter.addListener(eventName, callback);
      this.listeners.set(eventName, subscription);
      return subscription;
    }
    return null;
  }

  /**
   * Remove event listener
   */
  removeListener(eventName: string) {
    const listener = this.listeners.get(eventName);
    if (listener) {
      listener.remove();
      this.listeners.delete(eventName);
    }
  }

  /**
   * Remove all listeners
   */
  removeAllListeners() {
    this.listeners.forEach((listener) => listener.remove());
    this.listeners.clear();
  }

  /**
   * Initialize the face recognition system
   */
  async initialize(): Promise<boolean> {
    try {
      const hasPermission = await this.requestCameraPermission();
      if (!hasPermission) {
        throw new Error('Camera permission denied');
      }

      await this.startCamera();
      return true;
    } catch (error) {
      throw error;
    }
  }
}

export default new FaceRecognition();