import { ActivityIndicator, Alert, FlatList, Image, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import React, { useEffect, useState } from 'react'
import FaceRecognition from './FaceRecognition';
import { DEFAULT_IMAGE, getFontSize, getInitials, STATUS_BAR_HEIGHT } from '../../Helper/Helper';
import { Cross, DeleteIcon, LeftIcon } from '../../Helper/IconsLoad';
import { API_BASE_URL2 } from '../../Apis/Services/ServerURL';
import EmptyMessage from '../../Helper/EmptyMessage';
import ThemedText from '../../Helper/ThemedText';

const EmployeeFaceLists = ({ hideModal, data, handleDeleteFace, SelectedDeleteId, loading }) => {
    const [registeredFaces, setRegisteredFaces] = useState([]);
    const [visible, setVisible] = useState(false);
    const [FacePath, setFacePath] = useState('');

    // const loadRegisteredFaces = async () => {
    //     try {
    //         const faces = await FaceRecognition.getAllFaces();
    //         setRegisteredFaces(faces);
    //     } catch (error) {
    //         console.error('Error loading faces:', error);
    //     }
    // };

    useEffect(() => {
        setRegisteredFaces(data?.data)
    }, [data]);

    const handleViewFace = (item) => {
        setFacePath(item?.face_url ? API_BASE_URL2 + item?.face_url : DEFAULT_IMAGE)
        setVisible(true);
    }

    // const handleClearAllFaces = async () => {
    //     Alert.alert(
    //         'Clear All Faces',
    //         'Are you sure you want to delete all registered faces?',
    //         [
    //             { text: 'Cancel', style: 'cancel' },
    //             {
    //                 text: 'Clear All',
    //                 style: 'destructive',
    //                 onPress: async () => {
    //                     try {
    //                         await FaceRecognition.clearAllFaces();
    //                         loadRegisteredFaces();
    //                         Alert.alert('Success', 'All faces cleared');
    //                     } catch (error) {
    //                         Alert.alert('Error', 'Failed to clear faces');
    //                     }
    //                 },
    //             },
    //         ]
    //     );
    // };

    // const handleDeleteFace = async (name) => {
    //     Alert.alert(
    //         'Delete Face',
    //         `Are you sure you want to delete ${name}?`,
    //         [
    //             { text: 'Cancel', style: 'cancel' },
    //             {
    //                 text: 'Delete',
    //                 style: 'destructive',
    //                 onPress: async () => {
    //                     try {
    //                         await FaceRecognition.deleteFace(name);
    //                         loadRegisteredFaces();
    //                         Alert.alert('Success', 'Face deleted');
    //                     } catch (error) {
    //                         Alert.alert('Error', 'Failed to delete face');
    //                     }
    //                 },
    //             },
    //         ]
    //     );
    // };

    return (
        <View style={{ flex: 1, paddingTop: STATUS_BAR_HEIGHT(), }}>
            <View style={styles.facesSection}>
                <View style={styles.facesSectionHeader}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                        <TouchableOpacity onPress={hideModal} style={{ backgroundColor: '#ecececff', borderRadius: 50, padding: 7 }} >
                            <Cross width={25} height={25} />
                        </TouchableOpacity>
                        <ThemedText weight='Medium' size='md'>
                            Registered Faces
                        </ThemedText>
                    </View>
                    {/* {registeredFaces?.length > 0 && (
                        <TouchableOpacity onPress={handleClearAllFaces}>
                            <Text style={styles.clearAllText}>Clear All</Text>
                        </TouchableOpacity>
                    )} */}
                </View>

                <FlatList
                    data={registeredFaces}
                    keyExtractor={(item, index) => item?.name + index}
                    scrollEnabled={true}
                    ListEmptyComponent={<EmptyMessage />}
                    renderItem={({ item }) => (
                        <TouchableOpacity onPress={() => handleViewFace(item)} style={styles.faceCard}>
                            <View style={styles.faceCardLeft}>
                                <Image source={{ uri: item?.face_url ? API_BASE_URL2 + item?.face_url : DEFAULT_IMAGE }} style={styles.faceAvatar} />
                                <View style={styles.faceCardInfo}>
                                    <ThemedText size='md' weight='Medium'>
                                        {item?.name}
                                    </ThemedText>

                                    {item?.employee_id && (
                                        <ThemedText size='sm' weight='Regular' color='secondary'>
                                            ID: {item?.employee_id}
                                        </ThemedText>
                                    )}
                                </View>
                            </View>
                            <TouchableOpacity
                                style={styles.deleteButton}
                                disabled={SelectedDeleteId == item?.id && loading}
                                onPress={() => handleDeleteFace(item)}
                            >
                                {SelectedDeleteId == item?.id && loading ? (
                                    <ActivityIndicator color={'#CA282C'} />
                                ) : (
                                    <DeleteIcon width={25} height={25} color={'#CA282C'} />
                                )}

                            </TouchableOpacity>
                        </TouchableOpacity>
                    )}
                />
            </View>
            <Modal
                animationType="slide"
                transparent={true}
                statusBarTranslucent={true}
                visible={visible}
                onRequestClose={() => {
                    setVisible(!visible);
                }}>
                <View style={styles.centeredView}>
                    <Image
                        source={{ uri: FacePath }}
                        style={{ width: '100%', height: '100%', flex: 1 }}
                        resizeMode="contain"
                    />
                    <TouchableOpacity
                        style={[styles.button, styles.buttonClose]}
                        onPress={() => setVisible(!visible)}>
                        <Cross color={'white'} width={30} height={30} />
                    </TouchableOpacity>
                </View>
            </Modal>
        </View>
    )
}

export default EmployeeFaceLists

const styles = StyleSheet.create({
    centeredView: {
        flex: 1,
        alignItems: 'center',
        backgroundColor: 'white',
        padding: 20,
    },
    button: {
        borderRadius: 50,
        padding: 10,
        position: 'absolute',
        bottom: 20,
    },
    buttonClose: {
        backgroundColor: '#CA282C',
    },

    facesSection: {
        backgroundColor: '#fff',
        padding: 16,
        flex: 1
    },
    facesSectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    clearAllText: {
        color: '#CA282C',
        fontSize: 12,
        fontFamily: 'Poppins-Medium',
    },
    sectionTitle: {
        fontSize: 17,
        color: '#333',
        fontFamily: 'Poppins-Medium',
    },
    emptyState: {
        alignItems: 'center',
        paddingVertical: 32,
    },
    emptyStateIcon: {
        fontSize: 48,
        marginBottom: 12,
    },
    emptyStateText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#666',
        marginBottom: 4,
    },
    emptyStateSubtext: {
        fontSize: 14,
        color: '#999',
        textAlign: 'center',
    },
    faceCard: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 12,
        paddingHorizontal: 16,
        backgroundColor: '#f9f9f9',
        borderRadius: 8,
        marginBottom: 8,
    },
    faceCardLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    faceAvatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    faceAvatarText: {
        color: '#fff',
        fontSize: 14,
        fontFamily: 'Poppins-SemiBold',
    },
    faceCardInfo: {
        flex: 1,
    },
    faceCardName: {
        fontSize: 14,
        color: '#333',
        fontFamily: 'Poppins-Medium',
        textTransform: 'capitalize'

    },
    faceCardEmployeeId: {
        fontSize: 12,
        color: '#666',
        marginTop: 2,
        fontFamily: 'Poppins-Medium',
    },
    deleteButton: {
        padding: 8,
    },
    deleteButtonText: {
        fontSize: 20,
    },
})