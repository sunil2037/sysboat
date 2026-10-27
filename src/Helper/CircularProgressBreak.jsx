import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { View, StyleSheet, Easing } from 'react-native';
import { AnimatedCircularProgress } from 'react-native-circular-progress';
import moment from 'moment-timezone';
import { useAuth } from '../Context/AuthContext';

const getISTTime = () => moment().tz('Asia/Kolkata').toDate();

const CircularProgressBreak = ({ data, breakInTime, breakOutTime, message }) => {
  var companyOutTime = data?.out_time;

  const [companyProgress, setCompanyProgress] = useState(0);

  const getPercentage = useCallback((companyOutTime, startTime, outTime) => {
    if (!startTime) { return 0; }

    const today = new Date().toISOString().split('T')[0];
    const start = new Date(`${today}T${startTime}`);
    const end = new Date(companyOutTime);
    const now = new Date();

    if (now < start) { return 0; }

    const totalTime = end - start;
    const elapsedTime = Math.min(now - start, totalTime);
    let companyPercentage = Math.round((elapsedTime / totalTime) * 100);

    if (outTime && outTime !== '00:00:00') {
      const out = new Date(`${today}T${outTime}`);
      if (out < start) { return companyPercentage; }

      let outTimeMs = Math.min(out.getTime(), end.getTime());
      const workedTime = outTimeMs - start.getTime();
      const workedPercentage = Math.round((workedTime / totalTime) * 100);
      return workedPercentage;
    }

    return companyPercentage;
  }, []);

  useEffect(() => {
    if (breakInTime) {
      const initialProgress = getPercentage(companyOutTime, breakInTime, breakOutTime);
      setCompanyProgress(initialProgress < 1 ? 1 : initialProgress);
    } else {
      setCompanyProgress(0);
    }
  }, [breakInTime, breakOutTime, companyOutTime, getPercentage]);

  useEffect(() => {
    if (!breakInTime) { return; }

    const updateProgress = () => {
      const progress = getPercentage(companyOutTime, breakInTime, breakOutTime);

      setCompanyProgress(prev => {
        const newProgress = progress < 1 ? 1 : progress;
        return prev !== newProgress ? newProgress : prev;
      });

      if (progress >= 50) {
        message('Minimum half-day time reached');
      } else {
        message('');
      }
    };

    updateProgress();

    const interval = setInterval(updateProgress, 20000);
    return () => clearInterval(interval);
  }, [breakInTime, breakOutTime, companyOutTime, getPercentage]);

  return (
    <View style={styles.container}>
      <AnimatedCircularProgress
        size={223}
        lineCap="round"
        width={10}
        fill={companyProgress}
        rotation={360}
        tintColor="#D70654"
        backgroundColor="transparent"
        delay={500}
        duration={5000}
        easing={Easing.ease}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    top: 0,
    zIndex: 1,
  },
});

export default React.memo(CircularProgressBreak);
