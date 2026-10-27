import {
  FlatList,
  ImageBackground,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  TextInput,
  ScrollView,
  Pressable,
  ActivityIndicator,
  RefreshControl,
  Image,
} from 'react-native';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import backgroundImage from '../../assets/Icon/background.png';
import TopNavBar from '../navigation/TopNavBar';
import { bottomHeight, getFontSize, SCREEN_WIDTH, STATUS_BAR_HEIGHT } from '../Helper/Helper';
import EmptyMessage from '../Helper/EmptyMessage';
import CustomNativeDropdown from '../Helper/CustomNativeDropdown';
import { useInfiniteQuery, useMutation, useQuery } from '@tanstack/react-query';
import useApi from '../Apis/Services/ApiConfig';
import useEncodedUserData from '../hooks/useEncodedUserData';
import { Formik } from 'formik';
import * as Yup from 'yup';
import { Back, Calendar, Correct, CorrectIcon, Cross, FileUploadIcon, FilterIcon, Pen, RightIcon, SalaryPayableIcon, TotalPaidIcon, TotalPendingIcon, TotalSalaryIcon } from '../Helper/IconsLoad';
import { DateTimePickerComponent } from '../Helper/DateTimePicker';
import moment from 'moment-timezone';
import ToastManager, { toast } from '../Helper/ToastManager';
import { API_BASE_URL, API_BASE_URL2 } from '../Apis/Services/ServerURL';
import { useAuth } from '../Context/AuthContext';
import useUploadFile from '../hooks/useUploadFile';
import DocumentUploadComponent from '../hooks/DocumentUploadComponent';
import DocumentView from '../Helper/DocumentView';
import Skeleton, { getLayout } from '../Helper/Skeleton';
import CustomMultiSelect from '../Helper/CustomMultiSelect';
import ExpenseDetailModal from './ExpenseDetailModal';
import ThemedText from '../Helper/ThemedText';
import ModalMultiSelect from '../Helper/ModalMultiSelect';
import FilterExpenses from '../components/FilterExpenses';


const formatINR = num =>
  typeof num === 'number'
    ? new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2,
    }).format(num)
    : num;

const formatDate = dateStr => {
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
};

const LABELS = ['Total Expenses', 'Paid', 'Unpaid', 'Pending Approval', 'Rejected'];

const Label = ({ children }) => <Text style={styles.label}>{children}</Text>;

const Value = ({ children }) => (
  <Text style={styles.value} numberOfLines={1}>
    {children}
  </Text>
);

const StatusBadge = ({ status = 'Pending', kind = 'rm' }) => {
  const palette = {
    Approved: { bg: '#E6F7ED', text: '#1B7F4A', border: '#BFEAD4' },
    Pending: { bg: '#FFF7E6', text: '#9A6200', border: '#F9DEB3' },
    Rejected: { bg: '#FDECEC', text: '#9B1C1C', border: '#F6BABA' },
  };
  const colors = palette[status] || palette.Pending;
  return (
    <View
      style={[
        styles.badge,
        { backgroundColor: colors.bg, borderColor: colors.border },
      ]}>
      <Text style={[styles.badgeText, { color: colors.text }]}>
        {kind === 'rm' ? 'RM: ' : 'Admin: '}
        {status}
      </Text>
    </View>
  );
};

const Dot = () => <Text style={{ fontSize: 22, lineHeight: 22 }}>•</Text>;

