import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Alert,
    Modal,
} from 'react-native';
import { Icon1, Icon2, LockIcon } from '../Helper/IconsLoad';
import ThemedText from '../Helper/ThemedText';
import { ActionButton } from '../utils/ActionButton';
import { bottomHeight, STATUS_BAR_HEIGHT } from '../Helper/Helper';
import { KeyboardAvoidingScrollView } from 'react-native-keyboard-avoiding-scroll-view';
import useApi from '../Apis/Services/ApiConfig';
import { useMutation } from '@tanstack/react-query';
import useEncodedUserData from '../hooks/useEncodedUserData';


const PRIMARY = '#CA282C';
const WHITE = '#FFFFFF';

const PasswordUpdateScreen = () => {
    const { CompanyChangePassword } = useApi();
    const { userdata } = useEncodedUserData();
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const [secureCurrent, setSecureCurrent] = useState(true);
    const [secureNew, setSecureNew] = useState(true);
    const [secureConfirm, setSecureConfirm] = useState(true);

    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});


    const ChangePasswordMutation = useMutation({
        mutationFn: CompanyChangePassword,
        onSuccess: response => {
            if (response.status) {
                toast.success(response.message);
            }
            else {
                toast.error(response.message);
            }
        },
        onError: error => {
            toast.error(error.message);
        },
    });

    const passwordRules = {
        length: newPassword.length >= 8,
        number: /[0-9]/.test(newPassword),
        special: /[^A-Za-z0-9]/.test(newPassword),
    };

    const isPasswordValid =
        passwordRules.length &&
        passwordRules.number &&
        passwordRules.special;


    const getPasswordStrength = (password) => {
        let score = 0;
        if (password.length >= 8) score++;
        if (/[A-Z]/.test(password)) score++;
        if (/[0-9]/.test(password)) score++;
        if (/[^A-Za-z0-9]/.test(password)) score++;

        return score;
    };

    const strength = getPasswordStrength(newPassword);

    const getStrengthColor = () => {
        if (strength <= 1) return '#ff4d4d';
        if (strength === 2) return '#ff944d';
        if (strength === 3) return '#ffd11a';
        return '#2ecc71';
    };

    const validate = () => {
        let err = {};

        if (!isPasswordValid) {
            err.new = 'Password must meet all requirements';
        }

        if (!currentPassword) err.current = 'Enter current password';
        if (newPassword.length < 8)
            err.new = 'Minimum 8 characters required';
        if (newPassword !== confirmPassword)
            err.confirm = 'Passwords do not match';

        setErrors(err);
        return Object.keys(err).length === 0;
    };

    const handleUpdatePassword = async () => {
        if (!validate()) return;

        try {
            setLoading(true);

            ChangePasswordMutation.mutate({
                newPassword: newPassword,
                confirmPassword: confirmPassword,
                userData: userdata
            })

        } catch (e) {
            Alert.alert('Error', 'Failed to update password');
        } finally {
            setLoading(false);
        }
    };

    const isFormValid =
        currentPassword &&
        isPasswordValid &&
        newPassword === confirmPassword;

    const Button = () => {
        return (
            <ActionButton size="medium" text="Update Password" loading={ChangePasswordMutation.isPending} disabled={!isFormValid || loading || ChangePasswordMutation.isPending} onPress={handleUpdatePassword} />
        )
    }

    return (
        <Modal visible={true} animationType="slide">
            <View style={[styles.container, { paddingHorizontal: 20, paddingTop: STATUS_BAR_HEIGHT(), paddingBottom: bottomHeight() }]}>
                <View style={styles.header}>
                    <LockIcon width={40} height={40} color={PRIMARY} />
                    <ThemedText size='lg' weight='SemiBold' color='primary' >Update Your Password</ThemedText>
                    <ThemedText size='xs' weight='Medium' color='secondary' style={{ textAlign: 'center' }}>For your security, you must update your password to continue.</ThemedText>
                </View>
                <KeyboardAvoidingScrollView stickyFooter={<Button />}>
                    <View style={styles.form}>
                        <View style={styles.inputContainer}>
                            <TextInput
                                placeholder="Current Password"
                                secureTextEntry={secureCurrent}
                                style={styles.input}
                                value={currentPassword}
                                onChangeText={setCurrentPassword}
                            />
                            <TouchableOpacity onPress={() => setSecureCurrent(!secureCurrent)}>
                                {secureCurrent ? <Icon1 /> : <Icon2 />}
                            </TouchableOpacity>
                        </View>
                        {errors.current && <Text style={styles.error}>{errors.current}</Text>}

                        <View style={styles.inputContainer}>
                            <TextInput
                                placeholder="New Password"
                                secureTextEntry={secureNew}
                                style={styles.input}
                                value={newPassword}
                                onChangeText={setNewPassword}
                            />
                            <TouchableOpacity onPress={() => setSecureNew(!secureNew)}>
                                {secureNew ? <Icon1 /> : <Icon2 />}
                            </TouchableOpacity>
                        </View>
                        {errors.new && <Text style={styles.error}>{errors.new}</Text>}

                        <View style={styles.strengthBar}>
                            <View
                                style={[
                                    styles.strengthFill,
                                    { width: `${(strength / 4) * 100}%`, backgroundColor: getStrengthColor() },
                                ]}
                            />
                        </View>

                        <View style={styles.inputContainer}>
                            <TextInput
                                placeholder="Confirm New Password"
                                secureTextEntry={secureConfirm}
                                style={styles.input}
                                value={confirmPassword}
                                onChangeText={setConfirmPassword}
                            />
                            <TouchableOpacity onPress={() => setSecureConfirm(!secureConfirm)}>
                                {secureCurrent ? <Icon1 /> : <Icon2 />}
                            </TouchableOpacity>
                        </View>
                        {errors.confirm && <Text style={styles.error}>{errors.confirm}</Text>}
                        <View style={styles.rulesContainer}>
                            <RuleItem label="At least 8 characters" valid={passwordRules.length} />
                            <RuleItem label="Includes at least one number" valid={passwordRules.number} />
                            <RuleItem label="One special character (@, #, $)" valid={passwordRules.special} />
                        </View>
                    </View>
                </KeyboardAvoidingScrollView>



            </View>
        </Modal>
    );
};


