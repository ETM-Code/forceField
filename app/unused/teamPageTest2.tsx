import React, { useEffect, useState } from 'react';
import { Text, View, ScrollView } from 'react-native';
import 'react-native-gesture-handler';
import { fetchAndFormatSensorData, TeamDataRow } from '@/scripts/fetchTeamDataBeta';
import 'nativewind';

const connectionIP = 'http://192.168.4.1';

interface TeamMemberData {
  playerName: string;
  number1: number;
  number2: number;
  number3: number;
  risk: string;
  accels: number[];
  angularAccels: number[]; // Add angular acceleration
}

export default function Page() {
  const [teamData, setTeamData] = useState<TeamMemberData[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data: TeamDataRow[] = await fetchAndFormatSensorData(connectionIP);
        const formattedData = data.map(row => ({
          playerName: row[0] || "Unknown",
          number1: row[1] || 0,
          number2: row[2] || 0,
          number3: row[3] || 0,
          risk: row[4] || "Low",
          riskNum: row[5] || 0,
          accels: row[6] || [], // Include acceleration data
          angularAccels: row[7] || [], // Include angular acceleration data
        }));

        const sortedData = formattedData.sort((a, b) => b.riskNum - a.riskNum);
        setTeamData(sortedData);
      } catch (error) {
        console.error('Error fetching team data:', error);
      }
    };

    fetchData();
    const intervalId = setInterval(fetchData, 1000);

    return () => clearInterval(intervalId);
  }, []);

  return (
    <View className="bg-pink-900 min-h-screen">
      <View className='m-10 p-5 bg-gray-800 rounded-2xl shadow-lg'>
        <Text className='text-white text-4xl text-center'>Your Team</Text>
      </View>
      <ScrollView className='bg-gray-700 p-5 mx-4 rounded-2xl min-h-screen shadow-lg'>
        {teamData.map((member, index) => (
          <View key={index} className='mb-5 p-4 bg-gray-800 rounded-xl'>
            <Text className='text-white text-2xl'>{member.playerName}</Text>
            <Text className='text-white'>Risk: {member.risk}</Text>
            <Text className='text-white'>Number 1: {member.number1}</Text>
            <Text className='text-white'>Number 2: {member.number2}</Text>
            <Text className='text-white'>Number 3: {member.number3}</Text>
            <Text className='text-white mt-2'>Acceleration Data:</Text>
            {member.accels.map((accel, idx) => (
              <Text key={idx} style={{ color: 'white' }}>{accel}</Text>
            ))}
            <Text className='text-white mt-2'>Rotational Acceleration Data:</Text>
            {member.angularAccels.map((angularAccel, idx) => (
              <Text key={idx} style={{ color: 'white' }}>{angularAccel}</Text>
            ))}
          </View>
        ))}
        <View className='py-20'></View>
      </ScrollView>
    </View>
  );
}
