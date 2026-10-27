import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    Dimensions,
    TouchableOpacity,
    ActivityIndicator,
    TextInput,
    Image,
} from 'react-native';
import { CorrectIcon, DeleteIcon, DocIcon, FileUploadIcon } from './IconsLoad';
import * as Progress from 'react-native-progress';
import BottomSheetBase from './BottomSheetBase';
import { getFontSize } from './Helper';
import ThemedText from './ThemedText';
const { height } = Dimensions.get('window');

const BottomSheetUploadDocuments = ({
    visible,
    onClose,
    onUploadPress,
    documentType,
    uploadProgress,
    documentName,
    documentSize,
    uploadStatus,
    processing,
    isCustomDoc,
    customDocumentName,
    onChangeCustomName,
    readyToSubmit,
    onFinalUploadPress,
    previewUrl,
    showPreview,
    onPreviewPress,
    onDeleteUpload,
    onUploadToCloud,
    isUploadingToCloud,
    cloudUploadComplete,
    isDocumentUploadPending
}) => {
    const disableUpload = processing || showPreview;
    const isPDF = previewUrl?.toLowerCase().endsWith('.pdf');
    const headerTitle = isCustomDoc ? 'Enter the exact name of the document (e.g. BCA Degree Certificate, MCA Degree, Diploma in CS).' : `Please upload a clear copy of your ${documentType}.`;

    return (
        <BottomSheetBase visible={visible} onClose={onClose}>
            <View style={{ alignItems: 'center', paddingTop: 20 }}>
                <View style={{ width: '100%', marginBottom: 10 }}>
                    <ThemedText size='md' weight='Medium'>
                        Upload {isCustomDoc ? 'Custom Document' : documentType || 'Document'}
                    </ThemedText>
                    <ThemedText size='xs' weight='Regular' color='secondary'>
                        {headerTitle}
                    </ThemedText>
                </View>

                {isCustomDoc && (
                    <View style={styles.customNameContainer}>
                        <ThemedText size='xs' weight='Medium'>
                            Document Name *
                        </ThemedText>
                        <TextInput
                            value={customDocumentName}
                            onChangeText={onChangeCustomName}
                            placeholder="e.g. BCA Degree Certificate"
                            placeholderTextColor="#A0A4AA"
                            style={styles.customNameInput}
                            editable={!showPreview}
                        />
                        {customDocumentName.trim().length > 0 && (
                            <ThemedText size='xs' weight='Medium' color='secondary'>
                                {customDocumentName.length} characters
                            </ThemedText>

                        )}
                    </View>
                )}

                {!showPreview && (
                    <TouchableOpacity
                        disabled={disableUpload}
                        onPress={onUploadPress}
                        style={[
                            styles.uploadBox,
                            disableUpload && styles.uploadBoxDisabled
                        ]}
                    >
                        <View style={styles.uploadIconWrapper}>
                            {processing ? (
                                <ActivityIndicator size={30} color={'#CA282C'} />
                            ) : (
                                <FileUploadIcon width={50} height={50} color={'#CA282C'} />
                            )}
                        </View>
                        <View style={{ flexDirection: 'row', paddingTop: 20, gap: 5 }}>
                            <ThemedText size='sm' weight='Medium' color='error'>
                                Click to Upload
                            </ThemedText>
                            <ThemedText size='sm' weight='Medium' >
                                or drag and drop
                            </ThemedText>
                        </View>
                        <ThemedText size='sm' weight='Medium' color='secondary' >
                            (Max. File size: 2 MB)
                        </ThemedText>
                        {processing && (
                            <View style={styles.processingContainer}>
                                <ThemedText size='sm' weight='Medium' >
                                    Processing document...
                                </ThemedText>
                            </View>
                        )}
                    </TouchableOpacity>
                )}

                {/* PREVIEW SECTION */}
                {showPreview && previewUrl && (
                    <View style={styles.previewContainer}>
                        <View style={styles.previewHeader}>
                            <ThemedText size='sm' weight='Medium' >
                                Preview Document
                            </ThemedText>
                            <TouchableOpacity
                                onPress={onDeleteUpload}
                                style={styles.deleteButton}
                                disabled={isUploadingToCloud}
                            >
                                <DeleteIcon width={18} height={18} color={'#CA282C'} />
                                <ThemedText size='xs' weight='Medium' color='error' >
                                    Remove
                                </ThemedText>
                            </TouchableOpacity>
                        </View>

                        {isPDF ? (
                            <TouchableOpacity
                                onPress={onPreviewPress}
                                style={styles.pdfPreviewBox}
                            >
                                <View style={styles.pdfIconContainer}>
                                    <DocIcon width={40} height={40} color={'#CA282C'} />
                                </View>
                                <View style={styles.pdfTextContainer}>
                                    <ThemedText size='sm' weight='Medium' >
                                        {documentName || 'Document.pdf'}
                                    </ThemedText>
                                    {documentSize && (
                                        <ThemedText size='xs' weight='Regular' color="secondary" >
                                            {documentSize || 2}
                                        </ThemedText>
                                    )}
                                    <ThemedText size='xs' weight='Medium' color="error" >
                                        Tap to view full PDF
                                    </ThemedText>
                                </View>
                            </TouchableOpacity>
                        ) : (
                            <TouchableOpacity
                                onPress={onPreviewPress}
                                style={styles.imagePreviewContainer}
                            >
                                <Image
                                    source={{ uri: previewUrl }}
                                    style={styles.previewImage}
                                    resizeMode="contain"
                                />
                                <View style={styles.imageOverlay}>
                                    <ThemedText size='xs' weight='Medium' color='inverse' >
                                        Tap to enlarge
                                    </ThemedText>
                                </View>
                            </TouchableOpacity>
                        )}

                        {isUploadingToCloud && uploadProgress > 0 && uploadProgress < 1 && (
                            <View style={styles.progressContainer}>
                                <View style={styles.progressHeader}>
                                    <ThemedText size='sm' weight='Medium'  >
                                        Uploading to cloud...
                                    </ThemedText>
                                    <ThemedText size='sm' weight='Medium' color='error'  >
                                        {Math.round(uploadProgress * 100)}%
                                    </ThemedText>
                                </View>
                                <Progress.Bar
                                    progress={uploadProgress}
                                    width={null}
                                    height={6}
                                    color={'#CA282C'}
                                    unfilledColor={'#F5F5F5'}
                                    borderWidth={0}
                                    borderRadius={3}
                                />
                            </View>
                        )}

                        {cloudUploadComplete && (
                            <View style={styles.successContainer}>
                                <CorrectIcon width={20} height={20} color={'#51B625'} />
                                <ThemedText size='xs' weight='Regular' color='success'  >
                                    Uploaded to cloud successfully!
                                </ThemedText>
                            </View>
                        )}

                        {!cloudUploadComplete && !isUploadingToCloud && (
                            <TouchableOpacity
                                style={styles.uploadToCloudButton}
                                onPress={onUploadToCloud}
                                disabled={isUploadingToCloud}
                            >
                                <FileUploadIcon width={18} height={18} color={'#CA282C'} />
                                <ThemedText size='sm' weight='Medium' color='error'  >
                                    Upload to Cloud
                                </ThemedText>
                            </TouchableOpacity>
                        )}
                    </View>
                )}

                {readyToSubmit && cloudUploadComplete && (
                    <TouchableOpacity
                        style={styles.finalUploadButton}
                        onPress={onFinalUploadPress}
                        disabled={processing || isDocumentUploadPending}
                    >
                        {processing || isDocumentUploadPending ? (
                            <ActivityIndicator size="small" color="white" />
                        ) : (
                            <>
                                <CorrectIcon width={20} height={20} color={'white'} />
                                <ThemedText size='sm' weight='Medium' color='inverse'  >
                                    Confirm & Submit
                                </ThemedText>
                            </>
                        )}
                    </TouchableOpacity>
                )}

                {!showPreview && (
                    <View style={styles.instructionsContainer}>
                        <ThemedText size='sm' weight='Medium'  >
                            Requirements:
                        </ThemedText>
                        <ThemedText size='xs' weight='Regular' color='secondary'  >
                            • Clear and readable document
                        </ThemedText>
                        <ThemedText size='xs' weight='Regular' color='secondary'  >
                            • File size must be under 2 MB
                        </ThemedText>
                        <ThemedText size='xs' weight='Regular' color='secondary'  >
                            • Supported formats: PDF, JPG, PNG
                        </ThemedText>
                        {isCustomDoc && (
                            <ThemedText size='xs' weight='Regular' color='secondary'  >
                                • Enter the exact document name before uploading
                            </ThemedText>
                        )}
                    </View>
                )}
            </View>
        </BottomSheetBase>
    );
};

