import * as React from 'react';
import { View, Text, ScrollView, Image, useColorScheme, useWindowDimensions, Pressable } from 'react-native';
import { router } from 'expo-router';

export default function Welcome() {
  const colorScheme = useColorScheme();
  const windowDimensions = useWindowDimensions();
  return (
    <ScrollView
      indicatorStyle="white"
      className="flex-1 p-5"
      style={{ backgroundColor: colorScheme === 'dark' ? '#333' : '#9c9c9c' }}
    >
      <View className='flex-row justify-center m-[10px]'>
        <Image
          className='image'
          source={require('../img/Image-1.png')}
          resizeMode="cover"
          accessible={true}
          accessibilityLabel={'Little Lemon Logo'}
        />
        <Text className="welcome">
          Little Lemon
        </Text>
      </View>
      <Text className="welcome-para">Little Lemon is a charming neighborhood bistro that serves simple food and classic cocktails in a lively but casual environment. We would love to hear more about your experience with us!</Text>
      {/* <Text>{colorScheme}</Text> */}
      {/* <Text className="welcome-para">The current window dimensions are {windowDimensions.width} x {windowDimensions.height} </Text>
      <Text className="welcome-para">Font scale: {windowDimensions.fontScale}</Text> */}
    </ScrollView>
  )
}
