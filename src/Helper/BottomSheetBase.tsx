import React, {
  useCallback,
  useEffect,
  useRef,
  useMemo,
  useState,
} from 'react';
import {
  StyleSheet,
  BackHandler,
  Platform,
  StyleProp,
  ViewStyle,
  Keyboard,
  KeyboardAvoidingView,
} from 'react-native';
import {
  BottomSheetModal,
  BottomSheetScrollView,
  BottomSheetView,
  BottomSheetBackdrop,
  BottomSheetBackdropProps,
  useBottomSheetTimingConfigs,
} from '@gorhom/bottom-sheet';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Easing } from 'react-native-reanimated';
import { STATUS_BAR_HEIGHT } from './Helper';

interface BottomSheetBaseProps {
  header?: React.ReactNode;
  isScrollView?: boolean;
  visible: boolean;
  onClose?: () => void;
  children: React.ReactNode;
  isStatic?: boolean;
  isSnapPoint?: boolean;
  snapPoints?: (string | number)[];
  isHandle?: boolean;
  handleStyle?: StyleProp<ViewStyle>;
  backgroundStyle?: StyleProp<ViewStyle>;
  contentContainerStyle?: StyleProp<ViewStyle>;
  keyboardBehavior?: 'height' | 'padding' | 'position';
  freeze?: boolean;
}

const BottomSheetBase: React.FC<BottomSheetBaseProps> = ({
  header,
  isScrollView = true,
  visible,
  onClose,
  children,
  snapPoints = ['40%'],
  isStatic = false,
  isSnapPoint = false,
  isHandle = false,
  handleStyle,
  backgroundStyle,
  contentContainerStyle,
  keyboardBehavior = Platform.OS === 'ios' ? 'padding' : 'height',
  freeze = false,
}) => {
  const insets = useSafeAreaInsets();
  const bottomInset = Platform.OS === 'android'
    ? (insets.bottom === 0 ? 30 : insets.bottom)
    : insets.bottom;
  const bottomSheetModalRef = useRef<BottomSheetModal>(null);
  const [kbVisible, setKbVisible] = useState(false);
  const isPresentedRef = useRef(false);
  const animationTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const showSubscription = Keyboard.addListener('keyboardDidShow', () => {
      setKbVisible(true);
    });
    const hideSubscription = Keyboard.addListener('keyboardDidHide', () => {
      setKbVisible(false);
    });

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

  const ContainerComponent = useMemo(
    () => (isScrollView ? BottomSheetScrollView : BottomSheetView),
    [isScrollView],
  );

  const mergedHandleStyle = useMemo(
    () => [styles.handle, handleStyle],
    [handleStyle],
  );
  const mergedBackgroundStyle = useMemo(
    () => [styles.background, backgroundStyle],
    [backgroundStyle],
  );
  const mergedContentContainerStyle = useMemo(
    () => [styles.contentContainer, contentContainerStyle, { paddingBottom: bottomInset }],
    [contentContainerStyle, bottomInset],
  );

  const handleSheetChanges = useCallback(
    (index: number) => {
      if (index === -1 && !isStatic) {
        Keyboard.dismiss();
        isPresentedRef.current = false;
        onClose?.();
      }
    },
    [onClose, isStatic],
  );

  const animationConfigs = useBottomSheetTimingConfigs({
    duration: 250,
    easing: Easing.ease,
  });

  const controlSheet = useCallback((shouldShow: boolean) => {
    if ((shouldShow && isPresentedRef.current) || (!shouldShow && !isPresentedRef.current)) {
      return;
    }

    if (shouldShow) {
      bottomSheetModalRef.current?.present();
      isPresentedRef.current = true;
    } else {
      bottomSheetModalRef.current?.dismiss();
      isPresentedRef.current = false;
    }
  }, []);

  useEffect(() => {
    controlSheet(visible);
  }, [visible, controlSheet]);

  useEffect(() => {
    const backAction = () => {
      if (isPresentedRef.current && !freeze && !isStatic) {
        Keyboard.dismiss();
        controlSheet(false);
        return true;
      }
      return false;
    };

    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      backAction,
    );

    return () => backHandler.remove();
  }, [freeze, isStatic, controlSheet]);

  useEffect(() => {
    return () => {
      if (animationTimeoutRef.current) {
        clearTimeout(animationTimeoutRef.current);
      }
    };
  }, []);

  return (
    <BottomSheetModal
      stackBehavior="push"
      ref={bottomSheetModalRef}
      handleComponent={() => null}

      animationConfigs={animationConfigs}
      index={0}
      {...(isSnapPoint ? { snapPoints } : {})}
      topInset={STATUS_BAR_HEIGHT()}
      handleIndicatorStyle={{ display: isHandle ? 'flex' : 'none' }}
      handleStyle={mergedHandleStyle}
      backgroundStyle={mergedBackgroundStyle}
      keyboardBehavior={Platform.OS === 'ios' ? 'extend' : 'interactive'}
      keyboardBlurBehavior="none"
      enablePanDownToClose={!kbVisible && !isStatic && !freeze}
      onChange={handleSheetChanges}
      onDismiss={() => {
        isPresentedRef.current = false;
        onClose?.();
      }}
      backdropComponent={(props: BottomSheetBackdropProps) => (
        <BottomSheetBackdrop
          {...props}
          appearsOnIndex={0}
          disappearsOnIndex={-1}
          pressBehavior={kbVisible || isStatic || freeze ? 'none' : 'close'}
        />
      )}
    >
      {header ? header : null}

      <ContainerComponent
        contentContainerStyle={mergedContentContainerStyle}
        style={[styles.containerComponent, { paddingBottom: bottomInset }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {children}
      </ContainerComponent>
    </BottomSheetModal>
  );
};

const styles = StyleSheet.create({
  background: {
    backgroundColor: 'rgb(241, 241, 241)',
    borderTopLeftRadius: 20, borderTopRightRadius: 20
  },
  contentContainer: { padding: 20, backgroundColor: 'rgb(241, 241, 241)', flexGrow: 1, borderTopLeftRadius: 20, borderTopRightRadius: 20 },
  containerComponent: { flex: 1, },
});

export default React.memo(BottomSheetBase);