const ExpenseCard = ({
  data,
  onDetailsView,
  onEdit,
  editableData,
  documentURL,
  isView,
  srNo,
  expenseType,
  amount,
  expenseDate,
  documentAvailable = false,
  onViewDocument,
  rmStatus = 'Pending',
  adminStatus = 'Pending',
  onAction = () => { },
  approveLoading,
}) => {
  const { userType } = useAuth();
  const [FakeKey, setFakeKey] = useState(null);
  const [DelFakeKey, setDelFakeKey] = useState(null);
  return (
    <TouchableOpacity activeOpacity={0.7} onPress={onDetailsView} style={styles.card}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.srNo}>#{srNo}</Text>
          <Dot />
          <Text style={styles.title} numberOfLines={1}>
            {data?.employee_name}
          </Text>
        </View>
      </View>

      <View style={styles.grid}>
        <View style={styles.cell}>
          <Label>Type</Label>
          <Value>{expenseType}</Value>
        </View>
        <View style={styles.cell}>
          <Label>Amount</Label>
          <Value>₹{formatINR(amount)}</Value>
        </View>

        <View style={styles.cell}>
          <Label>Expense Date</Label>
          <Value>{formatDate(expenseDate)}</Value>
        </View>

        {documentAvailable && (
          <View style={styles.cell}>
            <Label>Document</Label>
            <TouchableOpacity
              onPress={() => onViewDocument(documentURL)}
              style={styles.linkBtn}>
              <Text style={styles.linkBtnText}>View</Text>
            </TouchableOpacity>
          </View>
        )}
        {data?.rm_id > 0 && (
          <View style={styles.cell}>
            <Label>RM Status</Label>
            <StatusBadge
              status={
                rmStatus == 0
                  ? 'Pending'
                  : rmStatus == 1
                    ? 'Approved'
                    : 'Reject'
              }
              kind="rm"
            />
          </View>
        )}
        <View style={styles.cell}>
          <Label>Admin Status</Label>
          <StatusBadge
            status={
              adminStatus == 0
                ? 'Pending'
                : adminStatus == 1
                  ? 'Approved'
                  : 'Reject'
            }
            kind="admin"
          />
        </View>
      </View>
      <View style={styles.footer}>
        {!isView &&
          (userType === 'admin' ||
            userType === 'ceo' ||
            userType === 'company_admin' ||
            userType === 'hr') && (
            <>
              <TouchableOpacity
                disabled={approveLoading && FakeKey == editableData?.id}
                style={[styles.actionBtn, styles.approveBtn]}
                onPress={() => {
                  setFakeKey(editableData?.id);
                  onAction('approve', editableData);
                }}>
                {approveLoading && FakeKey == editableData?.id ? (
                  <ActivityIndicator color={'white'} />
                ) : (
                  <Text style={styles.actionText}>Approve</Text>
                )}
              </TouchableOpacity>
              <TouchableOpacity
                disabled={approveLoading && DelFakeKey == editableData?.id}
                style={[styles.actionBtn, styles.rejectBtn]}
                onPress={() => {
                  setDelFakeKey(editableData?.id);
                  onAction('reject', editableData);
                }}>
                {approveLoading && DelFakeKey == editableData?.id ? (
                  <ActivityIndicator color={'black'} />
                ) : (
                  <Text style={[styles.actionText, { color: 'black' }]}>
                    Reject
                  </Text>
                )}
              </TouchableOpacity>
            </>
          )}

        {(!isView &&
          !['admin', 'ceo', 'company_admin', 'hr'].includes(userType)) && (
            <TouchableOpacity
              style={[styles.actionBtn, styles.approveBtn]}
              onPress={() => onEdit(editableData)}>
              <Text style={styles.actionText}>Edit</Text>
            </TouchableOpacity>
          )}
      </View>
    </TouchableOpacity>
  );
};

