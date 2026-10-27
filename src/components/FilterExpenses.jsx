import React, { useEffect, useState } from 'react';
import {
    SectionList,
    Text,
    TouchableOpacity,
    View,
    StyleSheet,
    Modal,
    Platform,
    ScrollView,
} from 'react-native';

import { Cross } from '../Helper/IconsLoad';
import { bottomHeight, STATUS_BAR_HEIGHT } from '../Helper/Helper';
import DateRangePick from '../Helper/DateRangePick';
import CustomCalendar from '../utils/CustomCalendar';
import ModalMultiSelect from '../Helper/ModalMultiSelect';
import { ActionButton } from '../utils/ActionButton';
import ThemedText from '../Helper/ThemedText';
const FILTER_STATUS = [
    { id: 'all', title: 'All' },
    { id: 'paid', title: 'Paid' },
    { id: 'unpaid', title: 'Unpaid' },
    { id: 'pending', title: 'Pending' },
    { id: 'rejected', title: 'Rejected' },
];


const FILTER_TYPES = [
    { id: 'all', title: 'All' },
    { id: 'advance_payment', title: 'Advance Payment' },
    { id: 'expense', title: 'Expense' },
    { id: 'deduction', title: 'Deduction' },
];

const ALLOW_MULTIPLE_SELECTION = true;

const FilterExpenses = ({ modalVisible, selectedEmployee, isAdmin, selectableItems, onModalClose, filterData }) => {
    const [selectedEmployees, setSelectedEmployees] = useState([]);
    const [selectedStatus, setSelectedStatus] = useState('all');
    const [selectedTypes, setSelectedTypes] = useState('all');
    const [dateRange, setDateRange] = useState([]);

    useEffect(() => {
        setSelectedEmployees(selectedEmployee);
    }, [selectedEmployee])


    const handleSelect = (item, type) => {
        const stateMap = {
            status: [selectedStatus, setSelectedStatus],
            type: [selectedTypes, setSelectedTypes],
        };

        const [selectedList, setSelected] = stateMap[type];

        const isSelected = selectedList.includes(item.id);

        if (ALLOW_MULTIPLE_SELECTION) {
            if (isSelected) {
                setSelected(selectedList.filter(id => id !== item.id));
            } else {
                setSelected(item.id);
            }
        } else {
            setSelected(isSelected ? [] : [item.id]);
        }
    };

    const handleApplyFilters = () => {
        filterData({
            status: selectedStatus,
            types: selectedTypes,
            employee_id: selectedEmployees.join(", "),
            dateRange,
        });
        onModalClose();
    };

    const handleClearFilters = () => {
        setSelectedStatus([]);
        setSelectedTypes([]);
        setDateRange([]);
    };

    const sections = [
        { title: 'Status', key: 'status', data: FILTER_STATUS },
        { title: 'Type', key: 'type', data: FILTER_TYPES },
    ];

    return (
        <Modal
            visible={modalVisible}
            animationType="fade"
            onRequestClose={onModalClose}
            statusBarTranslucent
        >
            <ScrollView style={{ flex: 1 }}>
                <View style={{ flex: 1, paddingBottom: bottomHeight(), paddingHorizontal: 15 }}>

                    <View style={[styles.headerContainer, { paddingTop: STATUS_BAR_HEIGHT() }]}>
                        <TouchableOpacity onPress={onModalClose}>
                            <Cross width={25} height={25} />
                        </TouchableOpacity>
                        <ThemedText size='md' weight='SemiBold'>
                            Filters
                        </ThemedText>

                        <TouchableOpacity onPress={handleClearFilters}>
                            <ThemedText size='sm' weight='Medium'>
                                Reset
                            </ThemedText>
                        </TouchableOpacity>
                    </View>
                    {Platform.OS === 'android' ? (
                        <DateRangePick
                            maxDate
                            rangeDate={setDateRange}
                            selectedRange={dateRange}
                        />
                    ) : (
                        <CustomCalendar
                            maxDate
                            rangeDate={setDateRange}
                            selectedRange={dateRange}
                        />
                    )}
                    {(isAdmin && selectedEmployees) && (
                        <View style={{ marginTop: 12 }}>
                            <ThemedText size='xs' weight='Medium' style={{ marginBottom: 10 }}>
                                Select Employee
                            </ThemedText>
                            <ModalMultiSelect
                                items={selectableItems}
                                selectedItems={selectedEmployees}
                                onSelectedItemsChange={setSelectedEmployees}
                            />
                        </View>
                    )}


                    <SectionList
                        sections={sections}
                        scrollEnabled={false}
                        keyExtractor={(item) => item.id.toString()}
                        contentContainerStyle={{ marginTop: 12, paddingBottom: 12 }}
                        renderSectionHeader={({ section }) => (
                            <ThemedText size='xs' weight='Medium' style={{ marginBottom: 10 }}>
                                {section.title}
                            </ThemedText>
                        )}
                        renderItem={({ item, section }) => {
                            const selectedList =
                                section.key === 'status' ? selectedStatus : selectedTypes;
                            const isSelected = selectedList.includes(item.id);

                            return (
                                <>
                                    <TouchableOpacity
                                        onPress={() => handleSelect(item, section.key)}
                                        style={[styles.item, isSelected && styles.selectedItem]}
                                    >
                                        <ThemedText size='sm' weight='Medium'>
                                            {item.title}
                                        </ThemedText>
                                    </TouchableOpacity>
                                </>

                            );
                        }}
                    />
                    <ActionButton size="medium" onPress={handleApplyFilters} text={`Apply Filter ${(selectedStatus.length + selectedTypes.length) > 0 &&
                        `(${selectedStatus.length + selectedTypes.length})`}`} />

                </View>
            </ScrollView>
        </Modal>
    );
};

export default FilterExpenses;

const styles = StyleSheet.create({
    headerContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingBottom: 15,
    },
    title: {
        fontFamily: 'Poppins-Medium',
        fontSize: 20,
        color: '#293646',
    },
    reset: {
        fontFamily: 'Poppins-Medium',
        fontSize: 15,
        color: '#293646',
    },
    sectionHeader: {
        fontSize: 16,
        fontFamily: 'Poppins-Medium',
        marginTop: 20,
        marginBottom: 5,
        color: '#293646',
    },
    item: {
        padding: 15,
        borderRadius: 8,
        borderColor: '#E2E2E2',
        borderWidth: 1,
        marginBottom: 10,
        backgroundColor: '#fff',
    },
    selectedItem: {
        backgroundColor: '#FFF2F2',
        borderColor: '#CA282C',
    },
    text: {
        fontFamily: 'Poppins-Regular',
        fontSize: 14,
        color: '#293646',
    },
    applyBtn: {
        height: 52,
        backgroundColor: '#CA282C',
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
    },
    applyText: {
        fontFamily: 'Poppins-Medium',
        color: 'white',
        fontSize: 15,
    },
});