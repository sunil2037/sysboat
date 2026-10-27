import { NativeModules } from 'react-native';

const { NativeStorage } = NativeModules;

export default {
    setString: (key: string, value: string | null) =>
        NativeStorage.setString(key, value),

    getString: (key: string): Promise<string | null> =>
        NativeStorage.getString(key),

    remove: (key: string) =>
        NativeStorage.remove(key),

    clearAll: () =>
        NativeStorage.clearAll(),

    destroy: () => {
    },
};