const ExpensesScreen = ({ navigation }) => {
  const { userType, permissions } = useAuth();
  const { CompanyEmployeeLists, ExpensesGet, ExpensesRequestApprove, ExpensesGetAmmount } = useApi();
  const { ExpensesAdd, ExpensesEdit } = useApi();
  const { userdata } = useEncodedUserData();
  const [selectedEmployee, setSelectedEmployee] = useState();
  const [visible, setVisible] = useState(false);
  const formikRef = useRef();
  const [refreshing, setRefreshing] = useState(false);
  const [documentURL, setDocumentURL] = useState([]);
  const [visibleDocumentModal, setVisibleDocumentModal] = useState(false);
  const [EditableData, setEditableData] = useState([]);
  const [isReset, setIsReset] = useState(false);
  const [detailVisible, setDetailVisible] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState(null);
  const [showFilter, setShowFilter] = useState(false);

  const formatDate = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const getPastDate = (daysBack) => {
    const d = new Date();
    d.setDate(d.getDate() - daysBack);
    return d;
  };

  const [filter, setFilter] = useState({
    dateRange: {
      startDate: formatDate(getPastDate(30)),
      endDate: formatDate(new Date())
    }
  });

  // http://localhost:2200/upload/all
  // 192.168.1.11
  // key ->file,folder

  const {
    data: CompanyEmployeeListsData,
    isLoading: CompanyEmployeeListsDataIsLoading,
    isError: CompanyEmployeeListsDataIsError,
    isPending: CompanyEmployeeListsDataisPending,
    refetch: CompanyEmployeeListsDataRefetch,
  } = useQuery({
    queryKey: ['CompanyEmployeeLists', userdata],
    queryFn: () =>
      CompanyEmployeeLists({
        userData: userdata,
        type: '',
        UserId: '',
        platformType: Platform.OS,
      }),
    enabled: !!userdata,
  });


  const ExpensesGetAmmountData = useQuery({
    queryKey: ['ExpensesGetAmmount', userdata, filter.dateRange?.startDate, filter.dateRange?.endDate, filter.types, filter.status, filter.employee_id, selectedEmployee],
    queryFn: () =>
      ExpensesGetAmmount({
        search: '',
        date_from: filter.dateRange?.startDate,
        date_to: filter.dateRange?.endDate,
        expense_type: filter.types || 'all',
        status_filter: filter.status || 'all',
        employee_id: filter.employee_id || selectedEmployee.join(", ") || '',
        userData: userdata,
      }),
    enabled: !!userdata,
  });

  const expenseSummary = ExpensesGetAmmountData?.data?.data;

  console.log("expenseSummary", expenseSummary)

  const formattedData = [
    { label: 'Total Expenses', value: expenseSummary?.total, icon: <TotalSalaryIcon width={25} height={25} /> },
    { label: 'Paid', value: expenseSummary?.totalpaid, icon: <TotalPaidIcon width={25} height={25} /> },
    { label: 'Unpaid', value: expenseSummary?.totalunpaid, icon: <SalaryPayableIcon width={25} height={25} /> },
    { label: 'Pending Approval', value: expenseSummary?.totalpending, icon: <TotalPendingIcon width={25} height={25} /> },
    { label: 'Rejected', value: expenseSummary?.totalrejected, icon: <TotalSalaryIcon width={25} height={25} /> },
  ];



  useEffect(() => {
    if (!CompanyEmployeeListsData?.data) return;

    if (
      userType === 'admin' ||
      userType === 'ceo' ||
      userType === 'company_admin' ||
      userType === 'hr' ||
      userType === 'rm'
    ) {
      const allIds = CompanyEmployeeListsData.data.map(emp =>
        Number(emp.id)
      );

      setSelectedEmployee(allIds);
    } else {
      setSelectedEmployee([
        Number(CompanyEmployeeListsData.data[0]?.id),
      ]);
    }
  }, [CompanyEmployeeListsData, userType]);





  const {
    data: ExpensesGetData,
    isLoading: ExpensesGetDataIsLoading,
    isError: ExpensesGetDataIsError,
    isPending: ExpensesGetDataPending,
    refetch: ExpensesGetDataRefetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isFetching,
    isRefetching,
  } = useInfiniteQuery({
    queryKey: ['ExpensesGetData', userdata, filter.dateRange?.startDate, filter.dateRange?.endDate, filter.types, filter.status, filter.employee_id, selectedEmployee],
    queryFn: ({ pageParam = 1 }) =>
      ExpensesGet({
        page: pageParam,
        limit: 20,
        search: '',
        date_from: filter.dateRange?.startDate || '',
        date_to: filter.dateRange?.endDate || '',
        expense_type: filter.types || 'all',
        status_filter: filter.status || 'all',
        employee_id: filter.employee_id || selectedEmployee.join(", ") || '',
        userData: userdata,
      }),
    getNextPageParam: (lastPage, allPages) => {
      const totalFetchedItems = allPages?.flatMap(
        page => page?.expenses,
      )?.length;
      if (totalFetchedItems < lastPage?.total) {
        return lastPage?.page + 1;
      }
      return undefined;
    },
    enabled: !!userdata,
  });

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await ExpensesGetDataRefetch();
    await ExpensesGetAmmountData.refetch();
    setRefreshing(false);
  }, [ExpensesGetDataRefetch, ExpensesGetAmmountData.refetch()]);

  const ExpensesData = useMemo(() => {
    return ExpensesGetData?.pages?.flatMap(page => page?.expenses) || [];
  }, [ExpensesGetData]);



  const loadMore = () => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  };

  const { mutate, isLoading, isPending, isError, isSuccess } = useMutation({
    mutationFn: formData => {
      return ExpensesAdd(formData);
    },
    onSuccess: async response => {
      toast.success(response?.message);
      setIsReset(true);
      await CompanyEmployeeListsDataRefetch();
      await ExpensesGetDataRefetch();
      if (formikRef.current) {
        formikRef.current.resetForm({
          values: {
            amount: '',
            expenseDate: '',
            employeeId: '',
            reason: '',
            expenseType: '',
            document: null,
          },
        });
      }
    },
    onError: error => {
      setIsReset(false);
      toast.error(error.message);
    },
  });

  const {
    mutate: ExpensesEditMutate,
    isLoading: ExpensesEditMutateLoading,
    isPending: ExpensesEditMutatePending,
    isSuccess: ExpensesEditMutateSuccess,
  } = useMutation({
    mutationFn: formData => {
      // console.log('formData', formData);
      return ExpensesEdit(formData);
    },
    onSuccess: async response => {
      toast.success(response?.message);
      setIsReset(true);
      await CompanyEmployeeListsDataRefetch();
      await ExpensesGetDataRefetch();
      if (formikRef.current) {
        formikRef.current.resetForm({
          values: {
            amount: '',
            expenseDate: '',
            employeeId: '',
            reason: '',
            expenseType: '',
            document: null,
          },
        });
      }
    },
    onError: error => {
      toast.error(error.message);
      setIsReset(false);
    },
  });
  const {
    mutate: ExpensesRequestApproveMutate,
    isLoading: ExpensesRequestApproveMutateLoading,
    isPending: ExpensesRequestPendingMutate,
  } = useMutation({
    mutationFn: formData => {
      return ExpensesRequestApprove(formData);
    },
    onSuccess: async response => {
      toast.success(response?.message);
      await CompanyEmployeeListsDataRefetch();
      await ExpensesGetDataRefetch();
    },
    onError: error => {
      toast.error(error.message);
    },
  });

  const handleAction = (item, action) => {
    const formData = {
      id: item?.id,
      amount: item?.amount,
      reason: item?.reason,
      status: action == 'approve' ? 1 : 2,
      action_type: item?.action_status,
      employee_id: item?.employee_id,
      expense_type: item?.expense_type,
      userData: userdata,
    };
    ExpensesRequestApproveMutate(formData);
  };

  const handleSubmitData = data => {
    const { docData, existingDocs, values } = data;
    const filePaths = docData.map(item => item.file_path);
    const mergedFiles = [...filePaths, ...existingDocs];
    const date = new Date(values?.expenseDate);
    const formattedDate = date.toISOString().split('T')[0];
    let payload = {
      userData: userdata,
      amount: values?.amount,
      reason: values?.reason,
      document: mergedFiles,
      employee_id: values?.employeeId,
      expense_date: formattedDate,
    };
    if (
      values?.expenseType == 'Advance Payment' ||
      values?.expenseType == 'advance_payment'
    ) {
      payload.expense_type = 'advance_payment';
    } else if (
      values?.expenseType == 'Expense' ||
      values?.expenseType == 'expense'
    ) {
      payload.expense_type = 'expense';
    } else if (
      values?.expenseType == 'Deduction' ||
      values?.expenseType == 'deduction'
    ) {
      payload.expense_type = 'deduction';
    }

    if (EditableData) {
      payload.id = EditableData?.id;
      ExpensesEditMutate(payload);
    } else {
      mutate(payload);
    }
  };

  const HEADER = () => {
    return <FlatList
      horizontal
      data={formattedData}
      contentContainerStyle={{ gap: 10, }}
      showsHorizontalScrollIndicator={false}
      keyExtractor={(item, index) => index.toString()}
      renderItem={({ item }) => (
        <View style={{ padding: 15, backgroundColor: 'white', borderRadius: 12, width: SCREEN_WIDTH - 100, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View>
            <ThemedText weight='Medium' size='sm'>{item.label}</ThemedText>
            <ThemedText weight='Medium' size='lg'>{item.value}</ThemedText>
          </View>
          {item.icon}
        </View>
      )}
    />
  }

  const handleFilter = (res) => {
    setFilter(res)
  }

  return (
    <ImageBackground
      source={backgroundImage}
      resizeMode="cover"
      style={{ flex: 1, paddingTop: STATUS_BAR_HEIGHT(), backgroundColor: '#F9F9F9', ...StyleSheet.absoluteFillObject }}>
      <View
        style={{
          flex: 1,
        }}>
        <TopNavBar title={'Expense'} navigation={navigation} />
        <View
          style={{
            gap: 10,
          }}>

          <FlatList
            ListHeaderComponent={HEADER}
            ListHeaderComponentStyle={{ paddingBottom: 10 }}
            contentContainerStyle={{
              paddingHorizontal: 15,
              paddingBottom: bottomHeight() * 3,
            }}
            data={ExpensesGetDataIsLoading ? Array(5).fill({}) : ExpensesData}
            keyExtractor={(item, index) => index.toString()}
            ListEmptyComponent={
              !ExpensesGetDataIsLoading ? <EmptyMessage /> : null
            }
            renderItem={({ item, index }) => {
              if (ExpensesGetDataIsLoading) {
                return (
                  <Skeleton
                    isLoading={true}
                    layout={getLayout({ length: 1, height: 242 })}
                  />
                );
              }

              return (
                <ExpenseCard
                  data={item}
                  onDetailsView={() => {
                    setSelectedExpense(item);
                    setDetailVisible(true);
                  }}
                  onEdit={editableData => {
                    setEditableData(editableData);
                    setIsReset(false);
                    setVisible(true);
                  }}
                  editableData={item}
                  documentURL={item?.document}
                  isView={item?.action_status === 'view'}
                  srNo={index + 1}
                  expenseType={item.expense_type}
                  amount={item.amount}
                  expenseDate={item.expense_date}
                  documentAvailable={item.document.length > 0}
                  onViewDocument={documentURL => {
                    setDocumentURL(documentURL);
                    setVisibleDocumentModal(true);
                  }}
                  rmStatus={item.rm_status}
                  adminStatus={item.admin_status}
                  onAction={action => handleAction(item, action)}
                  approveLoading={
                    ExpensesRequestPendingMutate ||
                    ExpensesRequestApproveMutateLoading
                  }
                />
              );
            }}
            onEndReached={loadMore}
            onEndReachedThreshold={0.9}
            initialNumToRender={5}
            maxToRenderPerBatch={5}
            showsVerticalScrollIndicator={false}
            windowSize={7}
            removeClippedSubviews={false}
            updateCellsBatchingPeriod={100}
            ListFooterComponent={
              isLoading || isPending || isRefetching ? (
                <ActivityIndicator size={30} color={'black'} />
              ) : null
            }
            ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
            decelerationRate={'normal'}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={['black']}
              />
            }
          />
        </View>
        <View style={{
          position: 'absolute',
          right: 10,
          bottom: bottomHeight(),
          gap: 10
        }}>
          {!permissions?.block_create_expense && (
            <TouchableOpacity
              onPress={() => {
                setEditableData(null);
                setIsReset(true);
                setVisible(true);
              }}
              style={{
                backgroundColor: '#CA282C',
                width: 50,
                height: 50,
                borderRadius: 50,
                justifyContent: 'center',
                alignItems: 'center',
              }}>
              <Pen color={'white'} width={30} height={30} />
            </TouchableOpacity>
          )}
          <TouchableOpacity
            onPress={() => {
              setShowFilter(true)
            }}
            style={{
              backgroundColor: '#CA282C',
              width: 50,
              height: 50,
              borderRadius: 50,
              justifyContent: 'center',
              alignItems: 'center',
            }}>
            <FilterIcon color={'white'} width={30} height={30} />
          </TouchableOpacity>
        </View>
        <ExpenseFormModal
          EditableData={EditableData}
          loading={
            isLoading || isPending || CompanyEmployeeListsDataIsLoading
          }
          formikRef={formikRef}
          CompanyEmployeeListsData={CompanyEmployeeListsData}
          visible={visible}
          onClose={() => {
            setVisible(false);
            setEditableData(null);
            setIsReset(true);
          }}
          onSubmit={handleSubmitData}
          isReset={isReset}
          setIsReset={setIsReset}
          isSuccess={isSuccess}
        />
        <ExpenseDetailModal
          visible={detailVisible}
          onClose={() => setDetailVisible(false)}
          data={selectedExpense}
        />
        <FilterExpenses
          modalVisible={showFilter}
          isAdmin={userType === 'admin' ||
            userType === 'ceo' ||
            userType === 'company_admin' ||
            userType === 'hr' ||
            userType === 'rm'}
          selectableItems={CompanyEmployeeListsData?.data}
          selectedEmployee={selectedEmployee}
          filterData={handleFilter}
          onModalClose={() => setShowFilter(false)}
        />
        <DocumentView
          visible={visibleDocumentModal}
          documentURL={documentURL}
          onClose={() => setVisibleDocumentModal(false)}
        />
      </View>
    </ImageBackground>
  );
};

