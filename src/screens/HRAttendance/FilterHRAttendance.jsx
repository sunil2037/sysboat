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
import { bottomHeight, formatDate, STATUS_BAR_HEIGHT } from '../../Helper/Helper';
import DateRangePick from '../../Helper/DateRangePick';
import ModalMultiSelect from '../../Helper/ModalMultiSelect';
import { ActionButton } from '../../utils/ActionButton';
import ThemedText from '../../Helper/ThemedText';
import { Cross } from '../../Helper/IconsLoad';
import CustomCalendar from '../../utils/CustomCalendar';

const FILTER_STATUS = [
    { id: 'all', title: 'All' },
    { id: 'absent', title: 'Absent' },
    { id: 'present', title: 'Present' },
    { id: 'active', title: 'Active' },
    { id: 'inactive', title: 'In Active' },
];


const FILTER_TYPES = [
    { id: 'all', title: 'All' },
    { id: 'advance_payment', title: 'Advance Payment' },
    { id: 'expense', title: 'Expense' },
    { id: 'deduction', title: 'Deduction' },
];

const ALLOW_MULTIPLE_SELECTION = true;

const FilterHRAttendance = ({ modalVisible, selectedEmployee, isAdmin, selectableItems, onModalClose, filterData }) => {
    const [selectedEmployees, setSelectedEmployees] = useState([]);
    const [selectedStatus, setSelectedStatus] = useState('all');
    const [selectedTypes, setSelectedTypes] = useState('all');
    const [dateRange, setDateRange] = useState({ startDate: formatDate(new Date()), endDate: formatDate(new Date()) });

    useEffect(() => {
        setSelectedEmployees(selectedEmployee);
    }, [selectedEmployee])


    const handleSelect = (item, type) => {
        if (type === 'status') {
            setSelectedStatus(item.id);
        } else {
            setSelectedTypes(item.id);
        }
    };

    const handleApplyFilters = () => {
        filterData({
            status: selectedStatus,
            types: selectedTypes,
            employee_id: selectedEmployees,
            dateRange,
        });
        onModalClose();
    };

    const handleClearFilters = () => {
        setSelectedEmployees([]);
        setSelectedStatus([]);
        setSelectedTypes([]);
        setDateRange([]);
    };

    const sections = [
        { title: 'Attendance Status', key: 'status', data: FILTER_STATUS },
        // { title: 'Type', key: 'type', data: FILTER_TYPES },
    ];

    return (
        <Modal
            visible={modalVisible}
            animationType="fade"
            onRequestClose={onModalClose}
            statusBarTranslucent
        >
            <ScrollView contentContainerStyle={{ flex: 1 }}>
                <View style={{ flex: 1, paddingBottom: bottomHeight(), paddingHorizontal: 15, justifyContent: 'space-between', }}>
                    <View>
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
                                single={(Object.keys(selectedEmployees)?.length || selectedEmployees.toString().length) > 0 ? false : true}
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
                                    items={selectableItems?.data?.data}
                                    selectedItems={selectedEmployees}
                                    single
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
                                const currentSelection = section.key === 'status' ? selectedStatus : selectedTypes;
                                const isSelected = currentSelection === item.id;

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


                    </View>
                    <ActionButton size="medium" onPress={handleApplyFilters} text={`Apply Filter `} />
                </View>
            </ScrollView>
        </Modal>
    );
};

export default FilterHRAttendance;

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