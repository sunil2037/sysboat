import { useRef } from 'react';
import axios from 'axios';
import { API_BASE_URL } from './ServerURL';
import { useLogout } from '../../components/Logout';
import { storage } from '../../hooks/useEncodedUserData';

const createAxiosInstance = ({ header, IP, logout }) => {
    const instance = axios.create({
        baseURL: IP,
        timeout: 30000,
        headers: {
            'Content-Type': header || 'application/json',
        },
    });

    instance.interceptors.request.use(async config => {
        const token = await storage.getString('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        console.log('🌐 API Request:', {
            url: config.url,
            method: config.method?.toUpperCase(),
            data: config.data,
            headers: config.headers,
        });
        return config;
    });

    instance.interceptors.response.use(
        response => {
            console.log("✅ API SUCCESS:", {
                url: response.config.url,
                status: response.status,
                data: response.data,
            });
            return response;
        },
        async error => {
            const token = await storage.getString('token');
            console.log("error?.response", error?.response)
            if (
                !error.response &&
                error.config &&
                !error.config.__retry &&
                error.code !== 'ECONNABORTED'
            ) {
                error.config.__retry = true;
                return instance.request(error.config);
            }

            if ([401, 403].includes(error?.response?.status) && token) {
                await logout();
            }

            return Promise.reject({
                status: error?.response?.status,
                message:
                    error?.response?.data?.message ||
                    'Network error. Please try again.',
            });
        }
    );

    return instance;
};

