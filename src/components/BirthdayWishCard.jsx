
import React, { useEffect, useRef, useState, useCallback, memo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Pressable,
  Platform,
  StatusBar,
  Modal,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withDelay,
  withSequence,
  withRepeat,
  interpolate,
  Extrapolation,
  runOnJS,
  FadeIn,
  FadeInDown,
  FadeInUp,
  ZoomIn,
  SlideInRight,
  useAnimatedReaction,
  cancelAnimation,
} from 'react-native-reanimated';
import { Cross } from '../Helper/IconsLoad';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

const easeInQuad = (t) => { 'worklet'; return t * t; };
const easeOutQuad = (t) => { 'worklet'; return t * (2 - t); };
const easeInOutSine = (t) => { 'worklet'; return -(Math.cos(Math.PI * t) - 1) / 2; };
const easeOutExpo = (t) => { 'worklet'; return t === 1 ? 1 : 1 - Math.pow(2, -10 * t); };
const easeLinear = (t) => { 'worklet'; return t; };
const easeOutBack = (t) => {
  'worklet';
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
};

const COLORS = {
  bg: '#1A0405',        // deep dark red-black background
  card: '#FFFFFF',      // white card
  accent1: '#CA282C',   // primary brand red
  accent2: '#E8474B',   // lighter red
  accent3: '#FFD700',   // gold for birthday feel
  accent4: '#CA282C',   // red variant
  accent5: '#FF6B6B',   // soft red
  text: '#1A0405',      // dark text on white card
  textMuted: '#8A6060', // muted warm-red toned text
  inputBg: '#FFF5F5',   // very light pink-white input
  border: '#F0CECE',    // soft red border
  gold: '#FFD700',
  shimmer: '#FFE0E0',
};

const CONFETTI_COLORS = [
  '#CA282C',
  '#E8474B',
  '#FFD700',
  '#FF6B6B',
  '#FFFFFF',
  '#FF9999',
  '#FFB3B3',
  '#FFC0C0',
];

const WISH_MESSAGES = [
  '🎉 Wishing you a fantastic birthday!',
  '🌟 Many happy returns of the day!',
  '🎂 Hope your day is as special as you are!',
  '🚀 Another year of amazing achievements ahead!',
  '✨ May all your dreams come true this year!',
  '🎊 Celebrating the awesome person you are!',
];

const EMOJI_REACTIONS = ['🎂', '🎉', '🥳', '🌟', '💐', '🎁', '🍰', '✨'];

