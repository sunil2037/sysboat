import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  ImageBackground,
  ScrollView,
  StyleSheet,
  Platform,
} from 'react-native';
import backgroundImage from '../../../assets/Icon/background.png';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import useApi from '../../Apis/Services/ApiConfig';
import { TextInput, useTheme } from 'react-native-paper';
import TopNavBar from '../../navigation/TopNavBar';

import useEncodedUserData from '../../hooks/useEncodedUserData';
import { useRoute } from '@react-navigation/native';
import Skeleton, { getLayout } from '../../Helper/Skeleton';
const GridData = ({ EmployeesDetailsData }) => {
  const theme = useTheme();

  return (
    <View style={{ paddingBottom: 30, paddingHorizontal: 20, gap: 20 }}>
      <Text
        style={{ fontFamily: 'Poppins-Medium', fontSize: 18, color: '#293646' }}>
        Personal Info
      </Text>
      <View style={{ flexDirection: 'row', gap: 10 }}>
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
            placeholderTextColor="#6A7D94"
            readOnly={true}
            value={EmployeesDetailsData?.first_name || ''}
            textColor="#6A7D94"
            theme={{
              fonts: {
                bodyLarge: {
                  ...theme.fonts.bodyMedium,
                  fontFamily: 'Poppins-Regular',
                },
              },
            }}
            style={[styles.input, { flex: 1, fontSize: 15 }]}
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
            underlineColor="transparent"
            activeUnderlineColor="transparent"
            cursorColor={'#6A7D94'}
            placeholderTextColor="#6A7D94"
            readOnly={true}
            value={EmployeesDetailsData?.last_name || ''}
            textColor="#6A7D94"
            theme={{
              fonts: {
                bodyLarge: {
                  ...theme.fonts.bodyMedium,
                  fontFamily: 'Poppins-Regular',
                },
              },
            }}
            style={[styles.input, { flex: 1, fontSize: 15 }]}
          />
        </View>
      </View>
      <View style={{ flex: 1 }}>
        <Text
          style={{
            fontFamily: 'Poppins-Regular',
            fontSize: 15,
            color: '#6A7D94',
          }}>
          Date Of Birth
        </Text>
        <TextInput
          mode="flat"
          underlineColor="transparent"
          activeUnderlineColor="transparent"
          cursorColor={'#6A7D94'}
          placeholderTextColor="#6A7D94"
          readOnly={true}
          value={
            EmployeesDetailsData?.dob &&
            (new Date(EmployeesDetailsData?.dob).toLocaleDateString() || '')
          }
          textColor="#6A7D94"
          theme={{
            fonts: {
              bodyLarge: {
                ...theme.fonts.bodyMedium,
                fontFamily: 'Poppins-Regular',
              },
            },
          }}
          style={[styles.input, { flex: 1, fontSize: 15 }]}
        />
      </View>
      <View style={{ flex: 1 }}>
        <Text
          style={{
            fontFamily: 'Poppins-Regular',
            fontSize: 15,
            color: '#6A7D94',
          }}>
          Gender
        </Text>
        <TextInput
          mode="flat"
          underlineColor="transparent"
          activeUnderlineColor="transparent"
          cursorColor={'#6A7D94'}
          placeholderTextColor="#6A7D94"
          readOnly={true}
          value={EmployeesDetailsData?.gender || ''}
          textColor="#6A7D94"
          theme={{
            fonts: {
              bodyLarge: {
                ...theme.fonts.bodyMedium,
                fontFamily: 'Poppins-Regular',
              },
            },
          }}
          style={[styles.input, { flex: 1, fontSize: 15 }]}
        />
      </View>
      <View style={{ flex: 1 }}>
        <Text
          style={{
            fontFamily: 'Poppins-Regular',
            fontSize: 15,
            color: '#6A7D94',
          }}>
          Blood Group
        </Text>
        <TextInput
          mode="flat"
          underlineColor="transparent"
          activeUnderlineColor="transparent"
          cursorColor={'#6A7D94'}
          placeholderTextColor="#6A7D94"
          readOnly={true}
          value={EmployeesDetailsData?.blood_group || ''}
          textColor="#6A7D94"
          theme={{
            fonts: {
              bodyLarge: {
                ...theme.fonts.bodyMedium,
                fontFamily: 'Poppins-Regular',
              },
            },
          }}
          style={[styles.input, { flex: 1, fontSize: 15 }]}
        />
      </View>
      <View style={{ flex: 1 }}>
        <Text
          style={{
            fontFamily: 'Poppins-Regular',
            fontSize: 15,
            color: '#6A7D94',
          }}>
          Martial Status
        </Text>
        <TextInput
          mode="flat"
          underlineColor="transparent"
          activeUnderlineColor="transparent"
          cursorColor={'#6A7D94'}
          placeholderTextColor="#6A7D94"
          readOnly={true}
          value={EmployeesDetailsData?.marital_status || ''}
          textColor="#6A7D94"
          theme={{
            fonts: {
              bodyLarge: {
                ...theme.fonts.bodyMedium,
                fontFamily: 'Poppins-Regular',
              },
            },
          }}
          style={[styles.input, { flex: 1, fontSize: 15 }]}
        />
      </View>
      <Text
        style={{ fontFamily: 'Poppins-Medium', fontSize: 18, color: '#293646' }}>
        Contact Info
      </Text>
      <View style={{ flex: 1 }}>
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
          cursorColor={'#6A7D94'}
          placeholderTextColor="#6A7D94"
          readOnly={true}
          value={EmployeesDetailsData?.official_email_id || ''}
          textColor="#6A7D94"
          theme={{
            fonts: {
              bodyLarge: {
                ...theme.fonts.bodyMedium,
                fontFamily: 'Poppins-Regular',
              },
            },
          }}
          style={[styles.input, { flex: 1, fontSize: 15 }]}
        />
      </View>
      <View style={{ flex: 1 }}>
        <Text
          style={{
            fontFamily: 'Poppins-Regular',
            fontSize: 15,
            color: '#6A7D94',
          }}>
          Personal Email
        </Text>
        <TextInput
          mode="flat"
          underlineColor="transparent"
          activeUnderlineColor="transparent"
          cursorColor={'#6A7D94'}
          placeholderTextColor="#6A7D94"
          readOnly={true}
          value={EmployeesDetailsData?.email_id || ''}
          textColor="#6A7D94"
          theme={{
            fonts: {
              bodyLarge: {
                ...theme.fonts.bodyMedium,
                fontFamily: 'Poppins-Regular',
              },
            },
          }}
          style={[styles.input, { flex: 1, fontSize: 15 }]}
        />
      </View>
      <View style={{ flex: 1 }}>
        <Text
          style={{
            fontFamily: 'Poppins-Regular',
            fontSize: 15,
            color: '#6A7D94',
          }}>
          Contact Name
        </Text>
        <TextInput
          mode="flat"
          underlineColor="transparent"
          activeUnderlineColor="transparent"
          cursorColor={'#6A7D94'}
          placeholderTextColor="#6A7D94"
          readOnly={true}
          value={
            EmployeesDetailsData?.first_name +
            ' ' +
            EmployeesDetailsData?.last_name || ''
          }
          textColor="#6A7D94"
          theme={{
            fonts: {
              bodyLarge: {
                ...theme.fonts.bodyMedium,
                fontFamily: 'Poppins-Regular',
              },
            },
          }}
          style={[styles.input, { flex: 1, fontSize: 15 }]}
        />
      </View>
      <View style={{ flex: 1 }}>
        <Text
          style={{
            fontFamily: 'Poppins-Regular',
            fontSize: 15,
            color: '#6A7D94',
          }}>
          Contact Number
        </Text>
        <TextInput
          mode="flat"
          underlineColor="transparent"
          activeUnderlineColor="transparent"
          cursorColor={'#6A7D94'}
          placeholderTextColor="#6A7D94"
          readOnly={true}
          value={EmployeesDetailsData?.contact_number || ''}
          textColor="#6A7D94"
          theme={{
            fonts: {
              bodyLarge: {
                ...theme.fonts.bodyMedium,
                fontFamily: 'Poppins-Regular',
              },
            },
          }}
          style={[styles.input, { flex: 1, fontSize: 15 }]}
        />
      </View>
      <View style={{ flex: 1 }}>
        <Text
          style={{
            fontFamily: 'Poppins-Regular',
            fontSize: 15,
            color: '#6A7D94',
          }}>
          Emergency Contact Name
        </Text>
        <TextInput
          mode="flat"
          underlineColor="transparent"
          activeUnderlineColor="transparent"
          cursorColor={'#6A7D94'}
          placeholderTextColor="#6A7D94"
          readOnly={true}
          value={EmployeesDetailsData?.emergency_contact_name || ''}
          textColor="#6A7D94"
          theme={{
            fonts: {
              bodyLarge: {
                ...theme.fonts.bodyMedium,
                fontFamily: 'Poppins-Regular',
              },
            },
          }}
          style={[styles.input, { flex: 1, fontSize: 15 }]}
        />
      </View>
      <View style={{ flex: 1 }}>
        <Text
          style={{
            fontFamily: 'Poppins-Regular',
            fontSize: 15,
            color: '#6A7D94',
          }}>
          Emergency Contact Number
        </Text>
        <TextInput
          mode="flat"
          underlineColor="transparent"
          activeUnderlineColor="transparent"
          cursorColor={'#6A7D94'}
          placeholderTextColor="#6A7D94"
          readOnly={true}
          value={EmployeesDetailsData?.emergency_contact_number || ''}
          textColor="#6A7D94"
          theme={{
            fonts: {
              bodyLarge: {
                ...theme.fonts.bodyMedium,
                fontFamily: 'Poppins-Regular',
              },
            },
          }}
          style={[styles.input, { flex: 1, fontSize: 15 }]}
        />
      </View>
      <Text
        style={{ fontFamily: 'Poppins-Medium', fontSize: 18, color: '#293646' }}>
        Address
      </Text>
      <View style={{ flex: 1 }}>
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
          placeholderTextColor="#6A7D94"
          readOnly={true}
          value={EmployeesDetailsData?.current_address || ''}
          textColor="#6A7D94"
          theme={{
            fonts: {
              bodyLarge: {
                ...theme.fonts.bodyMedium,
                fontFamily: 'Poppins-Regular',
              },
            },
          }}
          style={[styles.input, { flex: 1, fontSize: 15 }]}
        />
      </View>
      <View style={{ flex: 1 }}>
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
          readOnly={true}
          value={EmployeesDetailsData?.permanent_address || ''}
          textColor="#6A7D94"
          theme={{
            fonts: {
              bodyLarge: {
                ...theme.fonts.bodyMedium,
                fontFamily: 'Poppins-Regular',
              },
            },
          }}
          style={[styles.input, { flex: 1, fontSize: 15 }]}
        />
      </View>
      <Text
        style={{ fontFamily: 'Poppins-Medium', fontSize: 18, color: '#293646' }}>
        Social Profile
      </Text>
      <View style={{ flex: 1 }}>
        <Text
          style={{
            fontFamily: 'Poppins-Regular',
            fontSize: 15,
            color: '#6A7D94',
          }}>
          Linkedin
        </Text>
        <TextInput
          mode="flat"
          underlineColor="transparent"
          activeUnderlineColor="transparent"
          cursorColor={'#6A7D94'}
          placeholderTextColor="#6A7D94"
          readOnly={true}
          value={EmployeesDetailsData?.socialProfile?.linkedin || ''}
          textColor="#6A7D94"
          theme={{
            fonts: {
              bodyLarge: {
                ...theme.fonts.bodyMedium,
                fontFamily: 'Poppins-Regular',
              },
            },
          }}
          style={[styles.input, { flex: 1, fontSize: 15 }]}
        />
      </View>
      <View style={{ flex: 1 }}>
        <Text
          style={{
            fontFamily: 'Poppins-Regular',
            fontSize: 15,
            color: '#6A7D94',
          }}>
          Facebook
        </Text>
        <TextInput
          mode="flat"
          underlineColor="transparent"
          activeUnderlineColor="transparent"
          cursorColor={'#6A7D94'}
          placeholderTextColor="#6A7D94"
          readOnly={true}
          value={EmployeesDetailsData?.socialProfile?.facebook || ''}
          textColor="#6A7D94"
          theme={{
            fonts: {
              bodyLarge: {
                ...theme.fonts.bodyMedium,
                fontFamily: 'Poppins-Regular',
              },
            },
          }}
          style={[styles.input, { flex: 1, fontSize: 15 }]}
        />
      </View>
      <View style={{ flex: 1 }}>
        <Text
          style={{
            fontFamily: 'Poppins-Regular',
            fontSize: 15,
            color: '#6A7D94',
          }}>
          Instagram
        </Text>
        <TextInput
          mode="flat"
          underlineColor="transparent"
          activeUnderlineColor="transparent"
          cursorColor={'#6A7D94'}
          placeholderTextColor="#6A7D94"
          readOnly={true}
          value={EmployeesDetailsData?.socialProfile?.instagram || ''}
          textColor="#6A7D94"
          theme={{
            fonts: {
              bodyLarge: {
                ...theme.fonts.bodyMedium,
                fontFamily: 'Poppins-Regular',
              },
            },
          }}
          style={[styles.input, { flex: 1, fontSize: 15 }]}
        />
      </View>
      <Text
        style={{ fontFamily: 'Poppins-Medium', fontSize: 18, color: '#293646' }}>
        Work Info
      </Text>
      <View style={{ flex: 1 }}>
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
          underlineColor="transparent"
          activeUnderlineColor="transparent"
          cursorColor={'#6A7D94'}
          placeholderTextColor="#6A7D94"
          readOnly={true}
          value={EmployeesDetailsData?.employee_id || ''}
          textColor="#6A7D94"
          theme={{
            fonts: {
              bodyLarge: {
                ...theme.fonts.bodyMedium,
                fontFamily: 'Poppins-Regular',
              },
            },
          }}
          style={[styles.input, { flex: 1, fontSize: 15 }]}
        />
      </View>
      <View style={{ flex: 1 }}>
        <Text
          style={{
            fontFamily: 'Poppins-Regular',
            fontSize: 15,
            color: '#6A7D94',
          }}>
          Date Of Joining
        </Text>
        <TextInput
          mode="flat"
          underlineColor="transparent"
          activeUnderlineColor="transparent"
          cursorColor={'#6A7D94'}
          placeholderTextColor="#6A7D94"
          readOnly={true}
          value={
            EmployeesDetailsData?.date_of_Joining
              ? new Date(
                EmployeesDetailsData.date_of_Joining,
              ).toLocaleDateString()
              : ''
          }
          textColor="#6A7D94"
          theme={{
            fonts: {
              bodyLarge: {
                ...theme.fonts.bodyMedium,
                fontFamily: 'Poppins-Regular',
              },
            },
          }}
          style={[styles.input, { flex: 1, fontSize: 15 }]}
        />
      </View>
      <View style={{ flex: 1 }}>
        <Text
          style={{
            fontFamily: 'Poppins-Regular',
            fontSize: 15,
            color: '#6A7D94',
          }}>
          Probabtion Period
        </Text>
        <TextInput
          mode="flat"
          underlineColor="transparent"
          activeUnderlineColor="transparent"
          cursorColor={'#6A7D94'}
          placeholderTextColor="#6A7D94"
          readOnly={true}
          value={EmployeesDetailsData?.probation_period || ''}
          textColor="#6A7D94"
          theme={{
            fonts: {
              bodyLarge: {
                ...theme.fonts.bodyMedium,
                fontFamily: 'Poppins-Regular',
              },
            },
          }}
          style={[styles.input, { flex: 1, fontSize: 15 }]}
        />
      </View>
      <View style={{ flex: 1 }}>
        <Text
          style={{
            fontFamily: 'Poppins-Regular',
            fontSize: 15,
            color: '#6A7D94',
          }}>
          Employee Type
        </Text>
        <TextInput
          mode="flat"
          underlineColor="transparent"
          activeUnderlineColor="transparent"
          cursorColor={'#6A7D94'}
          placeholderTextColor="#6A7D94"
          readOnly={true}
          value={EmployeesDetailsData?.employee_type || ''}
          textColor="#6A7D94"
          theme={{
            fonts: {
              bodyLarge: {
                ...theme.fonts.bodyMedium,
                fontFamily: 'Poppins-Regular',
              },
            },
          }}
          style={[styles.input, { flex: 1, fontSize: 15 }]}
        />
      </View>
      <View style={{ flex: 1 }}>
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
          readOnly={true}
          value={EmployeesDetailsData?.work_location || ''}
          textColor="#6A7D94"
          theme={{
            fonts: {
              bodyLarge: {
                ...theme.fonts.bodyMedium,
                fontFamily: 'Poppins-Regular',
              },
            },
          }}
          style={[styles.input, { flex: 1, fontSize: 15 }]}
        />
      </View>
      <View style={{ flex: 1 }}>
        <Text
          style={{
            fontFamily: 'Poppins-Regular',
            fontSize: 15,
            color: '#6A7D94',
          }}>
          Probation Status
        </Text>
        <TextInput
          mode="flat"
          underlineColor="transparent"
          activeUnderlineColor="transparent"
          cursorColor={'#6A7D94'}
          placeholderTextColor="#6A7D94"
          readOnly={true}
          value={EmployeesDetailsData?.probation_status || ''}
          textColor="#6A7D94"
          theme={{
            fonts: {
              bodyLarge: {
                ...theme.fonts.bodyMedium,
                fontFamily: 'Poppins-Regular',
              },
            },
          }}
          style={[styles.input, { flex: 1, fontSize: 15 }]}
        />
      </View>
      <View style={{ flex: 1 }}>
        <Text
          style={{
            fontFamily: 'Poppins-Regular',
            fontSize: 15,
            color: '#6A7D94',
          }}>
          Status
        </Text>
        <TextInput
          mode="flat"
          underlineColor="transparent"
          activeUnderlineColor="transparent"
          cursorColor={'#6A7D94'}
          placeholderTextColor="#6A7D94"
          readOnly={true}
          value={EmployeesDetailsData?.status || ''}
          textColor="#6A7D94"
          theme={{
            fonts: {
              bodyLarge: {
                ...theme.fonts.bodyMedium,
                fontFamily: 'Poppins-Regular',
              },
            },
          }}
          style={[styles.input, { flex: 1, fontSize: 15 }]}
        />
      </View>
      <View style={{ flex: 1 }}>
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
          readOnly={true}
          value={EmployeesDetailsData?.experience || ''}
          textColor="#6A7D94"
          theme={{
            fonts: {
              bodyLarge: {
                ...theme.fonts.bodyMedium,
                fontFamily: 'Poppins-Regular',
              },
            },
          }}
          style={[styles.input, { flex: 1, fontSize: 15 }]}
        />
      </View>
      <View style={{ flex: 1 }}>
        <Text
          style={{
            fontFamily: 'Poppins-Regular',
            fontSize: 15,
            color: '#6A7D94',
          }}>
          Reporting Manager Name
        </Text>
        <TextInput
          mode="flat"
          underlineColor="transparent"
          activeUnderlineColor="transparent"
          cursorColor={'#6A7D94'}
          placeholderTextColor="#6A7D94"
          readOnly={true}
          value={EmployeesDetailsData?.reporting_manager_name || ''}
          textColor="#6A7D94"
          theme={{
            fonts: {
              bodyLarge: {
                ...theme.fonts.bodyMedium,
                fontFamily: 'Poppins-Regular',
              },
            },
          }}
          style={[styles.input, { flex: 1, fontSize: 15 }]}
        />
      </View>
      <View style={{ flex: 1 }}>
        <Text
          style={{
            fontFamily: 'Poppins-Regular',
            fontSize: 15,
            color: '#6A7D94',
          }}>
          Designation
        </Text>
        <TextInput
          mode="flat"
          underlineColor="transparent"
          activeUnderlineColor="transparent"
          cursorColor={'#6A7D94'}
          placeholderTextColor="#6A7D94"
          readOnly={true}
          value={EmployeesDetailsData?.designation || ''}
          textColor="#6A7D94"
          theme={{
            fonts: {
              bodyLarge: {
                ...theme.fonts.bodyMedium,
                fontFamily: 'Poppins-Regular',
              },
            },
          }}
          style={[styles.input, { flex: 1, fontSize: 15 }]}
        />
      </View>
      <View style={{ flex: 1 }}>
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
          readOnly={true}
          value={EmployeesDetailsData?.job_title || ''}
          textColor="#6A7D94"
          theme={{
            fonts: {
              bodyLarge: {
                ...theme.fonts.bodyMedium,
                fontFamily: 'Poppins-Regular',
              },
            },
          }}
          style={[styles.input, { flex: 1, fontSize: 15 }]}
        />
      </View>
      <View style={{ flex: 1 }}>
        <Text
          style={{
            fontFamily: 'Poppins-Regular',
            fontSize: 15,
            color: '#6A7D94',
          }}>
          Department
        </Text>
        <TextInput
          mode="flat"
          underlineColor="transparent"
          activeUnderlineColor="transparent"
          cursorColor={'#6A7D94'}
          placeholderTextColor="#6A7D94"
          readOnly={true}
          value={EmployeesDetailsData?.departmentName || ''}
          textColor="#6A7D94"
          theme={{
            fonts: {
              bodyLarge: {
                ...theme.fonts.bodyMedium,
                fontFamily: 'Poppins-Regular',
              },
            },
          }}
          style={[styles.input, { flex: 1, fontSize: 15 }]}
        />
      </View>
      <View style={{ flex: 1 }}>
        <Text
          style={{
            fontFamily: 'Poppins-Regular',
            fontSize: 15,
            color: '#6A7D94',
          }}>
          Sub Department
        </Text>
        <TextInput
          mode="flat"
          underlineColor="transparent"
          activeUnderlineColor="transparent"
          cursorColor={'#6A7D94'}
          placeholderTextColor="#6A7D94"
          readOnly={true}
          value={EmployeesDetailsData?.sub_departmentName || ''}
          textColor="#6A7D94"
          theme={{
            fonts: {
              bodyLarge: {
                ...theme.fonts.bodyMedium,
                fontFamily: 'Poppins-Regular',
              },
            },
          }}
          style={[styles.input, { flex: 1, fontSize: 15 }]}
        />
      </View>
      <View style={{}}>
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
          textColor="#6A7D94"
          placeholderTextColor="#6A7D94"
          readOnly={true}
          value={EmployeesDetailsData?.bank}
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
      <View style={{}}>
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
          readOnly={true}
          value={EmployeesDetailsData?.branch}
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
      <View style={{}}>
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
          readOnly={true}
          value={EmployeesDetailsData.city}
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
      <View style={{}}>
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
          readOnly={true}
          placeholderTextColor="#6A7D94"
          textColor="#6A7D94"
          value={EmployeesDetailsData.ifsc}
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
      <View style={{}}>
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
          readOnly={true}
          value={EmployeesDetailsData.account_number}
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
    </View>
  );
};

