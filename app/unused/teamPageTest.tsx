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
}

export default function Page() {
  const [teamData, setTeamData] = useState<TeamMemberData[]>([]);
  const [firstMemberAccels, setFirstMemberAccels] = useState<number[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data: TeamDataRow[] = await fetchAndFormatSensorData(connectionIP);
        const formattedData = data.map(row => ({
          playerName: row[0] || "0",
          number1: row[1] || 0,
          number2: row[2] || 0,
          number3: row[3] || 0,
          risk: row[4] || "0",
          riskNum: row[5] || 0,
          accels: row[6] || [], // Include acceleration data
        }));

        const sortedData = formattedData.sort((a, b) => b.riskNum - a.riskNum);
        setTeamData(sortedData);

        if (sortedData.length > 0) {
          setFirstMemberAccels(sortedData[0].accels);
        }
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
      <View className='bg-gray-700 p-5 mx-4 rounded-2xl min-h-screen shadow-lg'>
        <Text className='text-white text-2xl text-center'>Acceleration Data of First Team Member</Text>
        <ScrollView>
          {firstMemberAccels.map((accels, index) => (
            <Text key={index} style={{ color: 'white' }}>{accels}</Text>
          ))}
          <View className='py-80'></View>
        </ScrollView>
      </View>
    </View>
  );
}
