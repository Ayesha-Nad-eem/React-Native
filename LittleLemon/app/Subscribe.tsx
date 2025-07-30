import React, { useState } from 'react';
import { View, Text, ScrollView, Image, TextInput, Pressable, Alert, KeyboardAvoidingView, Platform } from 'react-native';

export default function Subscribe() {
  const [email, setEmail] = useState('');

  const isValidEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSubscribe = () => {
    if (isValidEmail(email)) {
      // Show thank you message
      Alert.alert(
        'Thank You!', 
        'Thanks for subscribing to our newsletter!',
        [{ text: 'OK' }]
      );
      // Clear the input after successful subscription
      setEmail('');
    }
  };

  return (
    <KeyboardAvoidingView 
      style={{ flex: 1 }} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <ScrollView 
        style={{ flex: 1, backgroundColor: '#9c9c9c', padding: 16 }}
        contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
      <View style={{ flex: 1, paddingHorizontal: 16 }}>
        {/* Little Lemon Logo */}
        <View className="items-center mb-6 mt-4">
          <Image
            source={require('../img/little-lemon-logo-grey.png')}
            className="w-24 h-24 mb-4"
            resizeMode="contain"
            accessible={true}
            accessibilityLabel={'Little Lemon Logo'}
          />
        </View>

        {/* Header */}
        <Text className="section-header">
          Subscribe our Newsletter
        </Text>

        {/* Description Text */}
        <Text className="para">
          Stay updated with our latest menu items, special offers, and restaurant news. 
          Join our community of food lovers and never miss out on delicious updates!
        </Text>

        {/* Email Input Section */}
        <View className="mb-4 px-2">
          <Text className="text-lg font-semibold mb-3 text-black text-center">
            Enter Your Email Address
          </Text>
          <TextInput
            className="input-field"
            placeholder="your.email@example.com"
            placeholderTextColor="#9CA3AF"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="done"
            accessible={true}
            accessibilityLabel="Email input field"
          />
        </View>

        {/* Subscribe Button */}
        <Pressable className='p-[16px] rounded-xl mx-[16px] mb-[24px]'
          style={{
            backgroundColor: isValidEmail(email) ? '#fdda28' : '#808080',
          }}
          onPress={handleSubscribe}
          disabled={!isValidEmail(email)}
          accessible={true}
          accessibilityLabel="Subscribe to newsletter button"
        >
          <Text className='text-center font-bold text-lg' style={{
            color: isValidEmail(email) ? '#000' : '#505050',
          }}>
            Subscribe Now
          </Text>
        </Pressable>
      </View>
    </ScrollView>
    </KeyboardAvoidingView>
  );
}
