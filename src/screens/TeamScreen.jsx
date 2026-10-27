import { useMutation, useQuery } from '@tanstack/react-query';
import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  Dimensions,
  FlatList,
  ImageBackground,
  RefreshControl,
  StyleSheet,
} from 'react-native';
import useApi from '../Apis/Services/ApiConfig';
import backgroundImage from '../../assets/Icon/background.png';
import BottomSheetTeamScreen from '../Helper/BottomSheetTeamScreen';
import { Down, RightIcon } from '../Helper/IconsLoad';
import TopNavBar from '../navigation/TopNavBar';
import EmptyMessage from '../Helper/EmptyMessage';
import useEncodedUserData from '../hooks/useEncodedUserData';
import { toast } from '../Helper/ToastManager';
import { API_BASE_URL2 } from '../Apis/Services/ServerURL';
import { DEFAULT_IMAGE, getFontSize, STATUS_BAR_HEIGHT } from '../Helper/Helper';
import { SafeAreaView } from 'react-native-safe-area-context';
import Skeleton, { getLayout } from '../Helper/Skeleton';
import { SCREEN_HEIGHT } from '@gorhom/bottom-sheet';
import ThemedText from '../Helper/ThemedText';

const SCREEN_WIDTH = Dimensions.get('window').width;

const flattenTree = (nodes, collapsedNodes, level = 0) => {
  const flattened = [];

  const flatten = (node, currentLevel, parentCollapsed = false) => {
    if (!node) return;

    const isCollapsed = collapsedNodes[node.id];
    const hasChildren = node.children && node.children.length > 0;

    flattened.push({
      ...node,
      level: currentLevel,
      hasChildren,
      isCollapsed,
      isHidden: parentCollapsed,
    });

    if (hasChildren && !isCollapsed && !parentCollapsed) {
      node.children.forEach((child) => {
        flatten(child, currentLevel + 1, false);
      });
    }
  };

  nodes.forEach((node) => flatten(node, level));
  return flattened.filter(item => !item.isHidden);
};

