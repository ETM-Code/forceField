import React, { useEffect } from 'react';
import { Text, View, Linking, Platform, TouchableOpacity } from 'react-native';
import 'nativewind';
import { Link, useRouter, useSegments } from 'expo-router';
import NetInfo from '@react-native-community/netinfo';
import { NavigationContainer, NavigationProp } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import TeamPage from './teamPage'; // Ensure correct path
import TeamMemberDetail from './teamMemberDetail'; // Ensure correct path

const openWifiSettings = () => {
  if (Platform.OS === 'ios') {
    Linking.openURL('App-Prefs:root=WIFI');
  } else {
    Linking.openURL('android.settings.WIFI_SETTINGS');
  }
};

// Define the type for the navigation stack parameters
export type RootStackParamList = {
  Index: undefined;
  TeamPage: undefined;
  TeamMemberDetail: { playerName: string; accels: number[] };
};

const Stack = createStackNavigator<RootStackParamList>();

export default function App() {
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    const checkForWifi = async () => {
      try {
        const state = await NetInfo.fetch();
        if (state.type === 'wifi') {
          if (segments[0] !== 'teamPage') {
            router.push('./teamPage');
          }
        }
      } catch (error) {
        console.log("Error checking WiFi state:", error);
      }
    };

    checkForWifi(); // Initial check
    const intervalId = setInterval(checkForWifi, 1000); // Periodic check

    return () => clearInterval(intervalId);
  }, [router, segments]);

  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Index">
        <Stack.Screen name="Index" component={IndexPage} options={{ headerShown: false }} />
        <Stack.Screen name="TeamPage" component={TeamPage} />
        <Stack.Screen name="TeamMemberDetail" component={TeamMemberDetail} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

// Separate component for the index page to avoid conflict with navigation
const IndexPage: React.FC = () => {
  return (
    <View className="bg-gray-900 min-h-screen flex justify-center items-center">
      <View className='flex items-center bg-gray-800 m-5 rounded-3xl p-10 shadow-lg'>
        <TouchableOpacity onPress={openWifiSettings}>
          <Text className='text-white text-4xl text-center mb-5'>Connect to Team WiFi</Text>
          <View className='bg-gray-700/60 p-4 rounded-xl'>
            <Text className='text-white text-2xl text-center'>(Network)</Text>
          </View>
        </TouchableOpacity>
      </View>
      <View className="mt-20">
        <Link href='./teamPage' className='text-white text-center text-xl'>Go to team page</Link>
      </View>
    </View>
  );
};
