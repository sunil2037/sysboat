import React from 'react';
import { View, StyleSheet, Dimensions, ImageBackground, TouchableWithoutFeedback, ScrollView } from 'react-native';
import backgroundImage from '../../assets/Icon/background.png';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import TopNavBar from '../navigation/TopNavBar';
import TabViewComponent from '../Helper/TabViewComponent';
import { STATUS_BAR_HEIGHT } from '../Helper/Helper';
const PayrollScreen = ({ navigation }) => {
    return (
        <SafeAreaView style={{ flex: 1 }}>
            <ImageBackground source={backgroundImage} resizeMode="cover" style={{ flex: 1, backgroundColor: '#F9F9F9', paddingTop: STATUS_BAR_HEIGHT(), ...StyleSheet.absoluteFillObject }}>
                <TopNavBar title={'Payroll'} navigation={navigation} />
                <View style={{ paddingHorizontal: 15, flex: 1 }}>
                    <TabViewComponent routes={[
                        { key: 'payslip', title: 'Pay Details' },
                        { key: 'salaryslip', title: 'Salary Structure' },
                        { key: 'salaryslipdetails', title: 'Salary Slip' },
                    ]} />
                </View>
            </ImageBackground>
        </SafeAreaView>
    );
};

export default PayrollScreen;

