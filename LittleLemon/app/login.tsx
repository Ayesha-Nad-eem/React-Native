
import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput, View } from 'react-native';

export default function Login() {
  const [username, onChangeUsername] = useState('');
  const [password, onChangePassword] = useState('');
  const [loggedIn, setLoggedIn] = useState(false);

  return (
    <ScrollView contentContainerStyle={{ flexGrow: 1 }} className='flex-1'>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View className='flex-1 justify-center items-center p-6'>
          {!loggedIn && (
            <View className='container'>
              <Text className='login-title'>Login</Text>
              <View className='p-4'>
                <TextInput
                  accessible={true}
                  accessibilityLabel="Username"
                  value={username}
                  onChangeText={onChangeUsername}
                  placeholder='Username'
                  className='input-field'
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
              </View>
              <View className='flex-row justify-center'>
                <Pressable
                  className='btn'
                  onPress={() => {
                    if (username && password) {
                      setLoggedIn(true);
                      Alert.alert('Login Successful', `Welcome back, ${username}!`);
                    } else {
                      Alert.alert('Login Failed', 'Please enter both username and password.');
                    }
                  }}>
                  <Text className='btn-txt'>LOGIN</Text>
                </Pressable>
              </View>
            </View>
          )}
          {loggedIn && (
            <View className='p-4'>
              <Text className='welcome'>You are logged in!</Text>
              <Text className='welcome-para'>Enjoy exploring our menu and services.</Text>
            </View>
          )}

        </View>
      </KeyboardAvoidingView>
    </ScrollView>
  );
}