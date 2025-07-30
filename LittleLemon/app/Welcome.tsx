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
          className='w-[8rem] h-[8rem]'
          source={require('../img/little-lemon-logo.png')}
          resizeMode="contain"
          accessible={true}
          accessibilityLabel={'Little Lemon Logo'}
        />
        <Text className="welcome">
          Little Lemon
        </Text>
      </View>
      <Text className="welcome-para">Little Lemon is a charming neighborhood bistro that serves simple food and classic cocktails in a lively but casual environment. We would love to hear more about your experience with us! 
      </Text>
      
      <View className="flex-col gap-4 mt-6">
        {/* <Pressable className='menu-button' onPress={() => { router.push('/menu'); }}>
          <Text className="text-center font-semibold">View Menu</Text>
        </Pressable> */}
        
        <Pressable 
          className='bg-yellow-400 p-4 rounded-lg mx-4 active:bg-yellow-500' 
          onPress={() => { router.push('/Subscribe' as any); }}
        >
          <Text className="text-center font-semibold text-gray-800">Subscribe to Newsletter</Text>
        </Pressable>
      </View>
      
      {/* <Text>{colorScheme}</Text> */}
      {/* <Text className="welcome-para">The current window dimensions are {windowDimensions.width} x {windowDimensions.height} </Text>
      <Text className="welcome-para">Font scale: {windowDimensions.fontScale}</Text> */}
    </ScrollView>
  )
}
