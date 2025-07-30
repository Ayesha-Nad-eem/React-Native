import { Ionicons } from "@expo/vector-icons";
import { Drawer } from 'expo-router/drawer';
import { Stack } from "expo-router";
import { View, TouchableOpacity } from "react-native";
import { DrawerActions } from '@react-navigation/native';
import LittleLemonFooter from "./footer";
import "./global.css";


export default function RootLayout() {
  return (
    <View className="flex-1">
      {/* STACK NAVIGATION */}
      <Stack
        screenOptions={{
          headerShown: true,
          headerStyle: {
            backgroundColor: '#F4CE14',
          },
          headerTintColor: '#495E57',
          headerTitleStyle: {
            fontWeight: 'bold',
            fontSize: 18,
            color: '#495E57',
          },
        }}
      >
        <Stack.Screen
          name="Welcome"
          options={{
            title: 'Welcome',
            headerShown: true,
          }}
        />
        <Stack.Screen
          name="Subscribe"
          options={{
            title: 'Newsletter',
            headerShown: true,
          }}
        />
        <Stack.Screen
          name="menu"
          options={{
            title: 'Menu',
            headerShown: true,
          }}
        />
        <Stack.Screen
          name="loginPage"
          options={{
            title: 'Login',
            headerShown: true,
          }}
        />
      </Stack>

      {/* DRAWER NAVIGATION - COMMENTED OUT FOR LATER USE */}
      {/* 
      <Drawer
        screenOptions={({ navigation }) => ({
          headerShown: true,
          headerStyle: {
            backgroundColor: '#F4CE14',
          },
          headerTintColor: '#F4CE14',
          headerTitleStyle: {
            fontWeight: 'bold',
            fontSize: 18,
            color: '#495E57',
          },
          headerLeft: () => (
            <TouchableOpacity 
              onPress={() => navigation.dispatch(DrawerActions.toggleDrawer())}
              style={{ marginLeft: 15, padding: 5 }}
            >
              <Ionicons name="menu" size={24} color="#495E57" />
            </TouchableOpacity>
          ),
          drawerActiveTintColor: '#F4CE14',
          drawerInactiveTintColor: '#495E57',
          drawerStyle: {
            backgroundColor: '#EDEFEE',
            width: 280,
          },
          drawerLabelStyle: {
            fontSize: 16,
            fontWeight: '600',
          },
        })}
      >
        <Drawer.Screen
          name="loginPage"
          options={{
            title: 'Login',
            drawerIcon: ({ color, size }: { color: string; size: number }) => (
              <Ionicons name="person" size={size} color={color} />
            ),
          }}
        />
        <Drawer.Screen
          name="Welcome"
          options={{
            title: 'Welcome',
            drawerIcon: ({ color, size }: { color: string; size: number }) => (
              <Ionicons name="star" size={size} color={color} />
            ),
          }}
        />
        <Drawer.Screen
          name="menu"
          options={{
            title: 'Menu',
            drawerIcon: ({ color, size }: { color: string; size: number }) => (
              <Ionicons name="restaurant" size={size} color={color} />
            ),
          }}
        />
        <Drawer.Screen
          name="Subscribe"
          options={{
            title: 'Newsletter',
            drawerIcon: ({ color, size }: { color: string; size: number }) => (
              <Ionicons name="mail" size={size} color={color} />
            ),
          }}
        />
        
        <Drawer.Screen name="index" options={{ href: null }} />
        <Drawer.Screen name="feedbackForm" options={{ href: null }} />
        <Drawer.Screen name="login" options={{ href: null }} />
        <Drawer.Screen name="register" options={{ href: null }} />
        <Drawer.Screen name="footer" options={{ href: null }} />
        <Drawer.Screen name="LittleLemonHeader" options={{ href: null }} />
        <Drawer.Screen name="index_temp" options={{ href: null }} />
      </Drawer>
      */}

      {/* TAB NAVIGATION - COMMENTED OUT FOR LATER USE */}
      {/* 
      <Tabs screenOptions={{ 
        headerShown: false,
        tabBarInactiveTintColor: '#495E57',
        tabBarActiveTintColor: '#F4CE14',
        tabBarStyle: {
          backgroundColor: '#EDEFEE',
        }
      }}>
        <Tabs.Screen 
          name="loginPage"
          options={{
            title: 'Login',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="person" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen 
          name="Welcome"
          options={{
            title: 'Welcome',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="star" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen 
          name="menu"
          options={{
            title: 'Menu',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="restaurant" size={size} color={color} />
            ),
          }}
        />
        
        <Tabs.Screen name="index" options={{ href: null }} />
        <Tabs.Screen name="feedbackForm" options={{ href: null }} />
        <Tabs.Screen name="login" options={{ href: null }} />
        <Tabs.Screen name="register" options={{ href: null }} />
        <Tabs.Screen name="footer" options={{ href: null }} />
        <Tabs.Screen name="LittleLemonHeader" options={{ href: null }} />
        <Tabs.Screen name="index_temp" options={{ href: null }} />
      </Tabs>
      */}

      <LittleLemonFooter />
    </View>
  );
}