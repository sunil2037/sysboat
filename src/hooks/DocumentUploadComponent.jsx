import React, { useState } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    FlatList,
    Alert,
    Modal,
    Image,
    ScrollView,
    PermissionsAndroid
} from 'react-native';
import { launchCamera } from 'react-native-image-picker';
import { pick } from '@react-native-documents/picker';
import useUploadFile from './useUploadFile';
import {
    AlertIcon,
    CameraIcon,
    CorrectIcon,
    Cross,
    DeleteIcon,
    DocumentsIcon,
    FileUploadIcon
} from '../Helper/IconsLoad';
import { bottomHeight, getFontSize, STATUS_BAR_HEIGHT } from '../Helper/Helper';

const PICK_FORMATS = {
    allFiles: "*/*",
    audio: "audio/*",
    csv: ["text/csv", "text/comma-separated-values"],
    doc: "application/msword",
    docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    jpg: "image/*",
    jpeg: "image/*",
    png: "image/*",
    pdf: "application/pdf",
    plainText: "text/plain",
    json: "application/json",
    ppt: "application/vnd.ms-powerpoint",
    pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    video: "video/*",
    xls: "application/vnd.ms-excel",
    xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    zip: "application/zip",
}

const DocumentUploadComponent = ({
    visible,
    onClose,
    folder = 'default',
    maxFiles = 1,
    allowedTypes = ['pdf', 'doc', 'docx', 'jpg', 'jpeg', 'png'],
    onUploadComplete,
    onUploadError,
    onDeleteDocuments = () => { }
}) => {

    const [documents, setDocuments] = useState([]);
    const [previewDoc, setPreviewDoc] = useState(null);
    const [uploadingDocs, setUploadingDocs] = useState({});

    const { uploadFile } = useUploadFile();

    const mappedTypes = allowedTypes.map(type => PICK_FORMATS[type]).flat();

    const requestCameraPermission = async () => {
        if (Platform.OS === "ios") {
            return true;
        }

        try {
            const granted = await PermissionsAndroid.requestMultiple([
                PermissionsAndroid.PERMISSIONS.CAMERA,
                PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
                PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
            ]);

            return granted["android.permission.CAMERA"] === "granted";
        } catch (err) {
            console.warn(err);
            return false;
        }
    };

    const handleTakePhoto = async () => {
        const hasPermission = await requestCameraPermission();
        if (!hasPermission) {
            Alert.alert("Permission Required", "Camera permission is required.");
            return;
        }

        launchCamera(
            { mediaType: 'photo', quality: 0.5, saveToPhotos: true },
            (response) => {
                if (response.didCancel || response.errorCode) return;

                const asset = response.assets[0];

                const newPhoto = {
                    id: Date.now() + Math.random(),
                    name: asset.fileName || 'captured.jpg',
                    uri: asset.uri,
                    type: asset.type,
                    size: asset.fileSize,
                    extension: 'jpg',
                    uploadProgress: 0,
                    uploaded: false,
                    error: null,
                    selected: false,         // ADD
                };

                setDocuments(prev => [...prev, newPhoto]);
            }
        );
    };

    const pickDocument = async () => {
        try {
            if (documents.length >= maxFiles) {
                Alert.alert('Limit Reached', `You can only upload ${maxFiles} files.`);
                return;
            }

            const results = await pick({ type: [mappedTypes], allowMultiSelection: true });

            const validDocs = results.filter(doc => {
                const ext = doc.name.split('.').pop().toLowerCase();
                return allowedTypes.includes(ext);
            });

            const newDocs = validDocs
                .slice(0, maxFiles - documents.length)
                .map(doc => ({
                    id: Date.now() + Math.random(),
                    name: doc.name,
                    uri: doc.fileCopyUri || doc.uri,
                    type: doc.type,
                    size: doc.size,
                    extension: doc.name.split('.').pop().toLowerCase(),
                    uploadProgress: 0,
                    uploaded: false,
                    error: null,
                    selected: false,         // ADD
                }));

            setDocuments(prev => [...prev, ...newDocs]);

        } catch (err) { }
    };

    const toggleSelect = (id) => {
        setDocuments(prev =>
            prev.map(doc =>
                doc.id === id ? { ...doc, selected: !doc.selected } : doc
            )
        );
    };

    const handleUpload = async (document, done = () => { }) => {
        setUploadingDocs(prev => ({ ...prev, [document.id]: true }));

        const progressInterval = setInterval(() => {
            setDocuments(prev => prev.map(doc =>
                doc.id === document.id && doc.uploadProgress < 90
                    ? { ...doc, uploadProgress: doc.uploadProgress + 10 }
                    : doc
            ));
        }, 200);

        try {
            const file = {
                uri: document.uri,
                type: document.type,
                name: document.name,
            };

            uploadFile(
                { file, folder },
                {
                    onSuccess: (data) => {
                        clearInterval(progressInterval);

                        setDocuments(prev => prev.map(doc =>
                            doc.id === document.id
                                ? { ...doc, uploadProgress: 100, uploaded: true, cloudUrl: data?.url }
                                : doc
                        ));

                        setUploadingDocs(prev => {
                            const updated = { ...prev };
                            delete updated[document.id];
                            return updated;
                        });

                        onUploadComplete?.(document, data);
                        done();
                    },
                    onError: (error) => {
                        clearInterval(progressInterval);

                        setDocuments(prev => prev.map(doc =>
                            doc.id === document.id
                                ? { ...doc, error: error.message, uploadProgress: 0 }
                                : doc
                        ));

                        setUploadingDocs(prev => {
                            const updated = { ...prev };
                            delete updated[document.id];
                            return updated;
                        });

                        onUploadError?.(document, error);
                        done();
                    },
                }
            );
        } catch (error) {
            clearInterval(progressInterval);

            setUploadingDocs(prev => {
                const updated = { ...prev };
                delete updated[document.id];
                return updated;
            });
        }
    };

    const deleteDocument = (id) => {
        setDocuments(prev => prev.filter(doc => doc.id !== id));
        onDeleteDocuments();
    };

    const selectedDocs = documents.filter(d => d.selected);
    const pendingSelected = selectedDocs.filter(d => !d.uploaded);

    const isUploadEnabled =
        selectedDocs.length > 0 &&
        pendingSelected.length > 0;

    const previewDocument = (doc) => {
        if (['jpg', 'jpeg', 'png'].includes(doc.extension)) {
            setPreviewDoc(doc);
        } else {
            Alert.alert('Preview', `${doc.name}`);
        }
    };

    const formatBytes = (bytes) => {
        if (!bytes) return "0 Bytes";
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return (bytes / Math.pow(k, i)).toFixed(1) + ' ' + sizes[i];
    };

    const renderDocumentItem = ({ item }) => (
        <View style={styles.documentCard}>

            {maxFiles >= 1 && (
                <TouchableOpacity
                    onPress={() => toggleSelect(item.id)}
                    style={styles.selectCircle}
                >
                    <View
                        style={[
                            styles.selectInner,
                            { backgroundColor: item.selected ? "#CA282C" : "transparent", borderRadius: 50 }
                        ]}
                    />
                </TouchableOpacity>
            )}

            {/* CONTENT */}
            <TouchableOpacity
                style={styles.documentContent}
                onPress={() => previewDocument(item)}
            >
                <View style={styles.documentInfo}>
                    <Text style={styles.documentName}>{item.name}</Text>
                    <Text style={styles.documentSize}>{formatBytes(item.size)}</Text>

                    {/* Progress */}
                    {uploadingDocs[item.id] && (
                        <View style={styles.progressContainer}>
                            <View style={styles.progressBar}>
                                <View
                                    style={[styles.progressFill, { width: `${item.uploadProgress}%` }]}
                                />
                            </View>
                            <Text style={styles.progressText}>{item.uploadProgress}%</Text>
                        </View>
                    )}

                    {/* Uploaded */}
                    {item.uploaded && (
                        <View style={styles.statusContainer}>
                            <CorrectIcon />
                            <Text style={styles.uploadedText}>Uploaded</Text>
                        </View>
                    )}

                    {/* Error */}
                    {item.error && (
                        <View style={styles.statusContainer}>
                            <AlertIcon color={'#ef4444'} />
                            <Text style={styles.errorText}>{item.error}</Text>
                        </View>
                    )}
                </View>
            </TouchableOpacity>

            {/* DELETE */}
            <TouchableOpacity
                style={styles.deleteButton}
                onPress={() => deleteDocument(item.id)}
                disabled={uploadingDocs[item.id]}
            >
                <DeleteIcon color="#ef4444" />
            </TouchableOpacity>
        </View>
    );

    return (
        <Modal statusBarTranslucent visible={visible} onRequestClose={onClose}>
            <View style={{ flex: 1, paddingTop: STATUS_BAR_HEIGHT(), paddingBottom: bottomHeight(), backgroundColor: '#e9e9e9ff' }}>
                <TouchableOpacity onPress={onClose} style={{ padding: 20 }}>
                    <Cross width={30} height={30} />
                </TouchableOpacity>

                <View style={styles.container}>

                    <View style={styles.header}>
                        <Text style={styles.title}>Upload Documents</Text>
                        <Text style={styles.subtitle}>
                            {documents.length} / {maxFiles}
                        </Text>
                    </View>

                    <Text style={styles.pendingText}>
                        Pending: {pendingSelected.length} / {documents.length}
                    </Text>

                    <TouchableOpacity
                        style={styles.uploadButton}
                        onPress={pickDocument}
                        disabled={documents.length >= maxFiles}
                    >
                        <FileUploadIcon color='white' />
                        <Text style={styles.uploadButtonText}>
                            {documents.length >= maxFiles ? 'Max Files Reached' : 'Select Documents'}
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.uploadButton, { backgroundColor: '#2a292fff' }]}
                        onPress={handleTakePhoto}
                        disabled={documents.length >= maxFiles}
                    >
                        <CameraIcon color='white' />
                        <Text style={styles.uploadButtonText}>Take Photo</Text>
                    </TouchableOpacity>

                    {documents.length === 0 ? (
                        <View style={styles.emptyState}>
                            <DocumentsIcon width={50} height={50} />
                            <Text style={styles.emptyText}>No documents selected</Text>
                        </View>
                    ) : (
                        <FlatList
                            data={documents}
                            renderItem={renderDocumentItem}
                            keyExtractor={item => item.id.toString()}
                            showsVerticalScrollIndicator={false}
                            style={{ flex: 1 }}
                        />
                    )}

                    {maxFiles >= 1 && (
                        <TouchableOpacity
                            style={[
                                styles.uploadAllButton,
                                { opacity: isUploadEnabled ? 1 : 0.4 }
                            ]}
                            disabled={!isUploadEnabled}
                            onPress={async () => {
                                for (const doc of pendingSelected) {
                                    await new Promise(resolve => {
                                        handleUpload(doc, resolve);
                                    });
                                }
                            }}
                        >
                            <Text style={styles.uploadAllButtonText}>
                                Upload Selected ({pendingSelected.length})
                            </Text>
                        </TouchableOpacity>
                    )}

                    <Modal
                        visible={!!previewDoc}
                        transparent
                        animationType="fade"
                        onRequestClose={() => setPreviewDoc(null)}
                    >
                        <View style={styles.modalOverlay}>
                            <View style={[styles.modalContent, { marginTop: STATUS_BAR_HEIGHT() * 2 }]}>
                                <View style={styles.modalHeader}>
                                    <Text numberOfLines={1} style={styles.modalTitle}>
                                        {previewDoc?.name}
                                    </Text>
                                    <TouchableOpacity onPress={() => setPreviewDoc(null)}>
                                        <Cross width={25} height={25} />
                                    </TouchableOpacity>
                                </View>
                                <ScrollView contentContainerStyle={styles.previewContainer}>
                                    {previewDoc && (
                                        <Image
                                            source={{ uri: previewDoc.uri }}
                                            style={styles.previewImage}
                                            resizeMode="contain"
                                        />
                                    )}
                                </ScrollView>
                            </View>
                        </View>
                    </Modal>

                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, paddingHorizontal: 15, paddingTop: 10, },

    header: { marginBottom: 10 },

    title: { fontSize: 22, fontWeight: '700', color: '#111' },

    subtitle: { fontSize: 14, color: '#666' },

    pendingText: {
        fontSize: 14,
        color: '#444',
        marginBottom: 10,
        textAlign: 'right',
        fontWeight: '600'
    },

    uploadButton: {
        backgroundColor: '#CA282C',
        padding: 16,
        borderRadius: 12,
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 8,
    },

    uploadButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
        marginLeft: 8,
    },

    documentCard: {
        backgroundColor: '#fff',
        padding: 12,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#eee',
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
    },

    selectCircle: {
        width: 22,
        height: 22,
        borderRadius: 50,
        borderWidth: 2,
        borderColor: "#CA282C",
        marginRight: 12,
        alignItems: "center",
        justifyContent: "center"
    },

    selectInner: {
        width: 12,
        height: 12,
    },

    documentContent: { flex: 1 },

    documentInfo: { flex: 1 },

    documentName: { fontSize: 16, fontWeight: '600', color: '#111' },

    documentSize: { fontSize: 12, color: '#777', marginBottom: 4 },

    progressContainer: { flexDirection: 'row', alignItems: 'center' },

    progressBar: {
        flex: 1,
        height: 6,
        backgroundColor: '#eee',
        borderRadius: 3,
        marginRight: 8,
    },

    progressFill: {
        height: '100%',
        backgroundColor: '#3b82f6',
        borderRadius: 3,
    },

    progressText: { width: 40, fontSize: 12, color: '#3b82f6', fontWeight: '700' },

    statusContainer: { flexDirection: 'row', alignItems: 'center' },

    uploadedText: { marginLeft: 4, color: '#10b981', fontWeight: '600' },

    errorText: { marginLeft: 4, color: '#ef4444', fontWeight: '600' },

    deleteButton: { padding: 8, marginLeft: 8 },

    emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center' },

    emptyText: { fontSize: 16, fontWeight: '600', color: '#777', marginTop: 10 },

    uploadAllButton: {
        backgroundColor: '#CA282C',
        padding: 16,
        borderRadius: 12,
        marginBottom: 20,
        alignItems: 'center',
    },

    uploadAllButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '700',
    },

    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' },

    modalContent: {
        flex: 1,
        backgroundColor: '#fff',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
    },

    modalHeader: {
        padding: 16,
        flexDirection: 'row',
        justifyContent: 'space-between',
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },

    modalTitle: { fontSize: 18, fontWeight: '700', flex: 1 },

    previewContainer: {
        flexGrow: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 16
    },

    previewImage: { width: '100%', height: 500 },
});

export default DocumentUploadComponent;