const RuleItem = ({ label, valid }) => {
    return (
        <View style={styles.ruleItem}>
            <ThemedText size='xs' weight='Medium' color={valid ? 'success' : 'primary'}>{(valid ? '✔' : '✖')} {label}</ThemedText>
        </View>
    );
};

export default PasswordUpdateScreen;

const styles = StyleSheet.create({
    rulesContainer: {
        marginTop: 10,
    },

    ruleItem: {
        marginTop: 4,
    },
    container: {
        flex: 1,
        backgroundColor: WHITE,
        justifyContent: 'center',
    },
    header: {
        alignItems: 'center',
        marginBottom: 30,
        gap: 6,
        marginTop: 60
    },
    title: {
        fontSize: 22,
        fontWeight: 'bold',
        marginTop: 10,
        color: PRIMARY,
    },
    subtitle: {
        textAlign: 'center',
        marginTop: 5,
        color: '#555',
    },
    form: {
        marginBottom: 30,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 10,
        paddingHorizontal: 10,
        marginTop: 15,
    },
    input: {
        flex: 1,
        height: 50,
        fontSize: 12,
        fontFamily: 'Poppins-Regular',
    },
    error: {
        color: PRIMARY,
        fontSize: 12,
        marginTop: 5,
    },
    strengthBar: {
        height: 6,
        backgroundColor: '#eee',
        borderRadius: 5,
        marginTop: 10,
    },
    strengthFill: {
        height: 6,
        borderRadius: 5,
    },
    button: {
        backgroundColor: PRIMARY,
        padding: 15,
        borderRadius: 12,
        alignItems: 'center',
    },
    buttonText: {
        color: WHITE,
        fontWeight: 'bold',
        fontSize: 16,
    },
});