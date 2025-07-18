import { KeyboardAvoidingView, Platform, ScrollView, Text, TextInput, View, Alert, Pressable } from 'react-native';
import { useState } from 'react';

export default function LoginScreen() {
  const [email, onChangeEmail] = useState('');
  const [password, onChangePassword] = useState('');
  const [loggedIn, setLoggedIn] = useState(false);

  return (
    <ScrollView className='flex-1'>
      <Text className='welcome'>Welcome to Little Lemon</Text>
      {!loggedIn && (
        <>
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
                  setLoggedIn(true);
                  Alert.alert('Login Successful', `Welcome back, ${email}!`);
                } else {
                  Alert.alert('Login Failed', 'Please enter both email and password.');
                }
              }}>
              <Text className='menu-button-text'>Login</Text>
            </Pressable>
          </View>
        </>
      )}
      {loggedIn && (
        <View className='p-4'>
          <Text className='welcome'>You are logged in!</Text>
          <Text className='welcome-para'>Enjoy exploring our menu and services.</Text>
        </View>
      )}
    </ScrollView>
  );
}