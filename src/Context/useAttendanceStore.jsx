import { create } from 'zustand';

const useAttendanceStore = create((set, get) => ({
    visible: false,
    employeeId: null,
    attendanceId: null,
    requestDate: null,
    pendingApproveType: null,
    attendanceReqId: '',
    reload: false,
    showApprovalDetails: false,
    viewApprovalData: '',
    loadingView: false,
    type: null,
    preInTime: null,
    preOutTime: null,
    requestDay: null,
    attendanceTabIndex: 0,
    isFromAttendanceViewInBottomSheetGetApproved: false,

    setIsVisible: (value) => set({ visible: value }),

    setIsFromAttendanceViewInBottomSheetGetApproved: (value) => set({ isFromAttendanceViewInBottomSheetGetApproved: value }),

    setLoadingView: (value) => set({ loadingView: value }),

    setApprovalData: (value) => set({ viewApprovalData: value }),

    setShowApprovalDetails: (value) => set({ showApprovalDetails: value }),

    setEmployeeId: (ids) => set({ employeeId: ids }),

    setrequestDay: (type) => set({ requestDay: type }),

    setPreInTime: (time) => set({ preInTime: time }),

    setPreOutTime: (time) => set({ preOutTime: time }),

    setAttendanceId: (id) => set({ attendanceId: id }),

    setRequestDate: (date) => set({ requestDate: date }),

    setType: (value) => set({ type: value }),

    setPendingApproveType: (type) => set({ pendingApproveType: type }),

    setattendanceReqId: (id) => set({ attendanceReqId: id }),

    setReload: () => set((state) => ({ reload: !state.reload })),

    setAttendanceTabIndex: (index) => set({ attendanceTabIndex: index }),


    resetAttendanceState: () =>
        set({
            visible: false,
            employeeIds: [],
            attendanceId: null,
            requestDate: null,
            pendingApproveType: null,
            attendanceReqId: null,
            reload: false,
            attendanceTabIndex: 0,
            isFromAttendanceViewInBottomSheetGetApproved: false,
        }),
}));

export default useAttendanceStore;
