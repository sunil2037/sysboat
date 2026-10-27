import { NativeModules, Platform } from 'react-native';


const { MaterialTimePicker: _native } = NativeModules;

export async function showTimePicker(
    options = {},
) {
    if (Platform.OS !== 'android') {
        throw new Error('MaterialTimePicker is only available on Android.');
    }

    if (!_native) {
        throw new Error(
            'MaterialTimePicker native module not found. ' +
            'Make sure TimePickerPackage is registered in MainApplication.',
        );
    }

    return _native.show(options);
}

export default showTimePicker;