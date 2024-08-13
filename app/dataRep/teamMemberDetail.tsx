import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, Dimensions, StyleSheet, Button } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { RouteProp, useRoute } from '@react-navigation/native';
import { RootStackParamList } from '../unused/NavigationTypes';
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

  if(!historical){
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
  }, [teamData, playerName]);}

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
  const filteredData = dataToDisplay.slice(-12000).filter(value => value !== 0);
  const filteredLabels = dataToDisplay
  .slice(-12000)
  .map((value, index) => {
    if (value !== 0 && index % 1000 === 0) {
      return `#${Math.floor(index / 3) + 1}`;
    } else {
      return ''; // Empty string for labels not to be rendered
    }
  })
  .filter(label => label !== null);

  const chartData = {
    labels: filteredLabels,
    datasets: [
      {
        data: filteredData,
        color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`, // White line
        strokeWidth: 2, // Optional line width
      },
    ],
  };

  const chartConfig = {
    backgroundGradientFrom: 'yellow',
    backgroundGradientTo: 'red',
    backgroundGradientFromOpacity: 1,
    backgroundGradientToOpacity: 1,
    useShadowColorFromDataset: false, // Removes the semi-transparent fill under the line
    decimalPlaces: 2, // Optional, defaults to 2dp
    color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`, // White labels
    labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
    style: {
      borderRadius: 16,
    },
    propsForBackgroundLines: {
      stroke: 'transparent', // Makes the background lines invisible
    },
    propsForDots: {
      r: '0.1',
      strokeWidth: '0.1',
      stroke: '#ffffff',
    },
    yLabelsOffset: 0, // Adjust this value to move labels further from the edge
    formatYLabel: (yLabel: string) => (parseFloat(yLabel) / 1000).toString(),
  };

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

      {/* Replace the ScrollView and table with the LineChart */}
      <LineChart
        data={chartData}
        width={screenWidth - 50} // Width of the chart
        height={220} // Height of the chart
        chartConfig={chartConfig}
        style={{
          marginVertical: 8,
          borderRadius: 16,
          paddingLeft: 20, // Add padding to the left to make room for y-axis labels
        }}
      />

      {/* Padding for layout adjustment */}
      <View style={{ paddingBottom: 80 }}></View>
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
});

export default TeamMemberDetail;
