import React, { memo, useEffect } from "react";
import { StyleSheet, View } from "react-native";
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withRepeat,
    withTiming,
    interpolate,
    Easing,
} from "react-native-reanimated";
import { SCREEN_WIDTH } from "./Helper";


export const getLayout = (props) => {
    const layout = Array.from({ length: props?.length }, (_, i) => ({
        key: `${props.key || 'EditPersonalDetails'}-${i + 1}`,
        width: props?.width || SCREEN_WIDTH - 30,
        height: props?.height || 50,
        marginBottom: props?.marginBottom || 15,
        borderRadius: props?.borderRadius || 10,
        alignSelf: props?.alignSelf || "center",
        props
    }));
    return layout;
}

const Skeleton = ({
    layout = [],
    boneColor = "#fff",
    highlightColor = "#f5f5f5",
    animationType = "pulse",
    isLoading = true,
    type = "Rectangle",
    children,
}) => {

    const progress = useSharedValue(0);

    useEffect(() => {
        progress.value = withRepeat(
            withTiming(1, {
                duration: 1000,
                easing: Easing.linear,
            }),
            -1,
            true
        );
    }, []);

    const animatedStyle = useAnimatedStyle(() => {
        const opacity = interpolate(progress.value, [0, 1], [0.5, 1]);

        return {
            opacity: animationType === "pulse" ? opacity : 1,
            backgroundColor: boneColor,
        };
    });

    if (!isLoading) {
        return children;
    }

    const renderSkeletonItem = (item) => {
        switch (type) {
            case "Rectangle":
                return (
                    <Animated.View
                        key={item.key}
                        style={[
                            {
                                width: item.width,
                                height: item.height,
                                marginBottom: item.marginBottom || 0,
                                borderRadius: item.borderRadius || 4,
                                backgroundColor: highlightColor,
                            },
                            animatedStyle,
                            item
                        ]}
                    />
                );

            case "Square":
                return (
                    <Animated.View
                        key={item.key}
                        style={[
                            {
                                width: item.width,
                                height: item.height,
                                marginBottom: item.marginBottom || 0,
                                borderRadius: item.borderRadius || 4,
                                backgroundColor: highlightColor,
                            },
                            animatedStyle,
                            item
                        ]}
                    />
                );

            default:
                break;
        }
    }

    return (
        <View style={type == "Square" && Styles.square}>
            {layout.map((item) => {
                return renderSkeletonItem(item);
            })}
        </View>
    );
};

const Styles = StyleSheet.create({
    square: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: 10,
    }
})

export default memo(Skeleton);