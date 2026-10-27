import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Correct, CorrectIcon } from './IconsLoad';
import { getFontSize } from './Helper';

const SegmentedControl = ({ selected, segments, onSelect }) => {
  const [selectedIndex, setSelectedIndex] = useState(selected || 0);

  const handlePress = (index) => {
    setSelectedIndex(index);
    if (onSelect) {
      onSelect(segments[index]);
    }
  };

  return (
    <View style={styles.container}>
      {segments.map((segment, index) => (
        <TouchableOpacity
          key={index}
          style={[
            styles.segment,
            selectedIndex === index ? styles.selectedSegment : null,
            index === 0 ? styles.firstSegment : null,
            index === segments.length - 1 ? styles.lastSegment : null,
          ]}
          onPress={() => handlePress(index)}
        >
          {selectedIndex === index && (
            <Correct color='#333' width={15} height={15} />
          )}
          <Text
            style={[
              styles.segmentText,
              selectedIndex === index ? styles.selectedSegmentText : null,
            ]}
          >
            {segment}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};


const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    borderRadius: 50,
    borderWidth: 1,
    borderColor: '#6A7D94',
    overflow: 'hidden',

  },
  segment: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 5,
    alignItems: 'center',
    justifyContent: 'center',
    borderRightWidth: 1,
    borderRightColor: '#6A7D94',
    flexDirection: 'row',
    gap: 5
  },
  firstSegment: {
    borderTopLeftRadius: 7,
    borderBottomLeftRadius: 7,
  },
  lastSegment: {
    borderRightWidth: 0,
    borderTopRightRadius: 7,
    borderBottomRightRadius: 7,
  },
  selectedSegment: {
    backgroundColor: '#FFF2F2',
  },
  segmentText: {
    color: '#333',
    fontFamily: 'Poppins-Medium',
    fontSize: 12,
    lineHeight: 15,
    flexDirection: 'row',
    textTransform: 'capitalize',
    textAlign: 'center',
  },
  selectedSegmentText: {
  },
});

export default SegmentedControl;
