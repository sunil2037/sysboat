import React, { useCallback, useState } from 'react';
import { View, Text, ImageBackground, ScrollView, StyleSheet, RefreshControl } from 'react-native';
import backgroundImage from '../../../../assets/Icon/background.png';
import { Formik } from 'formik';
import { useQuery } from '@tanstack/react-query';
import { TextInput, useTheme } from 'react-native-paper';
import useApi from '../../../Apis/Services/ApiConfig';
import TopNavBar from '../../../navigation/TopNavBar';
import useEncodedUserData from '../../../hooks/useEncodedUserData';
import { capitalizeFirstLetter } from '../../../Helper/StringHelpers';
import { SafeAreaView } from 'react-native-safe-area-context';
import { bottomHeight, STATUS_BAR_HEIGHT, SystemOS } from '../../../Helper/Helper';
import Skeleton, { getLayout } from '../../../Helper/Skeleton';
import ThemedText from '../../../Helper/ThemedText';

const FIELDS = [
  ['date_of_Joining', 'Joining Date'],
  ['reporting_manager_name', 'Reporting Manager'],
  ['work_location', 'Work Location'],
  ['employee_type', 'Employeement Type'],
  ['experience', 'Experience'],
  ['probation_period', 'Probation Period'],
  ['job_title', 'Job Title'],
  ['designation', 'Designation'],
  ['department_name', 'Department Name'],
  ['sub_department_name', 'Sub Department Name'],
];

const GridData = ({ values }) => {
  const theme = useTheme();
  const inputStyle = {
    position: 'relative', borderWidth: 0, paddingHorizontal: 15, borderRadius: 5,
    backgroundColor: '#fff', height: 57, fontFamily: 'Poppins-Medium', fontSize: 14,
    color: '#6A7D94', lineHeight: SystemOS() ? 15 : 0, justifyContent: 'center',
  };
  return (
    <View style={{ paddingBottom: bottomHeight(), paddingHorizontal: 20 }}>
      {FIELDS.map(([key, label]) => (
        <View key={key} style={{ paddingBottom: 20, gap: 8 }}>
          <ThemedText weight='Medium' size='md'>
            {label}
          </ThemedText>
          <TextInput
            mode="flat" readOnly cursorColor="#6A7D94"
            underlineColor="transparent" activeUnderlineColor="transparent"
            placeholderTextColor="#6A7D94" textColor="#6A7D94"
            value={values[key]} style={inputStyle}
            theme={{ fonts: { bodyLarge: { ...theme.fonts.bodyMedium, fontFamily: 'Poppins-Regular' } } }}
          />
        </View>
      ))}
    </View>
  );
};

const WorkView = ({ navigation }) => {
  const { WorkDetailsFetch } = useApi();
  const [refreshing, setRefreshing] = useState(false);
  const { userdata } = useEncodedUserData();

  const { data: WD, isLoading, isPending, refetch } = useQuery({
    queryKey: ['WorkDetailsFetch', userdata],
    queryFn: () => WorkDetailsFetch({ type: 'Work', userData: userdata }),
    enabled: !!userdata,
  });

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const cap = key => capitalizeFirstLetter(WD?.data?.[key]) || '';

  const initialValues = {
    date_of_Joining: WD?.data?.date_of_Joining || '',
    reporting_manager_name: cap('reporting_manager_name'),
    work_location: cap('work_location'),
    employee_type: cap('employee_type'),
    experience: WD?.data?.experience || '',
    probation_period: WD?.data?.probation_period || '',
    job_title: cap('job_title'),
    designation: cap('designation'),
    department_name: cap('department_name'),
    sub_department_name: cap('sub_department_name'),
  };

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <ImageBackground source={backgroundImage} resizeMode="cover" style={{ ...StyleSheet.absoluteFillObject, flex: 1, paddingTop: STATUS_BAR_HEIGHT() }}>
        <TopNavBar navigation={navigation} title="Work Details" />
        <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['black']} />}>
          <Skeleton isLoading={isPending || isLoading} layout={getLayout({ length: 11 })}>
            <Formik enableReinitialize initialValues={initialValues}>
              {({ values }) => <GridData values={values} />}
            </Formik>
          </Skeleton>
        </ScrollView>
      </ImageBackground>
    </SafeAreaView>
  );
};

export default WorkView;