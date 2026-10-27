import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Image,
  FlatList,
} from 'react-native';
import React, { useMemo, useCallback, useEffect, useState } from 'react';
import BottomSheetBase from './BottomSheetBase';
import { API_BASE_URL2 } from '../Apis/Services/ServerURL';
import { getFontSize, haversineDistance } from './Helper';
import GoogleMapsModal from './GoogleMapsModal';

const DEFAULT_IMAGE_URI =
  'https://images.unsplash.com/photo-1633332755192-727a05c4013d?q=80&w=1480&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D';

const LOCATION_STATUS = {
  ACTIVE: 'ACTIVE', // Green - received location within 2 minutes
  INACTIVE: 'INACTIVE', // Red - no location for 4+ minutes
};

const TWO_MINUTES = 2 * 60 * 1000;
const FOUR_MINUTES = 4 * 60 * 1000;

const getLocationStatus = (lastUpdateTime?: number) => {
  if (!lastUpdateTime) return LOCATION_STATUS.INACTIVE;

  const timeSinceUpdate = Date.now() - lastUpdateTime;

  if (timeSinceUpdate <= TWO_MINUTES) {
    return LOCATION_STATUS.ACTIVE;
  } else if (timeSinceUpdate >= FOUR_MINUTES) {
    return LOCATION_STATUS.INACTIVE;
  }

  // Between 2-4 minutes, keep current status
  return LOCATION_STATUS.ACTIVE;
};

const StatusIndicator = React.memo(({ status }: { status: string }) => {
  const isActive = status === LOCATION_STATUS.ACTIVE;

  return (
    <View
      style={[
        styles.statusIndicator,
        { backgroundColor: isActive ? '#22C55E' : '#EF4444' },
      ]}
    />
  );
});


const LocationItem = React.memo(
  ({ item, onPress, onDistancePress, referenceLat, referenceLon }) => {
    const imageUri = item.profile_image
      ? `${API_BASE_URL2}${item.profile_image}`
      : DEFAULT_IMAGE_URI;

    const distance = useMemo(
      () =>
        haversineDistance(
          referenceLat,
          referenceLon,
          item.latitude,
          item.longitude,
        ),
      [referenceLat, referenceLon, item.latitude, item.longitude],
    );


    const status = useMemo(
      () => getLocationStatus(item.timestamp),
      [item.timestamp]
    );

    return (
      <TouchableOpacity
        disabled={!item.latitude}
        onPress={() => onPress(item.employee_id)}
        style={styles.itemContainer}>
        <View style={styles.imageContainer}>
          <Image
            style={styles.image}
            source={{ uri: imageUri }}
            resizeMode={'cover'}
          />
          <StatusIndicator status={status} />
        </View>

        <View style={styles.textContainer}>
          <Text style={styles.nameText} numberOfLines={1}>
            {item.name}
          </Text>
          {item.latitude && (
            <TouchableOpacity
              style={styles.distanceButton}
              onPress={() => onDistancePress(item)}>
              <Text style={styles.distanceLabel}>Distance:</Text>
              <Text style={styles.distanceValue}>{distance}</Text>
              <Text style={styles.directionIcon}>→</Text>
            </TouchableOpacity>
          )}
        </View>
      </TouchableOpacity>
    );
  },
);



const BottomSheetMapBox = ({
  visible,
  onClose,
  data,
  handleFocus,
  userLocation
}) => {
  const [, forceUpdate] = useState(0);
  const [showMapsModal, setShowMapsModal] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);

  const referenceLat = userLocation?.latitude || 26.9132885972103;
  const referenceLon = userLocation?.longitude || 75.73996468884121;


  useEffect(() => {
    if (!visible) return;

    const interval = setInterval(() => {
      forceUpdate(prev => prev + 1);
    }, 30000);

    return () => clearInterval(interval);
  }, [visible]);

  const entries = useMemo(() => {
    const employeeArray = Object.entries(data).map(([id, employee]) => ({
      employee_id: id,
      ...employee,
    }));

    return employeeArray.sort((a, b) => {
      const statusA = getLocationStatus(a.timestamp);
      const statusB = getLocationStatus(b.timestamp);

      if (statusA !== statusB) {
        return statusA === LOCATION_STATUS.ACTIVE ? -1 : 1;
      }

      return (a.name || '').localeCompare(b.name || '');
    });
  }, [data]);

  const memoizedHandleFocus = useCallback(
    (id) => {
      handleFocus(id);
    },
    [handleFocus],
  );

  const handleDistancePress = useCallback((employee) => {
    setSelectedEmployee(employee);
    setShowMapsModal(true);
  }, []);

  const renderItem = useCallback(
    ({ item }) => (
      <LocationItem
        item={item}
        onPress={memoizedHandleFocus}
        onDistancePress={handleDistancePress}
        referenceLat={referenceLat}
        referenceLon={referenceLon}
      />
    ),
    [memoizedHandleFocus, handleDistancePress, referenceLat, referenceLon]
  );

  const keyExtractor = useCallback((item) => item.employee_id.toString(), []);

  return (
    <>
      <BottomSheetBase visible={visible} onClose={onClose} snapPoints={['50%']}>
        <View style={styles.header}>
          <View style={styles.legendContainer}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#22C55E' }]} />
              <Text style={styles.legendText}>Active (≤2 min)</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#EF4444' }]} />
              <Text style={styles.legendText}>Inactive (≥4 min)</Text>
            </View>
          </View>
        </View>

        <FlatList
          data={entries}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          initialNumToRender={10}
          maxToRenderPerBatch={10}
          windowSize={5}
        />
      </BottomSheetBase>

      {selectedEmployee && (
        <GoogleMapsModal
          visible={showMapsModal}
          onClose={() => setShowMapsModal(false)}
          origin={{
            latitude: referenceLat,
            longitude: referenceLon,
            name: 'Your Location',
          }}
          destination={{
            latitude: selectedEmployee.latitude,
            longitude: selectedEmployee.longitude,
            name: selectedEmployee.name,
          }}
        />
      )}
    </>
  );
};

const styles = StyleSheet.create({
  header: {
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#EAECF0',
    marginBottom: 10,
  },
  legendContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendText: {
    fontSize: 12,
    color: '#6A7D94',
    fontFamily: 'Poppins-Regular',
  },
  listContainer: {
    gap: 10,
    paddingBottom: 20,
  },
  itemContainer: {
    backgroundColor: 'white',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 15,
    borderWidth: 1,
    borderColor: '#EAECF0',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  imageContainer: {
    position: 'relative',
  },
  image: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  statusIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: 'white',
  },
  textContainer: {
    flex: 1,
  },
  nameText: {
    color: '#45484D',
    fontSize: 15,
    fontFamily: 'Poppins-Medium',
    textTransform: 'capitalize',
    marginBottom: 4,
  },
  distanceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 4,
    paddingHorizontal: 8,
    backgroundColor: '#F3F4F6',
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  distanceLabel: {
    color: '#6A7D94',
    fontSize: 12,
    fontFamily: 'Poppins-Medium',
  },
  distanceValue: {
    fontSize: 12,
    color: '#CA282C',
    fontFamily: 'Poppins-SemiBold',
  },
  directionIcon: {
    fontSize: 14,
    color: '#CA282C',
    fontWeight: 'bold',
  },
});

export default React.memo(BottomSheetMapBox);