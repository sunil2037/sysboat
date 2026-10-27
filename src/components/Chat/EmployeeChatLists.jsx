import React, { useState, useEffect, useMemo } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    Image,
    TouchableOpacity,
    SafeAreaView,
    ActivityIndicator,
    ImageBackground,
    FlatList,
    Modal,
    Pressable,
    ScrollView,
    Alert,
    Vibration,
} from 'react-native';
import TopNavBar from '../../navigation/TopNavBar';
import backgroundImage from '../../../assets/Icon/background.png';
import { Back, Correct, CorrectIcon, HeartIcon, LeftIcon, LeftSideArrow, PlusIcon, SearchIcon } from '../../Helper/IconsLoad';
import { bottomHeight, getFontSize, STATUS_BAR_HEIGHT } from '../../Helper/Helper';
import { toast } from '../../Helper/ToastManager';

const EmployeeChatLists = ({ navigation }) => {
    const [searchText, setSearchText] = useState('');
    const [employees, setEmployees] = useState([]);
    const [filteredEmployees, setFilteredEmployees] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const [groups, setGroups] = useState([]);
    const [createModalVisible, setCreateModalVisible] = useState(false);
    const [selectedMembers, setSelectedMembers] = useState([]);
    const [groupName, setGroupName] = useState('');
    const [typingStatus, setTypingStatus] = useState({});

    const [activeFilter, setActiveFilter] = useState('All');
    const [favourites, setFavourites] = useState([]);

    const [longPressedEmployee, setLongPressedEmployee] = useState([]);

    useEffect(() => fetchEmployees(), []);

    const fetchEmployees = () => {
        setRefreshing(true);
        setTimeout(() => {
            const mockEmployees = [
                { id: '1', name: 'John Smith', position: 'Senior Developer', department: 'Engineering', email: 'john.smith@company.com', phone: '+1 (555) 123-4567', avatar: 'https://randomuser.me/api/portraits/men/1.jpg', isFavourite: true, },
                { id: '2', name: 'Sarah Johnson', position: 'Product Manager', department: 'Product', email: 'sarah.j@company.com', phone: '+1 (555) 234-5678', avatar: 'https://randomuser.me/api/portraits/women/1.jpg', isFavourite: true, },
                { id: '3', name: 'Michael Chen', position: 'UX Designer', department: 'Design', email: 'michael.c@company.com', phone: '+1 (555) 345-6789', avatar: 'https://randomuser.me/api/portraits/men/2.jpg', isFavourite: true, },
                { id: '4', name: 'Emily Wilson', position: 'Marketing Specialist', department: 'Marketing', email: 'emily.w@company.com', phone: '+1 (555) 456-7890', avatar: 'https://randomuser.me/api/portraits/women/2.jpg', isFavourite: true, },
                { id: '5', name: 'David Kim', position: 'Data Analyst', department: 'Analytics', email: 'david.k@company.com', phone: '+1 (555) 567-8901', avatar: 'https://randomuser.me/api/portraits/men/3.jpg', isFavourite: true, },
                { id: '6', name: 'Priya Patel', position: 'HR Manager', department: 'HR', email: 'priya.p@company.com', phone: '+91 98765 43210', avatar: 'https://randomuser.me/api/portraits/women/3.jpg', isFavourite: true, },
                { id: '7', name: 'Rohit Singh', position: 'Sales Lead', department: 'Sales', email: 'rohit.s@company.com', phone: '+91 91234 56789', avatar: 'https://randomuser.me/api/portraits/men/4.jpg', isFavourite: true, },
            ];
            setEmployees(mockEmployees);
            setFilteredEmployees(mockEmployees);
            setIsLoading(false);
            setRefreshing(false);

            setGroups([
                {
                    id: 'g1',
                    name: 'Design + Product',
                    members: [mockEmployees[1], mockEmployees[2]],
                    messages: [
                        { id: 'm1', text: 'Welcome to the group!', senderId: mockEmployees[1].id, createdAt: Date.now() - 1000 * 60 * 60 },
                        { id: 'm2', text: 'Hi all 👋', senderId: mockEmployees[2].id, createdAt: Date.now() - 1000 * 60 * 30 },
                    ],
                    unread: 2,
                    isFavourite: false,
                },
            ]);
        }, 900);
    };

    useEffect(() => {
        if (searchText === '') setFilteredEmployees(employees);
        else {
            const q = searchText.toLowerCase();
            setFilteredEmployees(
                employees.filter(
                    (e) =>
                        e.name.toLowerCase().includes(q) ||
                        e.position.toLowerCase().includes(q) ||
                        e.department.toLowerCase().includes(q)
                )
            );
        }
    }, [searchText, employees]);

    const toggleSelectMember = (employee) => {
        setSelectedMembers((prev) => {
            if (prev.find((m) => m.id === employee.id))
                return prev.filter((m) => m.id !== employee.id);
            return [...prev, employee];
        });
    };

    const toggleFavourite = (selectedEmployees) => {
        if (!Array.isArray(selectedEmployees)) return;

        setFavourites((prev) => {
            const newFavs = [...prev];
            selectedEmployees.forEach((emp) => {
                if (newFavs.includes(emp.id)) {
                    // remove
                    const idx = newFavs.indexOf(emp.id);
                    newFavs.splice(idx, 1);
                } else {
                    // add
                    newFavs.push(emp.id);
                }
            });
            return newFavs;
        });
    };



    const HeaderLongPress = () => {
        const favouriteEmployees = useMemo(() => {
            return employees.filter(e => favourites.includes(e.id));
        }, [employees, favourites]);


        return (
            <View style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 15, paddingBottom: 20 }}>
                <View style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 14 }}>
                    <TouchableOpacity>
                        <LeftIcon width={25} height={25} />
                    </TouchableOpacity>
                    <Text style={{ fontSize: 18, fontFamily: 'Poppins-Regular' }}>1</Text>
                </View>
                <View>
                    <TouchableOpacity onPress={() => toggleFavourite(longPressedEmployee)}>
                        <HeartIcon width={25} height={25} isFavourite={favouriteEmployees?.length > 0 ? true : false} color={favouriteEmployees?.length > 0 ? 'black' : 'white'} />
                    </TouchableOpacity>
                </View>
            </View>
        )
    }

    const EnableMoreOptions = (item) => {
        Vibration.vibrate(50)
        setLongPressedEmployee((prev) => {
            const alreadySelected = prev.find((emp) => emp.id === item.id);
            if (alreadySelected) {
                return prev.filter((emp) => emp.id !== item.id);
            } else {
                return [...prev, item];
            }
        });
    }

    const createGroup = () => {
        if (!groupName.trim() || selectedMembers.length < 1) {
            toast.info('Please add a group name and at least one member.');
            return;
        }
        const newGroup = {
            id: `g_${Date.now()}`,
            name: groupName.trim(),
            members: selectedMembers,
            messages: [
                {
                    id: `m_${Date.now()}`,
                    text: `${selectedMembers[0].name} created the group`,
                    senderId: selectedMembers[0].id,
                    createdAt: Date.now(),
                },
            ],
            unread: 0,
        };
        setGroups((prev) => [newGroup, ...prev]);
        setGroupName('');
        setSelectedMembers([]);
        setCreateModalVisible(false);
        navigation.navigate('GroupChat', { group: newGroup, onUpdateGroup });
    };

    const onUpdateGroup = (updatedGroup) => {
        setGroups((prev) =>
            prev.map((g) => (g.id === updatedGroup.id ? updatedGroup : g))
        );
    };

    const getGroupInitials = (group) => {
        if (!group) return '';
        const parts = group.name.split(' ');
        if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
        return (parts[0][0] + parts[1][0]).toUpperCase();
    };

    const timeSince = (time) => {
        const seconds = Math.floor((Date.now() - time) / 1000);
        if (seconds < 60) return `${seconds}s`;
        const minutes = Math.floor(seconds / 60);
        if (minutes < 60) return `${minutes}m`;
        const hours = Math.floor(minutes / 60);
        if (hours < 24) return `${hours}h`;
        const days = Math.floor(hours / 24);
        return `${days}d`;
    };

    // Combine all data into one list based on active filter
    const combinedList = useMemo(() => {
        let items = [];
        if (activeFilter === 'All') items = [...groups, ...filteredEmployees];
        else if (activeFilter === 'Groups') items = [...groups];
        else if (activeFilter === 'Favourites')
            items = [...groups, ...filteredEmployees].filter((i) =>
                favourites.includes(i.id)
            );
        return items;
    }, [activeFilter, groups, filteredEmployees, favourites]);

    const renderItem = ({ item, index }) => {
        const isGroup = item.members !== undefined;
        const isLongPressed = longPressedEmployee?.some(emp => emp.id === item.id);

        return (
            <TouchableOpacity
                onPress={() => {
                    if (longPressedEmployee?.length > 0) {
                        EnableMoreOptions(item);
                    } else {
                        isGroup
                            ? navigation.navigate('GroupChat', { group: item, onUpdateGroup })
                            : navigation.navigate('ChatMessage', { user: item })
                    }

                }
                }
                onLongPress={() => EnableMoreOptions(item)}
                style={[styles.employeeCard, { outlineWidth: isLongPressed ? 1 : 0, outlineColor: '#d5d5d5ff' }]}
                activeOpacity={0.8}
            >
                <View style={[styles.employeeInfo, { gap: 15 }]}>
                    {isLongPressed ? (
                        <View style={[styles.groupAvatar, { backgroundColor: '#000000ff' }]}>
                            <Image source={{ uri: item.avatar }} style={styles.avatar} />
                            <View style={{ position: 'absolute', backgroundColor: '#CA282C', padding: 7, borderRadius: 50, bottom: 0, right: 0 }}>
                                <Correct color={'white'} width={10} height={10} />
                            </View>
                        </View>
                    ) : (
                        isGroup ? (
                            <View style={styles.groupAvatar}>
                                <Text style={{ color: '#fff', fontFamily: 'Poppins-Medium' }}>
                                    {getGroupInitials(item)}
                                </Text>
                            </View>
                        ) : (
                            <Image source={{ uri: item.avatar }} style={styles.avatar} />
                        )
                    )}

                    <View style={styles.textContainer}>
                        <View style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', flex: 1 }}>
                            <Text style={styles.name}>{item.name}</Text>
                            <Text style={{ fontSize: 10, fontFamily: 'Poppins-Regular' }}>10/03/25</Text>
                        </View>
                        <Text style={styles.position}>
                            {isGroup
                                ? item.messages[item.messages.length - 1]?.text ||
                                'No messages yet'
                                : item.position}
                        </Text>
                    </View>
                </View>

                {/* <TouchableOpacity onPress={() => toggleFavourite(item.id)}>
                    <Text style={{ fontSize: 22 }}>
                        {favourites.includes(item.id) ? <HeartIcon color={'#CA282C'} isFavourite={true} /> : <HeartIcon isFavourite={false} color={'white'} />}
                    </Text>
                </TouchableOpacity> */}
            </TouchableOpacity>
        );
    };

    const renderChip = (label) => (
        <TouchableOpacity
            key={label}
            onPress={() => setActiveFilter(label)}
            style={[
                styles.chip,
                activeFilter === label && styles.activeChip,
            ]}
        >
            <Text
                style={[
                    styles.chipText,
                    activeFilter === label && styles.activeChipText,
                ]}
            >
                {label}
            </Text>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.container}>
            <ImageBackground
                source={backgroundImage}
                resizeMode="cover"
                style={{ flex: 1, paddingTop: STATUS_BAR_HEIGHT(), ...StyleSheet.absoluteFillObject }}
            >
                {longPressedEmployee?.length > 0 ? (
                    <HeaderLongPress />
                ) : (
                    <TopNavBar title={'Chats'} navigation={navigation} />
                )}

                <View style={styles.searchContainer}>
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Search here..."
                        placeholderTextColor="#999"
                        value={searchText}
                        onChangeText={setSearchText}
                        clearButtonMode="while-editing"
                    />
                    <View style={{ position: 'absolute', left: 10 }}>
                        <SearchIcon color={'#CA282C'} width={30} height={30} />
                    </View>
                </View>

                <View style={styles.chipContainer}>
                    {['All', 'Groups', 'Favourites'].map(renderChip)}
                </View>

                {isLoading ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color="#4a90e2" />
                        <Text style={styles.loadingText}>Loading...</Text>
                    </View>
                ) : (
                    <FlatList
                        data={combinedList}
                        renderItem={renderItem}
                        keyExtractor={(item) => item.id}
                        showsVerticalScrollIndicator={false}
                        refreshing={refreshing}
                        onRefresh={fetchEmployees}
                        contentContainerStyle={{ paddingBottom: bottomHeight() + 60 }}
                    />
                )}

                <TouchableOpacity
                    onPress={() => setCreateModalVisible(true)}
                    style={[styles.createGroupBtn, { bottom: bottomHeight(), right: 20 }]}
                >
                    <PlusIcon color={'white'} width={25} height={25} />
                </TouchableOpacity>
                <Modal visible={createModalVisible} animationType="fade" transparent statusBarTranslucent>
                    <View style={[styles.modalContainer, { paddingHorizontal: 15, paddingTop: STATUS_BAR_HEIGHT(), paddingBottom: bottomHeight() }]}>
                        <Text style={{ fontSize: 18, marginBottom: 8, fontFamily: 'Poppins-Medium' }}>Create Group</Text>
                        <TextInput placeholder="Group name" value={groupName} onChangeText={setGroupName} placeholderTextColor={'black'} cursorColor={'black'} style={[{ marginBottom: 10, padding: 16, borderWidth: 1, color: 'black', borderColor: '#E2E2E2', borderRadius: 10, fontFamily: 'Poppins-Regular' }]} />
                        <Text style={{ marginBottom: 8, color: '#444', fontFamily: 'Poppins-Regular' }}>Select members</Text> <ScrollView style={{}} contentContainerStyle={{ gap: 10 }}> {employees.map(emp => {
                            const selected = selectedMembers.find(m => m.id === emp.id); return (<Pressable key={emp.id} onPress={() => toggleSelectMember(emp)} style={[styles.memberRow, selected && { backgroundColor: '#f1f1f1ff' }]}>
                                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                    <Image source={{ uri: emp.avatar }} style={{ width: 40, height: 40, borderRadius: 20, marginRight: 10 }} />
                                    <View>
                                        <Text style={{ fontFamily: 'Poppins-Medium' }}>{emp.name}</Text>
                                        <Text style={{ fontSize: 12, color: '#666', fontFamily: 'Poppins-Regular' }}>{emp.position}</Text>
                                    </View>
                                </View>
                                <View> {selected ? (<View style={{ width: 15, height: 15, borderRadius: 20, outlineWidth: 1, outlineOffset: 2, padding: 5, backgroundColor: '#000000ff' }} />) : (<View style={{ width: 20, height: 20, borderRadius: 20, borderWidth: 1, borderColor: '#999' }} />)}
                                </View>
                            </Pressable>);
                        })} </ScrollView>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 12, gap: 10 }}> <TouchableOpacity style={[styles.modalBtn, { backgroundColor: '#e7e7e7' }]} onPress={() => { setCreateModalVisible(false); setSelectedMembers([]); setGroupName(''); }}>
                            <Text style={{ fontFamily: 'Poppins-Regular' }}>Cancel</Text>
                        </TouchableOpacity>
                            <TouchableOpacity style={[styles.modalBtn, { backgroundColor: '#CA282C' }]} onPress={createGroup}> <Text style={{ color: '#fff', fontFamily: 'Poppins-Regular' }}>Create</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </Modal>
            </ImageBackground>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f8f9fa', ...StyleSheet.absoluteFillObject },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: 50,
        marginHorizontal: 16,
        marginVertical: 10,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderWidth: 1,
        borderColor: '#E2E2E2',
        position: 'relative',
    },
    searchInput: {
        flex: 1,
        fontSize: 16,
        color: '#333',
        paddingVertical: 10,
        paddingLeft: 30,
        fontFamily: 'Poppins-Regular',
    },
    chipContainer: {
        flexDirection: 'row',
        marginHorizontal: 16,
        marginBottom: 8,
        gap: 8,
    },
    chip: {
        paddingVertical: 8,
        paddingHorizontal: 20,
        borderRadius: 20,
        backgroundColor: '#ffffffff',
    },
    activeChip: { backgroundColor: '#CA282C' },
    chipText: { color: '#555', fontFamily: 'Poppins-Regular' },
    activeChipText: { color: '#fff' },

    createGroupBtn: {
        padding: 12,
        backgroundColor: '#CA282C',
        borderRadius: 50,
        position: 'absolute',
    },
    employeeCard: {
        backgroundColor: '#fff',
        borderRadius: 12,
        marginHorizontal: 15,
        marginVertical: 6,
        padding: 12,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    employeeInfo: { flexDirection: 'row', alignItems: 'center', flex: 1 },
    avatar: { width: 56, height: 56, borderRadius: 28, },
    groupAvatar: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: '#4a90e2',
        alignItems: 'center',
        justifyContent: 'center',
    },
    textContainer: { flex: 1 },
    name: { fontSize: 16, color: '#333', fontFamily: 'Poppins-Medium' },
    position: { fontSize: 12, color: '#666', fontFamily: 'Poppins-Regular' },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    loadingText: { marginTop: 16, fontSize: 16, color: '#666' },
    modalContainer: { backgroundColor: '#fff', width: '100%', flex: 1, borderRadius: 12 },
    memberRow: { padding: 8, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 0.5, borderBottomColor: '#ffffffff', borderRadius: 5 }, modalBtn: { padding: 10, borderRadius: 50, flex: 1, alignItems: 'center' },
});

export default EmployeeChatLists;
