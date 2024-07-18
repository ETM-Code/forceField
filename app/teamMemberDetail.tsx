import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, Dimensions, StyleSheet } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { RouteProp, useRoute } from '@react-navigation/native';
import { RootStackParamList } from './NavigationTypes';
import { fetchAndFormatSensorData, TeamDataRow } from '@/scripts/fetchTeamDataBeta';
import TeamMember from '@/components/teamMember'; // Import the TeamMember component

const screenWidth = Dimensions.get("window").width;

type TeamMemberDetailRouteProp = RouteProp<RootStackParamList, 'TeamMemberDetail'>;

const connectionIP = 'http://192.168.4.1';

const TeamMemberDetail: React.FC = () => {
  const route = useRoute<TeamMemberDetailRouteProp>();
  const { playerName } = route.params;
  const [accelerationData, setAccelerationData] = useState<number[]>([]);
  const [memberData, setMemberData] = useState<TeamDataRow | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data: TeamDataRow[] = await fetchAndFormatSensorData(connectionIP);
        const memberData = data.find(row => row[0] === playerName);
        if (memberData) {
          const validAccels = memberData[6].filter(value => !isNaN(value) && isFinite(value));
          setAccelerationData(validAccels);
          setMemberData(memberData); // Set the member data for the TeamMember component
        } else {
          setAccelerationData([]); // Default data if no member data found
          setMemberData(null); // Reset member data if not found
        }
      } catch (error) {
        console.error('Error fetching team data:', error);
        setAccelerationData([]); // Default data in case of an error
        setMemberData(null); // Reset member data in case of an error
      }
    };

    fetchData();
    const intervalId = setInterval(fetchData, 1000);

    return () => clearInterval(intervalId);
  }, [playerName]);

  if (accelerationData.length === 0) {
    return (
      <View style={styles.waitingContainer}>
        <Text style={styles.waitingText}>Waiting for data...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <Text style={styles.headerText}>{playerName}</Text>
      </View>
      <View style={styles.chartContainer}>
        <ScrollView horizontal>
          <LineChart
            data={{
              labels: accelerationData.map((_, index) => index.toString()),
              datasets: [
                {
                  data: accelerationData,
                },
              ],
            }}
            width={screenWidth} // from react-native
            height={220}
            yAxisLabel=""
            chartConfig={{
              backgroundColor: '#1A1A1A',
              backgroundGradientFrom: '#1A1A1A',
              backgroundGradientTo: '#1A1A1A',
              decimalPlaces: 2, // optional, defaults to 2dp
              color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
              labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
              style: {
                borderRadius: 16,
              },
              propsForDots: {
                r: '6',
                strokeWidth: '2',
                stroke: '#ffa726',
              },
            }}
            bezier
            style={styles.chart}
          />
        </ScrollView>
      </View>
      {memberData && (
        <TeamMember
          playerName={memberData[0]}
          number1={memberData[1]}
          number2={memberData[2]}
          number3={memberData[3]}
          risk={memberData[4]}
          accels={memberData[6]}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#242424',
  },
  headerContainer: {
    margin: 10,
    padding: 10,
    backgroundColor: '#1A1A1A',
    borderRadius: 10,
  },
  headerText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#E0E0E0',
    textAlign: 'center',
  },
  chartContainer: {
    flex: 1,
    margin: 10,
    padding: 10,
    backgroundColor: '#1A1A1A',
    borderRadius: 10,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
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
