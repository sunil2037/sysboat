import React from 'react';
import {
    Text,
    TextStyle,
    StyleSheet,
    TextProps,
    PixelRatio,
    useColorScheme,
    Platform,
} from 'react-native';
import { SCREEN_HEIGHT } from '@gorhom/bottom-sheet';


const BASE_HEIGHT = 680;
const scale = SCREEN_HEIGHT / BASE_HEIGHT;

const sf = (dp: number): number =>
    Math.round(PixelRatio.getFontScale() * dp * scale);

const FONT_SIZES = {
    xs: sf(10),
    sm: sf(12),
    md: sf(14),
    lg: sf(16),
    xl: sf(20),
    '2xl': sf(24),
    '3xl': sf(30),
    '4xl': sf(36),
} as const;

const FontWeights = {
    Light: 'Poppins-Light',
    Regular: 'Poppins-Regular',
    Medium: 'Poppins-Medium',
    SemiBold: 'Poppins-SemiBold',
    Bold: 'Poppins-Bold',
} as const;

const FontWeightsIOS = {
    Light: 300,
    Regular: 400,
    Medium: 500,
    SemiBold: 600,
    Bold: 700,
} as const;



const COLORS = {
    light: {
        primary: '#1e293b',
        secondary: '#64748b',
        muted: '#94a3b8',
        inverse: '#f8fafc',
        accent: '#CA282C',
        success: '#16a34a',
        warning: '#d97706',
        error: '#dc2626',
    },
    dark: {
        primary: '#1e293b',
        secondary: '#64748b',
        muted: '#94a3b8',
        inverse: '#f8fafc',
        accent: '#CA282C',
        success: '#16a34a',
        warning: '#d97706',
        error: '#dc2626',
    },
} as const;


type SizeKey = keyof typeof FONT_SIZES;
type ColorKey = keyof typeof COLORS.light;

type Weight = keyof typeof FontWeights;

export interface ThemedTextProps extends TextProps {
    size?: SizeKey;
    color?: ColorKey;
    weight?: Weight;
    italic?: boolean;
    underline?: boolean;
    strikethrough?: boolean;
    transform?: TextStyle['textTransform'];
    align?: TextStyle['textAlign'];
    letterSpacing?: number;
    lineHeightMultiplier?: number;
    customColor?: string;
    customSize?: number;
    lines?: number;
    children: React.ReactNode;
}


const ThemedText: React.FC<ThemedTextProps> = ({
    size = 'md',
    color = 'primary',
    weight = 'regular',
    italic = false,
    underline = false,
    strikethrough = false,
    transform,
    align = 'left',
    letterSpacing = 0.4,
    lineHeightMultiplier,
    customColor,
    customSize,
    lines,
    style,
    children,
    ...rest
}) => {
    const defaultWeight: Weight = weight;
    const scheme = useColorScheme() ?? 'light';
    const palette = COLORS[scheme];

    const resolvedSize = customSize ?? FONT_SIZES[size];
    const resolvedColor = customColor ?? palette[color];

    const decorationLines: TextStyle['textDecorationLine'] =
        underline && strikethrough
            ? 'underline line-through'
            : underline
                ? 'underline'
                : strikethrough
                    ? 'line-through'
                    : 'none';


    const dynamicStyle: TextStyle = {
        fontSize: resolvedSize,
        color: resolvedColor,
        fontFamily: FontWeights[defaultWeight],
        fontStyle: italic ? 'italic' : 'normal',
        fontWeight: FontWeightsIOS[defaultWeight],
        textDecorationLine: decorationLines,
        textTransform: transform,
        textAlign: align,
        ...(letterSpacing !== undefined && { letterSpacing }),
        ...(lineHeightMultiplier !== undefined && {
            lineHeight: resolvedSize * lineHeightMultiplier,
        }),
    };

    return (
        <Text
            style={[styles.base, dynamicStyle, style]}
            numberOfLines={lines}
            {...rest}
        >
            {children}
        </Text>
    );
};


export const DisplayText: React.FC<Omit<ThemedTextProps, 'size'>> = (p) => (
    <ThemedText size="4xl" weight="SemiBold" lineHeightMultiplier={1.15} {...p} />
);

export const Heading: React.FC<Omit<ThemedTextProps, 'size'>> = (p) => (
    <ThemedText size="2xl" weight="SemiBold" lineHeightMultiplier={1.25} {...p} />
);

export const Subheading: React.FC<Omit<ThemedTextProps, 'size'>> = (p) => (
    <ThemedText size="xl" weight="Medium" lineHeightMultiplier={1.3} {...p} />
);

export const BodyText: React.FC<Omit<ThemedTextProps, 'size'>> = (p) => (
    <ThemedText size="md" weight="Regular" lineHeightMultiplier={1.6} {...p} />
);

export const Caption: React.FC<Omit<ThemedTextProps, 'size'>> = (p) => (
    <ThemedText size="xs" color="muted" lineHeightMultiplier={1.5} {...p} />
);

export const Label: React.FC<Omit<ThemedTextProps, 'size'>> = (p) => (
    <ThemedText
        size="sm"
        weight="Regular"
        transform="uppercase"
        letterSpacing={0.8}
        color="secondary"
        {...p}
    />
);

const styles = StyleSheet.create({
    base: {
        includeFontPadding: false,
        textAlignVertical: 'center',
    },
});

export default ThemedText;