import React, { useCallback, useRef, useState } from 'react';
import {
  View, ImageBackground, ScrollView, TouchableOpacity,
  StyleSheet, Pressable, ActivityIndicator, KeyboardAvoidingView,
  RefreshControl, Platform,
} from 'react-native';
import moment from 'moment';
import backgroundImage from '../../../../assets/Icon/background.png';
import { Calendar, Cross } from '../../../Helper/IconsLoad';
import { Formik } from 'formik';
import { DateTimePickerComponent } from '../../../Helper/DateTimePicker';
import { useMutation, useQuery } from '@tanstack/react-query';
import useApi from '../../../Apis/Services/ApiConfig';
import { PersonalDetailsValidation } from '../../../Helper/Validation';
import TopNavBar from '../../../navigation/TopNavBar';
import CustomNativeDropdown from '../../../Helper/CustomNativeDropdown';
import useEncodedUserData from '../../../hooks/useEncodedUserData';
import { toast } from '../../../Helper/ToastManager';
import { SafeAreaView } from 'react-native-safe-area-context';
import { bottomHeight, STATUS_BAR_HEIGHT, SystemOS } from '../../../Helper/Helper';
import { useAuth } from '../../../Context/AuthContext';
import { TextInput } from 'react-native-gesture-handler';
import Skeleton, { getLayout } from '../../../Helper/Skeleton';
import ThemedText from '../../../Helper/ThemedText';

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
const MARITAL_STATUS = ['Single', 'Married', 'Unmarried'];
const GENDERS = ['Male', 'Female', 'Other'];


const styles = StyleSheet.create({
  input: { position: 'relative', borderWidth: 0, paddingHorizontal: 15, borderRadius: 5, backgroundColor: '#fff', height: 57, fontFamily: 'Poppins-Regular', fontSize: 14, color: '#6A7D94', justifyContent: 'center' },
  errorBorder: { borderWidth: 1, borderColor: 'red' },
});


const inputStyle = [styles.input, { lineHeight: SystemOS() ? 15 : 0 }];

const FormInput = ({ disabled, error, touched, fieldKey, label, setFieldValue, value, style, ...props }) => (
  <View style={{ paddingBottom: 20, gap: 8 }}>
    <ThemedText size="md" weight="Medium">{label}</ThemedText>
    <TextInput
      disabled={disabled}
      underlineColor="transparent"
      activeUnderlineColor="transparent"
      cursorColor="#6A7D94"
      placeholderTextColor="#6A7D94"
      textColor="#6A7D94"
      value={value}
      onChangeText={setFieldValue ? text => setFieldValue(fieldKey, text) : undefined}
      style={[...inputStyle, touched && error ? styles.errorBorder : null, style]}
      {...props}
    />
  </View>
);

const NumericInput = ({ fieldKey, maxLength = 10, setFieldValue, ...props }) => (
  <FormInput
    keyboardType="number-pad"
    maxLength={maxLength}
    onChangeText={text => setFieldValue(fieldKey, text.replace(/[^0-9]/g, '').slice(0, maxLength))}
    setFieldValue={null}
    fieldKey={fieldKey}
    {...props}
  />
);

