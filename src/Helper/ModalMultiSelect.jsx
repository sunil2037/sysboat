import React, { useState, useMemo, useEffect } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    TextInput,
    FlatList,
    StyleSheet,
    Modal,
    SafeAreaView,
} from 'react-native';
import { AdvancedCheckbox } from 'react-native-advanced-checkbox';
import { bottomHeight, COLORS, STATUS_BAR_HEIGHT } from './Helper';
import ThemedText from './ThemedText';
import { ActionButton } from '../utils/ActionButton';
import EmptyMessage from './EmptyMessage';
import { Down } from './IconsLoad';
import { capitalizeFirstLetter } from './StringHelpers';

const ModalMultiSelect = ({
    items = [],
    selectedItems = [],
    onSelectedItemsChange,
    labelKey = 'name',
    uniqueKey = 'id',
    placeholder = 'Select items',
    single = false,
    isError = false,
}) => {
    const [visible, setVisible] = useState(false);
    const [search, setSearch] = useState('');
    const [selectedData, setSelectedData] = useState([]);

    useEffect(() => {
        if (visible) {
            if (single) {
                setSelectedData(
                    selectedItems ? [selectedItems] : []
                );
            } else {
                setSelectedData(selectedItems || []);
            }
        }
    }, [visible, selectedItems, single]);

    const filteredItems = useMemo(() => {
        if (!search) return items;
        return items.filter(item =>
            item[labelKey]?.toLowerCase().includes(search.toLowerCase())
        );
    }, [search, items]);

    const toggleItem = (item) => {
        const id = item[uniqueKey];

        if (single) {
            setSelectedData([id]);
            onSelectedItemsChange(id);
            setVisible(false);
            return;
        }

        let newSelected;
        if (selectedData.includes(id)) {
            newSelected = selectedData.filter(i => i !== id);
        } else {
            newSelected = [...selectedData, id];
        }

        setSelectedData(newSelected);
    };

    const handleApply = () => {
        if (single) {
            onSelectedItemsChange(selectedData[0] || null);
        } else {
            onSelectedItemsChange(selectedData);
        }
        setVisible(false);
    };

    const displayText = useMemo(() => {
        if (single) {
            if (!selectedItems) return placeholder;

            const item = items.find(i => i[uniqueKey] === selectedItems);
            return item ? item[labelKey] : placeholder;
        }

        if (!selectedItems || selectedItems.length === 0) return placeholder;

        if (selectedItems.length === 1) {
            const item = items.find(i => i[uniqueKey] === selectedItems[0]);
            return item ? item[labelKey] : placeholder;
        }

        return `${selectedItems.length} selected`;
    }, [selectedItems, items, single]);

    const inputContainerStyle = StyleSheet.create({
        inputContainer: {
            backgroundColor: '#fff',
            borderRadius: 5,
            paddingVertical: 10,
            paddingHorizontal: 15,
            borderWidth: 1,
            borderColor: '#e5e7eb',
            height: 57,
            justifyContent: 'center'
        },

        inputContent: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
        },

        inputText: {
            flex: 1,
            fontSize: 14,
            color: '#111827',
            fontWeight: '500',
        },

        placeholderText: {
            color: '#9ca3af',
            fontWeight: '400',
        },

        rightSection: {
            flexDirection: 'row',
            alignItems: 'center',
            marginLeft: 10,
        },

        arrow: {
            fontSize: 16,
            color: '#6b7280',
            marginLeft: 6,
        },

        countBadge: {
            backgroundColor: '#CA282C',
            borderRadius: 50,
            width: 22,
            height: 22,
            alignItems: 'center',
            justifyContent: 'center',
        },

        countText: {
            color: '#fff',
            fontSize: 10,
            fontWeight: '600',
        },
        error: {
            borderWidth: 1,
            borderColor: COLORS.primary,
        }
    });

    return (
        <>
            <TouchableOpacity
                style={[inputContainerStyle.inputContainer, isError && inputContainerStyle.error]}
                onPress={() => setVisible(true)}
                activeOpacity={0.85}
            >
                <View style={inputContainerStyle.inputContent}>
                    <ThemedText size='sm' weight='Medium' >
                        {capitalizeFirstLetter(displayText)}
                    </ThemedText>

                    <View style={inputContainerStyle.rightSection}>
                        {!single && selectedItems.length > 0 && (
                            <View style={inputContainerStyle.countBadge}>
                                <ThemedText size='xs' weight='Medium' color='inverse'>
                                    {selectedItems.length}
                                </ThemedText>
                            </View>
                        )}
                        <Down />
                    </View>
                </View>
            </TouchableOpacity>

            <Modal visible={visible} animationType="fade" onRequestClose={() => setVisible(false)} statusBarTranslucent>
                <SafeAreaView style={[styles.modalContainer, { paddingTop: STATUS_BAR_HEIGHT(), paddingBottom: bottomHeight() }]}>

                    <View style={styles.header}>
                        <TouchableOpacity onPress={() => setVisible(false)}>
                            <ThemedText size='sm' weight='Medium'>Close</ThemedText>
                        </TouchableOpacity>

                        <ThemedText size='md' weight='Bold'>
                            {single ? 'Select Item' : 'Select Items'}
                        </ThemedText>

                        {!single && (
                            <TouchableOpacity onPress={() => setSelectedData([])}>
                                <ThemedText size='sm' weight='Medium'>Clear</ThemedText>
                            </TouchableOpacity>
                        )}
                    </View>

                    <TextInput
                        placeholder="Search..."
                        value={search}
                        onChangeText={setSearch}
                        style={styles.search}
                    />

                    <FlatList
                        data={filteredItems}
                        keyExtractor={(item) => item[uniqueKey].toString()}
                        showsVerticalScrollIndicator={false}
                        ListEmptyComponent={<EmptyMessage />}
                        renderItem={({ item }) => {
                            const isSelected = selectedData.includes(item[uniqueKey]);

                            return (
                                <TouchableOpacity
                                    style={styles.item}
                                    onPress={() => toggleItem(item)}
                                >
                                    <ThemedText style={{ width: '80%' }} transform='capitalize' size='sm' weight='Medium'>
                                        {item[labelKey]}
                                    </ThemedText>

                                    <AdvancedCheckbox
                                        value={!!isSelected}
                                        onValueChange={() => toggleItem(item)}
                                        checkedColor={COLORS.primary}
                                        uncheckedColor={COLORS.text_secondary}
                                        size={20}
                                    />
                                </TouchableOpacity>
                            );
                        }}
                    />

                    {!single && (
                        <View style={styles.footer}>
                            <ActionButton
                                text={`Apply (${selectedData.length})`}
                                onPress={handleApply}
                                size="medium"
                            />
                        </View>
                    )}
                </SafeAreaView>
            </Modal>
        </>
    );
};

export default ModalMultiSelect;
const styles = StyleSheet.create({
    input: {
        backgroundColor: '#fff',
        padding: 15,
        borderRadius: 6,
    },
    inputText: {
        color: '#333',
    },
    modalContainer: {
        flex: 1,
        backgroundColor: '#fff',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        padding: 15,
    },
    title: {
        fontWeight: 'bold',
        fontSize: 16,
    },
    close: {
        color: 'red',
    },
    clear: {
        color: 'blue',
    },
    search: {
        margin: 15,
        padding: 15,
        backgroundColor: '#f5f5f5',
        borderRadius: 6,
    },
    item: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        padding: 15,
        borderBottomWidth: 1,
        borderColor: '#eee',
    },
    itemText: {
        fontSize: 14,
    },
    checkbox: {
        fontSize: 16,
    },
    footer: {
        padding: 15,
    },
    applyBtn: {
        backgroundColor: '#000',
        padding: 15,
        borderRadius: 6,
        alignItems: 'center',
    },
    applyText: {
        color: '#fff',
        fontWeight: 'bold',
    },
});