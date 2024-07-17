import React, { useEffect, useState } from 'react';
import { Text, View, TouchableOpacity, ScrollView } from 'react-native';
import 'react-native-gesture-handler';
// import { fetchTeamData, TeamDataRow } from '@/scripts/fetchTeamData';
import { fetchAndFormatSensorData, TeamDataRow } from '@/scripts/fetchTeamDataBeta'
import 'nativewind';
import TeamMember from '@/components/teamMember';
import { Banner } from '@/components/teamMember';
import { NetworkInfo } from 'react-native-network-info';

const connectionIP = 'http://192.168.4.1'

interface TeamMemberData {
  playerName: string;
  number1: number;
  number2: number;
  number3: number;
  risk: string;
}

export default function Page() {
  const [teamData, setTeamData] = useState<TeamMemberData[]>([]);
  const [ssid, setSsid] = useState('TEAM NAME');

  useEffect(() => {
    const fetchSSID = async () => {
      try {
        const ssid = await NetworkInfo.getSSID();
        if (ssid) {
          // Remove the final occurrence of "field"
          const processedSsid = ssid.replace(/field$/i, '');
          setSsid(processedSsid);
        }
      } catch (error) {
        console.error('Error getting SSID:', error);
      }
    };

    fetchSSID();
    const intervalId = setInterval(fetchSSID, 1000);

    return () => clearInterval(intervalId);
  }, []);

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
          riskNum: row[5] || 100,
        }));

        const sortedData = formattedData.sort((a, b) => b.riskNum - a.riskNum);
      
        setTeamData(formattedData);
      } catch (error) {
        console.error('Error fetching team data:', error);
      }
    };

    fetchData();
    const intervalId = setInterval(fetchData, 1000);

    return () => clearInterval(intervalId);
  }, []);

  return (
    <View className="bg-gray-900 min-h-screen">
      <View className='m-10 p-5 bg-purple-500/50 rounded-2xl'>
        <Text className='text-white text-4xl text-center'>{ssid}</Text>
      </View>
      <View className='bg-gray-600 p-5 mx-4 rounded-2xl min-h-screen'>
        <Banner />
        <ScrollView>
          {teamData.map((member, index) => (
            <TeamMember
              key={index}
              playerName={member.playerName}
              number1={member.number1}
              number2={member.number2}
              number3={member.number3}
              risk={member.risk}
            />
          ))}
          <View className='py-80'></View>
        </ScrollView>
      </View>
    </View>
  );
}