const GridData = ({ handleSubmit, values, setFieldValue, errors, touched, isUpdating, disabled = false }) => {
  const [visibleDob, setVisibleDob] = useState(false);
  const dp = (key, placeholder, data) => (
    <CustomNativeDropdown
      disabled={disabled}
      enableDefaultOption
      placeholder={placeholder}
      value={values[key]}
      onValueChange={v => setFieldValue(key, v)}
      error={touched[key] && errors[key]}
      datas={['', ...data]}
    />
  );

  return (
    <View style={{ paddingBottom: bottomHeight(), paddingHorizontal: 20 }}>

      {/* First & Last Name */}
      <View style={{ paddingBottom: 20, flexDirection: 'row', gap: 10 }}>
        {['firstName', 'lastName'].map((key, i) => (
          <View key={key} style={{ flex: 1, gap: 8 }}>
            <ThemedText size="md" weight="Medium">{i === 0 ? 'First Name' : 'Last Name'}</ThemedText>
            <TextInput
              disabled={disabled}
              underlineColor="transparent"
              activeUnderlineColor="transparent"
              cursorColor="#6A7D94"
              placeholderTextColor="#6A7D94"
              textColor="#6A7D94"
              value={values[key]}
              onChangeText={text => setFieldValue(key, text)}
              style={[styles.input, touched[key] && errors[key] ? styles.errorBorder : null, { flex: 1, fontSize: 15, lineHeight: SystemOS() ? 15 : 0 }]}
            />
          </View>
        ))}
      </View>

      {dp('bloodGroups', 'Blood Group', BLOOD_GROUPS)}

      {/* Date of Birth */}
      <View style={{ flex: 1, paddingTop: 20 }}>
        <Pressable disabled={disabled} onPress={() => setVisibleDob(!visibleDob)}>
          <View style={[styles.input, errors.dob ? styles.errorBorder : null, { lineHeight: SystemOS() ? 15 : 0 }]}>
            <ThemedText size="sm" weight="Regular" color="secondary">
              {values.dob ? moment(values.dob, ['YYYY-MM-DD', 'YYYYMMDD']).format('DD/MM/YYYY') : 'Date Of Birth'}
            </ThemedText>
            {values.dob ? (
              <TouchableOpacity onPress={() => setFieldValue('dob', '')} style={{ position: 'absolute', right: 10, top: '50%', zIndex: 9999, transform: [{ translateY: '-50%' }] }}>
                <Cross color="#6A7D94" width={25} height={25} />
              </TouchableOpacity>
            ) : (
              <View style={{ position: 'absolute', right: 10, top: '50%', transform: [{ translateY: '-50%' }] }}>
                <Calendar color="#6A7D94" width={25} height={25} />
              </View>
            )}
          </View>
          <DateTimePickerComponent
            error={touched.dob && errors.dob}
            visible={visibleDob}
            setVisible={setVisibleDob}
            onChange={date => setFieldValue('dob', date)}
            value={values.dob ? new Date(values.dob) : new Date()}
          />
        </Pressable>
      </View>

      <View style={{ paddingTop: 20 }}>{dp('martialStatus', 'Marital Status', MARITAL_STATUS)}</View>
      <View style={{ paddingTop: 20, marginBottom: 15 }}>{dp('genderLists', 'Gender', GENDERS)}</View>

      <FormInput disabled={disabled} label="Contact Number" fieldKey="contactNumber" value={values.contactNumber} keyboardType="number-pad" maxLength={10} readOnly />
      <NumericInput disabled={disabled} label="Alternate Number" fieldKey="alternateNumber" value={values.alternateNumber} error={errors.alternateNumber} touched={touched.alternateNumber} setFieldValue={setFieldValue} />
      <FormInput disabled={disabled} label="Emergency Name" fieldKey="emergencyName" value={values.emergencyName} setFieldValue={setFieldValue} error={errors.emergencyName} touched={touched.emergencyName} />
      <NumericInput disabled={disabled} label="Emergency Number" fieldKey="emergencyNumber" value={values.emergencyNumber} error={errors.emergencyNumber} touched={touched.emergencyNumber} setFieldValue={setFieldValue} />
      <FormInput disabled={disabled} label="Official Email" fieldKey="official_email_id" value={values.official_email_id} readOnly />
      <FormInput disabled={disabled} label="Email" fieldKey="email_id" value={values.email_id} readOnly />
      <FormInput disabled={disabled} label="Current Address" fieldKey="currentAddress" value={values.currentAddress} setFieldValue={setFieldValue} error={errors.currentAddress} touched={touched.currentAddress} />
      <FormInput disabled={disabled} label="Permanent Address" fieldKey="permanentAddress" value={values.permanentAddress} setFieldValue={setFieldValue} error={errors.permanentAddress} touched={touched.permanentAddress} />
      <FormInput disabled={disabled} label="Instagram Link" fieldKey="instagramLink" value={values.instagramLink} setFieldValue={setFieldValue} error={errors.instagramLink} touched={touched.instagramLink} />
      <FormInput disabled={disabled} label="Facebook Link" fieldKey="facebookLink" value={values.facebookLink} setFieldValue={setFieldValue} error={errors.facebookLink} touched={touched.facebookLink} />
      <FormInput disabled={disabled} label="LinkedIn Link" fieldKey="linkedinLink" value={values.linkedinLink} setFieldValue={setFieldValue} error={errors.linkedinLink} touched={touched.linkedinLink} style={{ paddingBottom: 0 }} />

      {!disabled && (
        <TouchableOpacity disabled={isUpdating} onPress={handleSubmit} style={{ height: 52, backgroundColor: '#CA282C', borderRadius: 8, justifyContent: 'center', alignItems: 'center', marginTop: 30 }}>
          {isUpdating ? <ActivityIndicator color="white" /> : <ThemedText size="md" weight="Medium" color="inverse">Save</ThemedText>}
        </TouchableOpacity>
      )}
    </View>
  );
};

