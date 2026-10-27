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
import { FilterIcon, Pen, ViewAllIcon } from '../../../Helper/IconsLoad';
import { useNavigation } from '@react-navigation/native';
import backgroundImage from '../../../../assets/Icon/background.png';
import TopNavBar from '../../../navigation/TopNavBar';
import BottomSheetDesignation from '../../../Helper/BottomSheetDesignation';
import useEncodedUserData from '../../../hooks/useEncodedUserData';
import useApi from '../../../Apis/Services/ApiConfig';
import { useMutation, useQuery } from '@tanstack/react-query';
import { toast } from '../../../Helper/ToastManager';
import EmptyMessage from '../../../Helper/EmptyMessage';
import { bottomHeight, getFontSize, STATUS_BAR_HEIGHT } from '../../../Helper/Helper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../../Context/AuthContext';
import Skeleton, { getLayout } from '../../../Helper/Skeleton';

const SCREEN_WIDTH = Dimensions.get('window').width;

const DATA = [
  { title: 'Department', value: 20 },
  { title: 'Sub Department', value: 20 },
  { title: 'Designation', value: 20 },
];

const SummarySection = ({ loading, refreshing, onRefresh, renderItem, sections, renderSectionHeader }) => (
  <View style={styles.summaryContainer}>
    <Skeleton isLoading={loading} layout={getLayout({ length: 15, height: 45 })}>
      <SectionList
        sections={sections}
        keyExtractor={item => item.id.toString()}
        renderSectionHeader={renderSectionHeader}
        renderItem={renderItem}
        contentContainerStyle={{ paddingBottom: 10 }}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={<EmptyMessage />}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['black']}
          />
        }
      />
    </Skeleton>
  </View>
);

