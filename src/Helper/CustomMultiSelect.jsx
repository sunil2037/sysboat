import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    TextInput,
    FlatList,
    StyleSheet,
    Animated,
    Keyboard,
    Platform,
    Dimensions,
    ScrollView,
} from 'react-native';
import { Calendar, Cross, BlankBox, FilledBox, SearchIcon, Down, Top } from './IconsLoad';
import { getFontSize } from './Helper';
const { width } = Dimensions.get('window');

const CustomMultiSelect = ({
    items,
    selectedItems,
    onSelectedItemsChange,
    placeholder = 'Select items...',
    searchPlaceholder = 'Search...',
    labelKey = 'name',
    uniqueKey = 'id',
    selectText = 'Select',
    searchIcon = <SearchIcon />,
    selectedIcon = <FilledBox />,
    unselectedIcon = <BlankBox />,
    selectAllText = 'Select All',
    removeAllText = 'Remove All',
    noResultsText = 'No results found',
    style,
    itemStyle,
    selectedItemStyle,
    itemTextStyle,
    selectedItemTextStyle,
    searchInputStyle,
    chipContainerStyle,
    chipTextStyle,
    chipRemoveStyle,
    sectionHeaderStyle,
    hideSearch = false,
    hideSelectAll = false,
    hideChips = false,
    singleSelect = false,
    alwaysShowSelectText = false,
    animateDropdown = true,
    dropdownHeight = 250,
}) => {
    const [searchText, setSearchText] = useState('');
    const [isOpen, setIsOpen] = useState(false);
    const [filteredItems, setFilteredItems] = useState(items);
    const dropdownAnim = useRef(new Animated.Value(0)).current;
    const dropdownHeightRef = useRef(dropdownHeight);

    useEffect(() => {
        setFilteredItems(items);
    }, [items]);

    useEffect(() => {
        if (animateDropdown) {
            Animated.timing(dropdownAnim, {
                toValue: isOpen ? 1 : 0,
                duration: 200,
                useNativeDriver: false,
            }).start();
        }
    }, [isOpen, animateDropdown]);

    const toggleDropdown = () => {
        Keyboard.dismiss();
        setIsOpen(!isOpen);
    };

    const handleSearch = (text) => {
        setSearchText(text);
        if (text === '') {
            setFilteredItems(items);
        } else {
            const filtered = items?.filter(item =>
                item[labelKey].toLowerCase().includes(text.toLowerCase())
            );
            setFilteredItems(filtered);
        }
    };

    const handleSelectItem = (item) => {
        let newSelectedItems;

        if (singleSelect) {
            newSelectedItems = [item[uniqueKey]];
        } else {
            if (selectedItems.includes(item[uniqueKey])) {
                newSelectedItems = selectedItems?.filter(id => id !== item[uniqueKey]);
            } else {
                newSelectedItems = [...selectedItems, item[uniqueKey]];
            }
        }

        onSelectedItemsChange(newSelectedItems);

        if (singleSelect) {
            setIsOpen(false);
        }
    };

    const handleSelectAll = () => {
        if (selectedItems.length === filteredItems.length) {
            onSelectedItemsChange([]);
        } else {
            const allIds = filteredItems.map(item => item[uniqueKey]);
            onSelectedItemsChange(allIds);
        }
    };

    const removeItem = (itemId) => {
        const newSelectedItems = selectedItems?.filter(id => id !== itemId);
        onSelectedItemsChange(newSelectedItems);
    };

    const renderItem = ({ item, index }) => {
        const isSelected = selectedItems.includes(item[uniqueKey]);
        const hasSections = item.sectionHeader;

        if (hasSections) {
            return (
                <View style={[styles.sectionHeader, sectionHeaderStyle]}>
                    <Text style={styles.sectionHeaderText}>{item[labelKey]}</Text>
                </View>
            );
        }

        return (
            <TouchableOpacity
                style={[
                    styles.item,
                    itemStyle,
                    isSelected && styles.selectedItem,
                    isSelected && selectedItemStyle,
                ]}
                onPress={() => handleSelectItem(item)}
                activeOpacity={0.7}
            >
                <View style={styles.iconContainer}>
                    {isSelected ? selectedIcon : unselectedIcon}
                </View>
                <Text
                    style={[
                        styles.itemText,
                        itemTextStyle,
                        isSelected && styles.selectedItemText,
                        isSelected && selectedItemTextStyle,
                    ]}
                    numberOfLines={1}
                    ellipsizeMode="tail"
                >
                    {item[labelKey]}
                </Text>
            </TouchableOpacity>
        );
    };

    const renderChip = (itemId) => {
        const item = items.find(i => i[uniqueKey] === itemId);
        if (!item) { return null; }

        return (
            <View key={itemId} style={[styles.chip, chipContainerStyle]}>
                <Text style={[styles.chipText, chipTextStyle]} numberOfLines={1}>
                    {item[labelKey]}
                </Text>
                <TouchableOpacity
                    onPress={() => removeItem(itemId)}
                    style={[styles.chipRemove, chipRemoveStyle]}
                >
                    <Cross color={'white'} />
                </TouchableOpacity>
            </View>
        );
    };

    const dropdownHeightInterpolation = dropdownAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [0, dropdownHeightRef.current],
    });

    const selectedItemsObjects = useMemo(() => {
        return items.filter(item => selectedItems?.includes(item[uniqueKey]));
    }, [selectedItems, items]);

    const displayText = useMemo(() => {
        if (alwaysShowSelectText) { return selectText; }
        if (selectedItems.length === 0) { return selectText; }
        if (selectedItems.length === 1) {
            const item = items.find(i => i[uniqueKey] === selectedItems[0]);
            return item ? item[labelKey] : selectText;
        }
        return `${selectedItems.length} selected`;
    }, [selectedItems, items, selectText, alwaysShowSelectText]);

    return (
        <View style={[styles.container, style]}>
            <TouchableOpacity
                style={styles.header}
                onPress={toggleDropdown}
                activeOpacity={0.8}
            >
                <Text style={styles.headerText} numberOfLines={1}>
                    {displayText}
                </Text>
                {isOpen ? (
                    <Top />
                ) : (
                    <Down />
                )}
            </TouchableOpacity>

            {!hideChips && selectedItems.length > 0 && (
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.chipsContainer}
                >
                    {selectedItems.map(renderChip)}
                </ScrollView>
            )}

            {isOpen && (
                <Animated.View
                    style={[
                        styles.dropdown,
                        animateDropdown && { height: dropdownHeightInterpolation },
                        { maxHeight: dropdownHeightRef.current },
                    ]}
                >
                    {!hideSearch && (
                        <View style={styles.searchContainer}>
                            <View style={styles.searchIcon}>{searchIcon}</View>
                            <TextInput
                                style={[styles.searchInput, searchInputStyle]}
                                placeholder={searchPlaceholder}
                                placeholderTextColor="black"
                                value={searchText}
                                onChangeText={handleSearch}
                                autoCorrect={false}
                                autoCapitalize="none"
                            />
                        </View>
                    )}

                    {!hideSelectAll && !singleSelect && (
                        <TouchableOpacity
                            style={styles.selectAllButton}
                            onPress={handleSelectAll}
                        >
                            {selectedItems.length === filteredItems.length ? <FilledBox /> : <BlankBox />}
                        </TouchableOpacity>
                    )}

                    {filteredItems.length > 0 ? (
                        <ScrollView
                            keyboardShouldPersistTaps="handled"
                            showsVerticalScrollIndicator={false}
                        >
                            {filteredItems.map((item, index) => (
                                <View key={item[uniqueKey]?.toString() || index}>
                                    {renderItem({ item, index })}
                                </View>
                            ))}
                        </ScrollView>
                    ) : (
                        <View style={styles.noResults}>
                            <Text style={styles.noResultsText}>{noResultsText}</Text>
                        </View>
                    )}
                </Animated.View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        width: '100%',
        marginVertical: 8,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 12,
        paddingVertical: 15,
        borderRadius: 5,
        backgroundColor: '#fff',
        height: 50
    },
    headerText: {
        flex: 1,
        fontSize: 14,
        fontFamily: 'Poppins-Medium',
        color: '#333',
        marginRight: 8,
    },
    chipsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        paddingVertical: 8,
    },
    chip: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#CA282C',
        borderRadius: 16,
        paddingVertical: 6,
        paddingHorizontal: 12,
        marginRight: 8,
        marginBottom: 8,
        maxWidth: width * 0.7,
    },
    chipText: {
        color: '#fff',
        fontSize: 14,
        fontFamily: 'Poppins-Regular',
        marginRight: 4,
    },
    chipRemove: {
        borderRadius: 8,
        padding: 2,
    },
    dropdown: {
        borderRadius: 8,
        marginTop: 8,
        backgroundColor: '#fff',
        overflow: 'hidden',
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
        backgroundColor: 'white',
    },
    searchIcon: {
        marginRight: 8,
    },
    searchInput: {
        flex: 1,
        fontSize: 14,
        fontFamily: 'Poppins-Regular',
        color: 'black',
    },
    selectAllButton: {
        padding: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    selectAllText: {
        color: '',
        fontFamily: 'Poppins-Medium',
    },
    item: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    selectedItem: {
    },
    iconContainer: {
        marginRight: 12,
    },
    itemText: {
        flex: 1,
        fontSize: 16,
        color: '#333',
    },
    selectedItemText: {
    },
    noResults: {
        padding: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    noResultsText: {
        color: '#999',
        fontSize: 16,
    },
    sectionHeader: {
        padding: 8,
        backgroundColor: '#f5f5f5',
    },
    sectionHeaderText: {
        fontWeight: 'bold',
        color: '#666',
    },
});

export default CustomMultiSelect;
