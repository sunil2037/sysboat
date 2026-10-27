import React, { useState, useCallback, useMemo } from 'react';
import {
  View, ImageBackground, FlatList, StyleSheet,
  TouchableOpacity, RefreshControl, TextInput,
} from 'react-native';
import backgroundImage from '../../../../assets/Icon/background.png';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../../Context/AuthContext';
import BottomSheetWorkWeek from '../../../Helper/BottomSheetWorkWeek';
import useApi from '../../../Apis/Services/ApiConfig';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Back, CalendarEdit, Pen } from '../../../Helper/IconsLoad';
import BottomSheetCrud from '../../../Helper/BottomSheetCrud';
import * as Yup from 'yup';
import BottomSheetEditWorkWeek from '../../../Helper/BottomSheetEditWorkWeek';
import useEncodedUserData from '../../../hooks/useEncodedUserData';
import { toast } from '../../../Helper/ToastManager';
import { bottomHeight, COLORS, STATUS_BAR_HEIGHT } from '../../../Helper/Helper';
import Skeleton, { getLayout } from '../../../Helper/Skeleton';
import ThemedText from '../../../Helper/ThemedText';

const ADMIN_ROLES = ['admin', 'ceo', 'company_admin', 'hr'];

const WorkWeekView = ({ navigation }) => {
  const { userType, permissions } = useAuth();
  const { userdata } = useEncodedUserData();
  const { WorkWeekFetch, WorkWeekAssignView, CreateRule, UpdateRule, AssignRuleEmployee } = useApi();

  const [visible, setVisible] = useState(!ADMIN_ROLES.includes(userType));
  const [visible2, setVisible2] = useState(false);
  const [visible3, setVisible3] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [selectedRuleId, setSelectedRuleId] = useState('');
  const [selectedEditRule, setSelectedEditRule] = useState([]);
  const [mode, setMode] = useState(false);
  const [refreshing, setRefreshing] = useState(false);


  const {
    data: workWeekData,
    refetch: refetchWorkWeek,
    isLoading: isWorkWeekLoading,
    isPending: isWorkWeekPending,
  } = useQuery({
    queryKey: ['WorkWeekFetch', userdata],
    queryFn: () => WorkWeekFetch({ userData: userdata }),
    enabled: !!userdata,
  });

  const {
    data: assignViewData,
    refetch: refetchAssignView,
    isPending: isAssignViewPending,
  } = useQuery({
    queryKey: ['WorkWeekAssignView', userdata],
    queryFn: () => WorkWeekAssignView({ userData: userdata, page: 1, limit: 5, Search: '' }),
    enabled: !!userdata,
  });

  const assignList = useMemo(() => assignViewData?.data || [], [assignViewData]);
  const ruleList = useMemo(() => workWeekData?.data || [], [workWeekData]);
  const isLoading = isWorkWeekPending || isAssignViewPending || isWorkWeekLoading;


  const { mutate: createRule, isPending: isCreatePending } = useMutation({
    mutationFn: ({ ruleName }) => CreateRule({ userData: userdata, name: ruleName }),
    onSuccess: async (res) => {
      toast.success(res.message);
      setVisible2(false);
      await refetchWorkWeek();
    },
    onError: (err) => toast.error(err.message),
  });

  const { mutate: updateRule, isPending: isUpdatePending } = useMutation({
    mutationFn: (data) => UpdateRule(data),
    onSuccess: async (res) => {
      toast.success(res.message);
      setVisible3(false);
      await refetchWorkWeek();
    },
    onError: (err) => toast.error(err.message),
  });

  const { mutate: assignRule, isPending: isAssignPending } = useMutation({
    mutationFn: ({ ruleId, employeeId }) =>
      AssignRuleEmployee({ rule_id: ruleId, id: employeeId, userData: userdata }),
    onSuccess: async (res) => {
      toast.success(res.message);
      setVisible2(false);
      await Promise.all([refetchAssignView(), refetchWorkWeek()]);
    },
    onError: (err) => toast.error(err.message),
  });


  const handleCreateRule = ({ name }) => {
    name ? createRule({ ruleName: name }) : toast.error('Rule name is empty');
  };

  const handleAssignRule = ({ workWeekTypesId, employee }) => {
    assignRule({ ruleId: workWeekTypesId, employeeId: employee });
  };

  const handleUpdateRule = (data) => {
    updateRule({ ...data, userData: userdata, id: selectedRuleId });
  };

  const handleEditRule = (item) => {
    if (mode) {
      setSelectedEditRule(item);
      setVisible2(true);
    } else if (item.id) {
      setSelectedRuleId(item.id);
      setVisible3(true);
    } else {
      toast.error('Something went wrong');
    }
  };

  const handleOpenDetails = (id) => {
    setSelectedId(id);
    setVisible(true);
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await (mode ? refetchAssignView() : refetchWorkWeek());
    setRefreshing(false);
  }, [mode]);


  const validationSchema = Yup.object().shape({
    ...(!mode && { name: Yup.string().required('Rule Name is required') }),
    ...(mode && {
      workWeekTypes: Yup.string().required('Type is required'),
      employeeRule: Yup.string().required('Type is required'),
    }),
  });


  const RuleItem = ({ item, index }) => (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.75}
      onPress={() => handleOpenDetails(item.rule_id)}
    >
      <View style={styles.cardIndex}>
        <ThemedText size="sm" weight="Medium">{index + 1}</ThemedText>
      </View>

      <View style={styles.cardLabel}>
        <ThemedText size="sm" weight="Medium">
          {mode ? item.first_name : item.rule_name}
        </ThemedText>
      </View>

      {!permissions?.block_work_week_edit && (
        <TouchableOpacity onPress={() => handleEditRule(item)} style={styles.editBtn} hitSlop={8}>
          <CalendarEdit color="#6A7D94" />
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );


  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.root}>
        <ImageBackground
          source={backgroundImage}
          resizeMode="cover"
          style={[StyleSheet.absoluteFillObject, { backgroundColor: '#F9F9F9' }]}
        >
          {!mode && !permissions?.block_work_week_edit && (
            <TouchableOpacity
              onPress={() => setVisible2(true)}
              style={[styles.fab, { bottom: bottomHeight(), }]}
              activeOpacity={0.85}
            >
              <Pen width={22} height={22} color="white" />
            </TouchableOpacity>
          )}

          <View style={{ paddingTop: STATUS_BAR_HEIGHT(), flex: 1 }}>

            <View style={styles.header}>
              <View style={styles.headerLeft}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                  <Back width={20} height={20} color="#fcfcfc" />
                </TouchableOpacity>
                <ThemedText size="xl" weight="Medium">Work Week</ThemedText>
              </View>
              <TouchableOpacity onPress={() => setMode(m => !m)} style={styles.modeToggle}>
                <ThemedText size="xs" weight="Medium" color="accent">
                  {mode ? 'View Rules' : 'View Employees'}
                </ThemedText>
              </TouchableOpacity>
            </View>

            <View style={styles.sectionHeader}>
              <ThemedText size="md" weight="Medium">
                {mode ? 'Employees' : 'Rules'}
              </ThemedText>
              <ThemedText size="xs" weight="Regular" color="secondary">
                {mode ? assignList.length : ruleList.length} total
              </ThemedText>
            </View>

            <View style={{ flex: 1, paddingHorizontal: 20 }}>
              <Skeleton
                isLoading={isLoading}
                layout={getLayout({ length: 5, height: 100 })}
              >
                <FlatList
                  data={mode ? assignList : ruleList}
                  keyExtractor={(item) => item.id.toString()}
                  contentContainerStyle={{ gap: 8, paddingBottom: bottomHeight() + 70 }}
                  showsVerticalScrollIndicator={false}
                  renderItem={({ item, index }) => <RuleItem item={item} index={index} />}
                  refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['black']} />
                  }
                />
              </Skeleton>
            </View>
          </View>

          <BottomSheetWorkWeek
            visible={visible}
            onClose={() => { setVisible(false); setSelectedId(null); }}
            selectedId={selectedId || ''}
            update
          />

          <BottomSheetCrud
            visible={visible2}
            onClose={() => setVisible2(false)}
            fields={[
              <TextInput
                key="name"
                name="name"
                placeholderTextColor="#6A7D94"
                placeholder="Rule Name"
                keyboardType="default"
                style={styles.ruleInput}
              />,
            ]}
            dropdown
            initialValues={{
              name: '',
              workWeekTypes: selectedEditRule?.rule_name || '',
              employeeRule: selectedEditRule?.first_name || '',
            }}
            validationSchema={validationSchema}
            dropdowndata={ruleList}
            employeeData={assignViewData}
            onSubmit={mode ? handleAssignRule : handleCreateRule}
            loading={isCreatePending || isAssignPending}
            modeName={mode ? 'assignRule' : ''}
          />

          {visible3 && (
            <BottomSheetEditWorkWeek
              selectedRuleId={selectedRuleId}
              isPending={isUpdatePending}
              updateRuleData={handleUpdateRule}
              visible={visible3}
              onClose={() => setVisible3(false)}
            />
          )}
        </ImageBackground>
      </SafeAreaView>
    </SafeAreaProvider>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backBtn: {
    padding: 10,
    backgroundColor: '#CA282C',
    borderRadius: 50,
  },
  modeToggle: {
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  cardIndex: {
    backgroundColor: '#FFF2F2',
    height: 38,
    width: 38,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 50,
  },
  cardLabel: {
    flex: 1,
  },
  editBtn: {
    padding: 4,
  },
  fab: {
    backgroundColor: '#CA282C',
    position: 'absolute',

    right: 16,
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  ruleInput: {
    height: 57,
    borderWidth: 1,
    borderColor: '#F4F4F4',
    color: '#6A7D94',
    padding: 10,
    fontFamily: 'Poppins-Regular',
    fontSize: 13,
    lineHeight: 18,
    borderRadius: 10,
    backgroundColor: 'white',
  },
});

export default WorkWeekView;