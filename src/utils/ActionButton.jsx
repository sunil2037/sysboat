import React, { useMemo } from "react";
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { COLORS, getFontSize, SystemOS } from "../Helper/Helper";
import { DeleteIcon } from "../Helper/IconsLoad";
import ThemedText from "../Helper/ThemedText";
export const ActionButton = React.memo(({
    onPress,
    text,
    disabled = false,
    loading = false,
    variant = 'primary',
    size = 'small', // 'small', 'medium', 'large'
    extraStyle,
}) => {
    const buttonStyle = useMemo(() => [
        variant === 'secondary' ? styles.secondaryButton : variant === 'danger' ? styles.dangerButton : styles.primaryButton,
        size === 'large' ? styles.btnLarge : size === 'medium' ? styles.btnMedium : styles.btnSmall
    ], [variant, size]);

    const buttonTextStyle = useMemo(() => [
        variant === 'secondary' ? styles.secondaryButtonText : variant === 'danger' ? styles.dangerButtonText : styles.primaryButtonText,
        size === 'large' ? styles.txtLarge : size === 'medium' ? styles.txtMedium : styles.txtSmall
    ], [variant, size]);

    return (
        <TouchableOpacity
            activeOpacity={0.7}
            disabled={disabled || loading}
            onPress={onPress}
            style={[styles.actionButton, buttonStyle, disabled && { opacity: 0.5 }, extraStyle]}>
            {loading ? (
                <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
                    <ActivityIndicator
                        size="small"
                        color={StyleSheet.flatten(buttonTextStyle).color || COLORS.white}
                    />
                    <ThemedText style={[styles.actionButtonText, buttonTextStyle]}>
                        Please wait...
                    </ThemedText>
                </View>
            ) : (
                <>
                    {variant === 'danger' && <DeleteIcon width={size === 'large' ? 20 : 16} height={size === 'large' ? 20 : 16} color="white" />}
                    <ThemedText style={[styles.actionButtonText, buttonTextStyle]}>
                        {text}
                    </ThemedText>
                </>
            )}
        </TouchableOpacity>
    );
});
const styles = StyleSheet.create({
    actionButton: { borderRadius: 10, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8, marginVertical: 6, },
    actionButtonText: { fontFamily: 'Poppins-Medium' },
    primaryButton: { backgroundColor: COLORS.primary },
    secondaryButton: { backgroundColor: COLORS.background, borderWidth: 1, borderColor: '#EAEAEA' },
    dangerButton: { backgroundColor: '#FF4D4F' },
    primaryButtonText: { color: COLORS.white },
    secondaryButtonText: { color: COLORS.text_secondary },
    dangerButtonText: { color: COLORS.white },
    btnSmall: { height: 36, paddingHorizontal: 12 },
    btnMedium: { height: 45, paddingHorizontal: 16 },
    btnLarge: { height: 54, paddingHorizontal: 20 },
    txtSmall: { fontSize: getFontSize(12) },
    txtMedium: { fontSize: getFontSize(14) },
    txtLarge: { fontSize: getFontSize(16), fontFamily: 'Poppins-SemiBold' }
});