const EmployeesView = ({ navigation }) => {
  const route = useRoute();
  const { userdata } = useEncodedUserData();
  const [refreshing, setRefreshing] = useState(false);
  const { id } = route.params;
  const [show, setShow] = useState(false);
  const [submit, setSubmit] = useState('');
  const valueRef = useRef(null);
  const { Employees, PersonalDetailsUpdate } = useApi();
  const queryClient = useQueryClient();

  const {
    data: EmployeesData,
    isLoading,
    isError,
    isPending: EmployeesDataisPending,
    refetch,
  } = useQuery({
    queryKey: ['DataEmployees', userdata],
    queryFn: () =>
      Employees({
        userData: userdata,
        type: 'view',
        id: id,
        platformType: Platform.OS,
      }),
    enabled: !!userdata && !!id,
  });

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const WrapperComponent = isLoading ? ScrollView : ScrollView;
  return (
    <SafeAreaView style={{ flex: 1 }}>
      <ImageBackground
        source={backgroundImage}
        resizeMode="cover"
        style={{ flex: 1, paddingTop: 40 }}>
        <TopNavBar navigation={navigation} title={'Edit Employees'} />
        <Skeleton isLoading={isLoading || EmployeesDataisPending} layout={getLayout({ length: 8, height: 92 })}>
          <WrapperComponent
            keyboardShouldPersistTaps="handled"
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={['black']}
              />
            }>
            <View style={{ flex: 1 }}>

              <GridData EmployeesDetailsData={EmployeesData?.employees[0]} />
            </View>
          </WrapperComponent>
        </Skeleton>
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

export default EmployeesView;
