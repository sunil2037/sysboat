import React, { useEffect, useState } from 'react';
import { View, Text } from 'react-native';
import { SelectList } from 'react-native-dropdown-select-list';
import { Cross, Down, SearchIcon } from './IconsLoad';
import CustomMultiSelect from './CustomMultiSelect';
import { capitalizeFirstLetter } from './StringHelpers';
import ThemedText from './ThemedText';
const CustomNativeDropdown = ({
  enableDefaultOption,
  defaultOptions,
  search,
  datas = [],
  value,
  onValueChange,
  error,
  placeholder,
  mode = false,
  keyField = 'id',
  valueField = 'name',
  modeType,
  isMultipleSelect = false,
  disabled
}) => {
  const [selected, setSelected] = React.useState([]);
  const [selectedItems, setSelectedItems] = useState([]);

  const dropdownData = datas.map(emp => ({
    id: emp.id,
    name: capitalizeFirstLetter(emp.name),
  }));

  useEffect(() => {
    if (isMultipleSelect) {
      setSelectedItems(defaultOptions)
    }
  }, [isMultipleSelect])



  const items = [
    {
      id: '92iijs7yta',
      name: 'Ondo',
    },
    {
      id: 'a0s0a8ssbsd',
      name: 'Ogun',
    },
    {
      id: '16hbajsabsd',
      name: 'Calabar',
    },
    {
      id: 'nahs75a5sg',
      name: 'Lagos',
    },
    {
      id: '667atsas',
      name: 'Maiduguri',
    },
    {
      id: 'hsyasajs',
      name: 'Anambra',
    },
    {
      id: 'djsjudksjd',
      name: 'Benue',
    },
    {
      id: 'sdhyaysdj',
      name: 'Kaduna',
    },
    {
      id: 'suudydjsjd',
      name: 'Abuja',
    },
  ];

  let convertedData = [];
  let defaultOption = [];

  if (mode) {
    convertedData = datas.map((item, index) => ({
      key:
        modeType === 'halfDay'
          ? item[valueField]
          : modeType === 'leaveType' || modeType === 'reportingManager'
            ? item[keyField].toString()
            : item[valueField].toString(),
      value: item[valueField],
      disabled: !!item.disabled,
    }));
    defaultOption = convertedData.find(item =>
      modeType === 'halfDay'
        ? item.value === value
        : modeType === 'leaveType' || modeType === 'reportingManager'
          ? item.key === value?.toString()
          : item.key === value?.toString(),
    );
  } else {
    convertedData = datas.map((item, index) => ({
      key: index.toString(),
      value: item,
      disabled: !!item.disabled,
    }));
    defaultOption = convertedData.find(item => item.value === value);
  }

  useEffect(() => { }, [value, defaultOption]);

  const renderDropdownItem = item => (
    <View
      style={{
        padding: 10,
        alignItems: 'flex-start',
        opacity: item.disabled ? 0.4 : 1,
      }}
      pointerEvents={item.disabled ? 'none' : 'auto'}>
      <ThemedText size='md' weight='Medium'>
        {item.value}
      </ThemedText>
    </View>
  );

  return (
    <View pointerEvents={disabled ? 'none' : 'auto'} >
      {!isMultipleSelect ? (
        <SelectList
          defaultOption={defaultOptions}
          setSelected={val => {
            let selectedItem;
            if (modeType === 'leaveType' || modeType === 'reportingManager') {
              selectedItem = convertedData.find(
                item => item.key === val?.toString(),
              );
              if (selectedItem?.disabled) {
                return;
              }
              onValueChange(selectedItem || null);
            } else {
              selectedItem = convertedData.find(item => item.value === val);
              if (selectedItem?.disabled) {
                return;
              }
              onValueChange(val || null);
            }
          }}
          data={convertedData}
          save={
            modeType == 'leaveType' || modeType === 'reportingManager'
              ? 'key'
              : 'value'
          }
          search={search || false}
          searchPlaceholder="Search something..."
          placeholder={defaultOption?.value || placeholder || 'Select Option'}
          searchicon={<SearchIcon width={25} height={25} color={'black'} />}
          arrowicon={<Down width={25} height={25} color={'black'} />}
          closeicon={<Cross width={25} height={25} color={'black'} />}
          fontFamily={'Poppins-Regular'}
          // notFoundText={'Nothing here'}
          boxStyles={{
            borderWidth: 0,
            backgroundColor: 'white',
            borderRadius: 5,
            paddingHorizontal: 12,
            paddingVertical: 15,
            borderWidth: error ? 1 : 0,
            borderColor: error ? 'red' : 'transparent',
          }}
          dropdownStyles={{
            backgroundColor: 'white',
            borderWidth: 0,
          }}
          inputStyles={{
            color: '#6A7D94',
            textTransform: 'capitalize',
          }}
          dropdownItemStyles={{
            padding: 0,
          }}
          dropdownTextStyles={{
            color: '#6A7D94',
            textTransform: 'capitalize',
          }}
          renderItem={renderDropdownItem}
        />
      ) : (
        <>
          <CustomMultiSelect
            items={dropdownData}
            selectedItems={selectedItems}
            onSelectedItemsChange={(e) => { onValueChange(e); setSelectedItems(e) }}
            searchPlaceholder="Search Employee..."
            selectText="Select Employee"
            labelKey={valueField}
            uniqueKey={modeType}
          />
        </>
      )}
    </View>
  );
};

export default CustomNativeDropdown;
