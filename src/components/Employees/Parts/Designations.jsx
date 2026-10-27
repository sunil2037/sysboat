import {
  Dimensions,
  FlatList,
  ImageBackground,
  SectionList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Platform,
  RefreshControl,
} from 'react-native';
import React, { useCallback, useMemo, useState } from 'react';
import {
  CalendarEdit,
  FilterIcon,
  Pen,
  ViewAllIcon,
} from '../../../Helper/IconsLoad';
import { useNavigation } from '@react-navigation/native';
import backgroundImage from '../../../../assets/Icon/background.png';
import TopNavBar from '../../../navigation/TopNavBar';
import BottomSheetDesignation from '../../../Helper/BottomSheetDesignation';
import useEncodedUserData from '../../../hooks/useEncodedUserData';
import useApi from '../../../Apis/Services/ApiConfig';
import { useMutation, useQuery } from '@tanstack/react-query';
import { toast } from '../../../Helper/ToastManager';
import EmptyMessage from '../../../Helper/EmptyMessage';
import { getFontSize, STATUS_BAR_HEIGHT } from '../../../Helper/Helper';
import { SafeAreaView } from 'react-native-safe-area-context';
import Skeleton, { getLayout } from '../../../Helper/Skeleton';

const SCREEN_WIDTH = Dimensions.get('window').width;

const DATA = [
  { title: 'Department', value: 20 },
  { title: 'Sub Department', value: 20 },
  { title: 'Designation', value: 20 },
];

const Designations = () => {
  const [loading, setLoading] = useState(false);
  const navigation = useNavigation();
  const [visible, setVisible] = useState(false);
  const [actionType, setactionType] = useState('');
  const { userdata } = useEncodedUserData();
  const { DesignationDetails } = useApi();
  const [editCurrentData, setEditCurrentData] = useState([]);
  const [editDepartmentOrSubDepartment, seteditDepartmentOrSubDepartment] =
    useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [expandedSections, setExpandedSections] = useState({});

  const {
    data: DesignationDetailsData,
    isLoading: DesignationDetailsIsLoading,
    isError: DesignationDetailsIsError,
    isPending: DesignationDetailsisPending,
    refetch: DesignationDetailsRefetch,
  } = useQuery({
    queryKey: ['DesignationDetails', userdata],
    queryFn: () =>
      DesignationDetails({
        userData: userdata,
        type: 'Designation',
        UserId: '',
        platformType: Platform.OS,
      }),
    enabled: !!userdata,
  });

  const designationList = DesignationDetailsData?.data || [];

  const sections = useMemo(
    () =>
      (designationList || []).map((item, idx) => {
        const allNames = item.employee_names
          ? item.employee_names.split(',').map(n => n.trim())
          : [];
        const allIds = item.id ? item.id.split(',').map(id => id.trim()) : [];
        const allEmployees = allNames.map((name, i) => ({
          id: allIds[i] || '',
          name,
        }));
        const isExpanded = expandedSections[idx];
        return {
          title: item.designation
            ? item.designation.replace(/\b\w/g, c => c.toUpperCase())
            : 'No Designation',
          count: item.employee_count,
          data: isExpanded ? allEmployees : allEmployees.slice(0, 10),
          allEmployees,
          index: idx,
          isExpanded,
        };
      }),
    [designationList, expandedSections],
  );

  // const sections = useMemo(() => (
  //     (DepartmentsDetailsData?.data || []).map(dept => ({
  //         title: dept.name,
  //         id: dept,
  //         data: dept.subDepartments || [],
  //     }))
  // ), [DepartmentsDetailsData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await DesignationDetailsRefetch();
    setRefreshing(false);
  }, [DesignationDetailsRefetch]);

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <ImageBackground
        source={backgroundImage}
        resizeMode="cover"
        style={{ flex: 1, paddingTop: STATUS_BAR_HEIGHT(), ...StyleSheet.absoluteFillObject }}>
        <TopNavBar navigation={navigation} title={'Designations'} />
        <View style={{ flex: 1, paddingHorizontal: 15 }}>
          <Skeleton isLoading={DesignationDetailsisPending || DesignationDetailsIsLoading} layout={getLayout({ length: 15, height: 45 })}>
            <SectionList
              showsVerticalScrollIndicator={false}
              sections={sections}
              keyExtractor={(item, idx) => idx.toString()}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={onRefresh}
                  colors={['black']}
                />
              }
              renderSectionHeader={({ section }) => (
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionHeaderText}>{section.title}</Text>
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 5,
                    }}>
                    <TouchableOpacity
                      onPress={() => {
                        setEditCurrentData(section.allEmployees);
                        setVisible(true);
                      }}>
                      <CalendarEdit color={'white'} />
                    </TouchableOpacity>
                    <Text style={styles.countText}>
                      {section.count} Employee{section.count > 1 ? 's' : ''}
                    </Text>
                  </View>
                </View>
              )}
              renderItem={({ item }) => {
                return (
                  <View style={styles.item}>
                    <Text style={styles.employeeName}>
                      {item.id ? `${item.id}. ${item.name}` : item.name}
                    </Text>
                  </View>
                );
              }}
              contentContainerStyle={{ paddingBottom: 20 }}
              ListEmptyComponent={<EmptyMessage />}
            />
          </Skeleton>
        </View>
        <BottomSheetDesignation
          multipleSelect={true}
          isDesignation={true}
          editableData={editCurrentData}
          visible={visible}
          onClose={() => {
            setVisible(false);
          }}
        />
      </ImageBackground>
    </SafeAreaView>
  );
};

export default Designations;

const styles = StyleSheet.create({
  heading: {
    textAlign: 'center',
    fontFamily: 'Poppins-Medium',
    fontSize: 14,
    lineHeight: 20,
    color: '#293646',
  },
  countText: {
    fontFamily: 'Poppins-Regular',
    fontSize: 12,
    color: 'white',
  },
  employeeName: {
    fontFamily: 'Poppins-Regular',
    fontSize: 14,
    color: '#293646',
    textTransform: 'capitalize',
  },
  sectionHeader: {
    backgroundColor: '#CA282C',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 6,
    marginTop: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionHeaderText: {
    fontFamily: 'Poppins-Medium',
    fontSize: 16,
    color: 'white',
  },
  item: {
    backgroundColor: 'white',
    paddingVertical: 20,
    paddingHorizontal: 10,
    borderRadius: 6,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 5,
  },
  itemText: {
    fontFamily: 'Poppins-Regular',
    fontSize: 14,
    color: '#293646',
    textTransform: 'capitalize',
  },
  subheading: {
    textAlign: 'center',
    fontFamily: 'Poppins-Regular',
    fontSize: 12,
    lineHeight: 20,
    color: '#293646',
    textTransform: 'capitalize',
  },
  card: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 10,
    paddingVertical: 15,
    gap: 5,
    marginHorizontal: 5,
    alignItems: 'center',
    borderRadius: 10,
    borderColor: '#E2E2E2',
    borderWidth: 1,
  },
  summaryContainer: {
    paddingHorizontal: 20,
    backgroundColor: 'rgba(255, 255, 255, 0)',
  },
  row: {
    justifyContent: 'space-between',
    padding: 0,
    margin: 0,
  },
});
