import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  FlatList,
  Alert,
  ScrollView,
} from "react-native";
// import { Ionicons, FontAwesome, MaterialIcons } from "@expo/vector-icons";
import { CameraIcon, HeartIcon } from "../../Helper/IconsLoad";
import { getFontSize } from "../../Helper/Helper";
const ProfileDetailsScreen = ({ route }) => {
  const { type = "user", profileData } = route.params;
  const [showMembers, setShowMembers] = useState(false);

  const handleEdit = (field) => Alert.alert("Edit", `Edit ${field}`);
  const handleRemoveMember = (name) =>
    Alert.alert("Remove Member", `Removed ${name} from group`);
  const handleExitGroup = () => Alert.alert("Exit Group", "You exited the group");
  const handleDeleteGroup = () => Alert.alert("Delete Group", "Group deleted");

  return (
    <ScrollView style={styles.container}>
      <View style={styles.imageContainer}>
        <Image
          source={{
            uri: profileData.image || "https://via.placeholder.com/100",
          }}
          style={styles.image}
        />
        <TouchableOpacity
          style={styles.editIcon}
          onPress={() => handleEdit("photo")}
        >
          <CameraIcon color="#fff" />
        </TouchableOpacity>
      </View>

      <View style={styles.row}>
        <Text style={styles.name}>{profileData.name}</Text>
      </View>

      {type === "user" && (
        <View style={styles.row}>
          <Text style={styles.about}>
            {profileData.about || "Hey there! I am using ChatApp"}
          </Text>
        </View>
      )}

      {profileData.phone && (
        <View style={styles.phoneRow}>
          <Text style={styles.phone}>{profileData.phone}</Text>
        </View>
      )}

      {type === "group" && (
        <View style={styles.groupSection}>
          <TouchableOpacity
            onPress={() => setShowMembers(!showMembers)}
            style={styles.groupHeader}
          >
            <Text style={styles.groupTitle}>
              Members ({profileData.members?.length || 0})
            </Text>
            <Text style={styles.toggleText}>
              {showMembers ? "Hide" : "Show"}
            </Text>
          </TouchableOpacity>

          {showMembers && (
            <FlatList
              data={profileData.members}
              keyExtractor={(item, index) => index.toString()}
              renderItem={({ item }) => (
                <View style={styles.memberRow}>
                  <View style={styles.memberInfo}>
                    {/* <Ionicons name="person-circle" size={28} color="#777" /> */}
                    <Text style={styles.memberName}>{item.name}</Text>
                    {/* {item.isAdmin && (
                      <MaterialIcons
                        name="admin-panel-settings"
                        size={20}
                        color="#25D366"
                        style={{ marginLeft: 5 }}
                      />
                    )} */}
                  </View>
                  {!item.isAdmin && (
                    <TouchableOpacity
                      onPress={() => handleRemoveMember(item.name)}
                    >
                      <Text style={styles.removeText}>Remove</Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}
            />
          )}

          <View style={styles.actionRow}>
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: "#f5a623" }]}
              onPress={handleExitGroup}
            >
              <Text style={styles.actionText}>Exit Group</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: "#d9534f" }]}
              onPress={handleDeleteGroup}
            >
              <Text style={styles.actionText}>Delete</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </ScrollView>
  );
};

export default ProfileDetailsScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    padding: 16,
  },
  imageContainer: {
    alignItems: "center",
    marginVertical: 20,
  },
  image: {
    width: 110,
    height: 110,
    borderRadius: 55,
    borderWidth: 2,
    borderColor: "#ccc",
  },
  editIcon: {
    position: "absolute",
    bottom: 0,
    right: 120,
    backgroundColor: "#25D366",
    borderRadius: 20,
    padding: 6,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: 'center',
  },
  name: {
    fontSize: 16,
    color: "#333",
    textAlign: 'center',
    fontFamily: 'Poppins-Medium'
  },
  about: {
    fontSize: 16,
    color: "#555",
    flex: 1,
    textAlign: 'center',
    fontFamily: 'Poppins-Regular'
  },
  phoneRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: 'center',
  },
  phone: {
    fontSize: 14,
    marginLeft: 8,
    fontFamily: 'Poppins-Regular'
  },
  groupSection: {
    marginTop: 20,
  },
  groupHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  groupTitle: {
    fontSize: 16,
    fontFamily: 'Poppins-Medium'
  },
  toggleText: {
    fontSize: 14,
    color: "#777",
    fontFamily: 'Poppins-Regular'
  },
  memberRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 0.5,
    borderBottomColor: "#ddd",
  },
  memberInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  memberName: {
    fontSize: 14,
    color: "#333",
    marginLeft: 8,
    fontFamily: 'Poppins-Regular'
  },
  removeText: {
    color: "red",
    fontSize: 12,
    fontFamily: 'Poppins-Regular'
  },
  actionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    borderRadius: 10,
  },
  actionText: {
    color: "#fff",
    fontSize: 14,
    marginLeft: 6,
    fontFamily: 'Poppins-Regular'
  },
});
