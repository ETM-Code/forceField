import { Text, View, Linking, Platform, TouchableOpacity } from 'react-native';
import React, { useEffect, useState } from 'react';
import 'nativewind';
import { Link, useRouter, useSegments } from 'expo-router';
import { NetworkInfo } from 'react-native-network-info';

const openWifiSettings = () => {
  if (Platform.OS === 'ios') {
    Linking.openURL('App-Prefs:root=WIFI');
  } else {
    Linking.openURL('android.settings.WIFI_SETTINGS');
  }
};

export default function Page() {
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    const checkSSID = async () => {
      try {
        const ssid = await NetworkInfo.getSSID();
        if (ssid && ssid.includes('Field') && segments[0] !== 'teamPage') {
          router.push('./teamPage');
        }
      } catch (error) {
        console.error('Error getting SSID:', error);
        // if (segments[0] !== 'teamPage'){
        //   router.push('./teamPage');
        // }
      }
    };

    const intervalId = setInterval(checkSSID, 100);

    return () => clearInterval(intervalId);
  }, [router, segments]);

  return( 

  <View className="bg-gray-900 min-h-screen">
    
      <View className='flex items-center bg-red-900 m-5 rounded-3xl align-middle mt-40'>
      <TouchableOpacity onPress={openWifiSettings}>
        <Text className='text-white text-4xl mt-20 mx-10 mb-5 text-center'> Connect to Team WiFi</Text>
        <View className='bg-gray-700/60 mb-10 mx-10 p-4 rounded-xl'>
          <Text className='text-white text-2xl text-center'>(&lt;Team Name&gt; Network)</Text>
        </View>      
        </TouchableOpacity>
      </View>

        <View className="align-bottom bg-gray-300 mt-40 text-center items-center mx-20">
          {/* <Link href='./teamPageLegacy'>Go to team page</Link> */}
          <Link href='./teamPage'>Go to team page</Link>
        </View>

  </View>

  );
}