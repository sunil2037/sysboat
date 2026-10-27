import React, {
  useEffect,
  useState,
  useRef,
  useMemo,
  useCallback,
} from 'react';
import { View, StyleSheet, Easing } from 'react-native';
import { AnimatedCircularProgress } from 'react-native-circular-progress';
import moment from 'moment-timezone';

const CircularProgress = ({ data, inTime, outTime, message }) => {
  const companyInTime = data?.in_time;
  const companyOutTime = data?.out_time;
  const companyHalfTime = data?.half_day_time;

  const [companyProgress, setCompanyProgress] = useState(0);
  const [userProgress, setUserProgress] = useState(0);
  const [halfDayMessageShown, setHalfDayMessageShown] = useState(false);

  const intervalRef = useRef(null);

  const companyAnimRef = useRef(0);
  const userAnimRef = useRef(0);

  const getCurrentISTTime = useCallback(
    () => moment().tz('Asia/Kolkata').toDate(),
    []
  );

  const inTimeDate = useMemo(
    () => (inTime ? new Date(inTime) : null),
    [inTime]
  );

  const halfDayReachedTime = useMemo(() => {
    if (!inTimeDate || !companyHalfTime) return null;
    return new Date(
      inTimeDate.getTime() + companyHalfTime * 60 * 60 * 1000
    );
  }, [inTimeDate, companyHalfTime]);


  const getPercentage = useCallback(
    startTime => {
      if (!startTime || !companyInTime || !companyOutTime) return 0;

      const start = new Date(startTime);
      const open = new Date(companyInTime);
      const close = new Date(companyOutTime);
      const now = getCurrentISTTime();

      const effectiveStart = Math.max(start.getTime(), open.getTime());
      const total = close.getTime() - open.getTime();
      const elapsed =
        Math.min(now.getTime(), close.getTime()) - effectiveStart;

      const percent = Math.round((elapsed / total) * 100);
      return Math.min(Math.max(percent, 1), 100);
    },
    [companyInTime, companyOutTime, getCurrentISTTime]
  );


  const animateFill = useCallback((target, setter, ref) => {
    const current = ref.current;
    const diff = Math.abs(target - current);

    if (diff > 15) {
      ref.current = target;
      setter(target);
      return;
    }

    const step = () => {
      const cur = ref.current;
      const delta = target - cur;

      if (Math.abs(delta) < 0.1) {
        ref.current = target;
        setter(Math.round(target));
        return;
      }

      let animationSpeed = 0.3;

      if (cur >= 90) {
        animationSpeed = 0.05;
      } else if (cur >= 85) {
        animationSpeed = 0.15;
      }

      ref.current = cur + delta * animationSpeed;
      setter(Math.round(ref.current));
      requestAnimationFrame(step);
    };

    step();
  }, []);


  const updateProgress = useCallback(() => {
    if (!inTimeDate) {
      animateFill(0, setCompanyProgress, companyAnimRef);
      return;
    }

    const progress = getPercentage(inTime);
    animateFill(progress, setCompanyProgress, companyAnimRef);

    if (halfDayReachedTime && !halfDayMessageShown) {
      if (getCurrentISTTime() >= halfDayReachedTime) {
        message?.('Minimum half day time reached');
        setHalfDayMessageShown(true);
      }
    }

    const now = getCurrentISTTime();
    const companyOutDate = new Date(companyOutTime);

    if (!outTime && now > companyOutDate) {
      const max = 2 * 60 * 60 * 1000;
      const elapsed = now.getTime() - companyOutDate.getTime();
      const overtime = Math.min(
        Math.round((elapsed / max) * 100),
        100
      );
      animateFill(overtime, setUserProgress, userAnimRef);
    } else {
      animateFill(0, setUserProgress, userAnimRef);
    }
  }, [
    inTime,
    inTimeDate,
    outTime,
    companyOutTime,
    getPercentage,
    halfDayReachedTime,
    halfDayMessageShown,
    message,
    getCurrentISTTime,
    animateFill,
  ]);


  useEffect(() => {
    updateProgress();
    intervalRef.current = setInterval(updateProgress, 30000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [updateProgress]);

  useEffect(() => {
    setHalfDayMessageShown(false);
    companyAnimRef.current = 0;
    userAnimRef.current = 0;
  }, [inTime]);


  return (
    <>
      <View style={styles.container}>
        <AnimatedCircularProgress
          size={223}
          width={10}
          prefill={companyInTime && 1}
          fill={companyProgress}
          rotation={360}
          lineCap="round"
          delay={500}
          duration={5000}
          easing={Easing.ease}
          tintColor="#D70654"
          backgroundColor="transparent"
        />
      </View>

      <View style={styles.container2}>
        <AnimatedCircularProgress
          size={223}
          width={10}
          fill={userProgress}
          delay={500}
          duration={5000}
          easing={Easing.ease}
          rotation={360}
          lineCap="round"
          tintColor="#F09319"
          backgroundColor="transparent"
          padding={20}
        />
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    top: 0,
  },
  container2: {
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    top: -10,
  },
});

export default React.memo(CircularProgress);