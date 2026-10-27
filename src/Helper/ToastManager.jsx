// Toast.js
import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity, Dimensions } from 'react-native';
import { ErrorIcon, SuccessIcon } from './IconsLoad';
import { getFontSize, STATUS_BAR_HEIGHT } from './Helper';

const ToastTypes = {
  SUCCESS: 'success',
  ERROR: 'error',
  INFO: 'info',
};

const Toast = ({ message, type, duration = 5000, onHide }) => {
  const [visible, setVisible] = useState(true);
  const opacity = useRef(new Animated.Value(0)).current;
  const windowHeight = Dimensions.get('window').height;

  useEffect(() => {
    Animated.timing(opacity, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();

    const timer = setTimeout(() => {
      hideToast();
    }, duration);

    return () => clearTimeout(timer);
  }, []);

  const hideToast = () => {
    Animated.timing(opacity, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setVisible(false);
      onHide && onHide();
    });
  };

  if (!visible) { return null; }

  const getBackgroundColor = () => {
    switch (type) {
      case ToastTypes.SUCCESS:
        return 'white';
      case ToastTypes.ERROR:
        return 'white';
      case ToastTypes.INFO:
        return 'white';
      default:
        return 'white';
    }
  };

  const getIcon = () => {
    switch (type) {
      case ToastTypes.SUCCESS:
        return <SuccessIcon width={25} height={25} color="#51B625" />;
      case ToastTypes.ERROR:
        return <ErrorIcon width={25} height={25} color="#CA282C" />;
      case ToastTypes.INFO:
        return 'i';
      default:
        return '';
    }
  };

  return (
    <Animated.View
      style={[
        styles.toastContainer,
        {
          top: STATUS_BAR_HEIGHT(),
          opacity,
          transform: [
            {
              translateY: opacity.interpolate({
                inputRange: [0, 1],
                outputRange: [-windowHeight * 0.1, 0],
              }),
            },
          ],
          backgroundColor: getBackgroundColor(),
        },
      ]}
    >
      <View style={styles.iconContainer}>
        <Text style={styles.iconText}>{getIcon()}</Text>
      </View>
      <Text style={styles.messageText}>{message}</Text>
      {/* <TouchableOpacity onPress={hideToast} style={styles.closeButton}>
        <Text style={styles.closeText}>×</Text>
      </TouchableOpacity> */}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  toastContainer: {
    position: 'absolute',
    left: 20,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    zIndex: 9999,
    borderWidth: 1,
    borderColor: '#E2E2E2',
  },
  iconContainer: {
    marginRight: 12,
  },
  iconText: {
    color: '#293646',
    fontSize: 20,
    fontWeight: 'bold',
  },
  messageText: {
    flex: 1,
    color: '#293646',
    fontFamily: 'Poppins-Medium',
    fontSize: 14,
  },
  closeButton: {
    marginLeft: 12,
    padding: 4,
  },
  closeText: {
    color: 'black',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

// ToastManager Implementation
class ToastManagerClass {
  constructor() {
    this.toasts = [];
    this.setToasts = null;
  }

  show(message, type = ToastTypes.INFO, duration = 5000) {
    const id = Date.now().toString();
    this.toasts = [...this.toasts, { id, message, type, duration }];
    this.setToasts && this.setToasts(this.toasts);

    // Auto-hide if duration is set
    if (duration > 0) {
      setTimeout(() => {
        this.hide(id);
      }, duration);
    }
  }

  hide(id) {
    this.toasts = this.toasts.filter((toast) => toast.id !== id);
    this.setToasts && this.setToasts(this.toasts);
  }

  success(message, duration) {
    this.show(message, ToastTypes.SUCCESS, duration);
  }

  error(message, duration) {
    this.show(message, ToastTypes.ERROR, duration);
  }

  info(message, duration) {
    this.show(message, ToastTypes.INFO, duration);
  }
}

const toastManager = new ToastManagerClass();

const ToastManager = () => {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    toastManager.setToasts = setToasts;
    return () => {
      toastManager.setToasts = null;
    };
  }, []);

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          duration={toast.duration}
          onHide={() => toastManager.hide(toast.id)}
        />
      ))}
    </View>
  );
};

// Export the toast manager instance
export const toast = {
  success: (message, duration) => toastManager.success(message, duration),
  error: (message, duration) => toastManager.error(message, duration),
  info: (message, duration) => toastManager.info(message, duration),
  show: (message, type, duration) => toastManager.show(message, type, duration),
  hide: (id) => toastManager.hide(id),
};

export default ToastManager;
