import { View, Text } from 'react-native';
import React from 'react';

const FormatTime = (time) => {
    const [hours, minutes] = time.split(':');
    const formattedHours = hours % 12 || 12;
    const period = hours >= 12 ? 'PM' : 'AM';
    return `${formattedHours}:${minutes ?? '00'} ${period}`;
};

export default FormatTime;
