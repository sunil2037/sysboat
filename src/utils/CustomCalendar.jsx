import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LocaleConfig, Calendar } from 'react-native-calendars';
import { LeftSideArrow, RightSideArrow } from '../Helper/IconsLoad';
// Configure locale once outside the component
LocaleConfig.locales.custom = {
    monthNames: [
        'January',
        'February',
        'March',
        'April',
        'May',
        'June',
        'July',
        'August',
        'September',
        'October',
        'November',
        'December',
    ],
    monthNamesShort: [
        'JAN',
        'FEB',
        'MAR',
        'APR',
        'MAY',
        'JUN',
        'JUL',
        'AUG',
        'SEP',
        'OCT',
        'NOV',
        'DEC',
    ],
    dayNames: [
        'SUNDAY',
        'MONDAY',
        'TUESDAY',
        'WEDNESDAY',
        'THURSDAY',
        'FRIDAY',
        'SATURDAY',
    ],
    dayNamesShort: ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'],
};

LocaleConfig.defaultLocale = 'custom';

const calendarTheme = {
    backgroundColor: '#ffffff',
    calendarBackground: 'white',
    textSectionTitleColor: '#CA282C',
    selectedDayBackgroundColor: '#4CAF50',
    selectedDayTextColor: '#ffffff',
    todayTextColor: '#FF5722',
    dayTextColor: '#000000',
    textDisabledColor: '#d9e1e8',
    dotColor: '#FF5722',
    selectedDotColor: '#ffffff',
    arrowColor: '#4CAF50',
    monthTextColor: '#2196F3',
    indicatorColor: '#2196F3',
    textDayFontFamily: 'Poppins-Regular',
    textMonthFontFamily: 'Poppins-Medium',
    textDayHeaderFontFamily: 'Poppins-Regular',
    textDayFontSize: 14,
    textMonthFontSize: 16,
    textDayHeaderFontSize: 12,
};

export default function CustomCalendar({
    maxDate = false,
    rangeDate,
    selectedRange,
}) {
    const [selection, setSelection] = useState({
        startDate: null,
        endDate: null,
        markedDates: {},
    });

    const [currentMonth, setCurrentMonth] = useState(
        new Date().toISOString().split('T')[0],
    );

    const cutoffDate = useMemo(() => {
        const date = new Date();
        date.setDate(date.getDate() - 1);
        return date;
    }, []);

    const isDateDisabled = useCallback(
        dateString => {
            const date = new Date(dateString);
            return date > cutoffDate;
        },
        [cutoffDate],
    );

    const getMarkedDates = useCallback(
        (start, end) => {
            if (!start) {
                return {};
            }

            let marked = {};

            const today = new Date();
            let currentDate = new Date(today.getFullYear(), today.getMonth(), 1);
            const endDateForDisabled = new Date(cutoffDate);
            endDateForDisabled.setDate(cutoffDate.getDate() + 365);

            while (currentDate <= endDateForDisabled) {
                const dateStr = currentDate.toISOString().split('T')[0];
                if (isDateDisabled(dateStr)) {
                    marked[dateStr] = { disabled: true, disableTouchEvent: true };
                }
                currentDate.setDate(currentDate.getDate() + 1);
            }

            // Then handle the selection markings
            if (!end) {
                marked[start] = {
                    ...marked[start],
                    color: '#CA282C',
                    textColor: 'white',
                    startingDay: true,
                    endingDay: true,
                };
                return marked;
            }

            const startDate = new Date(start);
            const endDate = new Date(end);
            currentDate = new Date(startDate);

            // Mark the range
            while (currentDate <= endDate) {
                const dateStr = currentDate.toISOString().split('T')[0];
                marked[dateStr] = {
                    ...marked[dateStr],
                    color: '#FFE5E6',
                    textColor: 'black',
                    disabled: false, // Override disabled if within selected range
                };
                currentDate.setDate(currentDate.getDate() + 1);
            }

            // Highlight start and end dates
            marked[start] = {
                ...marked[start],
                color: '#CA282C',
                textColor: 'white',
                startingDay: true,
            };
            marked[end] = {
                ...marked[end],
                color: '#CA282C',
                textColor: 'white',
                endingDay: true,
            };

            return marked;
        },
        [isDateDisabled],
    );

    useEffect(() => {
        if (selectedRange) {
            const { startDate, endDate } = selectedRange;
            if (startDate && isDateDisabled(startDate)) {
                return;
            }
            if (endDate && isDateDisabled(endDate)) {
                return;
            }

            const markedDates = getMarkedDates(startDate, endDate);
            setSelection({ startDate, endDate, markedDates });
        }
    }, [selectedRange, getMarkedDates, isDateDisabled]);

    const markedDates = useMemo(() => {
        return selection.markedDates;
    }, [selection.markedDates]);

    const onMonthChange = useCallback(month => {
        setCurrentMonth(month.dateString);
    }, []);

    const handleDayPress = useCallback(
        day => {
            const selectedDate = day.dateString;

            if (isDateDisabled(selectedDate)) {
                return;
            }

            setSelection(prev => {
                if (!prev.startDate) {
                    const markedDates = getMarkedDates(selectedDate, null);
                    rangeDate({ startDate: selectedDate, endDate: null });
                    return { startDate: selectedDate, endDate: null, markedDates };
                }

                if (!prev.endDate) {
                    // Second date selected - only allow if it's after start date and not disabled
                    if (new Date(selectedDate) >= new Date(prev.startDate)) {
                        const markedDates = getMarkedDates(prev.startDate, selectedDate);
                        rangeDate({ startDate: prev.startDate, endDate: selectedDate });
                        return { ...prev, endDate: selectedDate, markedDates };
                    } else {
                        // If selected date is before start date, reset with new start date
                        const markedDates = getMarkedDates(selectedDate, null);
                        rangeDate({ startDate: selectedDate, endDate: null });
                        return { startDate: selectedDate, endDate: null, markedDates };
                    }
                } else {
                    // Reset selection with new date
                    const markedDates = getMarkedDates(selectedDate, null);
                    rangeDate({ startDate: selectedDate, endDate: null });
                    return { startDate: selectedDate, endDate: null, markedDates };
                }
            });
        },
        [getMarkedDates, rangeDate, isDateDisabled],
    );

    // Memoize the header render function
    const renderHeader = useCallback(
        date => (
            <Text
                style={{
                    fontFamily: 'Poppins-Medium',
                    fontSize: 15,
                    color: '#293646',
                    lineHeight: 20,
                }}>
                {date.toString('MMMM yyyy')}
            </Text>
        ),
        [],
    );

    // Memoize the arrow render function
    const renderArrow = useCallback(
        direction =>
            direction === 'left' ? (
                <LeftSideArrow width={25} height={25} />
            ) : (
                <RightSideArrow width={25} height={25} />
            ),
        [],
    );

    return (
        <View style={styles.container}>
            <Calendar
                key={`calendar-${selection.startDate}-${selection.endDate}`}
                current={currentMonth}
                markedDates={markedDates}
                markingType={'period'}
                onDayPress={handleDayPress}
                onMonthChange={onMonthChange}
                renderHeader={renderHeader}
                renderArrow={renderArrow}
                theme={calendarTheme}
                hideExtraDays={true}
                disableMonthChange={false}
                firstDay={1}
                enableSwipeMonths={true}
                // maxDate={maxDate ? cutoffDate.toISOString().split('T')[0] : false}
                maxDate={cutoffDate.toISOString().split('T')[0]}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        justifyContent: 'center',
        paddingVertical: 20,
    }
})