export default ExpensesScreen;




const ExpenseFormModal = ({
  EditableData,
  loading,
  formikRef,
  CompanyEmployeeListsData,
  visible,
  onClose,
  onSubmit,
  isReset,
  isSuccess,
}) => {

  const { userType } = useAuth();
  const [docName, setDocName] = useState(null);
  const probationLists = ['Advance Payment', 'Expense', 'Deduction'];
  const [visibleDobPicker, setVisibleDobPicker] = useState(false);

  const { uploadFile, isPending, data, isSuccessed, setIsSuccess } = useUploadFile();

  const [doc, setDoc] = useState({});
  const [visibleUploadDocumentSheet, setVisibleUploadDocumentSheet] = useState(false);

  const [existingDocs, setExistingDocs] = useState([]);

  const [docData, setDocData] = useState([]);

  const [viewerVisible, setViewerVisible] = useState(false);
  const [viewerDocs, setViewerDocs] = useState([]);
  const [viewerIndex, setViewerIndex] = useState(0);


  useEffect(() => {
    if (visible) {
      if (!EditableData || !EditableData.id) {
        setDocData([]);
        setExistingDocs([]);
        setViewerDocs([]);
        setDocName(null);
        setDoc({});
      }
    }
  }, [visible, EditableData]);

  useEffect(() => {
    if (EditableData?.document?.length > 0) {
      setExistingDocs(EditableData.document);
    }
  }, [EditableData]);

  useEffect(() => {
    // Reset when modal opens fresh or when explicitly reset
    if (isReset) {
      setDocData([]);
      setExistingDocs([]);
      setViewerDocs([]);
      setDocName(null);
      setDoc({});

      if (formikRef.current) {
        formikRef.current.resetForm({
          values: {
            expenseType: '',
            amount: '',
            expenseDate: '',
            employeeId: '',
            reason: '',
          },
        });
      }
    }
  }, [isReset]);

  useEffect(() => {
    if (EditableData?.document?.length > 0) {
      setExistingDocs(EditableData.document);
    } else {
      setExistingDocs([]);
    }
  }, [EditableData]);

  useEffect(() => {
    if (isSuccess && formikRef.current) {
      formikRef.current.resetForm({
        values: {
          expenseType: '',
          amount: '',
          expenseDate: '',
          employeeId: '',
          reason: '',
        },
      });

      setIsSuccess(false);
      setDocName(null);
      setDoc({});
      setDocData([]);
      setExistingDocs([]);
      setViewerDocs([]);
    }
  }, [isSuccess]);

  const onUploadComplete = (document, data) => {
    setDoc(document);
    setDocData(prev => [...prev, data]);
    setDocName(document.name);
  };

  const onUploadError = (document, error) => {
    if (error.message) toast.error(error.message);
  };

  const handleDocPick = async () => {
    setVisibleUploadDocumentSheet(true);
  };

  const allDocs = [...existingDocs, ...docData];

  const handleDeleteDoc = (item, index) => {
    if (typeof item === "string") {
      setExistingDocs(prev => prev.filter((_, i) => i !== index));
      return;
    }

    const newIndex = index - existingDocs.length;
    setDocData(prev => prev.filter((_, i) => i !== newIndex));
  };

  const openDocumentPreviewModal = (docs, index) => {
    setViewerDocs(docs);
    setViewerIndex(index);
    setViewerVisible(true);
  };

  return (
    <Modal
      visible={visible}
      onRequestClose={onClose}
      animationType="fade"
      statusBarTranslucent={true}
      transparent
    >
      <ImageBackground
        source={backgroundImage}
        resizeMode="cover"
        style={{ flex: 1, backgroundColor: '#F9F9F9', paddingTop: STATUS_BAR_HEIGHT(), ...StyleSheet.absoluteFillObject }}
      >
        <ToastManager />
        {visibleUploadDocumentSheet && (
          <DocumentUploadComponent
            maxFiles={5}
            folder="expense"
            onDeleteDocuments={() => { setDocName(''); setDoc(null); }}
            onUploadComplete={onUploadComplete}
            onUploadError={onUploadError}
            visible={visibleUploadDocumentSheet}
            onClose={() => setVisibleUploadDocumentSheet(false)}
          />
        )}
        {viewerVisible && (
          <DocumentView
            visible={viewerVisible}
            onClose={() => setViewerVisible(false)}
            documentURL={viewerDocs}
            startIndex={viewerIndex}
          />
        )}

        <View
          style={[
            styles.modalContent,
            { paddingHorizontal: 15, },
          ]}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingBottom: 20 }}>
            <TouchableOpacity onPress={onClose} style={{ padding: 10, backgroundColor: '#CA282C', borderRadius: 50, }}>
              <Back width={20} height={20} color={'#fcfcfcff'} />
            </TouchableOpacity>
            <ThemedText size='lg' weight='Medium'>
              {EditableData ? 'Edit Expense' : 'Add Expense'}
            </ThemedText>
          </View>

          <Formik
            enableReinitialize
            innerRef={formikRef}
            initialValues={{
              expenseType: EditableData?.expense_type || '',
              amount: EditableData?.amount || '',
              expenseDate: EditableData?.expense_date || '',
              employeeId: EditableData?.employee_id ? { key: EditableData?.employee_id, value: EditableData?.employee_name } : '',
              reason: EditableData?.reason || '',
            }}
            validationSchema={Yup.object().shape({
              expenseType: Yup.string().required('Expense Type is required'),
              amount: Yup.number()
                .typeError('Amount must be a number')
                .positive('Amount must be positive')
                .required('Amount is required'),
              expenseDate: Yup.string().required('Expense Date is required'),
              employeeId: Yup.number().nullable(),
              reason: Yup.string().min(5).required('Reason is required'),
            })}
            onSubmit={(values) => {
              onSubmit({
                values,
                existingDocs,
                docData
              });
            }}
          >
            {({
              handleChange,
              handleBlur,
              handleSubmit,
              values,
              errors,
              touched,
              setFieldValue,
            }) => {
              return (
                <ScrollView
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={{ gap: 10, paddingBottom: bottomHeight(), flex: 1, justifyContent: 'space-between' }}

                >
                  <View style={{ gap: 10 }}>

                    <CustomNativeDropdown mode={false} keyField="id" valueField="name" enableDefaultOption={true} placeholder={values.expenseType == 'expense' ? 'Expense' : values.expenseType == 'advance_payment' ? 'Advance Payment' : values.expenseType == 'deduction' ? 'Deduction' : 'Expense Type'} value={values.expenseType} onValueChange={value => setFieldValue('expenseType', value)} error={touched.expenseType && errors.expenseType} datas={['', ...probationLists]} />
                    <TextInput style={[styles.input, touched.amount && errors.amount ? styles.errorBorder : null,]} placeholder="Amount" keyboardType="number-pad" placeholderTextColor="#6A7D94" cursorColor={'#6A7D94'} value={values.amount} onChangeText={handleChange('amount')} error={touched.amount && errors.amount} onBlur={handleBlur('amount')} />
                    <Pressable onPress={() => { setVisibleDobPicker(!visibleDobPicker); }}> <View style={[styles.input, errors.expenseDate ? styles.errorBorder : null, { display: 'flex', justifyContent: 'space-between', flexDirection: 'row', alignItems: 'center', },]}> <Text style={{ color: '#6A7D94', fontFamily: 'Poppins-Regular', fontSize: 14, lineHeight: 20, }}> {values.expenseDate ? moment(values.expenseDate, ['YYYY-MM-DD', 'YYYYMMDD',]).format('DD/MM/YYYY') : 'Expense Date'} </Text> {values.expenseDate ? (
                      <TouchableOpacity onPress={() => { setFieldValue('expenseDate', ''); }} style={{}}> <Cross color={'#6A7D94'} width={25} height={25} />
                      </TouchableOpacity>) : (<View>
                        <View>
                          <Calendar color={'#6A7D94'} width={25} height={25} /> </View> </View>)} </View> <DateTimePickerComponent visible={visibleDobPicker} setVisible={setVisibleDobPicker} value={values.expenseDate ? new Date(values.expenseDate) : new Date()} onChange={date => setFieldValue('expenseDate', date)} /> </Pressable>
                    {(userType === 'admin' || userType === 'ceo' || userType === 'company_admin' || userType === 'hr') && (
                      <ModalMultiSelect
                        items={CompanyEmployeeListsData?.data}
                        selectedItems={values.employeeId}
                        onSelectedItemsChange={val => { setFieldValue('employeeId', val) }}
                        placeholder='Select Employee'
                        isError={touched.employeeId && errors.employeeId}
                        single
                      />
                    )}

                    <TextInput style={[styles.input, { height: 150, textAlignVertical: 'top' }, touched.reason && errors.reason ? styles.errorBorder : null,]} placeholder="Reason" cursorColor={'#6A7D94'} placeholderTextColor="#6A7D94" multiline value={values.reason} onChangeText={handleChange('reason')} onBlur={handleBlur('reason')} />

                    <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
                      <TouchableOpacity
                        style={[
                          styles.uploadBtn,
                          touched.document && errors.document ? styles.errorBorder : null,
                        ]}
                        onPress={handleDocPick}
                      >
                        <Text style={styles.uploadBtnText}>
                          Upload Document
                        </Text>
                      </TouchableOpacity>
                    </View>

                    {(existingDocs.length > 0 || docData.length > 0 || values.document?.length > 0) && (
                      <FlatList
                        horizontal
                        data={allDocs}
                        keyExtractor={(item, index) => index.toString()}
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={{ paddingVertical: 10, gap: 10 }}
                        renderItem={({ item, index }) => {
                          let finalItem = item?.file_path ? item?.file_path : item;
                          const isPDF = typeof finalItem === "string"
                            ? finalItem.toLowerCase().endsWith(".pdf")
                            : finalItem?.toLowerCase?.()?.endsWith?.(".pdf");

                          return (
                            <View
                              style={{
                                width: 100,
                                height: 120,
                                backgroundColor: "#ffffffff",
                                borderRadius: 8,
                                padding: 8,
                                alignItems: "center",
                                justifyContent: "center",
                                position: "relative",
                              }}
                            >
                              <TouchableOpacity
                                onPress={() => openDocumentPreviewModal(finalItem, index)}
                                style={{ flex: 1, width: "100%", justifyContent: "center" }}
                              >
                                {isPDF ? (
                                  <Text style={{ textAlign: "center", color: "#444" }}>PDF</Text>
                                ) : (
                                  <Image
                                    source={
                                      typeof item === "string"
                                        ? { uri: API_BASE_URL2 + finalItem }
                                        : { uri: API_BASE_URL2 + finalItem }
                                    }
                                    style={{ width: "100%", height: "100%", borderRadius: 6 }}
                                    resizeMode="cover"
                                  />
                                )}
                              </TouchableOpacity>

                              <TouchableOpacity
                                onPress={() => handleDeleteDoc(finalItem, index)}
                                style={{
                                  position: "absolute",
                                  top: 4,
                                  right: 4,
                                  padding: 4,
                                  backgroundColor: "rgba(0,0,0,0.6)",
                                  borderRadius: 20,
                                }}
                              >
                                <Cross width={18} height={18} color="#fff" />
                              </TouchableOpacity>
                            </View>
                          );
                        }}
                      />
                    )}
                  </View>
                  <View style={styles.buttonRow}>
                    <TouchableOpacity
                      disabled={loading || (!doc && existingDocs.length === 0)}
                      style={{
                        height: 52,
                        backgroundColor: '#CA282C',
                        width: '100%',
                        borderRadius: 8,
                        justifyContent: 'center',
                        alignItems: 'center',
                        marginTop: 30,
                        opacity: !doc && existingDocs.length === 0 ? 0.5 : 1,
                      }}
                      onPress={handleSubmit}
                    >
                      {loading || isPending ? (
                        <ActivityIndicator size={'large'} color={'white'} />
                      ) : (
                        <Text style={[styles.btnText, { color: '#fff' }]}>Submit</Text>
                      )}
                    </TouchableOpacity>
                  </View>

                </ScrollView>
              );
            }}
          </Formik>
        </View>
      </ImageBackground>
    </Modal>
  );
};


