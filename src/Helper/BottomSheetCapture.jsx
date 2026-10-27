import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import React from 'react'
import BottomSheetBase from './BottomSheetBase'
import { CameraIcon, DeleteIcon, GalleryIcon } from './IconsLoad'
import { getFontSize } from './Helper'

const BottomSheetCapture = ({ visible, onClose, handleChooseFromLibrary, handleTakePhoto }) => {
    return (
        <BottomSheetBase isSnapPoint={false} visible={visible} onClose={onClose}>
            <View style={{ gap: 10 }}>
                <TouchableOpacity style={styles.option} onPress={handleChooseFromLibrary}>
                    <GalleryIcon width={22} height={22} />
                    <Text style={styles.title}>Choose from library</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.option} onPress={handleTakePhoto}>
                    <CameraIcon width={22} height={22} />
                    <Text style={styles.title}>Take photo</Text>
                </TouchableOpacity>
            </View>
        </BottomSheetBase>
    )
}

export default BottomSheetCapture

const styles = StyleSheet.create({

    option: {
        flexDirection: 'row',
        gap: 8,
        paddingVertical: 10,
        alignItems: 'center',
    },

    title: {
        fontFamily: 'Poppins-Medium',
        fontSize: 15,
        lineHeight: 18,
    },

})