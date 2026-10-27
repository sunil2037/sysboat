import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { getFontSize } from '../Helper/Helper';
import ThemedText from '../Helper/ThemedText';

const TimeAndDate = () => {
  const [currentDate, setCurrentDate] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentDate(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const formatTime = date => {
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const formattedHours = hours % 12 || 12;
    const formattedMinutes = minutes < 10 ? `0${minutes}` : minutes;

    return `${formattedHours}:${formattedMinutes} ${ampm}`;
  };

  const formatDate = date => {
    const months = [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Oct',
      'Nov',
      'Dec',
    ];
    const daysOfWeek = [
      'Sunday',
      'Monday',
      'Tuesday',
      'Wednesday',
      'Thursday',
      'Friday',
      'Saturday',
    ];

    const day = date.getDate();
    const month = months[date.getMonth()];
    const year = date.getFullYear();
    const weekday = daysOfWeek[date.getDay()];

    return `${month} ${day < 10 ? '0' + day : day}, ${year} - ${weekday}`;
  };

  return (
    <View style={styles.container}>
      <ThemedText size='4xl' weight='Regular'>
        {formatTime(currentDate)}
      </ThemedText>
      <ThemedText size='sm' weight='Regular' color='secondary'>
        {formatDate(currentDate)}
      </ThemedText>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 20,
  },
  time: {
    fontSize: 50,
    fontFamily: 'Poppins-Regular',
    color: '#293646',
    lineHeight: 60,
  },
  date: {
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
    color: '#6A7D94',
    paddingTop: 10,
  },
});

export default TimeAndDate;
