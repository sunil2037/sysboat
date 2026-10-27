import React, { useCallback, useEffect, useState, useRef } from 'react';
import {
    View,
    Text,
    ImageBackground,
    FlatList,
    SafeAreaView,
    Dimensions,
    StyleSheet,
    TouchableOpacity,
    ActivityIndicator,
    ToastAndroid,
    RefreshControl,
    Modal,
    Image,
    TouchableWithoutFeedback,
    Platform,
    TextInput,
    ScrollView,
} from 'react-native';
import backgroundImage from '../../assets/Icon/background.png';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import {
    RentIcon,
    Cross,
    PenCardIcon,
    PassbookIcon,
    PassportIcon,
    VoterIdIcon,
    TenthMarksheetIcon,
    AadhaarIcon,
    CertificateIcon,
    TwelethIcon,
    ElectricityBill,
    DrivingLicenseIcon,
    PayrollIcon
} from '../Helper/IconsLoad';
import BottomSheetUploadDocuments from '../Helper/BottomSheetUploadDocuments';
import TopNavBar from '../navigation/TopNavBar';
import { pick, types } from '@react-native-documents/picker';
import TextRecognition from '@react-native-ml-kit/text-recognition';
import { convert } from 'react-native-pdf-to-image';
import useApi from '../Apis/Services/ApiConfig';
import { useMutation, useQuery } from '@tanstack/react-query';
import Pdf from 'react-native-pdf';
import useEncodedUserData from '../hooks/useEncodedUserData';
import { toast } from '../Helper/ToastManager';
import { API_BASE_URL2 } from '../Apis/Services/ServerURL';
import { bottomHeight, getFontSize, normalizePath, SCREEN_WIDTH, STATUS_BAR_HEIGHT } from '../Helper/Helper';
import { useAuth } from '../Context/AuthContext';
import useUploadFile from '../hooks/useUploadFile';
import Skeleton, { getLayout } from '../Helper/Skeleton';
import ThemedText from '../Helper/ThemedText';

