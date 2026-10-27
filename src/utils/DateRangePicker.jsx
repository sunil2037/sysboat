import { NativeModules, Platform } from 'react-native';

const { DateRangePicker } = NativeModules;

/**
 * @param {object}  options
 * @param {string}  [options.title]
 * @param {string}  [options.inputMode]   "calendar" | "input"
 * @param {number}  [options.startDate]   ms epoch
 * @param {number}  [options.endDate]     ms epoch
 * @param {number}  [options.minDate]     ms epoch
 * @param {number}  [options.maxDate]     ms epoch
 */
export function showDateRangePicker(options = {}) {
    if (Platform.OS !== 'android') {
        return Promise.reject(new Error('DateRangePicker is Android-only'));
    }
    return DateRangePicker.show(options);
}