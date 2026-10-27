import { FlatList, ImageBackground, SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import React, { useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import backgroundImage from '../../../../assets/Icon/background.png';
import TopNavBar from '../../../navigation/TopNavBar';

const DATA = [
    { title: 'Department', value: 20 },
    { title: 'Sub Department', value: 20 },
    { title: 'Designation', value: 20 },

];

const SubDepartment = () => {
    const navigation = useNavigation();
    const [visible, setVisible] = useState(false);

    const renderItem = ({ item, index }) => (
        <TouchableOpacity onPress={() => { setVisible(!visible); }} style={[styles.card]}>
            <Text style={styles.heading}>{item.title}</Text>
            <Text style={styles.subheading}>{item.value}</Text>
        </TouchableOpacity>
    );

    const SummarySection = () => (
        <View style={styles.summaryContainer}>

            <FlatList
                data={DATA}
                renderItem={renderItem}
                keyExtractor={(item, index) => index.toString()}
                numColumns={2}
                columnWrapperStyle={styles.row}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ gap: 10 }}
                style={{ padding: 0, margin: 0 }}

            />
        </View>
    );

    return (
        <SafeAreaView style={{ flex: 1 }}>
            <ImageBackground
                source={backgroundImage}
                resizeMode="cover"
                style={{ flex: 1, paddingTop: 40 }}>
                <TopNavBar navigation={navigation} title={'Manage'} />
                <View style={{ flex: 1 }}>
                    <SummarySection />
                </View>
            </ImageBackground>
        </SafeAreaView>
    );
};

export default SubDepartment;

const styles = StyleSheet.create({
    heading: {
        textAlign: 'center',
        fontFamily: 'Poppins-Medium',
        fontSize: 14,
        lineHeight: 20,
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
        paddingVertical: 15,
        gap: 5,
        marginHorizontal: 5,
        alignItems: 'center',
        borderRadius: 10,
        borderColor: '#E2E2E2',
        borderWidth: 1,
    },
    summaryContainer: {
        padding: 20,
        paddingVertical: 20,
        backgroundColor: 'rgba(255, 255, 255, 0)',

    },
    row: {
        justifyContent: 'space-between',
        padding: 0, margin: 0,
    },
});





