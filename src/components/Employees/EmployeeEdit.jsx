import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  ImageBackground,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Pressable,
  ActivityIndicator,
  KeyboardAvoidingView,
  ToastAndroid,
  RefreshControl,
  Dimensions,
  Platform,
} from 'react-native';
import moment from 'moment';
import backgroundImage from '../../../assets/Icon/background.png';
import { Back, Calendar, Cross } from '../../Helper/IconsLoad';
import { Formik } from 'formik';
import { DateTimePickerComponent } from '../../Helper/DateTimePicker';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import useApi from '../../Apis/Services/ApiConfig';
import { PersonalDetailsValidation } from '../../Helper/Validation';
import { TextInput, useTheme } from 'react-native-paper';
import TopNavBar from '../../navigation/TopNavBar';
import CustomNativeDropdown from '../../Helper/CustomNativeDropdown';
import { toast } from '../../Helper/ToastManager';
import { useRoute } from '@react-navigation/native';
import Autocomplete from '../../Helper/AutoComplete';
import { capitalizeFirstLetter } from '../../Helper/StringHelpers';
import { bottomHeight, STATUS_BAR_HEIGHT } from '../../Helper/Helper';
import { SafeAreaView } from 'react-native-safe-area-context';
import Skeleton, { getLayout } from '../../Helper/Skeleton';

