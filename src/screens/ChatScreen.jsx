import { SafeAreaView, StyleSheet, Text, View } from 'react-native';
import React from 'react';
import ChatMessage from '../components/Chat/ChatMessage';
import EmployeeChatLists from '../components/Chat/EmployeeChatLists';

const ChatScreen = ({ navigation }) => {
    return (
        <SafeAreaView style={{ flex: 1 }}>
            <EmployeeChatLists navigation={navigation} />
            {/* <ChatMessage /> */}
        </SafeAreaView>
    );
};

export default ChatScreen;

const styles = StyleSheet.create({});
