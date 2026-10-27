import { NativeModules, Platform, Alert } from 'react-native';

const { InAppUpdateModule } = NativeModules;

export const checkAndStartImmediateUpdate = async () => {
    if (Platform.OS !== 'android') {
        return;
    }
    try {
        const updateStarted = await InAppUpdateModule.checkForUpdate();

        if (updateStarted) {
        } else {
        }
    } catch (error) {

    }
};

