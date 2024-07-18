import React from 'react';
import { Text, View, ScrollView } from 'react-native';
import 'react-native-gesture-handler';
import 'nativewind';
import { useSensorData } from '@/context/SensorDataContext';

interface TeamMemberData {
  playerName: string;
  number1: number;
  number2: number;
  number3: number;
  risk: string;
  accels: number[];
}

export default function Page() {
  const { teamData, loading } = useSensorData();

  const formattedData = teamData.map(row => ({
    playerName: row[0] || "0",
    number1: row[1] || 0,
    number2: row[2] || 0,
    number3: row[3] || 0,
    risk: row[4] || "0",
    riskNum: row[5] || 0,
    accels: row[6] || [], // Include acceleration data
  }));

  const sortedData = formattedData.sort((a, b) => b.riskNum - a.riskNum);
  const firstMemberAccels = sortedData.length > 0 ? sortedData[0].accels : [];

  if (loading) {
    return (
      <View className="bg-pink-900 min-h-screen flex justify-center items-center">
        <Text className='text-white text-2xl'>Loading...</Text>
      </View>
    );
  }

  return (
    <View className="bg-pink-900 min-h-screen">
      <View className='m-10 p-5 bg-gray-800 rounded-2xl shadow-lg'>
        <Text className='text-white text-4xl text-center'>Your Team</Text>
      </View>
      <View className='bg-gray-700 p-5 mx-4 rounded-2xl min-h-screen shadow-lg'>
        <Text className='text-white text-2xl text-center'>Acceleration Data of First Team Member</Text>
        <ScrollView>
          {firstMemberAccels.map((accel, index) => (
            <Text key={index} style={{ color: 'white' }}>{accel}</Text>
          ))}
          <View className='py-80'></View>
        </ScrollView>
      </View>
    </View>
  );
}
