import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import React from 'react';
import { Back } from '../Helper/IconsLoad';
import { getFontSize } from '../Helper/Helper';
import ThemedText from '../Helper/ThemedText';

const TopNavBar = ({ title, navigation }) => {
    const BtnClickType =
        typeof navigation === 'function'
            ? navigation
            : () => navigation?.goBack?.();

    return (
        <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 15, gap: 10, paddingBottom: 20 }}>
            <TouchableOpacity onPress={BtnClickType} style={{ padding: 10, backgroundColor: '#CA282C', borderRadius: 50, }}>
                <Back width={20} height={20} color={'#fcfcfcff'} />
            </TouchableOpacity>
            <ThemedText size='lg' weight='Medium'>
                {title || ''}
            </ThemedText>
        </View>
    );
};

export default TopNavBar;

const styles = StyleSheet.create({});
