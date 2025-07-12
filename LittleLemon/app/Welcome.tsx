import * as React from 'react';
import {View,Text, ScrollView} from 'react-native';

export default function Welcome() {
  return (
    <ScrollView 
      indicatorStyle="white" 
      className="flex-1 p-5"
    >
        <Text className="welcome">Welcome to Little Lemon
        </Text>
        <Text className="welcome-para">Little Lemon is a charming neighborhood bistro that serves simple food and classic cocktails in a lively but casual environment. We would love to hear more about your experience with us!</Text>
    </ScrollView>
  )
}
