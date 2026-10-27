import React, { useState, useEffect, useRef } from "react";
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Image,
    FlatList,
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
} from "react-native";
import { LeftSideArrow, SendIcon } from "../../Helper/IconsLoad";
import { getFontSize } from "../../Helper/Helper";
const GroupChat = ({ navigation }) => {
    const [selectedGroup, setSelectedGroup] = useState(null);
    const [groups, setGroups] = useState([]);
    const [messages, setMessages] = useState([]);
    const [inputText, setInputText] = useState("");
    const [isTyping, setIsTyping] = useState(false);
    const flatListRef = useRef(null);

    useEffect(() => {
        setGroups([
            {
                id: "g1",
                name: "Dev Team Group",
                lastMessage: "Let's meet at 4 PM?",
                avatar: "https://i.pravatar.cc/150?img=5",
                members: [
                    { name: "John", avatar: "https://randomuser.me/api/portraits/men/1.jpg" },
                    { name: "Sarah", avatar: "https://randomuser.me/api/portraits/women/2.jpg" },
                    { name: "Me", avatar: "https://randomuser.me/api/portraits/men/5.jpg" },
                ],
            },
            {
                id: "g2",
                name: "Marketing Team",
                lastMessage: "New campaign launched 🎉",
                avatar: "https://i.pravatar.cc/150?img=9",
                members: [
                    { name: "Alice", avatar: "https://randomuser.me/api/portraits/women/3.jpg" },
                    { name: "Bob", avatar: "https://randomuser.me/api/portraits/men/4.jpg" },
                    { name: "Me", avatar: "https://randomuser.me/api/portraits/men/5.jpg" },
                ],
            },
        ]);
    }, []);

    // Load messages when group selected
    const openGroupChat = (group) => {
        setSelectedGroup(group);
        setMessages([
            {
                id: "1",
                text: "Hey team 👋",
                sender: "John",
                avatar: "https://randomuser.me/api/portraits/men/1.jpg",
                status: "seen",
                timestamp: new Date(Date.now() - 3600000),
            },
            {
                id: "2",
                text: "Hi everyone!",
                sender: "Sarah",
                avatar: "https://randomuser.me/api/portraits/women/2.jpg",
                status: "delivered",
                timestamp: new Date(Date.now() - 2700000),
            },
            {
                id: "3",
                text: "Let’s meet at 4 PM?",
                sender: "Me",
                avatar: "https://randomuser.me/api/portraits/men/5.jpg",
                status: "sent",
                timestamp: new Date(Date.now() - 1200000),
            },
        ]);
    };

    const handleSend = () => {
        if (inputText.trim() === "") return;
        const newMsg = {
            id: Date.now().toString(),
            text: inputText,
            sender: "Me",
            avatar: "https://randomuser.me/api/portraits/men/5.jpg",
            status: "sent",
            timestamp: new Date(),
        };
        setMessages((prev) => [...prev, newMsg]);
        setInputText("");

        setTimeout(() => updateMessageStatus(newMsg.id, "delivered"), 600);
        setTimeout(() => {
            updateMessageStatus(newMsg.id, "seen");
            simulateReply();
        }, 1500);
    };

    const updateMessageStatus = (id, status) => {
        setMessages((prev) =>
            prev.map((m) => (m.id === id ? { ...m, status } : m))
        );
    };

    const simulateReply = () => {
        setIsTyping(true);
        const randomMember =
            selectedGroup.members[
            Math.floor(Math.random() * (selectedGroup.members.length - 1))
            ];
        setTimeout(() => {
            const reply = {
                id: Date.now().toString(),
                text: "Got it 👍",
                sender: randomMember.name,
                avatar: randomMember.avatar,
                status: "seen",
                timestamp: new Date(),
            };
            setMessages((prev) => [...prev, reply]);
            setIsTyping(false);
        }, 2000);
    };

    const renderGroup = ({ item }) => (
        <TouchableOpacity style={styles.groupItem} onPress={() => openGroupChat(item)}>
            <Image source={{ uri: item.avatar }} style={styles.groupAvatar} />
            <View style={{ flex: 1 }}>
                <Text style={styles.groupName}>{item.name}</Text>
                <Text style={styles.lastMessage}>{item.lastMessage}</Text>
            </View>
        </TouchableOpacity>
    );

    const renderMessage = ({ item }) => {
        const isMe = item.sender === "Me";
        return (
            <View
                style={[
                    styles.messageContainer,
                    isMe ? styles.myMessage : styles.otherMessage,
                ]}
            >
                {!isMe && <Image source={{ uri: item.avatar }} style={styles.avatar} />}

                <View
                    style={[styles.messageBubble, isMe ? styles.myBubble : styles.otherBubble]}
                >
                    {!isMe && <Text style={styles.senderName}>{item.sender}</Text>}
                    <Text style={[styles.messageText, { color: isMe ? "white" : "black" }]}>
                        {item.text}
                    </Text>
                    <View style={styles.timeRow}>
                        <Text style={[styles.timestamp, { color: isMe ? "white" : "#666" }]}>
                            {item.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </Text>
                        {isMe && (
                            <Text style={styles.statusText}>
                                {item.status === "seen"
                                    ? "✓✓"
                                    : item.status === "delivered"
                                        ? "✓"
                                        : "⏳"}
                            </Text>
                        )}
                    </View>
                </View>
            </View>
        );
    };

    if (!selectedGroup) {
        return (
            <View style={styles.container}>
                <Text style={styles.headerTitle}>Group Chats</Text>
                <FlatList
                    data={groups}
                    renderItem={renderGroup}
                    keyExtractor={(item) => item.id}
                />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => setSelectedGroup(null)}>
                    <LeftSideArrow width={30} height={30} />
                </TouchableOpacity>
                <Image source={{ uri: selectedGroup.avatar }} style={styles.headerAvatar} />
                <View>
                    <Text style={styles.headerName}>{selectedGroup.name}</Text>
                    <Text style={styles.headerStatus}>
                        {isTyping ? "Typing..." : "Online"}
                    </Text>
                </View>
            </View>

            <FlatList
                ref={flatListRef}
                data={messages}
                renderItem={renderMessage}
                keyExtractor={(item) => item.id}
                onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
                onLayout={() => flatListRef.current?.scrollToEnd({ animated: true })}
                contentContainerStyle={{ paddingBottom: 80 }}
            />

            {isTyping && (
                <View style={styles.typingContainer}>
                    <ActivityIndicator color="#CA282C" />
                    <Text style={styles.typingText}>Someone is typing...</Text>
                </View>
            )}

            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                style={styles.inputContainer}
            >
                <TextInput
                    style={styles.input}
                    value={inputText}
                    onChangeText={setInputText}
                    placeholder="Type a message..."
                    placeholderTextColor="#6A7D94"
                    multiline
                />
                <TouchableOpacity style={styles.sendButton} onPress={handleSend}>
                    <SendIcon color={"#CA282C"} width={38} height={38} />
                </TouchableOpacity>
            </KeyboardAvoidingView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#F5F5F5", paddingTop: 40, paddingHorizontal: 15 },
    headerTitle: {
        fontFamily: "Poppins-SemiBold",
        fontSize: 20,
        marginVertical: 10,
        color: "#000",
    },
    groupItem: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderColor: "#eee",
    },
    groupAvatar: { width: 50, height: 50, borderRadius: 25, marginRight: 10 },
    groupName: { fontSize: 16, fontFamily: "Poppins-Medium", color: "#000" },
    lastMessage: { fontSize: 12, color: "#777", fontFamily: "Poppins-Regular" },

    header: {
        flexDirection: "row",
        alignItems: "center",
        borderBottomWidth: 1,
        borderColor: "#E2E2E2",
        paddingBottom: 15,
        marginBottom: 10,
        gap: 10,
    },
    headerAvatar: { width: 45, height: 45, borderRadius: 100 },
    headerName: { fontFamily: "Poppins-Medium", fontSize: 18, color: "#000" },
    headerStatus: { fontFamily: "Poppins-Regular", fontSize: 12, color: "gray" },

    messageContainer: { flexDirection: "row", marginVertical: 6, alignItems: "flex-end" },
    myMessage: { justifyContent: "flex-end" },
    otherMessage: { justifyContent: "flex-start" },
    avatar: { width: 32, height: 32, borderRadius: 16, marginRight: 8 },
    messageBubble: { maxWidth: "75%", padding: 10, borderRadius: 16 },
    myBubble: { backgroundColor: "#CA282C", borderBottomRightRadius: 2 },
    otherBubble: { backgroundColor: "#E5E5EA", borderBottomLeftRadius: 2 },
    senderName: { fontFamily: "Poppins-SemiBold", fontSize: 12, color: "#555", marginBottom: 2 },
    messageText: { fontFamily: "Poppins-Regular", fontSize: 14 },
    timestamp: { fontSize: 10, fontFamily: "Poppins-Regular" },
    statusText: { fontSize: 10, color: "white", marginLeft: 4 },
    timeRow: { flexDirection: "row", alignItems: "center", justifyContent: "flex-end" },

    typingContainer: { flexDirection: "row", alignItems: "center", paddingHorizontal: 20 },
    typingText: { marginLeft: 10, color: "#CA282C", fontFamily: "Poppins-Regular" },

    inputContainer: { flexDirection: "row", alignItems: "center", paddingBottom: 15 },
    input: {
        flex: 1,
        borderWidth: 1,
        borderColor: "#ddd",
        borderRadius: 50,
        backgroundColor: "#fff",
        paddingLeft: 20,
        paddingRight: 50,
        height: 60,
        fontFamily: "Poppins-Regular",
    },
    sendButton: { position: "absolute", right: 15, top: "50%", transform: [{ translateY: -20 }] },
});

export default GroupChat;