const ConfettiParticle = ({ index, trigger }) => {
  const x = useSharedValue(Math.random() * SCREEN_W);
  const y = useSharedValue(-20);
  const rotate = useSharedValue(0);
  const opacity = useSharedValue(1);
  const scale = useSharedValue(Math.random() * 0.6 + 0.4);

  const color = CONFETTI_COLORS[index % CONFETTI_COLORS.length];
  const size = Math.random() * 10 + 6;
  const isCircle = Math.random() > 0.5;
  const duration = Math.random() * 2000 + 2000;
  const delay = Math.random() * 1500;

  useEffect(() => {
    if (!trigger) return;
    x.value = Math.random() * SCREEN_W;
    y.value = -20;
    opacity.value = 1;
    rotate.value = 0;

    x.value = withDelay(
      delay,
      withTiming(x.value + (Math.random() - 0.5) * 200, { duration })
    );
    y.value = withDelay(
      delay,
      withTiming(SCREEN_H + 40, { duration, easing: easeInQuad })
    );
    rotate.value = withDelay(
      delay,
      withTiming(Math.random() * 720 - 360, { duration })
    );
    opacity.value = withDelay(
      delay + duration * 0.7,
      withTiming(0, { duration: duration * 0.3 })
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trigger]);

  const style = useAnimatedStyle(() => ({
    transform: [
      { translateX: x.value },
      { translateY: y.value },
      { rotate: `${rotate.value}deg` },
      { scale: scale.value },
    ],
    opacity: opacity.value,
    position: 'absolute',
    width: size,
    height: isCircle ? size : size * 0.4,
    borderRadius: isCircle ? size / 2 : 2,
    backgroundColor: color,
  }));

  return <Animated.View style={style} />;
};

const FloatingBalloon = ({ color, delay, startX }) => {
  const y = useSharedValue(SCREEN_H + 60);
  const x = useSharedValue(startX);
  const rotate = useSharedValue(0);

  useEffect(() => {
    y.value = withDelay(
      delay,
      withRepeat(
        withTiming(-80, { duration: 5000 + Math.random() * 2000, easing: easeInOutSine }),
        -1,
        false
      )
    );
    x.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(startX + 20, { duration: 1500, easing: easeInOutSine }),
          withTiming(startX - 20, { duration: 1500, easing: easeInOutSine })
        ),
        -1,
        true
      )
    );
    rotate.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(-8, { duration: 1200 }),
          withTiming(8, { duration: 1200 })
        ),
        -1,
        true
      )
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const style = useAnimatedStyle(() => ({
    position: 'absolute',
    transform: [
      { translateX: x.value },
      { translateY: y.value },
      { rotate: `${rotate.value}deg` },
    ],
  }));

  return (
    <Animated.View style={style}>
      <View style={[styles.balloon, { backgroundColor: color }]}>
        <View style={[styles.balloonShine, { backgroundColor: `${color}80` }]} />
      </View>
      <View style={[styles.balloonString, { borderColor: color }]} />
    </Animated.View>
  );
};