const Department = () => {
  const navigation = useNavigation();
  const { permissions } = useAuth();
  const [visible, setVisible] = useState(false);
  const [actionType, setactionType] = useState('');
  const { userdata } = useEncodedUserData();
  const { DepartmentsDetails, AddDepartment, AddSubDepartment, EditDepartment } =
    useApi();
  const [editCurrentData, setEditCurrentData] = useState([]);
  const [editDepartmentOrSubDepartment, seteditDepartmentOrSubDepartment] =
    useState('');
  const [refreshing, setRefreshing] = useState(false);

  const {
    data: DepartmentsDetailsData,
    isLoading: DepartmentsDetailsDataIsLoading,
    isError: DepartmentsDetailsDataIsError,
    isPending: DepartmentsDetailsDataIsPending,
    refetch: DepartmentsDetailsDataRefetch,
  } = useQuery({
    queryKey: ['DepartmentsDetails', userdata],
    queryFn: () =>
      DepartmentsDetails({
        userData: userdata,
        type: 'Department',
        UserId: '',
        platformType: Platform.OS,
      }),
    enabled: !!userdata,
  });

  const parentDepartments = useMemo(() =>
    (DepartmentsDetailsData?.data || []).map(dept => ({
      id: dept.id,
      name: dept.name,
    })), [DepartmentsDetailsData]);
  const sections = useMemo(
    () =>
      (DepartmentsDetailsData?.data || []).map(dept => ({
        title: dept.name,
        id: dept,
        data: dept.subDepartments || [],
      })),
    [DepartmentsDetailsData],
  );

  const {
    mutate: AddDepartmentAction,
    isLoading: AddDepartmentLoading,
    isError: AddDepartmentError,
    isPending,
  } = useMutation({
    mutationFn: ({ name, type }) =>
      AddDepartment({
        userData: userdata,
        activeSection: 'Department',
        name: name,
        type: type,
        platformType: Platform.OS,
      }),
    onSuccess: response => {
      toast.success(response.message);
      DepartmentsDetailsDataRefetch();
    },
    onError: error => {
      toast.error(error);
      console.warn('Query failed with error:', error);
    },
  });
  const {
    mutate: AddSubDepartmentAction,
    isLoading: AddSubDepartmentLoading,
    isError: AddSubDepartmentError,
    isPending: AddSubDepartmentPending,
  } = useMutation({
    mutationFn: ({ name, parent_id, type }) =>
      AddSubDepartment({
        userData: userdata,
        activeSection: 'AddSubDepartment',
        name: name,
        parent_id: parent_id,
        type: type,
        platformType: Platform.OS,
      }),
    onSuccess: response => {
      DepartmentsDetailsDataRefetch();
      toast.success(response.message);
    },
    onError: error => {
      toast.error(error);
      console.warn('Query failed with error:', error);
    },
  });
  const {
    mutate: EditDepartmentAction,
    isLoading: EditDepartmentLoading,
    isError: EditDepartmentError,
    isPending: EditDepartmentPending,
  } = useMutation({
    mutationFn: ({ name, id, parent_id, type }) => {
      return EditDepartment({
        userData: userdata,
        Id: id,
        parent_id: parent_id,
        activeSection: 'EditDepartmentValue',
        name: name,
        type: type,
        platformType: Platform.OS,
      });
    },
    onSuccess: response => {
      DepartmentsDetailsDataRefetch();
      toast.success(response.message);
    },
    onError: error => {
      toast.error(error);
    },
  });

  const actionData = values => {
    if (actionType === 'AddDepartment') {
      AddDepartmentAction({
        name: values.department,
        type: '1',
      });
    } else if (actionType === 'AddSubDepartment') {
      AddSubDepartmentAction({
        name: values.sub_department,
        parent_id: values.department,
        type: '2',
      });
    } else if (actionType === 'DepartmentEdit') {
      EditDepartmentAction({
        name: values.department,
        parent_id: 0,
        id: values.sub_department_id,
        type: '1',
      });
    } else if (actionType === 'SubDepartmentEdit') {
      EditDepartmentAction({
        name: values.sub_department,
        id: values.sub_department_id,
        parent_id: values.department,
        type: '2',
        activeSection: 'EditDepartmentValue',
      });
    }
    setVisible(false);
  };
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await DepartmentsDetailsDataRefetch();
    setRefreshing(false);
  }, [DepartmentsDetailsDataRefetch]);

  const renderSectionHeader = ({ section: { title, id } }) => (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionHeaderText}>
        {title?.replace(/\b\w/g, c => c.toUpperCase())}
      </Text>
      {!permissions?.block_department_edit && (
        <TouchableOpacity
          onPress={() => {
            setVisible(true);
            setactionType('DepartmentEdit');
            setEditCurrentData(id);
            seteditDepartmentOrSubDepartment('2');
          }}>
          <Pen color={'white'} width={25} height={25} />
        </TouchableOpacity>
      )}
    </View>
  );

  const renderItem = ({ item }) => (
    <View style={styles.item}>
      <Text style={styles.itemText}>{item.name}</Text>
      {!permissions?.block_subdepartment_eidt && (
        <TouchableOpacity
          onPress={() => {
            setVisible(true);
            setactionType('SubDepartmentEdit');
            setEditCurrentData(item);
            seteditDepartmentOrSubDepartment('1');
          }}>
          <Pen color={'#293646'} width={25} height={25} />
        </TouchableOpacity>
      )}
    </View>
  );



  return (
    <SafeAreaView style={{ flex: 1 }}>
      <ImageBackground
        source={backgroundImage}
        resizeMode="cover"
        style={{ flex: 1, paddingTop: STATUS_BAR_HEIGHT(), ...StyleSheet.absoluteFillObject }}>
        <TopNavBar navigation={navigation} title={'Department'} />
        <View style={{ flex: 1, paddingBottom: bottomHeight() }}>
          <SummarySection
            onRefresh={onRefresh}
            refreshing={refreshing}
            loading={
              DepartmentsDetailsDataIsLoading || DepartmentsDetailsDataIsPending
            }
            renderItem={renderItem} sections={sections} renderSectionHeader={renderSectionHeader}
          />
        </View>
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            gap: 10,
            paddingHorizontal: 20,
            paddingBottom: bottomHeight(),
          }}>
          <TouchableOpacity
            disabled={
              DepartmentsDetailsDataIsPending || DepartmentsDetailsDataIsLoading
            }
            onPress={() => {
              setVisible(true);
              setactionType('AddDepartment');
              setEditCurrentData('');
            }}
            style={{
              backgroundColor: '#CA282C',
              height: 50,
              flex: 1,
              borderRadius: 50,
              alignItems: 'center',
              justifyContent: 'center',
            }}>
            <Text
              style={{
                fontFamily: 'Poppins-Medium',
                fontSize: 12,
                color: 'white',
              }}>
              Add Department
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            disabled={
              DepartmentsDetailsDataIsPending || DepartmentsDetailsDataIsLoading
            }
            onPress={() => {
              setVisible(true);
              setactionType('AddSubDepartment');
              setEditCurrentData('');
            }}
            style={{
              backgroundColor: '#CA282C',
              height: 50,
              flex: 1,
              borderRadius: 50,
              alignItems: 'center',
              justifyContent: 'center',
            }}>
            <Text
              style={{
                fontFamily: 'Poppins-Medium',
                fontSize: 12,
                color: 'white',
              }}>
              Add Sub Department
            </Text>
          </TouchableOpacity>
        </View>

        <BottomModal editCurrentData={editCurrentData} loading={DepartmentsDetailsDataIsLoading ||
          DepartmentsDetailsDataIsPending ||
          AddDepartmentLoading ||
          isPending ||
          AddSubDepartmentLoading ||
          AddSubDepartmentPending} actionData={actionData} parentDepartments={parentDepartments} actionType={actionType} visible={visible} setVisible={setVisible} />
      </ImageBackground>
    </SafeAreaView>
  );
};

const BottomModal = ({ editCurrentData, loading, actionData, parentDepartments, actionType, visible, setVisible }) => {
  return (
    <BottomSheetDesignation
      editableData={editCurrentData}
      loading={
        loading
      }
      actionData={actionData}
      parentDepartments={parentDepartments}
      actionType={actionType}
      visible={visible}
      onClose={() => {
        setVisible(false);
      }}
    />
  )
}

export default Department;

const styles = StyleSheet.create({
  heading: {
    textAlign: 'center',
    fontFamily: 'Poppins-Medium',
    fontSize: 14,
    lineHeight: 20,
    color: '#293646',
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
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 6,
    flexDirection: 'row',
    justifyContent: 'space-between',
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
