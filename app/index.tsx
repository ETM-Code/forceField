import React, { useEffect } from 'react';
import { Text, View, Linking, Platform, TouchableOpacity } from 'react-native';
import 'nativewind';
import { Link, useRouter, useSegments } from 'expo-router';
import NetInfo from '@react-native-community/netinfo';

const openWifiSettings = () => {
  if (Platform.OS === 'ios') {
    Linking.openURL('App-Prefs:root=WIFI');
  } else {
    Linking.openURL('android.settings.WIFI_SETTINGS');
  }
};

export default function IndexPage() {
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    const checkForWifi = async () => {
      try {
        const state = await NetInfo.fetch();
        if (state.type === 'wifi') {
          if (segments[0] == 'index') {
            // router.push('/teamPage');
            router.push('/teamPageTest');
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
        <Link href='/teamPage' className='text-white text-center text-xl'>Go to team page</Link>
        <Link href='/displayAccels' className='text-white text-center text-xl'>Go to accel view</Link>
      </View>
    </View>
  );
}
