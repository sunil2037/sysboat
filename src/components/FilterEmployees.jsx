import React, { useEffect, useState } from 'react';
import { SectionList, Text, TouchableOpacity, View, StyleSheet } from 'react-native';
import Modal from 'react-native-modal';
import { Cross } from '../Helper/IconsLoad';
import { bottomHeight, getFontSize, STATUS_BAR_HEIGHT } from '../Helper/Helper';
// Dummy data
const dummyDesignations = [
    { id: 1, title: 'Web Developer' },
    { id: 2, title: 'HR Manager' },
    { id: 3, title: 'UI/UX Designer' },
    { id: 4, title: 'Team Lead' },
];

const dummyDepartments = [
    { id: 11, title: 'Engineering' },
    { id: 12, title: 'Human Resources' },
    { id: 13, title: 'Product' },
    { id: 14, title: 'Support' },
];

const ALLOW_MULTIPLE_SELECTION = true;

const FilterEmployees = ({ modalVisible, onModalClose, filterData }) => {
    const [selectedDesignations, setSelectedDesignations] = useState([]);
    const [selectedDepartments, setSelectedDepartments] = useState([]);

    const handleSelect = (item, sectionTitle) => {
        const isDesignation = sectionTitle === 'Designation';

        const selectedList = isDesignation ? selectedDesignations : selectedDepartments;
        const setSelected = isDesignation ? setSelectedDesignations : setSelectedDepartments;

        const isAlreadySelected = selectedList.includes(item.id);

        if (ALLOW_MULTIPLE_SELECTION) {
            if (isAlreadySelected) {
                setSelected(selectedList.filter(id => id !== item.id));
            } else {
                setSelected([...selectedList, item.id]);
            }
        } else {
            setSelected(isAlreadySelected ? [] : [item.id]);
        }
    };

    const handleApplyFilters = () => {
        const selected = {
            designations: selectedDesignations,
            departments: selectedDepartments,
        };
        filterData(selected);
        onModalClose();
    };

    const handleClearFilters = () => {
        setSelectedDesignations([]);
        setSelectedDepartments([]);
    };

    const sections = [
        { title: 'Designation', data: dummyDesignations },
        { title: 'Department', data: dummyDepartments },
    ];

    return (
        <Modal
            isVisible={modalVisible}
            style={{ margin: 0, backgroundColor: 'white' }}
            onBackdropPress={onModalClose}
            statusBarTranslucent
        >
            <View style={{ flex: 1, paddingBottom: bottomHeight() }}>
                <View style={[styles.headerContainer, { paddingTop: STATUS_BAR_HEIGHT() }]}>
                    <TouchableOpacity onPress={onModalClose}>
                        <Cross width={25} height={25} />
                    </TouchableOpacity>
                    <Text style={styles.title}>Filters</Text>
                    <TouchableOpacity onPress={handleClearFilters}>
                        <Text style={styles.reset}>Reset</Text>
                    </TouchableOpacity>
                </View>

                <SectionList
                    sections={sections}
                    keyExtractor={(item) => item.id.toString()}
                    contentContainerStyle={{ paddingHorizontal: 15, paddingBottom: 20 }}
                    renderSectionHeader={({ section: { title } }) => (
                        <Text style={styles.sectionHeader}>{title}</Text>
                    )}
                    renderItem={({ item, section }) => {
                        const isSelected = section.title === 'Designation'
                            ? selectedDesignations.includes(item.id)
                            : selectedDepartments.includes(item.id);

                        return (
                            <TouchableOpacity
                                onPress={() => handleSelect(item, section.title)}
                                style={[
                                    styles.item,
                                    isSelected && styles.selectedItem,
                                ]}
                            >
                                <Text style={styles.designationText}>{item.title}</Text>
                            </TouchableOpacity>
                        );
                    }}
                />

                <TouchableOpacity
                    onPress={handleApplyFilters}
                    style={styles.applyBtn}
                >
                    <Text style={styles.applyText}>
                        Apply Filter {selectedDesignations.length + selectedDepartments.length > 0 && `(${selectedDesignations.length + selectedDepartments.length})`}
                    </Text>
                </TouchableOpacity>
            </View>
        </Modal>
    );
};

export default FilterEmployees;

const styles = StyleSheet.create({
    headerContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 15,
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
    designationText: {
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
        margin: 15,
    },
    applyText: {
        fontFamily: 'Poppins-Medium',
        color: 'white',
        fontSize: 15,
    },
});