// Optimized TreeNode component
const TreeNode = React.memo(({
  item,
  handleDetailsView,
  handleCollapseToggle
}) => {
  const profileImageUri = item?.profile_image
    ? API_BASE_URL2 + item?.profile_image
    : DEFAULT_IMAGE;

  // Color gradient based on hierarchy level
  const levelColors = ['#CA282C', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899'];
  const borderColor = levelColors[Math.min(item.level, levelColors.length - 1)];

  // Badge colors for levels
  const badgeColors = ['#CA282C', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899'];
  const badgeColor = badgeColors[Math.min(item.level, badgeColors.length - 1)];

  return (
    <View style={[
      styles.nodeWrapper,
      item.level > 0 && {
        marginLeft: 20 + (item.level * 25),
        marginTop: 8,
      }
    ]}>
      <TouchableOpacity
        onPress={() => handleDetailsView(item.id)}
        activeOpacity={0.7}
        style={[
          styles.nodeCard,
          {
            borderLeftWidth: 4,
            borderLeftColor: borderColor,
            backgroundColor: item.level === 0 ? '#FFFFFF' : '#F9FAFB',
          }
        ]}>

        {item.level > 0 && (
          <View style={[styles.levelBadge, { backgroundColor: badgeColor }]}>
            <ThemedText size='xs' weight='Medium' color='inverse'>
              L{item.level}
            </ThemedText>
          </View>
        )}

        <View style={styles.nodeContent}>
          <Image
            style={[
              styles.profileImage,
              item.level === 0 && styles.rootProfileImage
            ]}
            source={{ uri: profileImageUri }}
            resizeMode="cover"
          />
          <View style={styles.nameContainer}>
            <ThemedText transform='capitalize' numberOfLines={1} size='sm' weight={item.level === 0 ? 'SemiBold' : 'Medium'} >
              {item.name}
            </ThemedText>
            {item.hasChildren && (
              <ThemedText numberOfLines={1} size='xs' weight={'Regular'} color='secondary' >
                {item.children.length} {item.children.length === 1 ? 'member' : 'members'}
              </ThemedText>

            )}
          </View>
        </View>

        {item.hasChildren && (
          <TouchableOpacity
            style={styles.collapseButton}
            onPress={() => handleCollapseToggle(item.id)}
            activeOpacity={0.7}>
            {item.isCollapsed ? (
              <RightIcon color="#293646" width={25} height={25} />
            ) : (
              <Down color="#293646" width={25} height={25} />
            )}
          </TouchableOpacity>
        )}
      </TouchableOpacity>
    </View>
  );
});

TreeNode.displayName = 'TreeNode';

const TeamScreen = ({ navigation }) => {
  const { FetchTeam, FetchTeamDetails } = useApi();
  const { userdata } = useEncodedUserData();
  const [visible, setVisible] = useState(false);
  const [detailsData, setDetailsData] = useState([]);
  const [collapsedNodes, setCollapsedNodes] = useState({});

  const handleCollapseToggle = useCallback((id) => {
    setCollapsedNodes((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  }, []);

  const handleCloseBottomSheet = useCallback(() => {
    setVisible(false);
  }, []);

  const {
    mutate: fetchTeamDetails,
    isLoading: FetchTeamDetailsLoading,
    isPending,
  } = useMutation({
    mutationFn: ({ UserId }) =>
      FetchTeamDetails({
        userData: userdata,
        UserId: UserId,
      }),
    onSuccess: (response) => {
      setDetailsData(response.data);
      setVisible(true);
    },
    onError: (error) => {
      console.warn('Query failed with error:', error);
      toast.error(error.message);
    },
  });

  const {
    data: employeeData,
    isLoading,
    refetch,
    isPending: employeeDataPending,
  } = useQuery({
    queryKey: ['FetchTeam', userdata],
    queryFn: () => FetchTeam({ userData: userdata }),
    enabled: !!userdata,
  });

  const handleRefresh = useCallback(async () => {
    await refetch();
  }, [refetch]);

  // Optimize: Open bottom sheet immediately, fetch data in background
  const handleDetailsView = useCallback(
    (id) => {
      setVisible(true);
      setDetailsData([]); // Clear previous data
      if (id) {
        fetchTeamDetails({ UserId: id });
      }
    },
    [fetchTeamDetails]
  );

  // Memoize flattened data
  const flattenedData = useMemo(() => {
    if (!Array.isArray(employeeData) || employeeData.length === 0) {
      return [];
    }
    return flattenTree(employeeData, collapsedNodes);
  }, [employeeData, collapsedNodes]);

  const isLoadingData = isLoading || employeeDataPending;

  const renderItem = useCallback(
    ({ item }) => (
      <TreeNode
        item={item}
        handleDetailsView={handleDetailsView}
        handleCollapseToggle={handleCollapseToggle}
      />
    ),
    [handleDetailsView, handleCollapseToggle]
  );

  const keyExtractor = useCallback((item) => item.id.toString(), []);

  const getItemLayout = useCallback(
    (data, index) => ({
      length: 70, // Fixed height for each item
      offset: 70 * index,
      index,
    }),
    []
  );

  return (
    <SafeAreaView style={styles.container}>
      <ImageBackground
        source={backgroundImage}
        resizeMode="cover"
        style={[styles.background, { paddingTop: STATUS_BAR_HEIGHT() }]}>
        <TopNavBar title="Teams" navigation={navigation} />


        <View style={styles.contentContainer}>
          <Skeleton isLoading={isLoadingData} layout={getLayout({ length: 1, height: SCREEN_HEIGHT - 150 })}>
            <FlatList
              data={flattenedData}
              renderItem={renderItem}
              keyExtractor={keyExtractor}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.flatListContent}
              ItemSeparatorComponent={() => <View style={styles.itemSeparator} />}
              refreshControl={
                <RefreshControl
                  refreshing={isLoadingData}
                  onRefresh={handleRefresh}
                />
              }
              removeClippedSubviews={false}
              maxToRenderPerBatch={20}
              windowSize={10}
              initialNumToRender={15}
              ListEmptyComponent={<EmptyMessage />}
              getItemLayout={getItemLayout}
            />
          </Skeleton>
        </View>
      </ImageBackground>

      <BottomSheetTeamScreen
        detailsData={detailsData}
        loading={FetchTeamDetailsLoading || isPending}
        visible={visible}
        onClose={handleCloseBottomSheet}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  background: {
    ...StyleSheet.absoluteFillObject,
    flex: 1,
  },
  skeletonContainer: {
    width: SCREEN_WIDTH,
    paddingHorizontal: 15,
  },
  skeletonWrapper: {
    backgroundColor: '#eee',
  },
  skeletonStyle: {
    padding: 10,
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: 15,
  },
  flatListContent: {
    paddingBottom: 20,
  },
  itemSeparator: {
    height: 10,
  },
  nodeWrapper: {
    position: 'relative',
  },
  nodeCard: {
    backgroundColor: '#F9F9F9',
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderRadius: 10,
    borderColor: '#EAECF0',
    borderWidth: 1,
    minHeight: 60,
  },
  levelBadge: {
    position: 'absolute',
    top: -8,
    left: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    zIndex: 1,
  },
  levelBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontFamily: 'Poppins-SemiBold',
    fontWeight: '600',
  },
  nodeContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    padding: 10,
  },
  nameContainer: {
    flex: 1,
    gap: 2,
  },
  profileImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  rootProfileImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 3,
    borderColor: '#CA282C',
  },
  nodeName: {
    fontSize: 14,
    fontFamily: 'Poppins-Medium',
    color: '#293646',
    textTransform: 'capitalize',
  },
  rootNodeName: {
    fontSize: 16,
    fontFamily: 'Poppins-SemiBold',
    color: '#1F2937',
  },
  childCount: {
    fontSize: 11,
    fontFamily: 'Poppins-Regular',
    color: '#6B7280',
  },
  collapseButton: {
    backgroundColor: '#EAECF0',
    borderTopRightRadius: 10,
    borderBottomRightRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 15,
    minWidth: 50,
  },
});

export default TeamScreen;