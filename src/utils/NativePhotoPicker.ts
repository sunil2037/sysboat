import { NativeModules } from 'react-native';

interface PhotoPickerModuleInterface {
  pickSingleMedia(mediaType: 'ImageAndVideo' | 'ImageOnly' | 'VideoOnly' | string): Promise<string | null>;
  pickMultipleMedia(maxSelection: number, mediaType: 'ImageAndVideo' | 'ImageOnly' | 'VideoOnly' | string): Promise<string[]>;
}

const { PhotoPickerModule } = NativeModules;

export const NativePhotoPicker = PhotoPickerModule as PhotoPickerModuleInterface;