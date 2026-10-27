import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import React from 'react'

const ActionToggleSwitch = ({
    label = 'Option',
    checked = false,
    onPress = () => { },
    width = 44,
    height = 24,
    activeColor = '#4CAF50',
    inactiveColor = '#E0E0E0',
    knobColor = '#FFFFFF',
    textStyle = {},
    containerStyle = {},
}) => {
    const knobSize = height - 4

    return (
        <TouchableOpacity
            style={[styles.main, containerStyle]}
            onPress={onPress}
            activeOpacity={0.8}
        >

            <Text style={[styles.text, textStyle]}>{label}</Text>

            <View
                style={[
                    styles.switch,
                    {
                        width,
                        height,
                        backgroundColor: checked ? activeColor : inactiveColor,
                        borderRadius: height / 2,
                    },
                ]}
            >
                <View
                    style={[
                        styles.knob,
                        {
                            width: knobSize,
                            height: knobSize,
                            backgroundColor: knobColor,
                            transform: [
                                {
                                    translateX: checked
                                        ? width - knobSize - 2
                                        : 2,
                                },
                            ],
                        },
                    ]}
                />
            </View>

        </TouchableOpacity>
    )
}

export default ActionToggleSwitch

const styles = StyleSheet.create({
    main: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between'
    },
    switch: {
        justifyContent: 'center',
        paddingHorizontal: 2,
    },
    knob: {
        borderRadius: 999,
        elevation: 2,
    },
    text: {
        fontFamily: 'Poppins-Medium',
    },
})
