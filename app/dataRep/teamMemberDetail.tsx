import React, { useEffect, useState } from 'react';
import { View, Text, Dimensions, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { RouteProp, useRoute } from '@react-navigation/native';
import { RootStackParamList } from '../unused/NavigationTypes';
import { useSensorData } from '@/context/SensorDataContext';
import TeamMember from '@/components/teamMember';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Skia, Canvas, Path } from '@shopify/react-native-skia';

const screenWidth = Dimensions.get("window").width;

type TeamMemberDetailRouteProp = RouteProp<RootStackParamList, 'TeamMemberDetail'>;

const TeamMemberDetail: React.FC = () => {
  const route = useRoute<TeamMemberDetailRouteProp>();
  const { playerName } = route.params;
  const { teamData, loading } = useSensorData();
  const [memberData, setMemberData] = useState<number[]>([]);
  const [historicalData, setHistoricalData] = useState<number[]>([]);
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
          const memberData = sessionData.data.find((row: any) => row[0] === playerName);
          if (memberData) {
            const validAccels = memberData[6].filter((value: any) => !isNaN(value) && isFinite(value));
            setHistoricalData(validAccels);
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
    if (!historical) {
      const updateData = () => {
        const memberData = teamData.find(row => row[0] === playerName);
        if (memberData) {
          const validAccels = memberData[6]?.filter(value => !isNaN(value) && isFinite(value));
          setMemberData(validAccels || []);
        } else {
          setError('Current member data not found.');
          setMemberData([]);
        }
      };

      updateData();
      const intervalId = setInterval(updateData, 500);

      return () => clearInterval(intervalId);
    }
  }, [teamData, playerName]);

  if (loading) {
    return (
      <View style={styles.waitingContainer}>
        <TouchableOpacity
          style={styles.homeButton}
          onPress={() => router.push('/dataRep/teamPage')}
        >
          <Ionicons name={historical ? "arrow-back" : "home"} size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.waitingText}>Waiting for data...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.waitingContainer}>
        <TouchableOpacity
          style={styles.homeButton}
          onPress={() => router.push('/dataRep/teamPage')}
        >
          <Ionicons name={historical ? "arrow-back" : "home"} size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.waitingText}>{error}</Text>
      </View>
    );
  }

  const displayData = historical ? historicalData : memberData;

  if (!displayData || displayData.length === 0) {
    return (
      <View style={styles.waitingContainer}>
        <TouchableOpacity
          style={styles.homeButton}
          onPress={() => router.push('/dataRep/teamPage')}
        >
          <Ionicons name={historical ? "arrow-back" : "home"} size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.waitingText}>No data available for acceleration values.</Text>
      </View>
    );
  }

  const path = Skia.Path.Make();
  path.moveTo(0, displayData[0]);

  displayData.forEach((value, index) => {
    const x = (index / displayData.length) * screenWidth;
    const y = 250 - value; // Adjust as per your y-axis scaling
    path.lineTo(x, y);
  });

  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <TouchableOpacity
          style={styles.homeButton}
          onPress={() => router.push('/dataRep/teamPage')}
        >
          <Ionicons name={historical ? "arrow-back" : "home"} size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerText}>{playerName}</Text>
      </View>
      <View style={styles.chartContainer}>
        <TeamMember
          playerName={String(playerName)}  // Ensure playerName is a string
          number1={displayData[1]}
          number2={displayData[2]}
          number3={displayData[3]}
          risk={String(displayData[4])}    // Convert risk to string
          accels={Array.isArray(displayData[6]) ? displayData[6] : [displayData[6]]}  // Ensure accels is an array
        />
      </View>
      <Text style={styles.headerText}>Linear Acceleration Values:</Text>
      <Canvas style={{ width: screenWidth, height: 250 }}>
        <Path path={path} color="#c43a31" style="stroke" strokeWidth={2} />
      </Canvas>
      <View style={{ paddingBottom: 80 }}></View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#242424',
    padding: 10,
    paddingTop: 50,
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
    paddingLeft: 30,
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
  homeButton: {
    padding: 10,
  },
});

export default TeamMemberDetail;
