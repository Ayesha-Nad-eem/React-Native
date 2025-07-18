import * as React from 'react';
import { View, Text, ScrollView, Image } from 'react-native';

export default function Welcome() {
  return (
    <ScrollView
      indicatorStyle="white"
      className="flex-1 p-5"
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
    </ScrollView>
  )
}