const DocumentsScreen = ({ navigation }) => {
    const pdfRef = useRef(null);
    const { permissions } = useAuth();
    const [pdfLoading, setPdfLoading] = useState(false);
    const [visible, setVisible] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [selectedDocumentType, setSelectedDocumentType] = useState('');
    const [isCustomDoc, setIsCustomDoc] = useState(false);
    const [customDocumentName, setCustomDocumentName] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');

    const [previewLocalUri, setPreviewLocalUri] = useState('');

    const { documentGet, documentPost } = useApi();
    const { userdata } = useEncodedUserData();
    const [uploadProgress, setUploadProgress] = useState(0);
    const [documentName, setDocumentName] = useState('');
    const [documentSize, setDocumentSize] = useState('');
    const [uploadStatus, setUploadStatus] = useState('0');
    const [viewDocument, setViewDocument] = useState(false);
    const [selectedImageUrl, setSelectedImageUrl] = useState('');
    const width = Dimensions.get('window').width - 30;
    const height = Dimensions.get('window').height;

    const [uploadedCloudPath, setUploadedCloudPath] = useState("");
    const [isReadyToSubmit, setIsReadyToSubmit] = useState(false);

    const [showPreview, setShowPreview] = useState(false);

    const [selectedFile, setSelectedFile] = useState(null);
    const [isUploadingToCloud, setIsUploadingToCloud] = useState(false);
    const [cloudUploadComplete, setCloudUploadComplete] = useState(false);



    const { uploadFile, isPending: uploadPending, isSuccessed: Success, setIsSuccess, error, data: uploadedData } = useUploadFile();

    const [uploadingDocs, setUploadingDocs] = useState({});
    const [documents, setDocuments] = useState([]);


    const handleDeleteUpload = () => {
        setUploadedCloudPath("");
        setIsReadyToSubmit(false);
        setShowPreview(false);
        setPreviewLocalUri("");
        setUploadProgress(0);
        setDocumentName('');
        setDocumentSize('');
        setUploadStatus('0');
        setSelectedFile(null);
        setIsUploadingToCloud(false);
        setCloudUploadComplete(false);

        toast.info("Upload removed. You can upload a new document.");
    };

    const handleUploadToCloud = () => {
        if (!selectedFile) {
            toast.error("No file selected");
            return;
        }

        if (isCustomDoc && !customDocumentName.trim()) {
            toast.error("Please enter document name first");
            return;
        }

        setIsUploadingToCloud(true);
        const folder = "document";

        uploadFile({ file: selectedFile, folder }, {
            onSuccess: async (data) => {
                toast.success("Document uploaded to cloud successfully!");
                setUploadedCloudPath(data?.url || data?.file_path);
                setIsReadyToSubmit(true);
                setCloudUploadComplete(true);
                setIsUploadingToCloud(false);
                setUploadStatus("1");
                setUploadProgress(1);
            },
            onError: (error) => {
                toast.error(error.message || "Failed to upload to cloud");
                setIsUploadingToCloud(false);
                setUploadStatus('2');
            },
            onUploadProgress: (progress) => {
                setUploadProgress(progress);
            },
        });
    };


    const data = [
        { id: '1', value: 'Aadhar Card', subText: 'Uploaded', icon: <AadhaarIcon color={'#CA282C'} width={30} height={30} /> },
        { id: '2', value: 'Pan Card', subText: 'Not Uploaded', icon: <PenCardIcon color={'#CA282C'} width={30} height={30} /> },
        { id: '9', value: 'Driving License', subText: 'Not Uploaded', icon: <DrivingLicenseIcon color={'#CA282C'} width={40} height={40} /> },
        { id: '3', value: 'Payslip', subText: 'Not Uploaded', icon: <PayrollIcon color={'#CA282C'} width={30} height={30} /> },
        { id: '6', value: '11th Marksheet', subText: 'Not Uploaded', icon: <TenthMarksheetIcon color={'#CA282C'} width={30} height={30} /> },
        { id: '7', value: '12th Marksheet', subText: 'Not Uploaded', icon: <TwelethIcon color={'#CA282C'} width={30} height={30} /> },
        { id: '8', value: 'Graduation Certificate', subText: 'Not Uploaded', icon: <CertificateIcon color={'#CA282C'} width={30} height={30} /> },
        { id: '14', value: 'Passport', subText: 'Not Uploaded', icon: <PassportIcon color={'#CA282C'} width={30} height={30} /> },
        { id: '10', value: 'Voter ID', subText: 'Not Uploaded', icon: <VoterIdIcon color={'#CA282C'} width={30} height={30} /> },
        { id: '11', value: 'Electricity Bill', subText: 'Not Uploaded', icon: <ElectricityBill color={'#CA282C'} width={30} height={30} /> },
        { id: '12', value: 'Bank Passbook', subText: 'Not Uploaded', icon: <PassbookIcon color={'#CA282C'} width={30} height={30} /> },
        { id: '13', value: 'Rental Agreement', subText: 'Not Uploaded', icon: <RentIcon color={'#CA282C'} width={30} height={30} /> },
    ];

    const calculateLoadingProgress = (percent) => {
        if (percent === 1) {
            setPdfLoading(true);
        }
    };

    const isAadhaarCard = (text) => {
        const aadhaarNumberPattern = /\b\d{4}\s?\d{4}\s?\d{4}\b/;
        const uidaiKeyword = /uidai|आधार|ಆಧಾರ|ఆధార్|ஆதார்|ആധാർ|ਆਧਾਰ|આધાર|ଆଧାର|আধার/i;
        return aadhaarNumberPattern.test(text) || uidaiKeyword.test(text);
    };

    const isPANCard = (text) => {
        const panPattern = /[A-Z]{5}[0-9]{4}[A-Z]{1}/;
        const panKeywords = /(permanent\saccount\snumber|pan\scard|income\stax)/i;
        return panPattern.test(text) || panKeywords.test(text);
    };

    const isDrivingLicense = (text) => {
        const dlPatterns = [
            /\b[A-Z]{2}\d{13}\b/,
            /\b[A-Z]{2}\d{2}\d{4}\d{7}\b/,
            /DL\s?No\.?\s?[A-Z0-9]{10,16}/i,
        ];
        const dlKeywords = /(driving\slicense|driver\slicense|dl\sno|rto|transport\sauthority)/i;
        return dlPatterns.some(pattern => pattern.test(text)) || dlKeywords.test(text);
    };

    const isPayslip = (text) => {
        const payslipKeywords = /(payslip|salary\sslip|pay\speriod|net\spay|basic\ssalary|employee\sID|PF\sno)/i;
        const datePattern = /(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s\d{4}/i;
        return payslipKeywords.test(text) || datePattern.test(text);
    };

    const isMarksheet = (text) => {
        const marksheetKeywords = /(marksheet|board\sof\seducation|secondary\sschool|higher\ssecondary|grade\ssheet|roll\sno|registration\sno)/i;
        const percentagePattern = /(\d{2}\.?\d{0,2}%\s?|percentage\s?:\s?\d{2}\.?\d{0,2})/i;
        return marksheetKeywords.test(text) || percentagePattern.test(text);
    };

    const isGraduationCertificate = (text) => {
        const degreeKeywords = /(degree\scertificate|graduation\scertificate|bachelor|university\sof|convocation|this\sis\sto\scertify)/i;
        const sealPattern = /(seal\s?of|university\s?seal|registrar|principal)/i;
        return degreeKeywords.test(text) || sealPattern.test(text);
    };

    const isPassport = (text) => {
        const passportPattern = /[A-Z]{1}[0-9]{7}/;
        const passportKeywords = /(passport|book\sno|issuing\sauthority|government\sof|date\sof\sissue|place\sof\sbirth)/i;
        return passportPattern.test(text) || passportKeywords.test(text);
    };

    const isVoterID = (text) => {
        const voterIdPattern = /[A-Z]{3}[0-9]{7}/;
        const voterKeywords = /(voter\sid|election\scommission|electoral\sroll|epic\sno)/i;
        return voterIdPattern.test(text) || voterKeywords.test(text);
    };

    const isElectricityBill = (text) => {
        const billKeywords = /(electricity\sbill|power\sconsumption|kwh|units\sconsumed|consumer\sno|discom)/i;
        const amountPattern = /(total\samount\sdue|payable\samount)\s?:?\s?₹?\s?\d+/i;
        return billKeywords.test(text) || amountPattern.test(text);
    };

    const isBankPassbook = (text) => {
        const bankKeywords = /(bank\spassbook|account\sstatement|transaction\sdetails|ifsc\scode|account\sno|branch\sname)/i;
        const transactionPattern = /(\d{2}-\w{3}-\d{4}\s.+\s[+-]?\d+)/i;
        return bankKeywords.test(text) || transactionPattern.test(text);
    };

    const isRentalAgreement = (text) => {
        const agreementKeywords = /(rental\sagreement|lease\sdeed|lessor\sand\slessee|tenancy\sagreement|monthly\srent|security\sdeposit)/i;
        const durationPattern = /(term\sof\slease|agreement\speriod)\s?:?\s?\d+\s(months|years)/i;
        return agreementKeywords.test(text) || durationPattern.test(text);
    };


    const {
        data: DocumentsData,
        isLoading,
        refetch,
        isPending,
    } = useQuery({
        queryKey: ['documentGet', userdata],
        queryFn: () =>
            documentGet({
                userData: userdata,
            }),
        enabled: !!userdata,
    });

    const uploadedDocs = DocumentsData?.data?.map(doc => ({
        name: doc.document_name?.toLowerCase?.() || '',
        status: doc.status,
        file_path: doc.file_path,
    })) || [];

    const updatedData = data.map(item => {
        const lowerValue = item.value.toLowerCase();
        const uploadedDoc = uploadedDocs.find(doc => doc.name === lowerValue);
        const isUploaded = !!uploadedDoc;
        let status = uploadedDoc?.status;
        const result = {
            ...item,
            subText: isUploaded ? 'Uploaded' : 'Not Uploaded',
            status: status == undefined ? 'Not Available' : status,
            file_path: uploadedDoc?.file_path,
        };

        return result;
    });

    const knownNamesSet = new Set(data.map(d => d.value.toLowerCase()));
    const otherDocsRaw = DocumentsData?.data?.filter(doc => {
        const n = doc.document_name?.toLowerCase?.() || '';
        return !knownNamesSet.has(n);
    }) || [];

    const {
        mutate: uploadDocument,
        isPending: isDocumentUploadPending,
        isError: isDocumentUploadError,
    } = useMutation({
        mutationFn: async (filePath) => {
            const finalDocumentName = customDocumentName
                ? customDocumentName
                : selectedDocumentType;
            let payload = {
                userData: userdata,
                document: filePath,
                documentName: finalDocumentName
            }

            try {
                const response = await documentPost(payload);
                return response;
            } catch (error) {
                console.warn('Image upload failed:', error);
                throw error;
            }
        },
        onSuccess: async (response) => {
            toast.success(response.message);
            setUploadProgress(1);
            setUploadStatus('1');
            await refetch();
            setTimeout(() => {
                setDocumentSize('');
                setDocumentName('');
                setCustomDocumentName('');
                setVisible(false);
            }, 500);
        },
        onError: error => {
            console.warn('Image upload failed:', error);
            toast.error(error.message);
            setUploadStatus('2');
        },
    });

    const extractTextFromPdf = async (pdfUri) => {
        try {
            const images = await convert(pdfUri);
            let fullText = '';

            for (const imagePath of images.outputFiles) {
                const imageUri = Platform.OS === 'android' ? imagePath : `file://${imagePath}`;
                const result = await TextRecognition.recognize(imageUri);

                if (result.blocks && result.blocks.length > 0) {
                    for (const block of result.blocks) {
                        if (block.text) {
                            fullText += block.text + ' ';
                        }
                    }
                }
            }
            return fullText.toLowerCase();
        } catch (error) {
            throw new Error('Failed to process PDF document');
        }
    };

    const extractTextFromImage = async (imageUri) => {
        try {
            let fullText = '';

            const validUri = await normalizePath(imageUri);
            const result = await TextRecognition.recognize(validUri);

            if (result.blocks && result.blocks.length > 0) {
                for (const block of result.blocks) {
                    if (block.text) {
                        fullText += block.text + ' ';
                    }
                }
            }

            return fullText.toLowerCase();
        } catch (error) {
            throw new Error('Failed to process image document');
        }
    };

    const handleFinalUpload = () => {
        if (!uploadedCloudPath) {
            toast.error("Please upload to cloud first");
            return;
        }

        if (isCustomDoc && !customDocumentName.trim()) {
            toast.error("Please enter document name");
            return;
        }

        uploadDocument(uploadedCloudPath);
    };


    const processDocument = async (files) => {
        setIsProcessing(true);

        try {
            let fullText = "";

            if (files[0].uri.endsWith(".pdf") || files[0].type === "application/pdf") {
                fullText = await extractTextFromPdf(files[0].uri);
            } else {
                fullText = await extractTextFromImage(files[0].uri);
            }

            let isValid = true;
            let errorMessage = "The uploaded document does not appear to be valid";

            if (isCustomDoc) {
                isValid = true;
            } else {
                switch (selectedDocumentType) {
                    case "Aadhar Card":
                        isValid = isAadhaarCard(fullText);
                        errorMessage = "The uploaded document does not appear to be a valid Aadhaar card";
                        break;
                    case "Pan Card":
                        isValid = isPANCard(fullText);
                        errorMessage = "The uploaded document does not appear to be a valid PAN card";
                        break;
                    case "Driving License":
                        isValid = isDrivingLicense(fullText);
                        errorMessage = "The uploaded document does not appear to be a valid Driving License";
                        break;
                    case "Payslip":
                        isValid = isPayslip(fullText);
                        errorMessage = "The uploaded document does not appear to be a valid Payslip";
                        break;
                    case "11th Marksheet":
                    case "12th Marksheet":
                        isValid = isMarksheet(fullText);
                        errorMessage = "The uploaded document does not appear to be a valid Marksheet";
                        break;
                    case "Graduation Certificate":
                        isValid = isGraduationCertificate(fullText);
                        errorMessage = "The uploaded document does not appear to be a valid Graduation Certificate";
                        break;
                    case "Passport":
                        isValid = isPassport(fullText);
                        errorMessage = "The uploaded document does not appear to be a valid Passport";
                        break;
                    case "Voter ID":
                        isValid = isVoterID(fullText);
                        errorMessage = "The uploaded document does not appear to be a valid Voter ID";
                        break;
                    case "Electricity Bill":
                        isValid = isElectricityBill(fullText);
                        errorMessage = "The uploaded document does not appear to be a valid Electricity Bill";
                        break;
                    case "Bank Passbook":
                        isValid = isBankPassbook(fullText);
                        errorMessage = "The uploaded document does not appear to be a valid Bank Passbook";
                        break;
                    case "Rental Agreement":
                        isValid = isRentalAgreement(fullText);
                        errorMessage = "The uploaded document does not appear to be a valid Rental Agreement";
                        break;
                    default:
                        isValid = false;
                        errorMessage = "Unknown document type";
                        break;
                }
            }

            if (!isValid) {
                toast.error(errorMessage);
                setDocumentSize("");
                setDocumentName("");
                return;
            }

            setDocumentName(files[0].name);
            setDocumentSize(formatFileSize(files[0].size || 0));
            setPreviewLocalUri(files[0].uri);
            setShowPreview(true);

            setSelectedFile({
                uri: files[0].uri,
                type: files[0].type,
                name: files[0].name,
            });

            toast.success("Document validated successfully. Click 'Upload to Cloud' to continue.");

        } catch (error) {
            toast.error(error.message || "Failed to process document. Please try again.");
            setDocumentSize("");
            setDocumentName("");
            setPreviewLocalUri("");
            setShowPreview(false);
        } finally {
            setIsProcessing(false);
        }
    };




    const formatFileSize = (bytes) => {
        if (bytes === 0) { return '0 Bytes'; }

        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(1024));
        const formattedSize = (bytes / Math.pow(1024, i)).toFixed(2);

        return `${formattedSize} ${sizes[i]}`;
    };

    const handleDocumentSelect = async () => {
        try {
            if (isCustomDoc && !customDocumentName.trim()) {
                toast.info("Please enter document name");
                return;
            }
            const PICK_TYPES = ["image/*", "application/pdf"];

            const res = await pick({
                type: [PICK_TYPES],
            });

            await processDocument(res);
        } catch (err) {
            toast.error("Failed to select document");
        }
    };


    const handleCloseSheet = () => {
        if (!isProcessing && !isUploadingToCloud) {
            setVisible(false);
            setUploadStatus('0');
            setSelectedDocumentType('');
            setIsCustomDoc(false);
            setCustomDocumentName('');
            setUploadProgress(0);
            setDocumentName('');
            setDocumentSize('');
            setUploadedCloudPath("");
            setIsReadyToSubmit(false);
            setShowPreview(false);
            setPreviewLocalUri("");
            setSelectedFile(null);
            setIsUploadingToCloud(false);
            setCloudUploadComplete(false);
        } else {
            ToastAndroid.show('Please Wait...', ToastAndroid.SHORT);
        }
    };

    const handleGridItemPress = (item) => {
        if (item.status === 1 || item.status === 0 || item.status === 2 || item.status === 3) {
            setSelectedImageUrl(API_BASE_URL2 + item.file_path);
            setViewDocument(true);
        } else {
            if (permissions?.block_document_upload) {
                toast.info('Document upload is blocked by admin.');
                return;
            }
            setSelectedDocumentType(item.value);
            setIsCustomDoc(false);
            setVisible(true);
        }
    };

    const handleAddOtherDocumentPress = () => {
        if (permissions?.block_document_upload) {
            toast.info('Document upload is blocked by admin.');
            return;
        }
        setSelectedDocumentType('Other Document');
        setIsCustomDoc(true);
        setVisible(true);
    };

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await refetch();
        setRefreshing(false);
    }, [refetch]);

    const profileImageUri = selectedImageUrl;


    const screenWidth = Dimensions.get('window').width - 40;
    const numColumns = 2;
    const gap = 5;
    const availableSpace = screenWidth - (numColumns - 1) * gap;
    const itemSize = availableSpace / numColumns;

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
        itemContainer: {
            width: itemSize,
            height: itemSize,
            backgroundColor: 'white',
            justifyContent: 'center',
            alignItems: 'center',
            gap: 10,
            borderRadius: 8,
            margin: 3,
            borderWidth: 1,
            borderColor: '#E2E2E2',
        },
        item: {
            justifyContent: 'center',
            alignItems: 'center',
            fontSize: 14,
            fontFamily: 'Poppins-Regular',
            color: '#45484D',
            textAlign: 'center',
        },
        uploadButton: {
            borderWidth: 2,
            borderStyle: 'dashed',
            borderColor: '#CACACA',
            width: '90%',
            alignItems: 'center',
            paddingVertical: 15,
            marginHorizontal: 20,
            marginBottom: 20,
            borderRadius: 10,
        },
        searchContainer: {
            width: '100%',
            paddingHorizontal: 20,
            marginTop: 10,
            marginBottom: 10,
        },
        searchInput: {
            backgroundColor: 'white',
            borderRadius: 10,
            paddingHorizontal: 15,
            paddingVertical: 8,
            borderWidth: 1,
            borderColor: '#E2E2E2',
            fontFamily: 'Poppins-Regular',
            fontSize: 13,
            color: '#45484D',
        },
        filterRow: {
            flexDirection: 'row',
            flexWrap: 'wrap',
            paddingHorizontal: 20,
            gap: 8,
            marginBottom: 10,
        },
        filterChip: {
            borderRadius: 20,
            paddingHorizontal: 12,
            paddingVertical: 6,
            borderWidth: 1,
            borderColor: '#E2E2E2',
        },
        filterChipActive: {
            backgroundColor: '#CA282C11',
            borderColor: '#CA282C',
        },
        filterChipText: {
            fontFamily: 'Poppins-Regular',
            fontSize: 12,
            color: '#45484D',
        },
        filterChipTextActive: {
            color: '#CA282C',
            fontFamily: 'Poppins-Medium',
        },
        addOtherDocButton: {
            marginHorizontal: 20,
            marginTop: 10,
            marginBottom: 10,
            borderRadius: 10,
            backgroundColor: '#FFF2F2',
            paddingVertical: 10,
            paddingHorizontal: 15,
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
        },
        addOtherDocText: {
            fontFamily: 'Poppins-Medium',
            fontSize: 13,
            color: '#CA282C',
        },
        addOtherDocSubText: {
            fontFamily: 'Poppins-Regular',
            fontSize: 11,
            color: '#6A7D94',
        },
        otherDocsContainer: {
            marginTop: 20,
            paddingHorizontal: 5,
            paddingBottom: 40,
        },
        otherDocCard: {
            borderWidth: 1,
            borderColor: '#E2E2E2',
            borderRadius: 8,
            padding: 10,
            marginVertical: 5,
            backgroundColor: 'white',
        },
        otherDocName: {
            fontFamily: 'Poppins-Medium',
            fontSize: 14,
            color: '#293646',
        },
        otherDocMetaRow: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            marginTop: 4,
        },
        otherDocStatus: {
            fontFamily: 'Poppins-Medium',
            fontSize: 12,
        },
        otherDocLabel: {
            fontFamily: 'Poppins-Regular',
            fontSize: 11,
            color: '#6A7D94',
        },
    });

    const statusFilterOptions = [
        'All',
        'Uploaded',
        'Pending',
        'Approved',
        'Rejected',
        'Not Uploaded',
    ];

    const filteredData = updatedData.filter(item => {
        const matchesSearch = item.value.toLowerCase().includes(searchQuery.toLowerCase());

        let matchesFilter = true;
        switch (statusFilter) {
            case 'Uploaded':
                matchesFilter = item.subText === 'Uploaded';
                break;
            case 'Pending':
                matchesFilter = item.status === 0 || item.status === 1;
                break;
            case 'Approved':
                matchesFilter = item.status === 2;
                break;
            case 'Rejected':
                matchesFilter = item.status === 3;
                break;
            case 'Not Uploaded':
                matchesFilter = item.subText === 'Not Uploaded';
                break;
            default:
                matchesFilter = true;
        }

        return matchesSearch && matchesFilter;
    });

    const filteredOtherDocs = otherDocsRaw.filter(doc =>
        doc.document_name?.toLowerCase?.().includes(searchQuery.toLowerCase())
    );

    const renderStatusTextAndColor = (status) => {
        if (status === 0 || status === 1) {
            return { text: 'Pending', color: '#FF9B17' };
        }
        if (status === 2) {
            return { text: 'Approved', color: '#51B625' };
        }
        if (status === 3) {
            return { text: 'Reject', color: '#CA282C' };
        }
        return { text: '', color: '#45484D' };
    };

    const MyListItem = React.memo(({ item, onPress }) => {
        const borderColor = item.status === 0 || item.status === 1
            ? '#FF9B17'
            : item.status === 2
                ? '#51B625'
                : item.status === 3
                    ? '#CA282C'
                    : '#E2E2E2';

        const { text: statusText, color: statusColor } = renderStatusTextAndColor(item.status);

        return (
            <TouchableOpacity
                onPress={() => onPress(item)}
                style={[styles.itemContainer, { borderColor }]}
            >
                <View style={{ backgroundColor: '#FFF2F2', height: 63, width: 63, justifyContent: 'center', alignItems: 'center', borderRadius: 20 }}>
                    {item.icon}
                </View>
                <View>
                    <ThemedText size='sm' align='center' weight='Medium'>
                        {item.value}
                    </ThemedText>

                    {item.status !== 'Not Available' && statusText !== '' && (
                        <ThemedText size='xs' weight='Regular' align='center' style={{ color: statusColor }}>
                            {statusText}
                        </ThemedText>

                    )}
                </View>
            </TouchableOpacity>
        );
    }
    )

    const renderItem = useCallback(({ item }) => (
        <MyListItem item={item} onPress={handleGridItemPress} />
    ), []);

    const keyExtractor = useCallback((item) => item.id.toString(), []);


    const Grid = React.memo(({ filteredData, refreshing, onRefresh, renderItem }) => (
        <FlatList
            data={filteredData}
            contentContainerStyle={{ gap, paddingBottom: bottomHeight(), }}
            columnWrapperStyle={{ gap }}
            nestedScrollEnabled={true}
            renderItem={renderItem}
            keyExtractor={keyExtractor}
            showsVerticalScrollIndicator={false}
            numColumns={numColumns}
            refreshControl={
                <RefreshControl
                    refreshing={refreshing}
                    onRefresh={onRefresh}
                    colors={['black']}
                />
            }
            ListFooterComponent={
                <View style={styles.otherDocsContainer}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6, paddingHorizontal: 5 }}>
                        <ThemedText size='sm' weight='Medium'>
                            Other Documents
                        </ThemedText>
                        <ThemedText size='xs' weight='Medium' color='secondary'>
                            {filteredOtherDocs.length} item(s)
                        </ThemedText>
                    </View>
                    {filteredOtherDocs.length === 0 ? (
                        <ThemedText size='xs' weight='Medium' align='center' color='secondary'>
                            No extra documents uploaded yet.
                        </ThemedText>
                    ) : (
                        filteredOtherDocs.map((doc) => {
                            const { text: statusText, color: statusColor } = renderStatusTextAndColor(doc.status);

                            return (
                                <TouchableOpacity
                                    key={doc.id || doc._id || doc.document_name + doc.file_path}
                                    onPress={() => {
                                        setSelectedImageUrl(API_BASE_URL2 + doc.file_path);
                                        setViewDocument(true);
                                    }}
                                    style={styles.otherDocCard}
                                >
                                    <ThemedText size='sm' weight='Medium' >
                                        {doc.document_name || 'Other Document'}
                                    </ThemedText>

                                    <View style={styles.otherDocMetaRow}>
                                        <ThemedText size='xs' weight='Regular' style={{ color: statusColor }} >
                                            {statusText || 'Uploaded'}
                                        </ThemedText>
                                        <ThemedText size='xs' weight='Medium' color='secondary' >
                                            Tap to view
                                        </ThemedText>
                                    </View>
                                </TouchableOpacity>
                            );
                        })
                    )}
                </View>
            }
        />
    ));

    return (
        <SafeAreaView style={{ flex: 1 }}>
            <ImageBackground
                source={backgroundImage}
                resizeMode="cover"
                style={{ ...StyleSheet.absoluteFillObject, flex: 1, backgroundColor: '#F9F9F9' }}
            >
                <Modal
                    animationType="slide"
                    transparent={true}
                    statusBarTranslucent={true}
                    visible={viewDocument}
                    onRequestClose={() => {
                        setViewDocument(!viewDocument);
                    }}>
                    <View style={styles.centeredView}>
                        {profileImageUri?.toLowerCase().endsWith('.pdf') ? (
                            <TouchableWithoutFeedback>
                                <Pdf
                                    ref={pdfRef}
                                    trustAllCerts={false}
                                    source={{ uri: profileImageUri, cache: false }}
                                    renderActivityIndicator={(progress) => (
                                        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                                            <ActivityIndicator size="large" color="black" />
                                        </View>
                                    )}
                                    onLoadProgress={(percent) => calculateLoadingProgress(percent)}
                                    style={{
                                        width,
                                        height: height,
                                        backgroundColor: 'rgba(52, 52, 52, 0)',
                                    }}
                                    enableAntialiasing={true}
                                    enablePaging={false}
                                    enableRTL={false}
                                    enableAnnotationRendering={false}
                                    showsVerticalScrollIndicator={true}
                                    showsHorizontalScrollIndicator={false}
                                    fitPolicy={0}
                                    singlePage={false}
                                    spacing={10}
                                    minScale={1.0}
                                    maxScale={3.0}
                                    scrollEnabled={true}
                                />
                            </TouchableWithoutFeedback>
                        ) : (
                            <Image
                                source={{ uri: profileImageUri }}
                                style={{ width: '100%', height: '100%', flex: 1 }}
                                resizeMode="contain"
                            />
                        )}
                        <TouchableOpacity
                            style={[styles.button, styles.buttonClose]}
                            onPress={() => setViewDocument(!viewDocument)}>
                            <Cross color={'white'} width={30} height={30} />
                        </TouchableOpacity>
                    </View>
                </Modal>

                <View style={{ paddingTop: STATUS_BAR_HEIGHT(), flex: 1 }}>
                    <TopNavBar title={'Documents'} navigation={navigation} />
                    <View >
                        <View style={styles.searchContainer}>
                            <TextInput
                                placeholder="Search document (e.g. Aadhaar, Degree)…"
                                value={searchQuery}
                                onChangeText={setSearchQuery}
                                style={styles.searchInput}
                                placeholderTextColor="#A0A4AA"
                            />
                        </View>

                        <View style={styles.filterRow}>
                            {statusFilterOptions.map((opt) => {
                                const active = statusFilter === opt;
                                return (
                                    <TouchableOpacity
                                        key={opt}
                                        onPress={() => setStatusFilter(opt)}
                                        style={[
                                            styles.filterChip,
                                            active && styles.filterChipActive,
                                        ]}
                                    >
                                        <ThemedText size='xs' weight='Medium' color={active ? 'error' : 'primary'}  >
                                            {opt}
                                        </ThemedText>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>

                        <TouchableOpacity
                            style={styles.addOtherDocButton}
                            onPress={handleAddOtherDocumentPress}
                        >
                            <View style={{ flex: 1 }}>
                                <ThemedText size='sm' weight='Medium' color={'error'}  >
                                    Upload specific degree / other document
                                </ThemedText>
                                <ThemedText size='xs' weight='Regular' color={'secondary'}  >
                                    e.g. BCA Degree, MCA Degree, Diploma, Experience Letter, etc.
                                </ThemedText>
                            </View>
                            <View>
                                <ThemedText size='xs' weight='Regular' color={'error'}  >
                                    + Add
                                </ThemedText>

                            </View>
                        </TouchableOpacity>
                    </View>
                    <View style={{ alignItems: 'center', flex: 1, }}>
                        <Skeleton isLoading={isLoading || isPending} type='Square' layout={getLayout({ length: 2, width: SCREEN_WIDTH / 2 - 22, height: SCREEN_WIDTH / 2 })}>
                            <Grid
                                filteredData={filteredData}
                                refreshing={refreshing}
                                onRefresh={onRefresh}
                                renderItem={renderItem}
                            />
                        </Skeleton>
                    </View>
                </View>
            </ImageBackground>
            <BottomSheetUploadDocuments
                visible={visible}
                onClose={handleCloseSheet}
                onUploadPress={handleDocumentSelect}
                documentType={selectedDocumentType}
                uploadProgress={uploadProgress}
                documentName={documentName}
                documentSize={documentSize}
                uploadStatus={uploadStatus}
                processing={isProcessing}
                isCustomDoc={isCustomDoc}
                customDocumentName={customDocumentName}
                onChangeCustomName={setCustomDocumentName}
                readyToSubmit={isReadyToSubmit}
                onFinalUploadPress={handleFinalUpload}
                previewUrl={previewLocalUri}
                isDocumentUploadPending={isDocumentUploadPending}
                showPreview={showPreview}
                onPreviewPress={() => {
                    setSelectedImageUrl(previewLocalUri);
                    setViewDocument(true);
                }}
                onDeleteUpload={handleDeleteUpload}
                onUploadToCloud={handleUploadToCloud}
                isUploadingToCloud={isUploadingToCloud}
                cloudUploadComplete={cloudUploadComplete}
            />


        </SafeAreaView>
    );
};

export default DocumentsScreen;