const useApi = ({ header = '', IP = API_BASE_URL } = {}) => {
    const logout = useLogout();

    const apiRef = useRef(createAxiosInstance({ header, IP, logout }));


    const resetApiClient = () => {
        apiRef.current = createAxiosInstance({ header, IP, logout });
    };

    const post = (url, data) =>
        apiRef.current.post(url, data).then(res => res.data);

    const get = (url, params) =>
        apiRef.current.get(url, { params }).then(res => res.data);

    const postBlob = (url, data) =>
        apiRef.current.post(url, data, {
            responseType: 'blob',
        }).then(res => res.data);

    return {
        resetApiClient,

        // ---------- AUTH ----------
        Signin: data => post('/userapi/login', data),
        ForgotPasswordSendOTP: data =>
            post('/userapi/api/send-otp', data),
        ForgotPasswordVerifyOTP: data =>
            post('/userapi/api/verify-otp', data),
        ForgotPasswordResetPassword: data =>
            post('/userapi/api/reset-password', data),
        CompanyChangePassword: data =>
            post('/Company/reset-password', data),


        // ---------- ATTENDANCE ----------
        fetchAttendance: data =>
            post('/Attendance/AttendanceGet', data),
        fetchAttendanceData: data =>
            post('/Attendance/api/data', data),
        fetchBreak: data =>
            post('/Attendance/api/BreakDetails', data),
        HRAttendanceMark: data =>
            post('/Attendancemark/Attendancemark', data),
        clockInApi: data =>
            post('/Attendancemark/Attendancemark', data),
        clockOutApi: data =>
            post('/Attendancemark/Attendancemark', data),
        breakInApi: data =>
            post('/Attendancemark/Attendancemark', data),
        breakOutApi: data =>
            post('/Attendancemark/Attendancemark', data),
        FaceAttendance: data =>
            post('/Attendancemark/Attendancemark', data),

        AttendanceTypeDetails: data =>
            post('/Attendance/api/AttendanceTypeDetails', data),
        AttendanceRequestsDetails: data =>
            post('/hrAttendance/AttendanceRequestDetails', data),
        HRAttendanceDetails: data =>
            post('/hrAttendance/attendanceDetails', data),
        HRAttendanceEdit: data =>
            post('/hrAttendance/attendanceEdit', data),
        AttendanceReqSubmit: data =>
            post('/AttendanceApp/api/AttendanceReqSubmit', data),
        AttendancePending: data =>
            post('/AttendanceApp/api/AttendancePending', data),
        AttendanceDelete: data =>
            post('/AttendanceApp/api/AttendanceDelete', data),
        AttendanceApprovalSubmit: data =>
            post('/AttendanceApprovalLog/api/ApprovalSubmit', data),
        AttendanceApprovalLog: data =>
            post('/AttendanceApp/api/AttendanceApprovalLog', data),
        AttendanceApprovalCheckViewDetails: data =>
            post('/AttendanceApprovalLog/api/ChackViewDetailsNew', data),
        AttendanceDirectory: data =>
            post('/AttendanceApp/api/Attendancedirectory', data),
        AttendanceRequestCount: data =>
            post('/AttendanceApp/api/attendanceRequestCount', data),
        EmployeeUnderRmData: data =>
            post('/AttendanceApp/api/EmployeesUnderRm', data),

        // ---------- LEAVE ----------
        FetchLeaveCount: data =>
            post('/logshandel/FetchLeaveCount', data),
        LeaveSubmit: data =>
            post('/leaveapi/leave', data),
        FetchLeave: data =>
            post('/LeaveApp/fetchleave', data),
        FetchLeaveReviewLog: data =>
            post('/LeaveApp/api/Review', data),
        FetchLeaveApprovalLog: data =>
            post('/LeaveApp/api/Approved', data),
        FetchLeaveRejectedLog: data =>
            post('/LeaveApp/api/Rejected', data),
        SingleLeaveRequest: data =>
            post('/leaveapi/LeaveRequest', data),
        ApprovalSubmit: data =>
            post('/leaveapi/api/ApprovalSubmit', data),
        deleteLeave: data =>
            post('/logshandel/api/deleteLeave', data),

        // ---------- EXPENSES ----------
        ExpensesAdd: data =>
            post('/Expenses/expensesAdd', data),
        ExpensesEdit: data =>
            post('/Expenses/expensesEdit', data),
        ExpensesGet: data =>
            post('/Expenses/api/getExpenses', data),
        ExpensesRequestApprove: data =>
            post('/Expenses/RequestApprove', data),
        ExpensesGetAmmount: data =>
            post('/Expenses/amountCount', data),

        // ---------- FIREBASE ----------
        FCMUPdate: data =>
            post('/dashboard/fcmUpdate', data),

        // ---------- HOLIDAY ----------
        Holiday: data =>
            post('/HolidayApiApp/holidayfetch', data),
        AddHoliday: data =>
            post('/holidayapi/holiday', data),
        UpdateHoliday: data =>
            post('/holidayapi/HolidayUpdate', data),
        DeleteHoliday: data =>
            post('/holidayapi/holidaydelete', data),

        // ---------- PROFILE / COMPANY ----------
        PersonalDetails: data =>
            post('/Profile/api/fetchDetails', data),
        PersonalDetailsUpdate: data =>
            post('/Profile/api/Update', data),
        GetEmployeesProfile: data =>
            post('/Header/api/GetEmployeesProfile', data),

        // ---------- WORK ----------
        WorkDetailsFetch: data =>
            post('/Profile/api/fetchDetails', data),

        // ---------- LOGO ----------
        UploadLogo: data =>
            post('/Header/api/UploadLogo', data),
        DeleteLogo: data =>
            post('/Header/api/Deleteapi', data),

        // ---------- TEAM ----------
        FetchTeam: data =>
            post('/Company/employee-hierarchyTeam', data),
        FetchTeamDetails: data =>
            post('/Directory/api/employeeTeamDetails', data),

        // ---------- WORK-WEEK ----------
        WorkWeekFetch: data =>
            post('/WorkWeekApp/api/fetchType', data),
        WorkWeekDetailsFetch: data =>
            post('/WorkWeekApp/api/fetchDetailsWorkWeek', data),
        WorkWeekAssignView: data =>
            post('/WorkWeekApp/api/data', data),
        CreateRule: data =>
            post('/Setting/api/AddType', data),
        UpdateRule: data =>
            post('/Setting/api/work_weekEdit', data),
        AssignRuleEmployee: data =>
            post('/Setting/api/Update', data),

        // ---------- FILES ----------
        documentPost: data =>
            apiRef.current
                .post('/uplodefile/documentPost', data)
                .then(r => r.data),
        documentGet: data =>
            post('/uplodefile/documentGet', data),

        UploadFileToCloud: data =>
            post('/upload/all', data),

        // ---------- SALARY ----------
        SalarySlip: data =>
            post('/Employeesdetails/api/SalarySlipStructure', data),
        BankDetails: data =>
            post('/Salary/api/BankDetails', data),
        EmployeeSalaryDetails: data =>
            post('/pay/api/EmployeeSalaryDetails', data),
        EmployeeCompleteSalaryDetails: data =>
            get('/pay/api/PayEmployeeSalaryDetails', data),
        EmployeePanaltyDetails: data =>
            post('/penaltie/penaltie/penaltiesData', data),
        EmployeeSalaryDoc: data =>
            postBlob('/PDFdow/api/HtmlViewToJpg', data),

        // ---------- FACE ----------
        FaceGet: data =>
            post('/Face/faceGet', data),
        FaceRegister: data =>
            post('/authentication/faceRegister', data),
        FaceDelete: data =>
            post('/authentication/faceDelete', data),
        FaceDetails: data =>
            post('/authentication/faceDetails', data),
        // /authentication/faceRegister 

        // ---------- LOCATION ----------
        SenderLocation: data =>
            post('/NotificationApi/SendLocation', data),
        LocationGet: data =>
            post('/EmployeeLocation/EmployeeLocationGet', data),

        // ---------- NOTIFICATIONS ----------
        NotificationGet: data =>
            post('/NotificationApi/NotificationGet', data),
        GetAnnouncements: data =>
            post('/Blog/postView', data),
        NotificationRead: data =>
            post('/NotificationApi/read', data),
        NotificationSend: data =>
            post('/NotificationApi/send', data),
        AnnouncementGet: data =>
            post('/NotificationApi/announcementGet', data),
        AnnouncementSend: data =>
            post('/NotificationApi/sendmessage', data),

        // ---------- EMPLOYEES ----------
        EmployeesProfile: data =>
            post('/Header/EmployeesProfile', data),
        EmployeesAdd: data =>
            post('/Directory/api/Add', data),
        EmployeesUpdate: data =>
            post('/Directory/api/Update', data),
        IdCard: data =>
            post('/Employeesdetails/api/IdCard', data),
        Employees: data =>
            post('/Directory/api/Employeesdirectory', data),

        // ---------- COMPANY ----------
        CompanyEmployeeLists: data =>
            post('/AttendanceApproval/api/companyEmployeeName', data),
        CompanyBranchName: data =>
            post('/Company/branchName', data),
        CompanychangeBranch: data =>
            post('/Company/changeBranch', data),
        Designations: data =>
            post('/Company/api/Designation', data),
        Departments: data =>
            post('/Directory/api/departments', data),
        SubDepartments: data =>
            post('/Directory/api/sub-departments', data),
        DepartmentsDetails: data =>
            post('/Company/api/DepartmentDetails', data),
        AddDepartment: data =>
            post('/Company/api/AddDepartment', data),
        AddSubDepartment: data =>
            post('/Company/api/AddSubDepartment', data),
        EditDepartment: data =>
            post('/Company/api/EditDepartment', data),
        DesignationDetails: data =>
            post('/Company/api/DesignationDetails', data),

        // ---------- PERMISSION ----------
        PermissionsDetails: data =>
            post('/authentication/permissionDetails', data),
        PermissionsUpdate: data =>
            post('/authentication/permissionUpdate', data),


    };
};

export default useApi;