const EditPersonalDetails = ({ navigation }) => {
  const { userdata } = useEncodedUserData();
  const { permissions } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const valueRef = useRef(null);
  const { PersonalDetails, PersonalDetailsUpdate } = useApi();

  const { data: PD, isLoading, isPending, refetch } = useQuery({
    queryKey: ['PersonalDetails', userdata],
    queryFn: () => PersonalDetails({ type: 'Personal', UserId: '', userData: userdata }),
    enabled: !!userdata,
  });

  const { mutate: updateDetails, isPending: isUpdating, isLoading: UpdatePersonaLoading } = useMutation({
    mutationFn: async (vals) => PersonalDetailsUpdate({
      userData: userdata, type: 'Personal',
      id: vals.id, first_name: vals.firstName, last_name: vals.lastName,
      blood_group: vals.bloodGroups, dob: vals.dob, marital_status: vals.martialStatus,
      gender: vals.genderLists, alternate_phone: vals.alternateNumber,
      emergency_contact_name: vals.emergencyName, emergency_contact_number: vals.emergencyNumber,
      current_address: vals.currentAddress, permanent_address: vals.permanentAddress,
      instagram: vals.instagramLink, facebook: vals.facebookLink, linkedin: vals.linkedinLink,
      email_id: vals.emailId, official_email_id: vals.official_email_id,
    }),
    onSuccess: async r => { toast.success(r.message); await refetch(); },
    onError: e => { console.warn('Query failed:', e); toast.error(e.message); },
  });

  const handleSubmit = v => {
    valueRef.current = v;
    updateDetails({
      ...v,
      dob: new Date(v.dob).toLocaleDateString('en-CA') || '',
      emailId: v.email_id || '',
    });
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const initialValues = {
    id: PD?.data?.id || '',
    firstName: PD?.data?.first_name || '',
    lastName: PD?.data?.last_name || '',
    contactNumber: PD?.data?.contact_number || '',
    emergencyName: PD?.data?.emergency_contact_name || '',
    emergencyNumber: PD?.data?.emergency_contact_number || '',
    currentAddress: PD?.data?.current_address || '',
    permanentAddress: PD?.data?.permanent_address || '',
    instagramLink: PD?.SocialProfileData?.[0]?.instagram || '',
    facebookLink: PD?.SocialProfileData?.[0]?.facebook || '',
    linkedinLink: PD?.SocialProfileData?.[0]?.linkedin || '',
    bloodGroups: PD?.data?.blood_group || '',
    martialStatus: PD?.data?.marital_status || '',
    genderLists: PD?.data?.gender || '',
    email_id: PD?.data?.email_id || '',
    official_email_id: PD?.data?.official_email_id || '',
    alternateNumber: PD?.data?.alternate_phone || '',
    dob: PD?.data?.dob || '',
  };

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <ImageBackground source={backgroundImage} resizeMode="cover" style={{ ...StyleSheet.absoluteFillObject, flex: 1, paddingTop: STATUS_BAR_HEIGHT() }}>
        <TopNavBar navigation={navigation} title="Personal Details" />
        <KeyboardAvoidingView keyboardVerticalOffset={20} behavior={Platform.OS === 'ios' ? 'padding' : null} style={{ flex: 1 }}>
          <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled"
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['black']} />}>
            <View style={{ flex: 1 }}>
              <Skeleton highlightColor="#f5f5f5" boneColor="#fff" animationType="pulse" isLoading={isPending || isLoading} layout={getLayout({ length: 11 })}>
                <Formik enableReinitialize initialValues={initialValues} validationSchema={PersonalDetailsValidation} onSubmit={handleSubmit}>
                  {({ handleSubmit, values, setFieldValue, errors, touched }) => (
                    <GridData
                      handleSubmit={handleSubmit} values={values} setFieldValue={setFieldValue}
                      errors={errors} touched={touched} isUpdating={isUpdating || UpdatePersonaLoading}
                      disabled={permissions?.block_personal_info_edit === 1}
                    />
                  )}
                </Formik>
              </Skeleton>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </ImageBackground>
    </SafeAreaView>
  );
};

export default EditPersonalDetails;
