import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Image,
  FlatList,
  ActivityIndicator,
} from "react-native";
import { LeftSideArrow, SendIcon } from "../../Helper/IconsLoad";
import { getFontSize } from "../../Helper/Helper";
const ChatMessage = ({ navigation }) => {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const flatListRef = useRef(null);

  useEffect(() => {
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
  }, []);

  const handleSend = () => {
    if (inputText.trim() === "") return;

    const newMessage = {
      id: Date.now().toString(),
      text: inputText,
      sender: "Me",
      avatar: "https://randomuser.me/api/portraits/men/5.jpg",
      status: "sent",
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, newMessage]);
    setInputText("");

    setTimeout(() => {
      updateMessageStatus(newMessage.id, "delivered");
    }, 500);

    setTimeout(() => {
      updateMessageStatus(newMessage.id, "seen");
      simulateReply();
    }, 1500);
  };

  const updateMessageStatus = (id, status) => {
    setMessages((prev) =>
      prev.map((msg) => (msg.id === id ? { ...msg, status } : msg))
    );
  };

  const simulateReply = () => {
    setIsTyping(true);
    setTimeout(() => {
      const replyUsers = [
        {
          name: "Sarah",
          avatar: "https://randomuser.me/api/portraits/women/2.jpg",
        },
        {
          name: "John",
          avatar: "https://randomuser.me/api/portraits/men/1.jpg",
        },
      ];
      const randomUser = replyUsers[Math.floor(Math.random() * replyUsers.length)];
      const reply = {
        id: Date.now().toString(),
        text: "Got it 👍",
        sender: randomUser.name,
        avatar: randomUser.avatar,
        status: "seen",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, reply]);
      setIsTyping(false);
    }, 2000);
  };

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
              {item.timestamp.toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
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

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <LeftSideArrow width={30} height={30} />
        </TouchableOpacity>
        <TouchableOpacity style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 10 }} onPress={() =>
          navigation.navigate("ProfileDetailsScreen", {
            type: "group",
            profileData: {
              image: "https://randomuser.me/api/portraits/women/68.jpg",
              name: "Weekend Friends 🥳",
              about: "Fun group!",
              phone: "+91 9876543210",
              members: [
                { name: "Riya Sharma", isAdmin: true },
                { name: "Aman", isAdmin: false },
                { name: "Sonal", isAdmin: false },
              ],
            },
          })
        }>
          <Image
            source={{ uri: "https://i.pravatar.cc/150?img=5" }}
            style={styles.headerAvatar}
          />
          <View>
            <Text style={styles.headerName}>Dev Team Group</Text>
            <Text style={styles.headerStatus}>
              {isTyping ? "Typing..." : "Online"}
            </Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Chat Messages */}
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id}
        onContentSizeChange={() =>
          flatListRef.current?.scrollToEnd({ animated: true })
        }
        onLayout={() => flatListRef.current?.scrollToEnd({ animated: true })}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 80 }}
      />

      {/* Typing Indicator */}
      {
        isTyping && (
          <View style={styles.typingContainer}>
            <ActivityIndicator color="#CA282C" />
            <Text style={styles.typingText}>Someone is typing...</Text>
          </View>
        )
      }

      {/* Input Area */}
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
    </View >
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F5F5F5", paddingTop: 40, paddingHorizontal: 15 },
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
  senderName: {
    fontFamily: "Poppins-SemiBold",
    fontSize: 12,
    color: "#555",
    marginBottom: 2,
  },
  messageText: { fontFamily: "Poppins-Regular", fontSize: 14 },
  timestamp: { fontSize: 10, fontFamily: "Poppins-Regular" },
  statusText: { fontSize: 10, color: "white", marginLeft: 4 },
  timeRow: { flexDirection: "row", alignItems: "center", justifyContent: "flex-end" },

  typingContainer: { flexDirection: "row", alignItems: "center", paddingHorizontal: 20 },
  typingText: { marginLeft: 10, color: "#CA282C", fontFamily: "Poppins-Regular" },

  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingBottom: 15,
  },
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
  sendButton: {
    position: "absolute",
    right: 15,
    top: "50%",
    transform: [{ translateY: -20 }],
  },
});

export default ChatMessage;