const styles = StyleSheet.create({
    headerTitle: {
        fontFamily: 'Poppins-Medium',
        fontSize: 16,
        color: '#293646',
        textAlign: 'left',
    },
    headerSubtitle: {
        fontFamily: 'Poppins-Regular',
        fontSize: 12,
        color: '#6A7D94',
        textAlign: 'left',
        marginTop: 4,
    },
    customNameContainer: {
        width: '100%',
        marginTop: 10,
        marginBottom: 15,
        gap: 5
    },
    customNameLabel: {
        fontFamily: 'Poppins-Medium',
        fontSize: 12,
        color: '#293646',
        marginBottom: 6,
    },
    customNameInput: {
        borderWidth: 1,
        borderColor: '#E2E2E2',
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 10,
        fontFamily: 'Poppins-Regular',
        fontSize: 13,
        color: '#45484D',
        backgroundColor: 'white',
    },
    characterCount: {
        fontFamily: 'Poppins-Regular',
        fontSize: 10,
        color: '#A0A4AA',
        marginTop: 4,
        textAlign: 'right',
    },
    uploadBox: {
        borderWidth: 2,
        borderStyle: 'dashed',
        borderColor: '#CACACA',
        width: '100%',
        alignItems: 'center',
        paddingVertical: 20,
        paddingHorizontal: 15,
        borderRadius: 10,
        marginTop: 5,
        backgroundColor: '#FAFAFA',
    },
    uploadBoxDisabled: {
        opacity: 0.5,
        backgroundColor: '#F5F5F5',
    },
    uploadIconWrapper: {
        width: 80,
        height: 80,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 50,
        backgroundColor: '#FFF2F2',
    },
    uploadTextPrimary: {
        fontFamily: 'Poppins-Medium',
        fontSize: 14,
        color: '#CA282C',
    },
    uploadTextSecondary: {
        fontFamily: 'Poppins-Medium',
        fontSize: 14,
        color: '#45484D',
    },
    processingContainer: {
        marginTop: 10,
        paddingTop: 10,
        borderTopWidth: 1,
        borderTopColor: '#E2E2E2',
        width: '100%',
        alignItems: 'center',
    },
    processingText: {
        fontFamily: 'Poppins-Medium',
        fontSize: 12,
        color: '#6A7D94',
    },
    previewContainer: {
        width: '100%',
        borderWidth: 1,
        borderColor: '#E2E2E2',
        borderRadius: 10,
        padding: 12,
        marginTop: 10,
        backgroundColor: 'white',
    },
    previewHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    previewTitle: {
        fontFamily: 'Poppins-Medium',
        fontSize: 14,
        color: '#293646',
    },
    deleteButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 6,
        backgroundColor: '#FFF2F2',
    },
    deleteButtonText: {
        fontFamily: 'Poppins-Medium',
        fontSize: 12,
        color: '#CA282C',
    },
    pdfPreviewBox: {
        flexDirection: 'row',
        padding: 12,
        backgroundColor: '#F5F5F5',
        borderRadius: 8,
        alignItems: 'center',
        gap: 12,
    },
    pdfIconContainer: {
        width: 60,
        height: 60,
        backgroundColor: '#FFF2F2',
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
    },
    pdfTextContainer: {
        flex: 1,
    },
    pdfFileName: {
        fontFamily: 'Poppins-Medium',
        fontSize: 13,
        color: '#293646',
        marginBottom: 2,
    },
    pdfFileSize: {
        fontFamily: 'Poppins-Regular',
        fontSize: 11,
        color: '#6A7D94',
        marginBottom: 4,
    },
    pdfViewText: {
        fontFamily: 'Poppins-Medium',
        fontSize: 11,
        color: '#CA282C',
    },
    imagePreviewContainer: {
        position: 'relative',
        borderRadius: 8,
        overflow: 'hidden',
    },
    previewImage: {
        height: 180,
        width: '100%',
        borderRadius: 8,
    },
    imageOverlay: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        padding: 8,
        alignItems: 'center',
    },
    imageOverlayText: {
        fontFamily: 'Poppins-Medium',
        fontSize: 11,
        color: 'white',
    },
    progressContainer: {
        marginTop: 12,
        width: '100%',
    },
    progressHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 6,
    },
    progressText: {
        fontFamily: 'Poppins-Medium',
        fontSize: 12,
        color: '#45484D',
    },
    progressPercentage: {
        fontFamily: 'Poppins-Medium',
        fontSize: 12,
        color: '#CA282C',
    },
    successContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginTop: 12,
        padding: 10,
        backgroundColor: '#F0F9EC',
        borderRadius: 6,
    },
    successText: {
        fontFamily: 'Poppins-Medium',
        fontSize: 12,
        color: '#51B625',
        flex: 1,
    },
    uploadToCloudButton: {
        width: '100%',
        backgroundColor: '#FFF2F2',
        borderWidth: 1,
        borderColor: '#CA282C',
        padding: 12,
        borderRadius: 10,
        alignItems: 'center',
        marginTop: 12,
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 8,
    },
    uploadToCloudButtonText: {
        color: '#CA282C',
        fontFamily: 'Poppins-Medium',
        fontSize: 14,
    },
    finalUploadButton: {
        width: '100%',
        backgroundColor: '#CA282C',
        padding: 14,
        borderRadius: 10,
        alignItems: 'center',
        marginTop: 15,
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 8,
    },
    finalUploadButtonText: {
        color: 'white',
        fontFamily: 'Poppins-Medium',
        fontSize: 14,
    },
    instructionsContainer: {
        width: '100%',
        marginTop: 15,
        padding: 12,
        backgroundColor: '#F9F9F9',
        borderRadius: 8,
    },
    instructionsTitle: {
        fontFamily: 'Poppins-Medium',
        fontSize: 12,
        color: '#293646',
        marginBottom: 6,
    },
    instructionItem: {
        fontFamily: 'Poppins-Regular',
        fontSize: 11,
        color: '#6A7D94',
        marginBottom: 3,
    },
});

export default BottomSheetUploadDocuments;