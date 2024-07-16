import {Text, View, Button, Linking, Platform, StyleSheet, TouchableOpacity} from 'react-native';
// import { Stack } from 'expo-router';
import React, { useEffect, useState} from 'react';
import 'nativewind';
import { Link, useRouter } from 'expo-router';
import { NetworkInfo } from 'react-native-network-info';




const openWifiSettings = () => {
  if (Platform.OS === 'ios') {
    Linking.openURL('App-Prefs:root=WIFI');
  } else {
    Linking.openURL('android.settings.WIFI_SETTINGS');
  }
};

// const checkWiFiAndNavigate = (router) => {
//   NetworkInfo.getSSID().then(ssid => {
//     if (ssid.includes('Field')) {
//       router.push('./teamPage');
//     }
//   });
// };




export default function Page() {
  const router = useRouter();

  useEffect(() => {
    const checkSSID = async () => {
      try {
        const ssid = await NetworkInfo.getSSID();
        if (ssid && ssid.includes('Field')) {
          router.push('./teamPage');
        }
      } catch (error) {
        console.error('Error getting SSID:', error);
      }
    };

    const intervalId = setInterval(checkSSID, 100);

    return () => clearInterval(intervalId);
  }, [router]);


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
          <Link href='./teamPage'>Go to team page</Link>
        </View>

  </View>

  );
}