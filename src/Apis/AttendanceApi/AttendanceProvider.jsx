// import React, { createContext, useEffect, useState } from 'react';
// import axios from 'axios';
// import AsyncStorage from '@react-native-async-storage/async-storage';
// import base64 from 'base-64';

// const API_BASE_URL = 'https://6bb4-2402-e280-2303-50d-714b-5240-2f2c-f3b9.ngrok-free.app';

// export const AttendanceContext = createContext();

// export const AttendanceProvider = ({ children }) => {
//     const [loading, setLoading] = useState(false);
//     const [attendanceData, setAttendanceData] = useState(null);
//     const [data, setData] = useState(null);
//     const [token, setToken] = useState(null);
//     const [clockIn, setClockIn] = useState(false);
//     const [clockout, setClockout] = useState(false);
//     // Step 1: Fetch token and user data from AsyncStorage
//     useEffect(() => {
//         const fetchStoredData = async () => {
//             try {
//                 const storedToken = await AsyncStorage.getItem('token');
//                 const storedData = await AsyncStorage.getItem('data');

//                 if (storedToken) {
//                     setToken(storedToken);
//                 }

//                 if (storedData) {
//                     const encodedData = base64.encode(storedData);
//                     setData(encodedData);
//                 } else {
//                     setData(null);
//                 }
//             } catch (error) {
//                 console.warn("Error fetching data from AsyncStorage:", error);
//             }
//         };

//         fetchStoredData();
//     }, []);

//     useEffect(() => {
//         fetchAttendance();
//     }, [token, clockIn, clockout]);


//     const fetchAttendance = async () => {
//         if (!token) {
//             console.warn("Token is missing");
//             return;
//         }

//         const config = {
//             headers: { Authorization: `Bearer ${token}` }
//         };

//         setLoading(true);
//         try {
//             const response = await axios.post(`${API_BASE_URL}/Attendance/AttendanceGet`, {
//                 TypeCheck: "TimeGet",
//                 userData: data,
//             }, config);
//             console.warn("Attendance status" + response.data.status);
//             await AsyncStorage.setItem("daystatus", JSON.stringify(response.data.status));
//             if (JSON.stringify(response.data.status) == 'true') {
//                 await AsyncStorage.setItem("InTime", new Date(response.data.InTime).toISOString());
//                 await AsyncStorage.setItem('check_out_time', JSON.stringify(response.data.check_out_time));
//                 await AsyncStorage.setItem('duration', JSON.stringify(response.data.duration));
//             } else {
//                 console.warn("gus ja");
//                 await AsyncStorage.setItem('AttendanceStatus', JSON.stringify(response.data.status));
//                 await AsyncStorage.removeItem("InTime");
//                 await AsyncStorage.removeItem('check_out_time');
//                 await AsyncStorage.removeItem('duration');
//             }
//             console.warn(response.data.status);
//             setAttendanceData(response.data);
//             console.warn("response" + response);
//         } catch (error) {
//             console.warn("Error fetching attendances:", error);
//         } finally {
//             setLoading(false);
//         }
//     };

//     // Check-in function
//     const checkIn = async () => {
//         console.warn("gus gya")
//         if (!token) {
//             console.warn("Token is missing");
//             return;
//         }

//         const config = {
//             headers: { Authorization: `Bearer ${token}` }
//         };

//         setLoading(true);

//         try {
//             const response = await axios.post(`${API_BASE_URL}/Attendancemark/Attendancemark`, {
//                 type: "in",
//                 dateTime: new Date().toISOString(),
//                 latitude: "26.9137157",
//                 longitude: "75.7402935",
//                 userData: data
//             }, config);
//             console.warn("response" + response.data.status);
//             await AsyncStorage.setItem('AttendanceStatus', JSON.stringify(response.data.status));

//             setClockIn(prev => !prev);
//             console.warn(response);
//             return response.data;
//         } catch (error) {
//             console.warn("Check-in error:", error);
//         } finally {
//             setLoading(false);
//         }
//     };

//     // Check-out function
//     const checkOut = async () => {
//         if (!token) {
//             console.warn("Token is missing");
//             return;
//         }

//         const config = {
//             headers: { Authorization: `Bearer ${token}` }
//         };

//         setLoading(true);

//         try {
//             const response = await axios.post(`${API_BASE_URL}/Attendance/api/BreakDetails`, {
//                 type: "out",
//                 dateTime: new Date().toISOString(),
//                 latitude: "26.9137157",
//                 longitude: "75.7402935",
//                 userData: data
//             }, config);
//             await AsyncStorage.setItem('AttendanceStatus', JSON.stringify(response.data.status));
//             setClockout(prev => !prev);
//             return response.data;
//         } catch (error) {
//             console.warn("Check-out error:", error);
//         } finally {
//             setLoading(false);
//         }
//     };

//     return (
//         <AttendanceContext.Provider value={{
//             attendanceData,
//             loading,
//             fetchAttendance,
//             checkIn,
//             checkOut
//         }}>
//             {children}
//         </AttendanceContext.Provider>
//     );
// };
