
import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput, View } from 'react-native';

export default function Register() {
    const [fullname, onChangeFullname] = useState('');
    const [Email, onChangeEmail] = useState('');
    const [phone, onChangePhone] = useState('');
    const [confirmPassword, onChangeConfirmPassword] = useState('');
    const [password, onChangePassword] = useState('');
    return (
        <ScrollView contentContainerStyle={{ flexGrow: 1 }} className='flex-1'>
            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
                <View className='flex-1 justify-center items-center p-6'>

                    <View className='container'>
                        <Text className='login-title'>Register</Text>
                        <View className='p-4'>
                            <TextInput
                                accessible={true}
                                accessibilityLabel="Fullname"
                                value={fullname}
                                onChangeText={onChangeFullname}
                                placeholder='Full name'
                                className='input-field'
                            />

                            <TextInput
                                accessible={true}
                                accessibilityLabel="Email"
                                value={Email}
                                onChangeText={onChangeEmail}
                                placeholder='E-mail'
                                className='input-field'
                                keyboardType='email-address'
                            />
                            <TextInput
                                accessible={true}
                                accessibilityLabel="Phone"
                                value={phone}
                                onChangeText={onChangePhone}
                                placeholder='Phone'
                                className='input-field rounded-2xl'
                            />
                            <TextInput
                                accessible={true}
                                accessibilityLabel="Password"
                                value={password}
                                onChangeText={onChangePassword}
                                placeholder='Password'
                                className='input-field'
                                secureTextEntry={true}
                            />
                            <TextInput
                                accessible={true}
                                accessibilityLabel="Confirm Password"
                                value={confirmPassword}
                                onChangeText={onChangeConfirmPassword}
                                placeholder='Confirm Password'
                                className='input-field'
                                secureTextEntry={true}
                            />
                        </View>
                        <View className='flex-row justify-center'>
                            <Pressable
                                className='btn'
                                onPress={() => {
                                    if (fullname && Email && phone && password && confirmPassword) {
                                        Alert.alert('Registration Successful', `Welcome, ${fullname}!`);
                                    } else {
                                        Alert.alert('Registration Failed', 'Please fill in all fields correctly.');
                                    }
                                }}>
                                <Text className='btn-txt'>REGISTER</Text>
                            </Pressable>
                        </View>
                        <View className='flex-row justify-center'>
                            <Pressable className='btn'>
                                <Text className='btn-txt'>
                                    Have Account? Sign In
                                </Text>
                            </Pressable>
                        </View>

                    </View>
                </View>
            </KeyboardAvoidingView>
        </ScrollView>
    )
}
