import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, Dimensions, StyleSheet, Button } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { RouteProp, useRoute } from '@react-navigation/native';
import { RootStackParamList } from './NavigationTypes';
import { useSensorData } from '@/context/SensorDataContext';
import { TeamDataRow } from '@/scripts/fetchTeamDataBeta';
import TeamMember from '@/components/teamMember';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter, useLocalSearchParams } from 'expo-router';

const screenWidth = Dimensions.get("window").width;

type TeamMemberDetailRouteProp = RouteProp<RootStackParamList, 'TeamMemberDetail'>;

const TeamMemberDetail: React.FC = () => {
  const route = useRoute<TeamMemberDetailRouteProp>();
  const { playerName } = route.params;
  const { teamData, loading } = useSensorData();
  const [memberData, setMemberData] = useState<TeamDataRow | null>(null);
  const [accelerationData, setAccelerationData] = useState<number[]>([]);
  const [historicalData, setHistoricalData] = useState<TeamDataRow | null>(null);
  const [historicalAccelerationData, setHistoricalAccelerationData] = useState<number[]>([]);
  const [showGyroscope, setShowGyroscope] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { historical } = useLocalSearchParams();

  useEffect(() => {
    const getHistoricalData = async () => {
      const currentSession = await AsyncStorage.getItem('currentSession');
      if (historical && currentSession) {
        const previousSessions = JSON.parse(await AsyncStorage.getItem('previousSessions') || '[]');
        const sessionData = previousSessions.find((session: any) => session.sessionName === currentSession);
        if (sessionData) {
          const memberData = sessionData.data.find((row: TeamDataRow) => row[0] === playerName);
          if (memberData) {
            const validAccels = memberData[6].filter((value: any) => !isNaN(value) && isFinite(value));
            setHistoricalData(memberData);
            setHistoricalAccelerationData(validAccels);
          } else {
            setError('Historical member data not found.');
          }
        } else {
          setError('Historical session data not found.');
        }
      }
    };

    getHistoricalData();
  }, [historical, playerName]);

  useEffect(() => {
    const updateData = () => {
      const memberData = teamData.find(row => row[0] === playerName);
      if (memberData) {
        const validAccels = memberData[6]?.filter(value => !isNaN(value) && isFinite(value));
        setAccelerationData(validAccels || []);
        setMemberData(memberData);
      } else {
        setError('Current member data not found.');
        setAccelerationData([]);
        setMemberData(null);
      }
    };

    // Initial data load
    updateData();

    // Set up interval for updating data
    const intervalId = setInterval(updateData, 1000); // Update every second

    // Clear interval on component unmount
    return () => clearInterval(intervalId);
  }, [teamData, playerName]);

  const toggleDataSet = () => {
    setShowGyroscope(prevState => !prevState);
  };

  if (loading) {
    return (
      <View style={styles.waitingContainer}>
        <Text style={styles.waitingText}>Waiting for data...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.waitingContainer}>
        <Text style={styles.waitingText}>{error}</Text>
      </View>
    );
  }

  const displayData = historical ? historicalAccelerationData : accelerationData;
  const displayMemberData = historical ? historicalData : memberData;
  const dataToDisplay = displayMemberData ? (showGyroscope ? displayMemberData[7] : displayMemberData[6]) : null;

  if (!dataToDisplay || dataToDisplay.length === 0) {
    return (
      <View style={styles.waitingContainer}>
        <Text style={styles.waitingText}>No data available for {showGyroscope ? 'gyroscope' : 'acceleration'} values.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <Text style={styles.headerText}>{playerName}</Text>
      </View>
      <View style={styles.chartContainer}>
        {displayMemberData && (
          <TeamMember
            playerName={displayMemberData[0]}
            number1={displayMemberData[1]}
            number2={displayMemberData[2]}
            number3={displayMemberData[3]}
            risk={displayMemberData[4]}
            accels={displayMemberData[6]}
          />
        )}
      </View>
      <Button title={`Show ${showGyroscope ? 'Acceleration' : 'Gyroscope'} Values`} onPress={toggleDataSet} />
      <ScrollView className='bg-slate-800 p-4 m-2'>
        <View>
          {/* Table Header */}
          <View style={{ flexDirection: 'row', marginBottom: 10 }}>
            <Text style={{ flex: 1, fontWeight: 'bold', color: 'white' }}>Value Number</Text>
            <Text style={{ flex: 1, fontWeight: 'bold', color: 'white' }}>X</Text>
            <Text style={{ flex: 1, fontWeight: 'bold', color: 'white' }}>Y</Text>
            <Text style={{ flex: 1, fontWeight: 'bold', color: 'white' }}>Z</Text>
          </View>

          {/* Table Rows */}
          {dataToDisplay
            .filter(value => value !== 0)
            .map((value, index, array) => {
              const setNumber = Math.floor(index / 3) + 1;
              const colIndex = index % 3;

              // Create rows for each set of 3 values
              if (colIndex === 0) {
                return (
                  <View key={setNumber} style={{ flexDirection: 'row', marginBottom: 5 }}>
                    <Text style={{ flex: 1, color: 'white' }}>{setNumber}</Text>
                    <Text style={{ flex: 1, color: 'white' }}>{array[index]}</Text>
                    <Text style={{ flex: 1, color: 'white' }}>{array[index + 1]}</Text>
                    <Text style={{ flex: 1, color: 'white' }}>{array[index + 2]}</Text>
                  </View>
                );
              }
              return null; // Skip non-start indices in the set
            })}
        </View>
        <Text className='text-white p-10'>
          {showGyroscope ? 'Gyroscope Values: ' : 'Acceleration Values: '}
          {dataToDisplay.filter(value => value !== 0).join(', ')}
        </Text>
        <View className='py-80'></View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#242424',
    padding: 10,
  },
  headerContainer: {
    margin: 10,
    padding: 10,
    backgroundColor: '#1A1A1A',
    borderRadius: 10,
    alignItems: 'center',
  },
  headerText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#E0E0E0',
  },
  chartContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 10,
    padding: 10,
    backgroundColor: '#1A1A1A',
    borderRadius: 10,
  },
  waitingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#242424',
  },
  waitingText: {
    fontSize: 24,
    color: '#E0E0E0',
  },
});

export default TeamMemberDetail;
