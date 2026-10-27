import { StyleSheet, View } from 'react-native';
import { Menu, TextInput, useTheme } from 'react-native-paper';
import React, { useState } from 'react';
import { getFontSize } from './Helper';
const Autocomplete = ({
    value: origValue,
    label,
    data,
    containerStyle,
    onChange: origOnChange,
    icon = 'bike',
    style = {},
    menuStyle = {},
    right = () => { },
    left = () => { },
}) => {
    const theme = useTheme();
    const [value, setValue] = useState(origValue);
    const [menuVisible, setMenuVisible] = useState(false);
    const [filteredData, setFilteredData] = useState([]);

    const filterData = (text) => {
        return data.filter(
            (val) => val?.toLowerCase()?.indexOf(text?.toLowerCase()) > -1
        );
    };
    return (
        <View style={[containerStyle]}>
            <TextInput
                mode="flat"
                underlineColor="transparent"
                activeUnderlineColor="transparent"
                cursorColor={'#6A7D94'}
                placeholderTextColor="#6A7D94"
                textColor="#6A7D94"
                onFocus={() => {
                    if (value.length === 0) {
                        setMenuVisible(true);
                    }
                }}
                // onBlur={() => setMenuVisible(false)}
                style={[
                    styles.input,
                ]}
                theme={{
                    fonts: { bodyLarge: { ...theme.fonts.bodyMedium, fontFamily: 'Poppins-Regular' } },
                }}
                onChangeText={(text) => {
                    origOnChange(text);
                    if (text && text.length > 0) {
                        setFilteredData(filterData(text));
                    } else if (text && text.length === 0) {
                        setFilteredData(data);
                    }
                    setMenuVisible(true);
                    setValue(text);
                }}
                value={value}
            />
            {menuVisible && filteredData && (
                <View
                    style={{
                        flex: 1,
                        backgroundColor: 'white',
                        flexDirection: 'column',
                        borderRadius: 5,
                        marginTop: 10,
                    }}
                >
                    {filteredData.map((datum, i) => (
                        <Menu.Item
                            theme={{
                                fonts: { bodyLarge: { ...theme.fonts.bodyMedium, fontFamily: 'Poppins-Regular' } },
                            }}
                            key={i}
                            style={{ width: '100%' }}
                            icon={icon}
                            onPress={() => {
                                setValue(datum);
                                setMenuVisible(false);
                            }}
                            title={datum}
                        />
                    ))}
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    input: {
        position: 'relative',
        borderWidth: 0,
        paddingHorizontal: 15,
        borderRadius: 5,
        backgroundColor: '#fff',
        height: 57,
        fontFamily: 'Poppins-Medium',
        fontSize: 14,
        color: '#6A7D94',
        lineHeight: 15,
        justifyContent: 'center',
    },
    errorBorder: {
        borderColor: 'red',
    },
});
export default Autocomplete;
