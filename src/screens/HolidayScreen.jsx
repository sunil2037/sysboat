import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import _ from 'lodash';
import React, { useCallback, useMemo, useState } from 'react';
import { Platform, Alert, StyleSheet, View, Text, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { ExpandableCalendar, AgendaList, CalendarProvider, WeekCalendar } from 'react-native-calendars';
import { SafeAreaView } from 'react-native-safe-area-context';
import BottomSheetHoliday from '../Helper/BottomSheetHoliday';
import { Pen, CalendarEdit, DeleteIcon } from '../Helper/IconsLoad';
import { useAuth } from '../Context/AuthContext';
import TopNavBar from '../navigation/TopNavBar';
import EmptyMessage from '../Helper/EmptyMessage';
import useEncodedUserData from '../hooks/useEncodedUserData';
import { toast } from '../Helper/ToastManager';
import useApi from '../Apis/Services/ApiConfig';
import { bottomHeight, getFontSize, STATUS_BAR_HEIGHT } from '../Helper/Helper';

const themeColor = 'black';

const HolidayScreen = ({ weekView, navigation }) => {
  const { userdata } = useEncodedUserData();
  const { Holiday, DeleteHoliday } = useApi();
  const [openSheet, setOpenSheet] = useState(false);
  const [status, setStatus] = useState('');
  const [updateValues, setUpdateValues] = useState('');
  const queryClient = useQueryClient();
  const [referenceId, setReferenceId] = useState();
  const { userType, permissions } = useAuth();
  const [today, setTodayDate] = useState(new Date().toISOString().split('T')[0]);
  // Memoized user type check
  const canEditHolidays = useMemo(() => (
    ['admin', 'ceo', 'company_admin', 'hr'].includes(userType)
  ), [userType]);

  const handleUpdateHoliday = useCallback((values) => {
    setOpenSheet(true);
    setStatus('update');
    setUpdateValues(values);
  }, []);

  const {
    data: HolidayData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    refetch,
    isFetching,
  } = useInfiniteQuery({
    queryKey: ['Holiday', userdata, today],
    queryFn: ({ pageParam = 1 }) =>
      Holiday({
        page: pageParam,
        limit: 20,
        userData: userdata,
        date: today,
        Search: '',
      }),
    getNextPageParam: (lastPage, allPages) => {
      const totalFetchedItems = allPages.flatMap((page) => page.records).length;
      if (totalFetchedItems < lastPage.total) {
        return lastPage.page + 1;
      }
      return undefined;
    },
    enabled: !!userdata,
    staleTime: 1000 * 60 * 5, // 5 minutes cache
  });

  // Memoized transformation of API data
  const ITEMS = useMemo(() => {
    const itemsMap = {};

    HolidayData?.pages.forEach(page => {
      page.records.forEach(holiday => {
        const date = holiday.date;
        const hour = '12am';
        const duration = '1h';
        const title = holiday.holiday;
        const id = holiday.id;

        if (!itemsMap[date]) {
          itemsMap[date] = {
            title: date,
            data: [],
          };
        }

        itemsMap[date].data.push({ hour, duration, title, id, date });
      });
    });

    return Object.values(itemsMap);
  }, [HolidayData]);


  // Memoized marked dates
  const markedDates = useMemo(() => {
    const marked = {};
    ITEMS.forEach(item => {
      if (item.data?.length > 0 && !_.isEmpty(item.data[0])) {
        marked[item.title] = { marked: true };
      } else {
        marked[item.title] = { disabled: true };
      }
    });
    return marked;
  }, [ITEMS]);

  // Memoized calendar theme
  const calendarTheme = useMemo(() => {
    const disabledColor = 'grey';
    return {
      arrowColor: 'black',
      arrowStyle: { padding: 0 },
      monthTextColor: 'black',
      textMonthFontSize: 16,
      textMonthFontFamily: 'Poppins-Medium',
      textMonthFontWeight: 'bold',
      textSectionTitleColor: 'black',
      textDayHeaderFontSize: 12,
      textDayHeaderFontFamily: 'Poppins-Medium',
      textDayHeaderFontWeight: 'normal',
      dayTextColor: themeColor,
      textDayFontSize: 14,
      textDayFontFamily: 'Poppins-Regular',
      textDayStyle: { marginTop: Platform.OS === 'android' ? 2 : 4 },
      selectedDayBackgroundColor: '#CA282C',
      selectedDayTextColor: 'white',
      textDisabledColor: disabledColor,
      dotColor: '#CA282C',
      selectedDotColor: 'white',
      disabledDotColor: disabledColor,
      dotStyle: { paddingTop: 10 },
    };
  }, []);

  const handleDeleteHoliday = useCallback((id) => {
    setReferenceId(id);
    const deleteHolidayData = {
      userData: userdata,
      id: id,
    };
    deleteHolidays(deleteHolidayData);
  }, [userdata]);

  const { mutate: deleteHolidays, isPending } = useMutation({
    mutationFn: (deleteHolidayData) => DeleteHoliday(deleteHolidayData),
    onSuccess: async (response) => {
      toast.success(response.message);
      await queryClient.invalidateQueries(['Holiday']);
    },
    onError: (error) => {
      console.warn('Error deleting holiday:', error);
      toast.error(error.message);
    },
  });

  const renderItem = useCallback(({ item }) => {
    if (_.isEmpty(item)) {
      return <EmptyMessage />;
    }

    return (
      <View key={item.id} style={styles.item}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View style={[
              styles.statusIndicator,
              item.status == 1 ? styles.activeStatus : styles.inactiveStatus,
            ]} />
            <Text style={styles.itemTitleText}>{item.title}</Text>
          </View>
          {canEditHolidays && !permissions?.block_create_holiday && (
            <View style={styles.actionsContainer}>
              <TouchableOpacity onPress={() => handleUpdateHoliday({
                id: item.id,
                date: item.date,
                title: item.title,
              })}>
                <CalendarEdit width={25} height={25} color={'#6A7D94'} />
              </TouchableOpacity>
              <TouchableOpacity
                disabled={isPending}
                onPress={() => handleDeleteHoliday(item.id)}
              >
                {isPending && referenceId === item.id ? (
                  <ActivityIndicator color={'black'} />
                ) : (
                  <DeleteIcon width={25} height={25} color={'#CA282C'} />
                )}
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    );
  }, [canEditHolidays, isPending, referenceId]);


  return (
    <SafeAreaView style={[styles.container, { paddingTop: 0 }]}>
      <TopNavBar title={'Holiday Calendar'} navigation={navigation} />

      <CalendarProvider
        date={today}
        onDateChanged={(e) => setTodayDate(e)}
        showTodayButton={false}
        disabledOpacity={0.6}
      >
        {weekView ? (
          <WeekCalendar firstDay={1} markedDates={markedDates} />
        ) : (
          <ExpandableCalendar
            theme={calendarTheme}
            firstDay={1}
            markedDates={markedDates}
            disableAllTouchEventsForDisabledDays
          />
        )}
        <AgendaList
          sections={ITEMS}
          renderItem={renderItem}
          renderEmptyData={() => <EmptyMessage />}
          refreshControl={
            <RefreshControl refreshing={isFetching || isLoading} onRefresh={refetch} />
          }
          keyExtractor={(item, index) => item.id || index.toString()}
          initialNumToRender={10}
          ListEmptyComponent={<EmptyMessage />}
          windowSize={5}
        />
      </CalendarProvider>

      {canEditHolidays && !permissions?.block_create_holiday && (
        <TouchableOpacity
          onPress={() => {
            setOpenSheet(true);
            setStatus('add');
          }}
          style={[styles.addButton, { bottom: bottomHeight() }]}
        >
          <Pen width={25} height={25} color={'white'} />
        </TouchableOpacity>
      )}

      <BottomSheetHoliday
        status={status}
        updateValues={updateValues}
        visible={openSheet}
        onClose={async () => {
          setOpenSheet(false);
          // await refetch();
        }}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  item: {
    paddingVertical: 15,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: 'lightgrey',
    flexDirection: 'row',
    paddingHorizontal: 15,
  },
  itemTitleText: {
    color: 'black',
    marginLeft: 5,
    fontSize: 16,
    lineHeight: 25,
    fontFamily: 'Poppins-Medium',
  },
  actionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  statusIndicator: {
    width: 15,
    height: 15,
    borderRadius: 50,
  },
  activeStatus: {
    backgroundColor: '#89AC46',
  },
  inactiveStatus: {
    backgroundColor: '#CA282C',
  },
  addButton: {
    backgroundColor: '#CA282C',
    position: 'absolute',
    right: 10,
    width: 50,
    height: 50,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default React.memo(HolidayScreen);


// import React, { useState, useRef } from 'react';
// import {
//   View,
//   Text,
//   TouchableOpacity,
//   ScrollView,
//   StyleSheet,
//   Animated,
//   Dimensions,
//   StatusBar,
//   Platform,
// } from 'react-native';

// const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// const C = {
//   primary: '#CA282C',
//   primaryLight: '#E8484C',
//   primaryDark: '#A01E21',
//   primaryFade: 'rgba(202,40,44,0.12)',
//   white: '#FFFFFF',
//   offWhite: '#FFF5F5',
//   card: '#FFFFFF',
//   bg: '#ffffff',
//   text: '#1A0A0A',
//   textSub: '#7A4040',
//   textMuted: '#B08080',
//   border: 'rgba(202,40,44,0.15)',
//   sat: '#CA282C',
//   sun: '#CA282C',
//   holiday: 'rgba(202,40,44,0.08)',
//   today: '#CA282C',
//   selectedBg: '#CA282C',
// };

// // ─── Data ─────────────────────────────────────────────────────────────────────
// const MONTH_NAMES = [
//   'January', 'February', 'March', 'April', 'May', 'June',
//   'July', 'August', 'September', 'October', 'November', 'December',
// ];
// const DAY_NAMES = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];

// const HOLIDAYS_DB = {
//   '2025-01-01': { name: "New Year's Day", type: 'national', icon: '🎆' },
//   '2025-01-26': { name: 'Republic Day', type: 'national', icon: '🇮🇳' },
//   '2025-03-17': { name: 'Holi', type: 'festival', icon: '🎨' },
//   '2025-04-14': { name: 'Dr. Ambedkar Jayanti', type: 'national', icon: '📿' },
//   '2025-04-18': { name: 'Good Friday', type: 'religious', icon: '✝️' },
//   '2025-05-01': { name: 'Labour Day', type: 'national', icon: '⚒️' },
//   '2025-08-15': { name: 'Independence Day', type: 'national', icon: '🇮🇳' },
//   '2025-10-02': { name: "Gandhi Jayanti", type: 'national', icon: '☮️' },
//   '2025-10-20': { name: 'Dussehra', type: 'festival', icon: '🪔' },
//   '2025-11-05': { name: 'Diwali', type: 'festival', icon: '🪔' },
//   '2025-11-15': { name: 'Guru Nanak Jayanti', type: 'religious', icon: '🕌' },
//   '2025-12-25': { name: 'Christmas Day', type: 'religious', icon: '🎄' },
//   '2026-01-01': { name: "New Year's Day", type: 'national', icon: '🎆' },
//   '2026-01-26': { name: 'Republic Day', type: 'national', icon: '🇮🇳' },
//   '2026-03-07': { name: 'Holi', type: 'festival', icon: '🎨' },
//   '2026-04-03': { name: 'Good Friday', type: 'religious', icon: '✝️' },
//   '2026-04-14': { name: 'Dr. Ambedkar Jayanti', type: 'national', icon: '📿' },
//   '2026-05-01': { name: 'Labour Day', type: 'national', icon: '⚒️' },
//   '2026-08-15': { name: 'Independence Day', type: 'national', icon: '🇮🇳' },
//   '2026-10-02': { name: 'Gandhi Jayanti', type: 'national', icon: '☮️' },
//   '2026-10-09': { name: 'Dussehra', type: 'festival', icon: '🪔' },
//   '2026-10-26': { name: 'Diwali', type: 'festival', icon: '🪔' },
//   '2026-11-03': { name: 'Guru Nanak Jayanti', type: 'religious', icon: '🕌' },
//   '2026-12-25': { name: 'Christmas Day', type: 'religious', icon: '🎄' },
// };

// const TYPE_COLORS = {
//   national: '#CA282C',
//   festival: '#E07B00',
//   religious: '#7B5EA7',
// };

// // ─── Helpers ──────────────────────────────────────────────────────────────────
// const pad = (n) => String(n).padStart(2, '0');
// const toKey = (y, m, d) => `${y}-${pad(m + 1)}-${pad(d)}`;

// function buildCalendar(year, month) {
//   const firstDay = new Date(year, month, 1).getDay(); // 0=Sun
//   const daysInMonth = new Date(year, month + 1, 0).getDate();
//   const daysInPrev = new Date(year, month, 0).getDate();
//   // Convert Sunday=0 to Mon-based index
//   const startOffset = firstDay === 0 ? 6 : firstDay - 1;
//   const cells = [];
//   for (let i = startOffset - 1; i >= 0; i--) {
//     cells.push({ day: daysInPrev - i, current: false, prev: true });
//   }
//   for (let d = 1; d <= daysInMonth; d++) {
//     cells.push({ day: d, current: true });
//   }
//   const remaining = 42 - cells.length;
//   for (let d = 1; d <= remaining; d++) {
//     cells.push({ day: d, current: false, next: true });
//   }
//   return cells;
// }

// function getHolidaysForMonth(year, month) {
//   const result = [];
//   const prefix = `${year}-${pad(month + 1)}-`;
//   Object.entries(HOLIDAYS_DB).forEach(([key, val]) => {
//     if (key.startsWith(prefix)) {
//       result.push({ ...val, date: parseInt(key.split('-')[2], 10), key });
//     }
//   });
//   return result.sort((a, b) => a.date - b.date);
// }

// // ─── Sub-Components ───────────────────────────────────────────────────────────

// function HolidayBadge({ type }) {
//   return (
//     <View style={[styles.badge, { backgroundColor: TYPE_COLORS[type] || C.primary }]}>
//       <Text style={styles.badgeText}>{type.toUpperCase()}</Text>
//     </View>
//   );
// }

// function DayCell({ cell, year, month, selectedDay, onSelect }) {
//   const scaleAnim = useRef(new Animated.Value(1)).current;
//   const today = new Date();
//   const isToday =
//     cell.current &&
//     cell.day === today.getDate() &&
//     month === today.getMonth() &&
//     year === today.getFullYear();
//   const isSelected = cell.current && cell.day === selectedDay;
//   const key = cell.current ? toKey(year, month, cell.day) : null;
//   const holiday = key ? HOLIDAYS_DB[key] : null;

//   const colIndex = cell._colIndex; // 5=SAT,6=SUN (Mon-based)
//   const isSat = colIndex === 5;
//   const isSun = colIndex === 6;

//   const handlePress = () => {
//     if (!cell.current) return;
//     Animated.sequence([
//       Animated.spring(scaleAnim, { toValue: 0.82, useNativeDriver: true }),
//       Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, tension: 200 }),
//     ]).start();
//     onSelect(cell.day);
//   };

//   let textColor = C.text;
//   if (!cell.current) textColor = C.textMuted;
//   else if (isSat || isSun) textColor = C.primary;
//   if (isSelected || isToday) textColor = C.white;

//   return (
//     <TouchableOpacity
//       onPress={handlePress}
//       activeOpacity={0.7}
//       style={styles.dayCellWrapper}
//     >
//       <Animated.View
//         style={[
//           styles.dayCell,
//           isSelected && styles.dayCellSelected,
//           isToday && !isSelected && styles.dayCellToday,
//           holiday && !isSelected && !isToday && styles.dayCellHoliday,
//           { transform: [{ scale: scaleAnim }] },
//         ]}
//       >
//         <Text style={[styles.dayCellText, { color: textColor }]}>{cell.day}</Text>
//         {holiday && <View style={[styles.holidayDot, { backgroundColor: isSelected || isToday ? C.white : TYPE_COLORS[holiday.type] || C.primary }]} />}
//       </Animated.View>
//     </TouchableOpacity>
//   );
// }

// function HolidayListItem({ holiday, index }) {
//   const slideAnim = useRef(new Animated.Value(40)).current;
//   const opacAnim = useRef(new Animated.Value(0)).current;

//   React.useEffect(() => {
//     Animated.parallel([
//       Animated.timing(slideAnim, {
//         toValue: 0,
//         duration: 350,
//         delay: index * 60,
//         useNativeDriver: true,
//       }),
//       Animated.timing(opacAnim, {
//         toValue: 1,
//         duration: 350,
//         delay: index * 60,
//         useNativeDriver: true,
//       }),
//     ]).start();
//   }, []);

//   return (
//     <Animated.View
//       style={[
//         styles.holidayItem,
//         { transform: [{ translateY: slideAnim }], opacity: opacAnim },
//       ]}
//     >
//       <View style={[styles.holidayLeft, { backgroundColor: `${TYPE_COLORS[holiday.type]}18` || C.primaryFade }]}>
//         <Text style={styles.holidayIcon}>{holiday.icon}</Text>
//       </View>
//       <View style={styles.holidayInfo}>
//         <Text style={styles.holidayName}>{holiday.name}</Text>
//         <HolidayBadge type={holiday.type} />
//       </View>
//       <View style={styles.holidayDateBubble}>
//         <Text style={styles.holidayDateNum}>{holiday.date}</Text>
//       </View>
//     </Animated.View>
//   );
// }

// // ─── Main Component ───────────────────────────────────────────────────────────
// export default function HolidayScreen() {
//   const today = new Date();
//   const [year, setYear] = useState(today.getFullYear());
//   const [month, setMonth] = useState(today.getMonth());
//   const [selectedDay, setSelectedDay] = useState(today.getDate());
//   const [view, setView] = useState('calendar'); // 'calendar' | 'list'

//   const slideX = useRef(new Animated.Value(0)).current;

//   const cells = buildCalendar(year, month).map((c, i) => ({ ...c, _colIndex: i % 7 }));
//   const monthHolidays = getHolidaysForMonth(year, month);

//   const selectedKey = toKey(year, month, selectedDay);
//   const selectedHoliday = HOLIDAYS_DB[selectedKey];

//   const navigate = (dir) => {
//     const toX = dir === 'next' ? -SCREEN_WIDTH * 0.6 : SCREEN_WIDTH * 0.6;
//     Animated.sequence([
//       Animated.timing(slideX, { toValue: toX, duration: 180, useNativeDriver: true }),
//       Animated.timing(slideX, { toValue: 0, duration: 0, useNativeDriver: true }),
//     ]).start();

//     let nm = month + dir === 'next' ? 1 : -1;
//     if (dir === 'next') {
//       if (month === 11) { setMonth(0); setYear(y => y + 1); }
//       else setMonth(m => m + 1);
//     } else {
//       if (month === 0) { setMonth(11); setYear(y => y - 1); }
//       else setMonth(m => m - 1);
//     }
//     setSelectedDay(1);
//   };

//   return (
//     <View style={styles.root}>
//       <StatusBar barStyle="light-content" backgroundColor={C.primary} />

//       {/* ── Header ── */}
//       <View style={styles.header}>
//         <View style={styles.headerTop}>
//           <Text style={styles.headerYear}>{year}</Text>
//           <View style={styles.viewToggle}>
//             <TouchableOpacity
//               onPress={() => setView('calendar')}
//               style={[styles.toggleBtn, view === 'calendar' && styles.toggleBtnActive]}
//             >
//               <Text style={[styles.toggleBtnText, view === 'calendar' && styles.toggleBtnTextActive]}>⊞</Text>
//             </TouchableOpacity>
//             <TouchableOpacity
//               onPress={() => setView('list')}
//               style={[styles.toggleBtn, view === 'list' && styles.toggleBtnActive]}
//             >
//               <Text style={[styles.toggleBtnText, view === 'list' && styles.toggleBtnTextActive]}>≡</Text>
//             </TouchableOpacity>
//           </View>
//         </View>

//         <View style={styles.headerNav}>
//           <TouchableOpacity onPress={() => navigate('prev')} style={styles.navBtn}>
//             <Text style={styles.navArrow}>‹</Text>
//           </TouchableOpacity>
//           <Text style={styles.headerMonth}>{MONTH_NAMES[month]}</Text>
//           <TouchableOpacity onPress={() => navigate('next')} style={styles.navBtn}>
//             <Text style={styles.navArrow}>›</Text>
//           </TouchableOpacity>
//         </View>

//         {/* Stats Strip */}
//         <View style={styles.statsStrip}>
//           <View style={styles.stat}>
//             <Text style={styles.statNum}>{monthHolidays.length}</Text>
//             <Text style={styles.statLabel}>Holidays</Text>
//           </View>
//           <View style={styles.statDivider} />
//           <View style={styles.stat}>
//             <Text style={styles.statNum}>{monthHolidays.filter(h => h.type === 'national').length}</Text>
//             <Text style={styles.statLabel}>National</Text>
//           </View>
//           <View style={styles.statDivider} />
//           <View style={styles.stat}>
//             <Text style={styles.statNum}>{monthHolidays.filter(h => h.type === 'festival').length}</Text>
//             <Text style={styles.statLabel}>Festivals</Text>
//           </View>
//         </View>
//       </View>

//       <ScrollView
//         style={styles.body}
//         showsVerticalScrollIndicator={false}
//         contentContainerStyle={{ paddingBottom: 40 }}
//       >
//         {view === 'calendar' ? (
//           <>
//             {/* ── Calendar Grid ── */}
//             <View style={styles.card}>
//               {/* Day headers */}
//               <View style={styles.dayRow}>
//                 {DAY_NAMES.map((d, i) => (
//                   <View key={d} style={styles.dayHeaderCell}>
//                     <Text style={[styles.dayHeaderText, (i === 5 || i === 6) && styles.dayHeaderWeekend]}>{d}</Text>
//                   </View>
//                 ))}
//               </View>

//               {/* Cells */}
//               <Animated.View style={[styles.grid, { transform: [{ translateX: slideX }] }]}>
//                 {cells.map((cell, idx) => (
//                   <DayCell
//                     key={idx}
//                     cell={cell}
//                     year={year}
//                     month={month}
//                     selectedDay={selectedDay}
//                     onSelect={setSelectedDay}
//                   />
//                 ))}
//               </Animated.View>
//             </View>

//             {/* ── Selected Day Card ── */}
//             {selectedHoliday ? (
//               <View style={styles.selectedCard}>
//                 <View style={styles.selectedCardAccent} />
//                 <View style={styles.selectedCardContent}>
//                   <Text style={styles.selectedIcon}>{selectedHoliday.icon}</Text>
//                   <View style={{ flex: 1 }}>
//                     <Text style={styles.selectedDate}>
//                       {selectedDay} {MONTH_NAMES[month]}, {year}
//                     </Text>
//                     <Text style={styles.selectedName}>{selectedHoliday.name}</Text>
//                     <HolidayBadge type={selectedHoliday.type} />
//                   </View>
//                 </View>
//               </View>
//             ) : (
//               <View style={styles.noHolidayCard}>
//                 <Text style={styles.noHolidayText}>
//                   {selectedDay} {MONTH_NAMES[month]} — No holiday
//                 </Text>
//               </View>
//             )}

//             {/* ── Month Holidays List ── */}
//             {monthHolidays.length > 0 && (
//               <View style={styles.sectionHeader}>
//                 <View style={styles.sectionLine} />
//                 <Text style={styles.sectionTitle}>THIS MONTH</Text>
//                 <View style={styles.sectionLine} />
//               </View>
//             )}

//             {monthHolidays.map((h, i) => (
//               <HolidayListItem key={h.key} holiday={h} index={i} />
//             ))}

//             {monthHolidays.length === 0 && (
//               <View style={styles.emptyMonth}>
//                 <Text style={styles.emptyMonthIcon}>📭</Text>
//                 <Text style={styles.emptyMonthText}>No holidays this month</Text>
//               </View>
//             )}
//           </>
//         ) : (
//           /* ── List View ── */
//           <>
//             <View style={styles.sectionHeader}>
//               <View style={styles.sectionLine} />
//               <Text style={styles.sectionTitle}>ALL HOLIDAYS {year}</Text>
//               <View style={styles.sectionLine} />
//             </View>
//             {Object.entries(HOLIDAYS_DB)
//               .filter(([k]) => k.startsWith(`${year}`))
//               .sort(([a], [b]) => a.localeCompare(b))
//               .map(([key, val], i) => {
//                 const parts = key.split('-');
//                 const mo = parseInt(parts[1], 10) - 1;
//                 const da = parseInt(parts[2], 10);
//                 return (
//                   <HolidayListItem
//                     key={key}
//                     holiday={{ ...val, date: da, key, _monthLabel: `${MONTH_NAMES[mo]} ${da}` }}
//                     index={i}
//                   />
//                 );
//               })}
//           </>
//         )}
//       </ScrollView>

//       {/* ── Legend ── */}
//       <View style={styles.legend}>
//         {Object.entries(TYPE_COLORS).map(([type, color]) => (
//           <View key={type} style={styles.legendItem}>
//             <View style={[styles.legendDot, { backgroundColor: color }]} />
//             <Text style={styles.legendText}>{type.charAt(0).toUpperCase() + type.slice(1)}</Text>
//           </View>
//         ))}
//       </View>
//     </View>
//   );
// }

// const CELL_SIZE = Math.floor((SCREEN_WIDTH - 60) / 7);

// const styles = StyleSheet.create({
//   root: {
//     flex: 1,
//     backgroundColor: C.bg,
//   },

//   // ── Header
//   header: {
//     backgroundColor: C.primary,
//     paddingTop: Platform.OS === 'android' ? 36 : 52,
//     paddingBottom: 24,
//     paddingHorizontal: 20,
//     borderBottomLeftRadius: 28,
//     borderBottomRightRadius: 28,
//     shadowColor: C.primary,
//     shadowOffset: { width: 0, height: 8 },
//     shadowOpacity: 0.4,
//     shadowRadius: 16,
//     elevation: 12,
//   },
//   headerTop: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     marginBottom: 8,
//   },
//   headerYear: {
//     fontSize: 15,
//     fontWeight: '700',
//     color: 'rgba(255,255,255,0.65)',
//     letterSpacing: 3,
//   },
//   viewToggle: {
//     flexDirection: 'row',
//     backgroundColor: 'rgba(0,0,0,0.2)',
//     borderRadius: 10,
//     padding: 3,
//   },
//   toggleBtn: {
//     width: 34,
//     height: 28,
//     alignItems: 'center',
//     justifyContent: 'center',
//     borderRadius: 8,
//   },
//   toggleBtnActive: {
//     backgroundColor: C.white,
//   },
//   toggleBtnText: { fontSize: 16, color: 'rgba(255,255,255,0.65)' },
//   toggleBtnTextActive: { color: C.primary },

//   headerNav: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'space-between',
//     marginBottom: 20,
//   },
//   navBtn: {
//     width: 40,
//     height: 40,
//     borderRadius: 20,
//     backgroundColor: 'rgba(255,255,255,0.15)',
//     alignItems: 'center',
//     justifyContent: 'center',
//   },
//   navArrow: { color: C.white, fontSize: 26, fontWeight: '300', marginTop: -2 },
//   headerMonth: {
//     fontSize: 30,
//     fontWeight: '800',
//     color: C.white,
//     letterSpacing: -0.5,
//   },

//   statsStrip: {
//     flexDirection: 'row',
//     backgroundColor: 'rgba(0,0,0,0.15)',
//     borderRadius: 14,
//     paddingVertical: 12,
//     paddingHorizontal: 20,
//   },
//   stat: { flex: 1, alignItems: 'center' },
//   statNum: { fontSize: 22, fontWeight: '800', color: C.white },
//   statLabel: { fontSize: 10, color: 'rgba(255,255,255,0.65)', marginTop: 1, fontWeight: '600', letterSpacing: 0.5 },
//   statDivider: { width: 1, backgroundColor: 'rgba(255,255,255,0.2)', marginVertical: 4 },

//   // ── Body
//   body: { flex: 1, paddingHorizontal: 16, paddingTop: 16 },

//   // ── Calendar Card
//   card: {
//     backgroundColor: C.card,
//     borderRadius: 20,
//     paddingTop: 16,
//     paddingBottom: 8,
//     paddingHorizontal: 8,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.06,
//     shadowRadius: 8,
//     elevation: 3,
//     marginBottom: 14,
//   },
//   dayRow: {
//     flexDirection: 'row',
//     marginBottom: 6,
//     paddingHorizontal: 4,
//   },
//   dayHeaderCell: {
//     width: CELL_SIZE,
//     alignItems: 'center',
//     paddingBottom: 8,
//   },
//   dayHeaderText: {
//     fontSize: 10,
//     fontWeight: '700',
//     color: C.textMuted,
//     letterSpacing: 0.5,
//   },
//   dayHeaderWeekend: { color: C.primary },

//   grid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 4 },

//   // ── Day Cell
//   dayCellWrapper: { width: CELL_SIZE, alignItems: 'center', marginBottom: 4 },
//   dayCell: {
//     width: CELL_SIZE - 6,
//     height: CELL_SIZE - 6,
//     borderRadius: (CELL_SIZE - 6) / 2,
//     alignItems: 'center',
//     justifyContent: 'center',
//   },
//   dayCellSelected: { backgroundColor: C.primary },
//   dayCellToday: {
//     backgroundColor: C.primary,
//     shadowColor: C.primary,
//     shadowOffset: { width: 0, height: 3 },
//     shadowOpacity: 0.5,
//     shadowRadius: 6,
//     elevation: 4,
//   },
//   dayCellHoliday: { backgroundColor: C.primaryFade },
//   dayCellText: { fontSize: 13, fontWeight: '600' },
//   holidayDot: {
//     width: 4,
//     height: 4,
//     borderRadius: 2,
//     position: 'absolute',
//     bottom: 4,
//   },

//   // ── Selected Card
//   selectedCard: {
//     backgroundColor: C.card,
//     borderRadius: 16,
//     marginBottom: 14,
//     flexDirection: 'row',
//     overflow: 'hidden',
//     shadowColor: C.primary,
//     shadowOffset: { width: 0, height: 3 },
//     shadowOpacity: 0.15,
//     shadowRadius: 8,
//     elevation: 4,
//   },
//   selectedCardAccent: {
//     width: 5,
//     backgroundColor: C.primary,
//   },
//   selectedCardContent: {
//     flex: 1,
//     flexDirection: 'row',
//     alignItems: 'center',
//     padding: 16,
//     gap: 14,
//   },
//   selectedIcon: { fontSize: 36 },
//   selectedDate: { fontSize: 11, color: C.textMuted, fontWeight: '600', marginBottom: 3 },
//   selectedName: { fontSize: 17, fontWeight: '800', color: C.text, marginBottom: 6 },

//   noHolidayCard: {
//     backgroundColor: C.card,
//     borderRadius: 14,
//     padding: 16,
//     marginBottom: 14,
//     alignItems: 'center',
//   },
//   noHolidayText: { color: C.textMuted, fontSize: 13, fontWeight: '500' },

//   // ── Section
//   sectionHeader: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     marginBottom: 12,
//     marginTop: 4,
//     gap: 10,
//   },
//   sectionLine: { flex: 1, height: 1, backgroundColor: C.border },
//   sectionTitle: {
//     fontSize: 10,
//     fontWeight: '800',
//     color: C.primary,
//     letterSpacing: 2,
//   },

//   // ── Holiday List Item
//   holidayItem: {
//     backgroundColor: C.card,
//     borderRadius: 16,
//     flexDirection: 'row',
//     alignItems: 'center',
//     marginBottom: 10,
//     overflow: 'hidden',
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 1 },
//     shadowOpacity: 0.05,
//     shadowRadius: 4,
//     elevation: 2,
//   },
//   holidayLeft: {
//     width: 60,
//     height: 60,
//     alignItems: 'center',
//     justifyContent: 'center',
//   },
//   holidayIcon: { fontSize: 26 },
//   holidayInfo: {
//     flex: 1,
//     paddingVertical: 12,
//     paddingHorizontal: 12,
//     gap: 5,
//   },
//   holidayName: { fontSize: 14, fontWeight: '700', color: C.text },
//   badge: {
//     alignSelf: 'flex-start',
//     borderRadius: 6,
//     paddingHorizontal: 7,
//     paddingVertical: 2,
//   },
//   badgeText: { fontSize: 9, fontWeight: '800', color: C.white, letterSpacing: 0.8 },
//   holidayDateBubble: {
//     width: 44,
//     height: 44,
//     borderRadius: 12,
//     backgroundColor: C.primaryFade,
//     alignItems: 'center',
//     justifyContent: 'center',
//     marginRight: 14,
//   },
//   holidayDateNum: { fontSize: 18, fontWeight: '800', color: C.primary },

//   // ── Empty
//   emptyMonth: { alignItems: 'center', paddingVertical: 32 },
//   emptyMonthIcon: { fontSize: 40, marginBottom: 10 },
//   emptyMonthText: { color: C.textMuted, fontSize: 14, fontWeight: '500' },

//   // ── Legend
//   legend: {
//     flexDirection: 'row',
//     justifyContent: 'center',
//     gap: 20,
//     paddingVertical: 12,
//     backgroundColor: C.card,
//     borderTopWidth: 1,
//     borderTopColor: C.border,
//   },
//   legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
//   legendDot: { width: 8, height: 8, borderRadius: 4 },
//   legendText: { fontSize: 11, fontWeight: '600', color: C.textSub },
// });