const Sparkle = ({ x: sx, y: sy, delay }) => {
  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);
  const rotate = useSharedValue(0);

  useEffect(() => {
    scale.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(1, { duration: 400 }),
          withTiming(0, { duration: 400 })
        ),
        -1,
        false
      )
    );
    opacity.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(1, { duration: 400 }),
          withTiming(0, { duration: 400 })
        ),
        -1,
        false
      )
    );
    rotate.value = withRepeat(
      withTiming(360, { duration: 3000, easing: easeLinear }),
      -1,
      false
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const style = useAnimatedStyle(() => ({
    position: 'absolute',
    left: sx,
    top: sy,
    transform: [{ scale: scale.value }, { rotate: `${rotate.value}deg` }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={style}>
      <Text style={{ fontSize: 14, color: 'white' }}>✦</Text>
    </Animated.View>
  );
};

const PulseRing = ({ color, size, delay }) => {
  const scale = useSharedValue(0.8);
  const opacity = useSharedValue(0.6);

  useEffect(() => {
    scale.value = withDelay(
      delay,
      withRepeat(
        withTiming(1.6, { duration: 2000, easing: easeOutExpo }),
        -1,
        false
      )
    );
    opacity.value = withDelay(
      delay,
      withRepeat(
        withTiming(0, { duration: 2000, easing: easeOutExpo }),
        -1,
        false
      )
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const style = useAnimatedStyle(() => ({
    position: 'absolute',
    width: size,
    height: size,
    borderRadius: size / 2,
    borderWidth: 2,
    borderColor: color,
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
    alignSelf: 'center',
  }));

  return <Animated.View style={style} />;
};

const EmojiBurst = ({ emoji, onComplete }) => {
  const scale = useSharedValue(0);
  const opacity = useSharedValue(1);
  const y = useSharedValue(0);
  const x = useSharedValue((Math.random() - 0.5) * 80);

  useEffect(() => {
    scale.value = withSequence(
      withSpring(1.4, { damping: 6 }),
      withDelay(600, withTiming(0, { duration: 400 }))
    );
    y.value = withTiming(-100, { duration: 1200, easing: easeOutQuad });
    opacity.value = withDelay(700, withTiming(0, { duration: 500 }));

    setTimeout(() => {
      runOnJS(onComplete)();
    }, 1300);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const style = useAnimatedStyle(() => ({
    transform: [
      { translateX: x.value },
      { translateY: y.value },
      { scale: scale.value },
    ],
    opacity: opacity.value,
    position: 'absolute',
    bottom: 20,
    alignSelf: 'center',
  }));

  return (
    <Animated.View style={[style, { zIndex: 99 }]}>
      <Text style={{ fontSize: 36 }}>{emoji}</Text>
    </Animated.View>
  );
};

// ─── Avatar Component ─────────────────────────────────────────────────────────
const AnimatedAvatar = ({ name, initials }) => {
  const ring1Scale = useSharedValue(1);
  const ring2Scale = useSharedValue(1);
  const avatarScale = useSharedValue(0);
  const glowOpacity = useSharedValue(0);
  const crownBounce = useSharedValue(-10);
  const crownOpacity = useSharedValue(0);

  useEffect(() => {
    avatarScale.value = withDelay(300, withSpring(1, { damping: 8, stiffness: 100 }));
    glowOpacity.value = withDelay(500, withTiming(1, { duration: 800 }));

    ring1Scale.value = withDelay(
      600,
      withRepeat(
        withSequence(
          withTiming(1.15, { duration: 1200, easing: easeInOutSine }),
          withTiming(1, { duration: 1200, easing: easeInOutSine })
        ),
        -1,
        true
      )
    );
    ring2Scale.value = withDelay(
      900,
      withRepeat(
        withSequence(
          withTiming(1.2, { duration: 1400, easing: easeInOutSine }),
          withTiming(1, { duration: 1400, easing: easeInOutSine })
        ),
        -1,
        true
      )
    );

    crownOpacity.value = withDelay(800, withTiming(1, { duration: 400 }));
    crownBounce.value = withDelay(
      800,
      withRepeat(
        withSequence(
          withTiming(-16, { duration: 600, easing: easeOutBack }),
          withTiming(-10, { duration: 400, easing: easeInQuad })
        ),
        -1,
        false
      )
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const avatarStyle = useAnimatedStyle(() => ({
    transform: [{ scale: avatarScale.value }],
  }));
  const ring1Style = useAnimatedStyle(() => ({
    transform: [{ scale: ring1Scale.value }],
  }));
  const ring2Style = useAnimatedStyle(() => ({
    transform: [{ scale: ring2Scale.value }],
  }));
  const crownStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: crownBounce.value }],
    opacity: crownOpacity.value,
  }));

  return (
    <View style={styles.avatarContainer}>
      {/* Crown */}
      <Animated.View style={[styles.crownWrapper, crownStyle]}>
        <Text style={styles.crownEmoji}>👑</Text>
      </Animated.View>

      {/* Pulse rings */}
      <Animated.View style={[styles.avatarRing2, ring2Style]} />
      <Animated.View style={[styles.avatarRing1, ring1Style]} />

      {/* Avatar */}
      <Animated.View style={[styles.avatarCircle, avatarStyle]}>
        <Text style={styles.avatarInitials}>{initials}</Text>
      </Animated.View>
    </View>
  );
};

// ─── Shimmer Text ─────────────────────────────────────────────────────────────
const ShimmerText = ({ text, style: textStyle }) => {
  const shimmerX = useSharedValue(-SCREEN_W);

  useEffect(() => {
    shimmerX.value = withRepeat(
      withTiming(SCREEN_W * 2, { duration: 2200, easing: easeLinear }),
      -1,
      false
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Text style={[textStyle, styles.shimmerText]}>{text}</Text>
  );
};

const WishButton = ({ onPress, sent }) => {
  const scale = useSharedValue(1);
  const glow = useSharedValue(0);

  const handlePress = useCallback(() => {
    scale.value = withSequence(
      withTiming(0.94, { duration: 100 }),
      withSpring(1.05, { damping: 6 }),
      withTiming(1, { duration: 200 })
    );
    glow.value = withSequence(
      withTiming(1, { duration: 200 }),
      withTiming(0, { duration: 600 })
    );
    onPress();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onPress]);

  const btnStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    shadowOpacity: interpolate(glow.value, [0, 1], [0.3, 0.9]),
    shadowRadius: interpolate(glow.value, [0, 1], [8, 24]),
  }));

  return (
    <Animated.View style={[styles.sendBtnWrapper, btnStyle]}>
      <Pressable
        onPress={handlePress}
        style={[styles.sendBtn, sent && styles.sendBtnSent]}
      >
        <Text style={styles.sendBtnText}>
          {sent ? '✓ Wish Sent!' : '🎉 Send Birthday Wish'}
        </Text>
      </Pressable>
    </Animated.View>
  );
};

const MessageChip = ({ msg, onSelect, selected }) => {
  const scale = useSharedValue(1);
  const bg = useSharedValue(0);

  const handlePress = () => {
    scale.value = withSequence(
      withTiming(0.95, { duration: 80 }),
      withSpring(1, { damping: 8 })
    );
    onSelect(msg);
  };

  const style = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={style}>
      <Pressable
        onPress={handlePress}
        style={[styles.chip, selected && styles.chipSelected]}
      >
        <Text style={[styles.chipText, selected && styles.chipTextSelected]} numberOfLines={1}>
          {msg}
        </Text>
      </Pressable>
    </Animated.View>
  );
};

const BirthdayWishCard = memo(({
  employee = {
    name: 'Priya Sharma',
    role: 'Senior UX Designer',
    department: 'Product & Design',
    yearsAtCompany: 4,
  },
  visible,
  onClose,
  onSendWish,
}) => {
  const [confettiTrigger, setConfettiTrigger] = useState(0);
  const [wishMessage, setWishMessage] = useState('');
  const [selectedMsg, setSelectedMsg] = useState('');
  const [sent, setSent] = useState(false);
  const [emojiBursts, setEmojiBursts] = useState([]);
  const [emojiCounter, setEmojiCounter] = useState(0);

  // Card entrance
  const cardY = useSharedValue(SCREEN_H);
  const cardOpacity = useSharedValue(0);
  const headerScale = useSharedValue(0.8);
  const headerOpacity = useSharedValue(0);

  const initials = employee.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const sparkles = Array.from({ length: 12 }, (_, i) => ({
    id: i,
    x: Math.random() * (SCREEN_W - 60) + 10,
    y: Math.random() * 220,
    delay: i * 300,
  }));

  const balloons = [
    { color: "#04fff7", startX: 30, delay: 0 },
    { color: "#ff0468", startX: SCREEN_W * 0.4, delay: 700 },
    { color: "#0471ff", startX: SCREEN_W - 60, delay: 300 },
    { color: "#9204ff", startX: SCREEN_W * 0.7, delay: 1200 },
  ];

  useEffect(() => {
    // Card slides up
    cardOpacity.value = withTiming(1, { duration: 400 });
    cardY.value = withSpring(0, { damping: 20, stiffness: 120 });

    // Header scales in
    headerOpacity.value = withDelay(300, withTiming(1, { duration: 500 }));
    headerScale.value = withDelay(
      300,
      withSpring(1, { damping: 12, stiffness: 100 })
    );

    // Auto-trigger confetti on mount
    setTimeout(() => {
      setConfettiTrigger((p) => p + 1);
    }, 800);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const cardStyle = useAnimatedStyle(() => ({
    opacity: cardOpacity.value,
    transform: [{ translateY: cardY.value }],
  }));
  const headerStyle = useAnimatedStyle(() => ({
    opacity: headerOpacity.value,
    transform: [{ scale: headerScale.value }],
  }));

  const handleSelectMsg = (msg) => {
    setSelectedMsg(msg);
    setWishMessage(msg);
  };

  const handleAddEmoji = (emoji) => {
    const id = emojiCounter;
    setEmojiCounter((c) => c + 1);
    setEmojiBursts((prev) => [...prev, { id, emoji }]);
  };

  const handleRemoveEmoji = (id) => {
    setEmojiBursts((prev) => prev.filter((e) => e.id !== id));
  };

  const handleSend = useCallback(() => {
    if (sent) return;
    setSent(true);
    setConfettiTrigger((p) => p + 1);
    // Add a few emoji bursts on send
    setTimeout(() => handleAddEmoji('🎉'), 0);
    setTimeout(() => handleAddEmoji('✨'), 200);
    setTimeout(() => handleAddEmoji('🎂'), 400);
    onSendWish && onSendWish(wishMessage || selectedMsg);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sent, wishMessage, selectedMsg, onSendWish]);

  return (
    <Modal visible={visible} transparent statusBarTranslucent onRequestClose={onClose}>
      <View style={styles.overlay}>

        {/* ── Main Card ── */}
        <Animated.View style={[styles.card, cardStyle]}>

          {/* Header gradient banner */}
          <View style={styles.banner}>
            {/* Sparkles on banner */}
            {sparkles.map((s) => (
              <Sparkle key={s.id} x={s.x} y={s.y} delay={s.delay} />
            ))}

            {/* Close button */}
            {onClose && (
              <Pressable style={styles.closeBtn} onPress={onClose}>
                <Cross color={'white'} />
              </Pressable>
            )}

            {/* Banner content */}
            <Animated.View style={[{ alignItems: 'center' }, headerStyle]}>
              <AnimatedAvatar name={employee.name} initials={initials} />
              <View style={styles.bannerTextWrapper}>
                <Text style={styles.happyBirthday}>🎂 Happy Birthday!</Text>
                <Text style={styles.empName}>{employee.name}</Text>
                <Text style={styles.empRole}>{employee.role}</Text>
              </View>

              {/* Stats row */}
              <Animated.View
                entering={FadeInUp.delay(700).springify()}
                style={styles.statsRow}
              >
                <View style={styles.statBox}>
                  <Text style={styles.statVal}>{employee.yearsAtCompany}</Text>
                  <Text style={styles.statLabel}>Years 🏆</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statBox}>
                  <Text style={styles.statVal}>{employee.department?.split(' ')[0] || '⭐'}</Text>
                  <Text style={styles.statLabel}>Team</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statBox}>
                  <Text style={styles.statVal}>🎁</Text>
                  <Text style={styles.statLabel}>Special Day</Text>
                </View>
              </Animated.View>
            </Animated.View>
          </View>

          {/* ── Scrollable content ── */}
          <ScrollView
            style={styles.body}
            contentContainerStyle={styles.bodyContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Quick Messages */}
            <Animated.View entering={FadeInDown.delay(500).springify()}>
              <Text style={styles.sectionLabel}>Quick Wishes ✨</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.chipRow}
              >
                {WISH_MESSAGES.map((msg, i) => (
                  <MessageChip
                    key={i}
                    msg={msg}
                    selected={selectedMsg === msg}
                    onSelect={handleSelectMsg}
                  />
                ))}
              </ScrollView>
            </Animated.View>

            {/* Custom message */}
            <Animated.View entering={FadeInDown.delay(650).springify()}>
              <Text style={styles.sectionLabel}>Personal Message 💌</Text>
              <TextInput
                style={styles.textInput}
                placeholder={`Write something heartfelt for ${employee.name.split(' ')[0]}...`}
                placeholderTextColor={COLORS.textMuted}
                multiline
                numberOfLines={3}
                value={wishMessage}
                onChangeText={(t) => {
                  setWishMessage(t);
                  setSelectedMsg('');
                }}
                selectionColor={COLORS.accent2}
              />
            </Animated.View>

            {/* Emoji Reactions */}
            <Animated.View entering={FadeInDown.delay(800).springify()}>
              <Text style={styles.sectionLabel}>React with Emoji 🎊</Text>
              <View style={styles.emojiRow}>
                {EMOJI_REACTIONS.map((emoji, i) => (
                  <Pressable
                    key={i}
                    style={styles.emojiBtn}
                    onPress={() => handleAddEmoji(emoji)}
                  >
                    <Text style={styles.emojiText}>{emoji}</Text>
                  </Pressable>
                ))}
              </View>
            </Animated.View>

            {/* Confetti Button */}
            <Animated.View entering={FadeInDown.delay(950).springify()}>
              <Pressable
                style={styles.confettiBtn}
                onPress={() => setConfettiTrigger((p) => p + 1)}
              >
                <Text style={styles.confettiBtnText}>🎊 Launch Confetti!</Text>
              </Pressable>
            </Animated.View>

            {/* Send Wish Button */}
            <WishButton onPress={handleSend} sent={sent} />

            {sent && (
              <Animated.View style={styles.sentBadge}>
                <Text style={styles.sentBadgeText}>
                  🌟 Your wish has been sent to {employee.name.split(' ')[0]}!
                </Text>
              </Animated.View>
            )}

            <View style={{ height: 24 }} />
          </ScrollView>
        </Animated.View>

        {/* Floating Emoji Bursts */}
        <View
          style={[StyleSheet.absoluteFill, { justifyContent: 'flex-end', alignItems: 'center' }]}
          pointerEvents="none"
        >
          {emojiBursts.map(({ id, emoji }) => (
            <EmojiBurst
              key={id}
              emoji={emoji}
              onComplete={() => handleRemoveEmoji(id)}
            />
          ))}
        </View>
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
          {balloons.map((b, i) => (
            <FloatingBalloon key={i} {...b} />
          ))}
        </View>

        {/* ── Confetti ── */}
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
          {Array.from({ length: 40 }).map((_, i) => (
            <ConfettiParticle key={i} index={i} trigger={confettiTrigger} />
          ))}
        </View>
      </View>
    </Modal>
  );
});

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'transparent',
    justifyContent: 'flex-end',
  },

  // ── Card ──────────────────────────────────
  card: {
    backgroundColor: COLORS.card,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    overflow: 'hidden',
    height: SCREEN_H * 0.95,
    shadowColor: COLORS.accent2,
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.4,
    shadowRadius: 24,
    elevation: 20,
  },

  // ── Banner ────────────────────────────────
  banner: {
    paddingTop: 32,
    paddingBottom: 24,
    paddingHorizontal: 20,
    alignItems: 'center',
    backgroundColor: '#CA282C',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    overflow: 'hidden',
  },

  closeBtn: {
    position: 'absolute',
    top: 16,
    right: 20,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  closeBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },

  bannerTextWrapper: {
    alignItems: 'center',
    marginTop: 12,
  },
  happyBirthday: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.gold,
    letterSpacing: 0.5,
    textShadowColor: `${COLORS.gold}80`,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 12,
  },
  empName: {
    fontSize: 26,
    fontWeight: '900',
    color: '#FFFFFF',
    marginTop: 4,
    letterSpacing: -0.5,
  },
  empRole: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.75)',
    marginTop: 2,
    fontWeight: '500',
  },

  // ── Avatar ────────────────────────────────
  avatarContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 110,
    height: 110,
  },
  crownWrapper: {
    position: 'absolute',
    top: -18,
    zIndex: 10,
  },
  crownEmoji: {
    fontSize: 28,
  },
  avatarRing2: {
    position: 'absolute',
    width: 104,
    height: 104,
    borderRadius: 52,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.4)',
  },
  avatarRing1: {
    position: 'absolute',
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 2.5,
    borderColor: 'rgba(255,255,255,0.9)',
  },
  avatarCircle: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: '#8B0000',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  avatarInitials: {
    fontSize: 26,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -1,
  },

  // ── Stats ─────────────────────────────────
  statsRow: {
    flexDirection: 'row',
    marginTop: 40,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 10,
  },
  statBox: {
    alignItems: 'center',
    flex: 1,
  },
  statVal: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  statLabel: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.75)',
    marginTop: 2,
    fontWeight: '500',
  },
  statDivider: {
    width: 1,
    backgroundColor: 'rgba(255,255,255,0.3)',
    marginHorizontal: 4,
  },

  // ── Body ──────────────────────────────────
  body: {
    flex: 1,
    flexShrink: 1,
  },
  bodyContent: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 40,
    gap: 20,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 12,
  },

  // ── Chips ─────────────────────────────────
  chipRow: {
    flexDirection: 'row',
    gap: 10,
    paddingBottom: 4,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 24,
    backgroundColor: COLORS.inputBg,
    borderWidth: 1,
    borderColor: COLORS.border,
    maxWidth: 220,
  },
  chipSelected: {
    backgroundColor: '#FFF0F0',
    borderColor: '#CA282C',
  },
  chipText: {
    fontSize: 13,
    color: COLORS.textMuted,
    fontWeight: '500',
  },
  chipTextSelected: {
    color: '#CA282C',
    fontWeight: '700',
  },

  // ── Input ─────────────────────────────────
  textInput: {
    backgroundColor: COLORS.inputBg,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 16,
    padding: 16,
    color: COLORS.text,
    fontSize: 15,
    minHeight: 90,
    textAlignVertical: 'top',
    fontWeight: '400',
    lineHeight: 22,
  },

  // ── Emoji Row ─────────────────────────────
  emojiRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  emojiBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.inputBg,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emojiText: {
    fontSize: 24,
  },

  // ── Confetti Button ───────────────────────
  confettiBtn: {
    alignSelf: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
    backgroundColor: COLORS.inputBg,
    borderWidth: 1,
    borderColor: COLORS.accent3,
  },
  confettiBtnText: {
    color: '#CA282C',
    fontWeight: '700',
    fontSize: 14,
  },

  // ── Send Button ───────────────────────────
  sendBtnWrapper: {
    shadowColor: COLORS.accent1,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    marginTop: 20
  },
  sendBtn: {
    backgroundColor: COLORS.accent1,
    borderRadius: 20,
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnSent: {
    backgroundColor: '#8B0000',
  },
  sendBtnText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: 0.3,
  },

  // ── Sent Badge ────────────────────────────
  sentBadge: {
    backgroundColor: '#FFF0F0',
    borderWidth: 1,
    borderColor: '#CA282C',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
  },
  sentBadgeText: {
    color: '#CA282C',
    fontWeight: '600',
    fontSize: 14,
    textAlign: 'center',
  },

  // ── Shimmer ───────────────────────────────
  shimmerText: {
    overflow: 'hidden',
  },

  // ── Balloon ───────────────────────────────
  balloon: {
    width: 36,
    height: 44,
    borderRadius: 18,
    overflow: 'hidden',
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
  },
  balloonShine: {
    width: 10,
    height: 16,
    borderRadius: 5,
    marginTop: 6,
    marginLeft: 6,
    opacity: 0.5,
  },
  balloonString: {
    width: 1,
    height: 30,
    borderLeftWidth: 1,
    borderStyle: 'dashed',
    alignSelf: 'center',
    opacity: 0.6,
  },
});

export default BirthdayWishCard;

// ─────────────────────────────────────────────────────────────────────────────
// USAGE EXAMPLE (in your HRMS screen):
//
// import BirthdayWishCard from './BirthdayWishCard';
//
// const employee = {
//   name: 'Rahul Gupta',
//   role: 'Backend Engineer',
//   department: 'Engineering',
//   yearsAtCompany: 3,
// };
//
// <BirthdayWishCard
//   employee={employee}
//   onClose={() => setShowCard(false)}
//   onSendWish={(msg) => console.log('Wish sent:', msg)}
// />