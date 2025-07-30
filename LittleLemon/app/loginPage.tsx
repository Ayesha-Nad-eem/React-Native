import { KeyboardAvoidingView, Platform, ScrollView, Text, TextInput, View, Alert, Pressable } from 'react-native';
import { useState, useEffect } from 'react';
import { router } from 'expo-router';

export default function LoginScreen() {
  const [email, onChangeEmail] = useState('');
  const [password, onChangePassword] = useState('');

  return (
    <ScrollView className='flex-1 bg-[#9c9c9c]'>
      <Text className='welcome'>Welcome to Little Lemon</Text>
     
          <Text className='welcome-para'>Login to continue </Text>
          <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
            <View className='p-4'>
              <TextInput
                value={email}
                onChangeText={onChangeEmail}
                placeholder='Email'
                className='input-field'
                keyboardType='email-address'
                // onFocus={() => { Alert.alert('Focus on Email Input'); }}
                // onBlur={() => { Alert.alert('Blur from Email Input'); }}
                clearButtonMode={"always"}

              />
              <TextInput
                value={password}
                onChangeText={onChangePassword}
                placeholder='Password'
                className='input-field'
                secureTextEntry={true}
              />
            </View>
          </KeyboardAvoidingView>
          <View className='flex-row justify-center'>
            <Pressable
              className='menu-button'
              onPress={() => {
                if (email && password) {
                  // Navigate to Welcome screen after login
                  router.push('/Welcome');
                } else {
                  Alert.alert('Login Failed', 'Please enter both email and password.');
                }
              }}>
              <Text className='menu-button-text'>Login</Text>
            </Pressable>
          </View>
    </ScrollView>
  );
}