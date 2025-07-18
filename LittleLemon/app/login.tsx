
import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput, View } from 'react-native';

export default function Login() {
  const [username, onChangeUsername] = useState('');
  const [password, onChangePassword] = useState('');
  const [loggedIn, setLoggedIn] = useState(false);

  return (
    <ScrollView 
      className='flex-1'
      contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View className='flex-1 justify-center items-center p-6'>
          {!loggedIn && (
            <View className='container'>
              <Text className='login-title'>Login</Text>
              <View className='p-4'>
                <TextInput
                  value={username}
                  onChangeText={onChangeUsername}
                  placeholder='Username'
                  className='input-field'
                />
                <TextInput
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
                  <Text className='btn-txt'>Login</Text>
                </Pressable>
              </View>
            </View>
          )}
        </View>
      </KeyboardAvoidingView>
    </ScrollView>
  );
}