const EmployeeEdit = ({ navigation }) => {
  const route = useRoute();
  const { id, userdata } = route.params;
  const [refreshing, setRefreshing] = useState(false);
  const valueRef = useRef(null);
  const [subDepartmentsOptions, setSubDepartmentsOptions] = useState([]);
  const [subDepartmentsLoading, setSubDepartmentsLoading] = useState(false);
  const scrollViewRef = useRef(null);

  const {
    Employees,
    Designations,
    Departments,
    SubDepartments,
    EmployeesUpdate,
    EmployeesAdd,
    CompanyEmployeeLists,
  } = useApi();

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

  const {
    data: DepartmentsData,
    isLoading: DepartmentsDataIsLoading,
    isError: DepartmentsDataIsError,
    isRefetching: DepartmentsDataRefetching,
    refetch: DepartmentsDataRefetch,
  } = useQuery({
    queryKey: ['Departments', userdata],
    queryFn: () =>
      Departments({
        userData: userdata,
        platformType: Platform.OS,
        type: 'work',
        id: '',
      }),
    enabled: !!userdata,
  });
  const {
    data: DesignationsData,
    isLoading: DesignationsDataIsLoading,
    isError: DesignationsDataIsError,
    isRefetching: DesignationsDataRefetching,
    refetch: DesignationsDataRefetch,
  } = useQuery({
    queryKey: ['Designations', userdata],
    queryFn: () =>
      Designations({
        userData: userdata,
        platformType: Platform.OS,
      }),
    enabled: !!userdata,
  });

  const designationOptions =
    DesignationsData?.data?.map(item => item.designation) || [];

  const fetchSubDepartmentsByDept = async departmentId => {
    setSubDepartmentsLoading(true);
    try {
      const res = await SubDepartments({
        userData: userdata,
        type: 'work',
        id: departmentId,
        platformType: Platform.OS,
      });
      setSubDepartmentsOptions(res?.data || []);
    } catch (err) {
      setSubDepartmentsOptions([]);
    }
    setSubDepartmentsLoading(false);
  };

  useEffect(() => {
    const refetch = async () => {
      if (EmployeesData?.employees[0]?.department) {
        await fetchSubDepartmentsByDept(EmployeesData.employees[0].department);
      }
    };
    refetch();
  }, [EmployeesData]);

  const {
    data: EmployeesData,
    isLoading,
    isError,
    isRefetching: EmployeesDataRefetching,
    isPending: EmployeesDataIsPending,
    refetch,
  } = useQuery({
    queryKey: ['DataEmployees', userdata, id],
    queryFn: () =>
      Employees({
        userData: userdata,
        type: 'view',
        id: id,
        platformType: Platform.OS,
      }),
    enabled: !!userdata && !!id,
  });

  const {
    mutate: UpdatePersonalDetails,
    isPending: isUpdating,
    isLoading: UpdatePersonalDetailsLoading,
    isError: isUpdateError,
  } = useMutation({
    mutationFn: async ({
      id,
      employee_id,
      dob,
      date_of_Joining,
      first_name,
      last_name,
      emergency_contact_name,
      emergency_contact_number,
      current_address,
      permanent_address,
      blood_group,
      marital_status,
      gender,
      alternate_phone,
      contact_number,
      email_id,
      official_email_id,
      probation_status,
      experience,
      job_title,
      work_location,
      department,
      sub_department,
      designation,
      employee_type,
      probation_period,
      reporting_manager,
      ctc,
      bank,
      branch,
      city,
      ifsc,
      account_number,
    }) => {
      if (!id) {
        return await EmployeesAdd({
          userData: userdata,
          platformType: Platform.OS,
          employee_id,
          date_of_Joining,
          contact_number,
          probation_status,
          account_number,
          ifsc,
          city,
          branch,
          bank,
          probation_period,
          ctc,
          reporting_manager,
          employee_type,
          sub_department,
          designation,
          experience,
          first_name,
          department,
          work_location,
          job_title,
          last_name,
          blood_group,
          dob,
          marital_status,
          gender,
          alternate_phone,
          emergency_contact_name,
          emergency_contact_number,
          current_address,
          permanent_address,
          email_id,
          official_email_id,
        });
      } else {
        return await EmployeesUpdate({
          userData: userdata,
          platformType: Platform.OS,
          employee_id,
          id: id,
          date_of_Joining,
          contact_number,
          probation_status,
          account_number,
          ifsc,
          city,
          branch,
          bank,
          probation_period,
          ctc,
          reporting_manager,
          employee_type,
          sub_department,
          designation,
          experience,
          first_name,
          department,
          work_location,
          job_title,
          last_name,
          blood_group,
          dob,
          marital_status,
          gender,
          alternate_phone,
          emergency_contact_name,
          emergency_contact_number,
          current_address,
          permanent_address,
          email_id,
          official_email_id,
        });
      }
    },
    onSuccess: async response => {
      toast.success(response.message);
      await refetch();
    },
    onError: error => {
      toast.error(error.message);
    },
  });
  const handleUpdatePersonalDetails = value => {
    const id = value.id;
    const employee_id = value.employee_id;
    const dob = new Date(value.dob).toLocaleDateString('en-CA') || '';
    const date_of_Joining =
      new Date(value.date_of_Joining).toLocaleDateString('en-CA') || '';
    const first_name = value.first_name || '';
    const last_name = value.last_name || '';
    const emergency_contact_name = value.emergency_contact_name || '';
    const emergency_contact_number = value.emergency_contact_number || '';
    const current_address = value.current_address || '';
    const permanent_address = value.permanent_address || '';
    const blood_group = value.blood_group || '';
    const marital_status = value.marital_status || '';
    const gender = value.gender || '';
    const alternate_phone = value.alternate_phone || '';
    const contact_number = value.contact_number || '';
    const email_id = value.email_id || '';
    const official_email_id = value.official_email_id || '';
    const probation_status = value.probation_status || '';
    const experience = value.experience || '';
    const job_title = value.job_title || '';
    const work_location = value.work_location || '';
    const department = value.department || '';
    const sub_department = value.sub_department || '';
    const designation = value.designation || '';
    const employee_type = value.employee_type || '';
    const probation_period = value.probation_period || '';
    const reporting_manager = value.reporting_manager.key
      ? value.reporting_manager.key
      : value.reporting_manager || '';
    const ctc = value.ctc || '';
    const bank = value.bank || '';
    const branch = value.branch || '';
    const city = value.city || '';
    const ifsc = value.ifsc || '';
    const account_number = value.account_number || '';

    UpdatePersonalDetails({
      id,
      employee_id,
      dob,
      date_of_Joining,
      first_name,
      last_name,
      emergency_contact_name,
      emergency_contact_number,
      current_address,
      permanent_address,
      blood_group,
      marital_status,
      gender,
      alternate_phone,
      contact_number,
      email_id,
      official_email_id,
      probation_status,
      experience,
      job_title,
      work_location,
      department,
      sub_department,
      designation,
      employee_type,
      probation_period,
      reporting_manager,
      ctc,
      bank,
      branch,
      city,
      ifsc,
      account_number,
    });
    valueRef.current = value;
  };
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const inputRefs = {
    first_name: useRef(null),
    last_name: useRef(null),
    contact_number: useRef(null),
    gender: useRef(null),
  };

  const dobViewRef = useRef(null);
  const dateOfJoiningViewRef = useRef(null);

  const focusFirstError = errors => {
    const fields = Object.keys(errors);
    if (fields.length > 0) {
      const firstErrorField = fields[0];
      if (inputRefs[firstErrorField] && inputRefs[firstErrorField].current) {
        inputRefs[firstErrorField].current.focus();
        inputRefs[firstErrorField].current.measureLayout(
          scrollViewRef.current.getInnerViewNode(),
          (x, y) => {
            scrollViewRef.current.scrollTo({ y: y - 20, animated: true });
          },
        );
      } else if (
        (firstErrorField === 'dob' || firstErrorField === 'date_of_Joining') &&
        scrollViewRef.current
      ) {
        scrollViewRef.current.scrollTo({ y: 0, animated: true });
      }
    }
  };

  const GridData = ({
    handleSubmit,
    formikProps,
    values,
    setFieldValue,
    errors,
    touched,
    isUpdating,
    EmployeesData,
    DepartmentsData,
    onDepartmentChange,
  }) => {
    const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
    const martialStatus = ['Single', 'Married', 'Unmarried'];
    const genderLists = ['Male', 'Female', 'Other'];
    const probationLists = ['Active', 'In Active'];
    const employeeTypeLists = ['Full Time', 'Contractual', 'Freelance'];
    const theme = useTheme();
    const [visibleDobPicker, setVisibleDobPicker] = useState(false);
    const [visibleDojPicker, setVisibleDojPicker] = useState(false);

    return (
      <View style={{ paddingHorizontal: 20 }}>
        <View style={{ paddingBottom: 20, flexDirection: 'row', gap: 10 }}>
          <View style={{ flex: 1 }}>
            <Text
              style={{
                fontFamily: 'Poppins-Regular',
                fontSize: 15,
                color: '#6A7D94',
              }}>
              First Name
            </Text>
            <TextInput
              mode="flat"
              underlineColor="transparent"
              activeUnderlineColor="transparent"
              cursorColor={'#6A7D94'}
              ref={inputRefs.first_name}
              placeholderTextColor="#6A7D94"
              onChangeText={text => setFieldValue('first_name', text)}
              textColor="#6A7D94"
              value={values.first_name}
              theme={{
                fonts: {
                  bodyLarge: {
                    ...theme.fonts.bodyMedium,
                    fontFamily: 'Poppins-Regular',
                  },
                },
              }}
              style={[
                styles.input,
                touched.first_name && errors.first_name
                  ? styles.errorBorder
                  : null,
                { flex: 1, fontSize: 15 },
              ]}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Text
              style={{
                fontFamily: 'Poppins-Regular',
                fontSize: 15,
                color: '#6A7D94',
              }}>
              Last Name
            </Text>
            <TextInput
              mode="flat"
              ref={inputRefs.last_name}
              underlineColor="transparent"
              activeUnderlineColor="transparent"
              placeholderTextColor="#6A7D94"
              cursorColor={'#6A7D94'}
              textColor="#6A7D94"
              onChangeText={text => setFieldValue('last_name', text)}
              value={values.last_name}
              style={[
                styles.input,
                touched.last_name && errors.last_name
                  ? styles.errorBorder
                  : null,
                { flex: 1 },
              ]}
              theme={{
                fonts: {
                  bodyLarge: {
                    ...theme.fonts.bodyMedium,
                    fontFamily: 'Poppins-Regular',
                  },
                },
              }}
            />
          </View>
        </View>
        <View style={{ paddingBottom: 20 }}>
          <Text
            style={{
              fontFamily: 'Poppins-Regular',
              fontSize: 15,
              color: '#6A7D94',
            }}>
            Employee ID
          </Text>
          <TextInput
            mode="flat"
            cursorColor={'#6A7D94'}
            underlineColor="transparent"
            activeUnderlineColor="transparent"
            placeholderTextColor="#6A7D94"
            maxLength={10}
            textColor="#6A7D94"
            onChangeText={text => {
              setFieldValue('employee_id', text);
            }}
            value={values.employee_id}
            style={[
              styles.input,
              touched.employee_id && errors.employee_id
                ? styles.errorBorder
                : null,
            ]}
            theme={{
              fonts: {
                bodyLarge: {
                  ...theme.fonts.bodyMedium,
                  fontFamily: 'Poppins-Regular',
                },
              },
            }}
          />
        </View>
        <CustomNativeDropdown
          mode={false}
          keyField="id"
          valueField="name"
          enableDefaultOption={true}
          placeholder={'Blood Group'}
          value={values.blood_group}
          onValueChange={value => setFieldValue('blood_group', value)}
          error={touched.blood_group && errors.blood_group}
          datas={['', ...bloodGroups]}
        />
        {/* <CustomDropdown
        value={values.bloodGroups}
        onValueChange={value => setFieldValue('bloodGroups', value)}
        error={touched.bloodGroups && errors.bloodGroups}
        data={['', ...bloodGroups]}
        placeholder={'Blood Group'}
      /> */}
        <View style={{ flex: 1, paddingTop: 20 }}>
          <Pressable
            onPress={() => {
              setVisibleDobPicker(!visibleDobPicker);
            }}>
            <View
              onLayout={event => {
                // You can store layout info here if needed
              }}
              collapsable={false}
              ref={dobViewRef}
              style={[styles.input, errors.dob ? styles.errorBorder : null]}>
              <Text
                style={{
                  color: '#6A7D94',
                  fontFamily: 'Poppins-Regular',
                  fontSize: 14,
                  lineHeight: 20,
                }}>
                {values.dob
                  ? moment(values.dob, ['YYYY-MM-DD', 'YYYYMMDD']).format(
                    'DD/MM/YYYY',
                  )
                  : 'Date Of Birth'}
              </Text>
              {values.dob ? (
                <TouchableOpacity
                  onPress={() => {
                    setFieldValue('dob', '');
                  }}
                  style={{
                    position: 'absolute',
                    right: 10,
                    top: '50%',
                    zIndex: 9999,
                    transform: [{ translateY: '-50%' }],
                  }}>
                  <Cross color={'#6A7D94'} width={25} height={25} />
                </TouchableOpacity>
              ) : (
                <View
                  style={{
                    position: 'absolute',
                    right: 10,
                    top: '50%',
                    transform: [{ translateY: '-50%' }],
                  }}>
                  <View>
                    <Calendar color={'#6A7D94'} width={25} height={25} />
                  </View>
                </View>
              )}
            </View>
            <DateTimePickerComponent
              error={touched.dob && errors.dob}
              visible={visibleDobPicker}
              setVisible={setVisibleDobPicker}
              value={new Date(values.dob)}
              onChange={date => setFieldValue('dob', date)}
            />
          </Pressable>
        </View>
        <View style={{ flex: 1, paddingTop: 20 }}>
          <Pressable
            onPress={() => {
              setVisibleDojPicker(!visibleDojPicker);
            }}>
            <View
              onLayout={event => {
                // You can store layout info here if needed
              }}
              collapsable={false}
              ref={dateOfJoiningViewRef}
              style={[
                styles.input,
                errors.date_of_Joining ? styles.errorBorder : null,
              ]}>
              <Text
                style={{
                  color: '#6A7D94',
                  fontFamily: 'Poppins-Regular',
                  fontSize: 14,
                  lineHeight: 20,
                }}>
                {values.date_of_Joining
                  ? moment(values.date_of_Joining, [
                    'YYYY-MM-DD',
                    'YYYYMMDD',
                  ]).format('DD/MM/YYYY')
                  : 'Date Of Joining'}
              </Text>
              {values.date_of_Joining ? (
                <TouchableOpacity
                  onPress={() => {
                    setFieldValue('date_of_Joining', '');
                  }}
                  style={{
                    position: 'absolute',
                    right: 10,
                    top: '50%',
                    zIndex: 9999,
                    transform: [{ translateY: '-50%' }],
                  }}>
                  <Cross color={'#6A7D94'} width={25} height={25} />
                </TouchableOpacity>
              ) : (
                <View
                  style={{
                    position: 'absolute',
                    right: 10,
                    top: '50%',
                    transform: [{ translateY: '-50%' }],
                  }}>
                  <View>
                    <Calendar color={'#6A7D94'} width={25} height={25} />
                  </View>
                </View>
              )}
            </View>
            <DateTimePickerComponent
              error={touched.date_of_Joining && errors.date_of_Joining}
              visible={visibleDojPicker}
              setVisible={setVisibleDojPicker}
              value={
                values.date_of_Joining
                  ? new Date(values.date_of_Joining)
                  : new Date()
              }
              onChange={date => setFieldValue('date_of_Joining', date)}
            />
          </Pressable>
        </View>
        <View style={{ paddingTop: 20 }}>
          <CustomNativeDropdown
            mode={false}
            keyField="id"
            valueField="name"
            enableDefaultOption={true}
            placeholder={'Marital Status'}
            value={values.marital_status}
            onValueChange={value => setFieldValue('marital_status', value)}
            error={touched.marital_status && errors.marital_status}
            datas={['', ...martialStatus]}
          />
          {/* <CustomDropdown
          value={values.martialStatus}
          onValueChange={value => setFieldValue('martialStatus', value)}
          error={touched.martialStatus && errors.martialStatus}
          data={['', ...martialStatus]}
          placeholder={'Marital Status'}
        /> */}
        </View>

        <View ref={inputRefs.gender} style={{ paddingTop: 20 }}>
          <CustomNativeDropdown
            mode={false}
            keyField="id"
            valueField="name"
            enableDefaultOption={true}
            placeholder={'Gender'}
            value={values.gender}
            onValueChange={value => setFieldValue('gender', value)}
            error={touched.gender && errors.gender}
            datas={['', ...genderLists]}
          />
          {/* <CustomDropdown
          value={values.genderLists}
          onValueChange={value => setFieldValue('genderLists', value)}
          error={touched.genderLists && errors.genderLists}
          data={['', ...genderLists]}
          placeholder={'Gender'}
        /> */}
        </View>

        <View style={{ paddingBottom: 20, paddingTop: 20 }}>
          <Text
            style={{
              fontFamily: 'Poppins-Regular',
              fontSize: 15,
              color: '#6A7D94',
            }}>
            Contact Number
          </Text>
          <TextInput
            keyboardType="number-pad"
            mode="flat"
            cursorColor={'#6A7D94'}
            underlineColor="transparent"
            activeUnderlineColor="transparent"
            placeholderTextColor="#6A7D94"
            maxLength={10}
            textColor="#6A7D94"
            ref={inputRefs.contact_number}
            onChangeText={text => {
              const numericText = text.replace(/[^0-9]/g, '').slice(0, 10);
              setFieldValue('contact_number', numericText);
            }}
            value={values.contact_number}
            style={[
              styles.input,
              touched.contact_number && errors.contact_number
                ? styles.errorBorder
                : null,
            ]}
            theme={{
              fonts: {
                bodyLarge: {
                  ...theme.fonts.bodyMedium,
                  fontFamily: 'Poppins-Regular',
                },
              },
            }}
          />
        </View>

        <View style={{ paddingBottom: 20 }}>
          <Text
            style={{
              fontFamily: 'Poppins-Regular',
              fontSize: 15,
              color: '#6A7D94',
            }}>
            Alternate Number
          </Text>

          <TextInput
            keyboardType="number-pad"
            mode="flat"
            underlineColor="transparent"
            activeUnderlineColor="transparent"
            placeholderTextColor="#6A7D94"
            maxLength={10}
            textColor="#6A7D94"
            cursorColor={'#6A7D94'}
            onChangeText={text => {
              const numericText = text.replace(/[^0-9]/g, '').slice(0, 10);
              setFieldValue('alternate_phone', numericText);
            }}
            value={values.alternate_phone}
            style={[
              styles.input,
              touched.alternate_phone && errors.alternate_phone
                ? styles.errorBorder
                : null,
            ]}
            theme={{
              fonts: {
                bodyLarge: {
                  ...theme.fonts.bodyMedium,
                  fontFamily: 'Poppins-Regular',
                },
              },
            }}
          />
        </View>

        <View style={{ paddingBottom: 20 }}>
          <Text
            style={{
              fontFamily: 'Poppins-Regular',
              fontSize: 15,
              color: '#6A7D94',
            }}>
            Emergency Name
          </Text>
          <TextInput
            mode="flat"
            underlineColor="transparent"
            activeUnderlineColor="transparent"
            placeholderTextColor="#6A7D94"
            textColor="#6A7D94"
            cursorColor={'#6A7D94'}
            onChangeText={text => setFieldValue('emergency_contact_name', text)}
            value={values.emergency_contact_name}
            style={[
              styles.input,
              touched.emergency_contact_name && errors.emergency_contact_name
                ? styles.emergency_contact_name
                : null,
            ]}
            theme={{
              fonts: {
                bodyLarge: {
                  ...theme.fonts.bodyMedium,
                  fontFamily: 'Poppins-Regular',
                },
              },
            }}
          />
        </View>

        <View style={{ paddingBottom: 20 }}>
          <Text
            style={{
              fontFamily: 'Poppins-Regular',
              fontSize: 15,
              color: '#6A7D94',
            }}>
            Emergency Number
          </Text>
          <TextInput
            mode="flat"
            underlineColor="transparent"
            activeUnderlineColor="transparent"
            keyboardType="number-pad"
            textColor="#6A7D94"
            cursorColor={'#6A7D94'}
            maxLength={10}
            onChangeText={text => {
              const emergency_contact_number = text
                .replace(/[^0-9]/g, '')
                .slice(0, 10);
              setFieldValue(
                'emergency_contact_number',
                emergency_contact_number,
              );
            }}
            value={values.emergency_contact_number}
            placeholderTextColor="#6A7D94"
            style={[
              styles.input,
              touched.emergency_contact_number &&
                errors.emergency_contact_number
                ? styles.errorBorder
                : null,
            ]}
            theme={{
              fonts: {
                bodyLarge: {
                  ...theme.fonts.bodyMedium,
                  fontFamily: 'Poppins-Regular',
                },
              },
            }}
          />
        </View>
        {/* <View style={{ paddingVertical: 20 }}>
            <SegmentedControl segments={['Full day', 'AN', 'FN']} />
        </View> */}

        <View style={{ paddingBottom: 20 }}>
          <Text
            style={{
              fontFamily: 'Poppins-Regular',
              fontSize: 15,
              color: '#6A7D94',
            }}>
            Official Email
          </Text>

          <TextInput
            mode="flat"
            underlineColor="transparent"
            activeUnderlineColor="transparent"
            readOnly={true}
            cursorColor={'#6A7D94'}
            textColor="#6A7D94"
            value={values.official_email_id}
            placeholderTextColor="#6A7D94"
            style={[styles.input]}
            theme={{
              fonts: {
                bodyLarge: {
                  ...theme.fonts.bodyMedium,
                  fontFamily: 'Poppins-Regular',
                },
              },
            }}
          />
        </View>

        <View style={{ paddingBottom: 20 }}>
          <Text
            style={{
              fontFamily: 'Poppins-Regular',
              fontSize: 15,
              color: '#6A7D94',
            }}>
            Email
          </Text>

          <TextInput
            mode="flat"
            underlineColor="transparent"
            readOnly={true}
            activeUnderlineColor="transparent"
            value={values.email_id}
            textColor="#6A7D94"
            cursorColor={'#6A7D94'}
            placeholderTextColor="#6A7D94"
            style={[styles.input]}
            theme={{
              fonts: {
                bodyLarge: {
                  ...theme.fonts.bodyMedium,
                  fontFamily: 'Poppins-Regular',
                },
              },
            }}
          />
        </View>
        <View style={{ paddingBottom: 20 }}>
          <Text
            style={{
              fontFamily: 'Poppins-Regular',
              fontSize: 15,
              color: '#6A7D94',
            }}>
            Current Address
          </Text>

          <TextInput
            mode="flat"
            underlineColor="transparent"
            activeUnderlineColor="transparent"
            cursorColor={'#6A7D94'}
            onChangeText={text => setFieldValue('current_address', text)}
            value={values.current_address}
            placeholderTextColor="#6A7D94"
            textColor="#6A7D94"
            style={[
              styles.input,
              touched.current_address && errors.current_address
                ? styles.errorBorder
                : null,
            ]}
            theme={{
              fonts: {
                bodyLarge: {
                  ...theme.fonts.bodyMedium,
                  fontFamily: 'Poppins-Regular',
                },
              },
            }}
          />
        </View>
        <View style={{ paddingBottom: 20 }}>
          <Text
            style={{
              fontFamily: 'Poppins-Regular',
              fontSize: 15,
              color: '#6A7D94',
            }}>
            Permanent Address
          </Text>
          <TextInput
            mode="flat"
            underlineColor="transparent"
            activeUnderlineColor="transparent"
            cursorColor={'#6A7D94'}
            placeholderTextColor="#6A7D94"
            textColor="#6A7D94"
            onChangeText={text => setFieldValue('permanent_address', text)}
            value={values.permanent_address}
            style={[
              styles.input,
              touched.permanent_address && errors.permanent_address
                ? styles.errorBorder
                : null,
            ]}
            theme={{
              fonts: {
                bodyLarge: {
                  ...theme.fonts.bodyMedium,
                  fontFamily: 'Poppins-Regular',
                },
              },
            }}
          />
        </View>

        <View style={{ paddingBottom: 20 }}>
          <CustomNativeDropdown
            mode={false}
            keyField="id"
            valueField="name"
            enableDefaultOption={true}
            placeholder={'Probation Status'}
            value={values.probation_status}
            onValueChange={value => setFieldValue('probation_status', value)}
            error={touched.probation_status && errors.probation_status}
            datas={['', ...probationLists]}
          />
        </View>
        <View style={{ paddingBottom: 20 }}>
          <Text
            style={{
              fontFamily: 'Poppins-Regular',
              fontSize: 15,
              color: '#6A7D94',
            }}>
            Experience
          </Text>
          <TextInput
            mode="flat"
            underlineColor="transparent"
            activeUnderlineColor="transparent"
            cursorColor={'#6A7D94'}
            placeholderTextColor="#6A7D94"
            textColor="#6A7D94"
            onChangeText={text => setFieldValue('experience', text)}
            value={values.experience}
            style={[
              styles.input,
              touched.experience && errors.experience
                ? styles.errorBorder
                : null,
            ]}
            theme={{
              fonts: {
                bodyLarge: {
                  ...theme.fonts.bodyMedium,
                  fontFamily: 'Poppins-Regular',
                },
              },
            }}
          />
        </View>
        <View style={{ paddingBottom: 20 }}>
          <Text
            style={{
              fontFamily: 'Poppins-Regular',
              fontSize: 15,
              color: '#6A7D94',
            }}>
            Job Title
          </Text>
          <TextInput
            mode="flat"
            underlineColor="transparent"
            activeUnderlineColor="transparent"
            cursorColor={'#6A7D94'}
            placeholderTextColor="#6A7D94"
            textColor="#6A7D94"
            onChangeText={text => setFieldValue('job_title', text)}
            value={values.job_title}
            style={[
              styles.input,
              touched.job_title && errors.job_title ? styles.errorBorder : null,
            ]}
            theme={{
              fonts: {
                bodyLarge: {
                  ...theme.fonts.bodyMedium,
                  fontFamily: 'Poppins-Regular',
                },
              },
            }}
          />
        </View>
        <View style={{ paddingBottom: 20 }}>
          <Text
            style={{
              fontFamily: 'Poppins-Regular',
              fontSize: 15,
              color: '#6A7D94',
            }}>
            Work Location
          </Text>
          <TextInput
            mode="flat"
            underlineColor="transparent"
            activeUnderlineColor="transparent"
            cursorColor={'#6A7D94'}
            placeholderTextColor="#6A7D94"
            textColor="#6A7D94"
            onChangeText={text => setFieldValue('work_location', text)}
            value={values.work_location}
            style={[
              styles.input,
              touched.work_location && errors.work_location
                ? styles.errorBorder
                : null,
            ]}
            theme={{
              fonts: {
                bodyLarge: {
                  ...theme.fonts.bodyMedium,
                  fontFamily: 'Poppins-Regular',
                },
              },
            }}
          />
        </View>

        <View style={{ paddingBottom: 20 }}>
          <CustomNativeDropdown
            mode={true}
            keyField="id"
            valueField="name"
            modeType={'reportingManager'}
            enableDefaultOption={true}
            placeholder={'Department'}
            value={values.department}
            onValueChange={onDepartmentChange}
            error={touched.department && errors.department}
            datas={DepartmentsData}
          />
        </View>
        <View style={{ paddingBottom: 20 }}>
          <CustomNativeDropdown
            mode={true}
            keyField="id"
            modeType={'reportingManager'}
            valueField="name"
            enableDefaultOption={true}
            placeholder={'Sub Department'}
            value={values.sub_department}
            onValueChange={value => setFieldValue('sub_department', value?.key)}
            error={touched.sub_department && errors.sub_department}
            datas={subDepartmentsOptions}
            loading={subDepartmentsLoading}
          />
        </View>
        <View style={{ paddingBottom: 20 }}>
          <Text
            style={{
              fontFamily: 'Poppins-Regular',
              fontSize: 15,
              color: '#6A7D94',
            }}>
            Designation{' '}
          </Text>
          <Autocomplete
            value={values.designation}
            label="Model"
            data={designationOptions}
            menuStyle={{ backgroundColor: 'white' }}
            onChange={text => setFieldValue('designation', text)}
          />
        </View>
        {/* <View style={{ paddingBottom: 20 }}>
                    <Text style={{ fontFamily: 'Poppins-Regular', fontSize: 15, color: '#6A7D94' }}>Designation</Text>
                    <TextInput
                        mode="flat"
                        underlineColor="transparent"
                        activeUnderlineColor="transparent"
                        cursorColor={'#6A7D94'}

                        placeholderTextColor="#6A7D94"
                        textColor='#6A7D94'

                        onChangeText={text => setFieldValue('designation', text)}
                        value={values.designation}
                        style={[
                            styles.input,
                            touched.designation && errors.designation
                                ? styles.errorBorder
                                : null,
                        ]}
                        theme={{
                            fonts: { bodyLarge: { ...theme.fonts.bodyMedium, fontFamily: "Poppins-Regular" } },
                        }}
                    />
                </View> */}
        <View style={{ paddingBottom: 20 }}>
          <CustomNativeDropdown
            mode={false}
            keyField="key"
            valueField="value"
            enableDefaultOption={true}
            placeholder={
              capitalizeFirstLetter(values.employee_type) || 'Employee Type'
            }
            value={values.employee_type}
            onValueChange={value => setFieldValue('employee_type', value)}
            error={touched.employee_type && errors.employee_type}
            datas={['', ...employeeTypeLists]}
          />
        </View>
        <View style={{ paddingBottom: 20 }}>
          <Text
            style={{
              fontFamily: 'Poppins-Regular',
              fontSize: 15,
              color: '#6A7D94',
            }}>
            Probation Period
          </Text>
          <TextInput
            mode="flat"
            underlineColor="transparent"
            activeUnderlineColor="transparent"
            cursorColor={'#6A7D94'}
            placeholderTextColor="#6A7D94"
            textColor="#6A7D94"
            onChangeText={text => setFieldValue('probation_period', text)}
            value={values.probation_period}
            style={[
              styles.input,
              touched.probation_period && errors.probation_period
                ? styles.errorBorder
                : null,
            ]}
            theme={{
              fonts: {
                bodyLarge: {
                  ...theme.fonts.bodyMedium,
                  fontFamily: 'Poppins-Regular',
                },
              },
            }}
          />
        </View>
        <View style={{ paddingBottom: 20 }}>
          {/* <Text style={{ fontFamily: 'Poppins-Regular', fontSize: 15, color: '#6A7D94' }}>Reporting Manager</Text> */}
          {/* <TextInput
                        mode="flat"
                        underlineColor="transparent"
                        activeUnderlineColor="transparent"
                        cursorColor={'#6A7D94'}

                        placeholderTextColor="#6A7D94"
                        textColor='#6A7D94'

                        onChangeText={text => setFieldValue('reporting_manager', text)}
                        value={values.reporting_manager}
                        style={[
                            styles.input,
                            touched.reporting_manager && errors.reporting_manager
                                ? styles.errorBorder
                                : null,
                        ]}
                        theme={{
                            fonts: { bodyLarge: { ...theme.fonts.bodyMedium, fontFamily: "Poppins-Regular" } },
                        }}
                    /> */}

          <CustomNativeDropdown
            mode={true}
            keyField="id"
            valueField="name"
            modeType="reportingManager"
            enableDefaultOption={true}
            placeholder={'Select Reporting Manager'}
            value={values.reporting_manager}
            onValueChange={val => {
              setFieldValue('reporting_manager', val);
            }}
            error={touched.reporting_manager && errors.reporting_manager}
            datas={CompanyEmployeeListsData?.data}
          />
        </View>
        <View style={{ paddingBottom: 20 }}>
          <Text
            style={{
              fontFamily: 'Poppins-Regular',
              fontSize: 15,
              color: '#6A7D94',
            }}>
            CTC
          </Text>
          <TextInput
            mode="flat"
            underlineColor="transparent"
            activeUnderlineColor="transparent"
            cursorColor={'#6A7D94'}
            placeholderTextColor="#6A7D94"
            textColor="#6A7D94"
            onChangeText={text => setFieldValue('ctc', text)}
            value={values.ctc}
            style={[
              styles.input,
              touched.ctc && errors.ctc ? styles.errorBorder : null,
            ]}
            theme={{
              fonts: {
                bodyLarge: {
                  ...theme.fonts.bodyMedium,
                  fontFamily: 'Poppins-Regular',
                },
              },
            }}
          />
        </View>
        <View style={{ paddingBottom: 20 }}>
          <Text
            style={{
              fontFamily: 'Poppins-Regular',
              fontSize: 15,
              color: '#6A7D94',
            }}>
            Bank Name
          </Text>
          <TextInput
            mode="flat"
            underlineColor="transparent"
            activeUnderlineColor="transparent"
            cursorColor={'#6A7D94'}
            placeholderTextColor="#6A7D94"
            textColor="#6A7D94"
            onChangeText={text => setFieldValue('bank', text)}
            value={values.bank}
            style={[
              styles.input,
              touched.bank && errors.bank ? styles.errorBorder : null,
            ]}
            theme={{
              fonts: {
                bodyLarge: {
                  ...theme.fonts.bodyMedium,
                  fontFamily: 'Poppins-Regular',
                },
              },
            }}
          />
        </View>
        <View style={{ paddingBottom: 20 }}>
          <Text
            style={{
              fontFamily: 'Poppins-Regular',
              fontSize: 15,
              color: '#6A7D94',
            }}>
            Branch Name
          </Text>
          <TextInput
            mode="flat"
            underlineColor="transparent"
            activeUnderlineColor="transparent"
            cursorColor={'#6A7D94'}
            placeholderTextColor="#6A7D94"
            textColor="#6A7D94"
            onChangeText={text => setFieldValue('branch', text)}
            value={values.branch}
            style={[
              styles.input,
              touched.branch && errors.branch ? styles.errorBorder : null,
            ]}
            theme={{
              fonts: {
                bodyLarge: {
                  ...theme.fonts.bodyMedium,
                  fontFamily: 'Poppins-Regular',
                },
              },
            }}
          />
        </View>
        <View style={{ paddingBottom: 20 }}>
          <Text
            style={{
              fontFamily: 'Poppins-Regular',
              fontSize: 15,
              color: '#6A7D94',
            }}>
            City
          </Text>
          <TextInput
            mode="flat"
            underlineColor="transparent"
            activeUnderlineColor="transparent"
            cursorColor={'#6A7D94'}
            placeholderTextColor="#6A7D94"
            textColor="#6A7D94"
            onChangeText={text => setFieldValue('city', text)}
            value={values.city}
            style={[
              styles.input,
              touched.city && errors.city ? styles.errorBorder : null,
            ]}
            theme={{
              fonts: {
                bodyLarge: {
                  ...theme.fonts.bodyMedium,
                  fontFamily: 'Poppins-Regular',
                },
              },
            }}
          />
        </View>
        <View style={{ paddingBottom: 20 }}>
          <Text
            style={{
              fontFamily: 'Poppins-Regular',
              fontSize: 15,
              color: '#6A7D94',
            }}>
            IFSC Code
          </Text>
          <TextInput
            mode="flat"
            underlineColor="transparent"
            activeUnderlineColor="transparent"
            cursorColor={'#6A7D94'}
            placeholderTextColor="#6A7D94"
            textColor="#6A7D94"
            onChangeText={text => setFieldValue('ifsc', text)}
            value={values.ifsc}
            style={[
              styles.input,
              touched.ifsc && errors.ifsc ? styles.errorBorder : null,
            ]}
            theme={{
              fonts: {
                bodyLarge: {
                  ...theme.fonts.bodyMedium,
                  fontFamily: 'Poppins-Regular',
                },
              },
            }}
          />
        </View>
        <View style={{ paddingBottom: 20 }}>
          <Text
            style={{
              fontFamily: 'Poppins-Regular',
              fontSize: 15,
              color: '#6A7D94',
            }}>
            Account Number
          </Text>
          <TextInput
            mode="flat"
            underlineColor="transparent"
            activeUnderlineColor="transparent"
            cursorColor={'#6A7D94'}
            placeholderTextColor="#6A7D94"
            textColor="#6A7D94"
            onChangeText={text => setFieldValue('account_number', text)}
            value={values.account_number}
            style={[
              styles.input,
              touched.account_number && errors.account_number
                ? styles.errorBorder
                : null,
            ]}
            theme={{
              fonts: {
                bodyLarge: {
                  ...theme.fonts.bodyMedium,
                  fontFamily: 'Poppins-Regular',
                },
              },
            }}
          />
        </View>

        <TouchableOpacity
          disabled={isUpdating ? true : false}
          onPress={() => {
            formikProps.validateForm().then(errors => {
              if (Object.keys(errors).length > 0) {
                focusFirstError(errors);
              } else {
                formikProps.handleSubmit();
              }
            });
          }}
          style={{
            height: 52,
            backgroundColor: '#CA282C',
            borderRadius: 8,
            justifyContent: 'center',
            alignItems: 'center',
            marginTop: 30,
          }}>
          {isUpdating ? (
            <ActivityIndicator color={'white'} />
          ) : (
            <Text
              style={{
                fontFamily: 'Poppins-Medium',
                color: 'white',
                fontSize: 15,
              }}>
              {/* {id ? 'Update' : 'Add'} Employee */}
              {id ? 'Save Changes' : 'Add Employees'}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    );
  };

  const WrapperComponent =
    isLoading || CompanyEmployeeListsDataIsLoading ? ScrollView : ScrollView;
  return (
    <SafeAreaView style={{ flex: 1 }}>
      <ImageBackground
        source={backgroundImage}
        resizeMode="cover"
        style={{ flex: 1, paddingTop: STATUS_BAR_HEIGHT(), ...StyleSheet.absoluteFillObject }}>
        <TopNavBar navigation={navigation} title={'Employee Manage'} />
        <KeyboardAvoidingView style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 20 : 0} >
          <WrapperComponent
            ref={scrollViewRef}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ paddingBottom: bottomHeight() }}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={['black']}
              />
            }>
            <View style={{ flex: 1 }}>
              <Skeleton isLoading={isLoading || CompanyEmployeeListsDataIsLoading} layout={getLayout({ length: 8, height: 82 })}>
                <Formik
                  enableReinitialize
                  initialValues={{
                    id: EmployeesData?.employees[0]?.id || '',
                    employee_id: EmployeesData?.employees[0]?.employee_id || '',
                    first_name: EmployeesData?.employees[0]?.first_name || '',
                    last_name: EmployeesData?.employees[0]?.last_name || '',
                    official_email_id:
                      EmployeesData?.employees[0]?.official_email_id || '',
                    date_of_Joining:
                      EmployeesData?.employees[0]?.date_of_Joining || '',
                    marital_status:
                      EmployeesData?.employees[0]?.marital_status || '',
                    blood_group: EmployeesData?.employees[0]?.blood_group || '',
                    email_id: EmployeesData?.employees[0]?.email_id || '',
                    contact_number:
                      EmployeesData?.employees[0]?.contact_number || '',
                    current_address:
                      EmployeesData?.employees[0]?.current_address || '',
                    permanent_address:
                      EmployeesData?.employees[0]?.permanent_address || '',
                    probation_status:
                      EmployeesData?.employees[0]?.probation_status || '',
                    dob: EmployeesData?.employees[0]?.dob || '',
                    gender: EmployeesData?.employees[0]?.gender || '',
                    emergency_contact_name:
                      EmployeesData?.employees[0]?.emergency_contact_name || '',
                    emergency_contact_number:
                      EmployeesData?.employees[0]?.emergency_contact_number || '',
                    alternate_phone:
                      EmployeesData?.employees[0]?.alternate_phone || '',
                    experience: EmployeesData?.employees[0]?.experience || '',
                    job_title: EmployeesData?.employees[0]?.job_title || '',
                    work_location:
                      EmployeesData?.employees[0]?.work_location || '',
                    department: EmployeesData?.employees[0]?.department || '',
                    sub_department:
                      EmployeesData?.employees[0]?.sub_department || '',
                    designation: EmployeesData?.employees[0]?.designation || '',
                    employee_type:
                      EmployeesData?.employees[0]?.employee_type || '',
                    probation_period:
                      EmployeesData?.employees[0]?.probation_period || '',
                    reporting_manager:
                      EmployeesData?.employees[0]?.reporting_manager || '',
                    ctc: EmployeesData?.employees[0]?.ctc || '',
                    bank: EmployeesData?.employees[0]?.bank || '',
                    branch: EmployeesData?.employees[0]?.branch || '',
                    city: EmployeesData?.employees[0]?.city || '',
                    ifsc: EmployeesData?.employees[0]?.ifsc || '',
                    account_number:
                      EmployeesData?.employees[0]?.account_number || '',
                  }}
                  validationSchema={PersonalDetailsValidation}
                  onSubmit={values => {
                    handleUpdatePersonalDetails(values);
                  }}>
                  {formikProps => (
                    <GridData
                      inputRefs={inputRefs}
                      dobViewRef={dobViewRef}
                      dateOfJoiningViewRef={dateOfJoiningViewRef}
                      formikProps={formikProps}
                      handleSubmit={formikProps.handleSubmit}
                      values={formikProps.values}
                      setFieldValue={formikProps.setFieldValue}
                      errors={formikProps.errors}
                      touched={formikProps.touched}
                      isUpdating={isUpdating || UpdatePersonalDetailsLoading}
                      EmployeesData={EmployeesData}
                      subDepartmentsOptions={subDepartmentsOptions}
                      subDepartmentsLoading={subDepartmentsLoading}
                      DepartmentsData={DepartmentsData?.data}
                      onDepartmentChange={async deptId => {
                        formikProps.setFieldValue('department', deptId?.key);
                        formikProps.setFieldValue('sub_department', '');
                        await fetchSubDepartmentsByDept(deptId?.key);
                      }}
                    />
                  )}
                </Formik>
              </Skeleton>
            </View>
          </WrapperComponent>
        </KeyboardAvoidingView>

      </ImageBackground>
    </SafeAreaView >
  );
};
const styles = StyleSheet.create({
  input: {
    position: 'relative',
    borderWidth: 0,
    paddingHorizontal: 15,
    borderRadius: 5,
    backgroundColor: '#fff',
    height: 57,
    fontFamily: 'Poppins-Medium',
    fontSize: 14,
    color: '#6A7D94',
    lineHeight: 15,
    justifyContent: 'center',
  },
  errorBorder: {
    borderWidth: 1,
    borderColor: 'red',
  },
  errorText: {
    color: 'red',
  },
});

export default EmployeeEdit;
