import { Dimensions, FlatList, ImageBackground, StyleSheet, Text, TouchableOpacity, View, Image } from 'react-native';
import React, { useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import backgroundImage from '../../../../assets/Icon/background.png';
import DepartmentImage from '../../../../assets/Icon/Department.png';
import DesignationImage from '../../../../assets/Icon/Designation.png';
import TopNavBar from '../../../navigation/TopNavBar';
import { getFontSize, STATUS_BAR_HEIGHT } from '../../../Helper/Helper';
import { SafeAreaView } from 'react-native-safe-area-context';

const DATA = [
    { title: 'Department', value: 20, ScreenName: 'Department' },
    { title: 'Designation', value: 20, ScreenName: 'Designations' },
];

const PartsCrud = () => {
    const navigation = useNavigation();


    const renderItem = ({ item, index }) => (
        <TouchableOpacity onPress={() => { navigation.navigate(item.ScreenName); }} style={styles.card}>
            <Image
                source={item.ScreenName === 'Department' ? DepartmentImage : DesignationImage}
                style={{ width: '100%', height: 200, marginBottom: 10 }}
                resizeMode={'contain'}
            />
            <Text style={styles.heading}>{item.title}</Text>
        </TouchableOpacity>
    );

    const SummarySection = () => (
        <View style={styles.summaryContainer}>
            <FlatList
                data={DATA}
                renderItem={renderItem}
                keyExtractor={(item, index) => index.toString()}
                numColumns={1}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ gap: 10, }}
                style={{ padding: 0, margin: 0 }}

            />
        </View>
    );

    return (
        <SafeAreaView style={{ flex: 1 }}>
            <ImageBackground
                source={backgroundImage}
                resizeMode="cover"
                style={{ flex: 1, paddingTop: STATUS_BAR_HEIGHT(), ...StyleSheet.absoluteFillObject }}>
                <TopNavBar navigation={navigation} title={'Manage'} />
                <View style={{ flex: 1 }}>
                    <SummarySection />
                </View>
            </ImageBackground>
        </SafeAreaView>
    );
};

export default PartsCrud;

const styles = StyleSheet.create({
    heading: {
        textAlign: 'center',
        fontFamily: 'Poppins-Medium',
        fontSize: 20,
        color: '#293646',
    },
    subheading: {
        textAlign: 'center',
        fontFamily: 'Poppins-Regular',
        fontSize: 12,
        lineHeight: 20,
        color: '#293646',
    },
    card: {
        flex: 1,
        backgroundColor: 'white',
        borderRadius: 10,
        paddingVertical: 20,
        gap: 20,
        marginHorizontal: 5,
        alignItems: 'center',
        borderRadius: 10,
        borderColor: '#E2E2E2',
        borderWidth: 1,
    },
    summaryContainer: {
        padding: 20,
        backgroundColor: 'rgba(255, 255, 255, 0)',
        flex: 1

    },
    row: {
        justifyContent: 'space-between',
        padding: 0, margin: 0,
    },
});





