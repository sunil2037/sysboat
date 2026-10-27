import React, { useState } from 'react';
import { View, TouchableOpacity, Text, TextInput, Keyboard, KeyboardAvoidingView, Platform, StyleSheet, ScrollView } from 'react-native';
import { Down } from './IconsLoad';
import { getFontSize } from './Helper';

const CustomDropdown = ({ value, onValueChange, error, data, placeholder, border }) => {
  const [show, setShow] = useState(false);
  const togglePicker = () => {
    Keyboard.dismiss();
    setShow((prev) => !prev);
  };

  const selectItem = (item) => {
    onValueChange(item);
    setShow(false);
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
      <View style={{ height: 57 }}>
        <TouchableOpacity onPress={togglePicker} style={{ position: 'relative' }} activeOpacity={1}>
          <TextInput
            placeholder={placeholder ? placeholder : 'Select Leave Type'}
            placeholderTextColor="#6A7D94"
            value={value}
            editable={false}
            style={[styles.input, error ? styles.errorInput : '', { borderWidth: border ? 1 : 0, borderColor: error ? 'red' : '#F4F4F4' }]}
          />

          <View
            style={{
              position: 'absolute',
              right: 15,
              top: '50%',
              transform: [{ translateY: '-50%' }, { rotate: show ? '180deg' : '0deg' }],
              transition: 'transform 0.3s ease',
            }}
          >
            <Down />
          </View>
        </TouchableOpacity>

        {show && (
          <View
            style={{
              backgroundColor: 'white',
              borderWidth: 1,
              borderRadius: 5,
              borderColor: '#6A7D94',
              position: 'absolute',
              top: 55,
              zIndex: 10,
              elevation: 5,
              width: '100%',
            }}
          >
            <ScrollView style={{ height: 200 }}>
              {data.map((item) => (
                <TouchableOpacity
                  key={item}
                  onPress={() => selectItem(item)}
                  style={{
                    padding: 10,
                    borderBottomWidth: 1,
                    borderColor: '#ccc',
                  }}
                >
                  <Text style={{ fontFamily: 'Poppins-Regular', color: '#6A7D94' }}>{item}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  input: {
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 5,
    backgroundColor: 'white',
    height: 57,
    fontFamily: 'Poppins-Regular',
    fontSize: 14,
    color: '#6A7D94',
    lineHeight: 15,
  },
  errorInput: {
    borderColor: 'red',
    borderWidth: 1,
  },
  errorText: {
    color: 'red',
    fontSize: 12,
    fontFamily: 'Poppins-Regular',
  },
});

export default CustomDropdown;
