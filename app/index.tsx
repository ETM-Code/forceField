import React, { useEffect, useState } from 'react';
import { Text, View, Linking, Platform, TouchableOpacity } from 'react-native';
import 'nativewind';
import { Link, useRouter, useSegments } from 'expo-router';
import NetInfo from '@react-native-community/netinfo';
import * as Location from 'expo-location';

const openWifiSettings = () => {
  if (Platform.OS === 'ios') {
    Linking.openURL('App-Prefs:root=WIFI');
  } else {
    Linking.openURL('android.settings.WIFI_SETTINGS');
  }
};

const requestLocationPermission = async () => {
  const { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== 'granted') {
    alert('Permission to access location was denied');
  }
};



export default function Page() {
  const router = useRouter();
  const segments = useSegments();
  const [ssid, setSsid] = useState('TEAM NAME');

  useEffect(() => {
    requestLocationPermission();
    NetInfo.fetch().then(state => {
      console.log('Connection type', state.type);
      console.log('Is connected?', state.isConnected);
      if (state.type === 'wifi') {
      console.log('SSID: ', state.details?.ssid);}}
      
    );
    const checkSSID = async () => {
      try {
        const state = await NetInfo.fetch();
        if (state.type === 'wifi' && state.details.ssid && state.details.ssid.includes('Field')) {
          if (segments[0] !== 'teamPage') {
            router.push('./teamPage');
          }
        }
        if (state.type === 'wifi' && state.details.ssid) {
          setSsid(state.details.ssid.replace(/field$/i, ''));
        }
      } catch (error) {
        console.error('Error getting SSID:', error);
      }
    };

    checkSSID(); // Initial check
    const intervalId = setInterval(checkSSID, 1000); // Periodic check

    return () => clearInterval(intervalId);
  }, [router, segments]);

  return (
    <View className="bg-gray-900 min-h-screen">
      <View className='flex items-center bg-red-900 m-5 rounded-3xl align-middle mt-40'>
        <TouchableOpacity onPress={openWifiSettings}>
          <Text className='text-white text-4xl mt-20 mx-10 mb-5 text-center'> Connect to Team WiFi</Text>
          <View className='bg-gray-700/60 mb-10 mx-10 p-4 rounded-xl'>
            <Text className='text-white text-2xl text-center'>({ssid} Network)</Text>
          </View>
        </TouchableOpacity>
      </View>
      <View className="align-bottom bg-gray-300 mt-40 text-center items-center mx-20">
        <Link href='./teamPage'>Go to team page</Link>
      </View>
    </View>
  );
}