const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '100%',
    height: '100%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: 'Poppins-Medium',
    color: '#333',
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: 'Poppins-Medium',
    marginBottom: 16,
    textAlign: 'center',
  },
  input: {
    position: 'relative',
    borderWidth: 0,
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 5,
    backgroundColor: '#fff',
    height: 57,
    fontFamily: 'Poppins-Regular',
    fontSize: 14,
    color: '#6A7D94',
    lineHeight: 15,
    justifyContent: 'center',
  },
  error: {
    fontSize: 12,
    color: 'red',
    marginBottom: 8,
  },
  uploadBtn: {
    borderWidth: 1,
    borderColor: '#6A7D94',
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
    alignItems: 'center',
    flex: 1
  },
  errorBorder: {
    borderWidth: 1,
    borderColor: 'red',
  },
  uploadBtnText: {
    color: '#6A7D94',
    fontWeight: '600',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  btn: {
    flex: 1,
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  cancelBtn: {
    backgroundColor: '#f3f4f6',
  },
  submitBtn: {
    backgroundColor: '#007BFF',
  },
  btnText: {
    fontSize: 15,
    fontWeight: '600',
  },
  card: {
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    padding: 14,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    justifyContent: 'space-between',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    maxWidth: '85%',
  },
  srNo: {
    fontFamily: 'Poppins-Medium',
    fontSize: 14,
    lineHeight: 20,
    color: '#5A5A5A',
    backgroundColor: '#F4F6F8',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  title: {
    fontSize: 16,
    fontFamily: 'Poppins-Medium',
    color: '#1F2937',
  },
  menuBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  menuDots: {
    fontSize: 20,
    color: '#6B7280',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  cell: {
    backgroundColor: '#FAFAFA',
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  label: {
    fontFamily: 'Poppins-Medium',
    fontSize: 10,
    color: '#6B7280',
    marginBottom: 4,
    letterSpacing: 0.2,
  },
  value: {
    fontFamily: 'Poppins-Medium',
    fontSize: 14,
    color: '#111827',
  },
  linkBtn: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: '#EFF6FF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  linkBtnText: {
    fontSize: 13,
    fontFamily: 'Poppins-Medium',
    lineHeight: 20,
    color: '#1D4ED8',
  },
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
  },
  badgeText: {
    fontSize: 12,
    lineHeight: 20,
    fontFamily: 'Poppins-Medium',
  },
  footer: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
  },
  actionBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  approveBtn: {
    backgroundColor: '#293646',
    borderWidth: 1,
  },
  rejectBtn: {
    backgroundColor: '#EAECF0',
  },
  actionText: {
    fontFamily: 'Poppins-Medium',
    fontSize: 12,
    lineHeight: 20,
    color: 'rgba(247, 247, 247, 1)ff',
  },
  modalBackdrop: {
    position: 'absolute',
    inset: 0,
    backgroundColor: 'rgba(0,0,0,0.15)',
  },
  menuSheet: {
    position: 'absolute',
    right: 16,
    top: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingVertical: 6,
    width: 180,
    // shadow
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  menuItem: {
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  menuItemText: {
    fontSize: 14,
    color: '#111827',
    fontWeight: '600',
  },
});
