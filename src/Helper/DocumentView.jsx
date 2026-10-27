import React, { useRef, useState, useMemo, useCallback } from "react";
import {
    View,
    Text,
    Modal,
    TouchableOpacity,
    FlatList,
    Image,
    StyleSheet,
    Dimensions,
    SafeAreaView,
} from "react-native";
import Pdf from "react-native-pdf";
import ImageViewer from "react-native-image-zoom-viewer";
import { Cross } from "./IconsLoad";
import { bottomHeight, getFontSize, STATUS_BAR_HEIGHT } from "./Helper";
import { API_BASE_URL2 } from "../Apis/Services/ServerURL";
import ThemedText from "./ThemedText";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");
const THUMB_SIZE = 64;
const THUMB_MARGIN = 8;

const DocumentView = ({ visible, documentURL, onClose }) => {
    const flatListRef = useRef(null);
    const [currentIndex, setCurrentIndex] = useState(0);


    const documents = useMemo(() => {
        if (!documentURL) return [];

        const isPDF = (url) => {
            if (typeof url !== "string") return false;
            return url.toLowerCase().endsWith(".pdf");
        };

        const processDocument = (doc) => {
            if (doc && typeof doc === "object" && doc.isLocal) {
                return {
                    type: "image",
                    src: doc.localFile || doc,
                    isLocal: true,
                    raw: doc,
                    filename: doc.filename || doc.name || "local-image",
                };
            }

            const url = typeof doc === "string" ? doc : "";
            if (!url) return null;

            if (isPDF(url)) {
                return {
                    type: "pdf",
                    src: API_BASE_URL2 + url,
                    raw: doc,
                    filename: url.split("/").pop() || "document.pdf",
                };
            }

            return {
                type: "image",
                src: API_BASE_URL2 + url,
                isLocal: false,
                raw: doc,
                filename: url.split("/").pop() || "image",
            };
        };

        if (Array.isArray(documentURL)) {
            return documentURL
                .map(processDocument)
                .filter(Boolean);
        }

        const processed = processDocument(documentURL);
        return processed ? [processed] : [];
    }, [documentURL]);

    const total = documents.length;

    React.useEffect(() => {
        setCurrentIndex(0);
    }, [documentURL]);

    const viewabilityConfig = useRef({
        itemVisiblePercentThreshold: 50,
    }).current;

    const onViewableItemsChanged = useRef(({ viewableItems }) => {
        if (viewableItems && viewableItems.length > 0) {
            const idx = viewableItems[0].index;
            if (typeof idx === "number") {
                setCurrentIndex(idx);
            }
        }
    }).current;

    const goToIndex = useCallback(
        (index) => {
            if (!flatListRef.current || index < 0 || index >= total) return;
            flatListRef.current.scrollToIndex({ index, animated: true });
            setCurrentIndex(index);
        },
        [total]
    );

    const goNext = useCallback(() => {
        if (currentIndex < total - 1) {
            goToIndex(currentIndex + 1);
        }
    }, [currentIndex, total, goToIndex]);

    const goPrev = useCallback(() => {
        if (currentIndex > 0) {
            goToIndex(currentIndex - 1);
        }
    }, [currentIndex, goToIndex]);

    const renderPdfSlide = useCallback((item) => (
        <View style={styles.slideContainer}>
            <Pdf
                source={{ uri: item.src, cache: true }}
                trustAllCerts={false}
                style={styles.pdf}
                onError={(error) => { }}
            />
        </View>
    ), []);

    const renderImageSlide = useCallback((item) => {
        const imageUrls = item.isLocal
            ? [{ props: { source: item.src } }]
            : [{ url: item.src }];



        return (
            <View style={styles.slideContainer}>
                <ImageViewer
                    imageUrls={imageUrls}
                    renderIndicator={() => null}
                    enablePreload
                    enableSwipeDown={false}
                    saveToLocalByLongPress={false}
                    enableImageZoom
                    style={styles.imageViewer}
                />
            </View>
        );
    }, []);

    const renderItem = useCallback(
        ({ item }) => {
            if (item.type === "pdf") return renderPdfSlide(item);
            return renderImageSlide(item);
        },
        [renderPdfSlide, renderImageSlide]
    );

    const keyExtractor = useCallback((item, index) => `${item.filename}-${index}`, []);

    const Thumbnail = useCallback(
        ({ doc, index }) => {
            const isActive = index === currentIndex;
            return (
                <TouchableOpacity
                    onPress={() => goToIndex(index)}
                    style={[
                        styles.thumbWrapper,
                        { borderColor: isActive ? "#007aff" : "transparent" },
                    ]}
                    activeOpacity={0.7}
                >
                    {doc.type === "image" ? (
                        <Image
                            source={doc.isLocal ? doc.src : { uri: doc.src }}
                            style={styles.thumbnail}
                            resizeMode="cover"
                        />
                    ) : (
                        <View style={styles.pdfThumbPlaceholder}>
                            <Text numberOfLines={2} style={styles.pdfThumbText}>
                                {doc.filename}
                            </Text>
                            <Text style={styles.pdfLabel}>PDF</Text>
                        </View>
                    )}
                </TouchableOpacity>
            );
        },
        [currentIndex, goToIndex]
    );

    if (!visible || total === 0) return null;

    return (
        <Modal
            visible={visible}
            animationType="fade"
            onRequestClose={onClose}
            statusBarTranslucent
            transparent={false}
        >
            <SafeAreaView style={styles.container}>
                {/* Header */}
                <View style={[styles.header, { paddingTop: STATUS_BAR_HEIGHT() ?? 0 }]}>
                    <View style={styles.headerLeft}>
                        <TouchableOpacity onPress={onClose} style={styles.iconButton}>
                            <Cross width={24} height={24} />
                        </TouchableOpacity>
                    </View>

                    {/* <View style={styles.headerCenter}>
                        <Text style={styles.headerTitle}>
                            {currentIndex + 1} of {total}
                        </Text>
                    </View> */}

                    <View style={styles.headerRight}>
                        <TouchableOpacity
                            onPress={goPrev}
                            style={[styles.iconButton, currentIndex === 0 && styles.disabled]}
                            disabled={currentIndex === 0}
                        >
                            <Text
                                style={[
                                    styles.navText,
                                    currentIndex === 0 && styles.navTextDisabled,
                                ]}
                            >
                                Prev
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={goNext}
                            style={[
                                styles.iconButton,
                                currentIndex === total - 1 && styles.disabled,
                            ]}
                            disabled={currentIndex === total - 1}
                        >
                            <Text
                                style={[
                                    styles.navText,
                                    currentIndex === total - 1 && styles.navTextDisabled,
                                ]}
                            >
                                Next
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Main Carousel */}
                <FlatList
                    ref={flatListRef}
                    data={documents}
                    keyExtractor={keyExtractor}
                    renderItem={renderItem}
                    horizontal
                    pagingEnabled
                    showsHorizontalScrollIndicator={false}
                    onViewableItemsChanged={onViewableItemsChanged}
                    viewabilityConfig={viewabilityConfig}
                    initialNumToRender={1}
                    maxToRenderPerBatch={1}
                    windowSize={3}
                    getItemLayout={(_, index) => ({
                        length: SCREEN_WIDTH,
                        offset: SCREEN_WIDTH * index,
                        index,
                    })}
                    style={styles.carousel}
                />

                {/* Thumbnail Strip */}
                {total > 1 && (
                    <View style={styles.thumbnailContainer}>
                        <FlatList
                            data={documents}
                            keyExtractor={keyExtractor}
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={styles.thumbListContent}
                            renderItem={({ item, index }) => (
                                <Thumbnail doc={item} index={index} />
                            )}
                        />
                    </View>
                )}
            </SafeAreaView>
            <View style={{ position: 'absolute', bottom: bottomHeight(), alignSelf: 'center' }}>
                <TouchableOpacity onPress={onClose} style={{ paddingHorizontal: 20, paddingVertical: 15, borderRadius: 50, backgroundColor: '#CA282C' }}>
                    <ThemedText size='md' weight='Regular' color='inverse'>Close</ThemedText>
                </TouchableOpacity>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#000",
    },
    header: {
        height: 64,
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 12,
        borderBottomColor: "rgba(255,255,255,0.06)",
        borderBottomWidth: 1,
        backgroundColor: "#000",
    },
    headerLeft: {
        width: 56,
        alignItems: "flex-start",
        justifyContent: "center",
    },
    headerCenter: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
    },
    headerRight: {
        width: 120,
        flexDirection: "row",
        justifyContent: "flex-end",
        alignItems: "center",
    },
    headerTitle: {
        color: "#fff",
        fontSize: 16,
        fontWeight: "600",
    },
    iconButton: {
        padding: 8,
        marginHorizontal: 4,
    },
    disabled: {
        opacity: 0.3,
    },
    navText: {
        color: "#fff",
        fontSize: 14,
        paddingHorizontal: 12,
        fontWeight: "500",
    },
    navTextDisabled: {
        color: "rgba(255,255,255,0.3)",
    },

    carousel: {
        flex: 1,
    },
    slideContainer: {
        width: SCREEN_WIDTH,
        height: SCREEN_HEIGHT - 150,
        backgroundColor: "#000",
        justifyContent: "center",
        alignItems: "center",
    },
    pdf: {
        flex: 1,
        width: SCREEN_WIDTH,
    },
    imageViewer: {
        flex: 1,
        width: SCREEN_WIDTH,
    },

    thumbnailContainer: {
        height: THUMB_SIZE + THUMB_MARGIN * 2 + 12,
        borderTopColor: "rgba(255,255,255,0.04)",
        borderTopWidth: 1,
        paddingVertical: 8,
        backgroundColor: "#0b0b0b",
    },
    thumbListContent: {
        paddingHorizontal: 12,
        alignItems: "center",
    },
    thumbWrapper: {
        width: THUMB_SIZE,
        height: THUMB_SIZE,
        marginRight: THUMB_MARGIN,
        borderRadius: 8,
        overflow: "hidden",
        borderWidth: 2,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "rgba(255,255,255,0.02)",
    },
    thumbnail: {
        width: THUMB_SIZE,
        height: THUMB_SIZE,
    },
    pdfThumbPlaceholder: {
        width: THUMB_SIZE,
        height: THUMB_SIZE,
        alignItems: "center",
        justifyContent: "center",
        padding: 6,
        backgroundColor: "rgba(255,255,255,0.04)",
    },
    pdfThumbText: {
        color: "#fff",
        fontSize: 9,
        textAlign: "center",
        fontWeight: "500",
    },
    pdfLabel: {
        color: "#007aff",
        fontSize: 10,
        marginTop: 4,
        fontWeight: "600",
    },
});

export default DocumentView;