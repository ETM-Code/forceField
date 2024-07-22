import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, Dimensions, StyleSheet, TouchableOpacity } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { RouteProp, useRoute, useNavigation } from '@react-navigation/native';
import { RootStackParamList } from './NavigationTypes';
import { useSensorData } from '@/context/SensorDataContext';
import { TeamDataRow } from '@/scripts/fetchTeamDataBeta';
import TeamMember from '@/components/teamMember';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
const router = useRouter();

const screenWidth = Dimensions.get("window").width;

type TeamMemberDetailRouteProp = RouteProp<RootStackParamList, 'TeamMemberDetail'>;

const TeamMemberDetail: React.FC = () => {
  const route = useRoute<TeamMemberDetailRouteProp>();
  const navigation = useNavigation();
  const { playerName } = route.params;
  const { teamData, loading } = useSensorData();
  const [memberData, setMemberData] = useState<TeamDataRow | null>(null);
  const [accelerationData, setAccelerationData] = useState<number[]>([]);

  useEffect(() => {
    const fetchData = () => {
      if (teamData.length === 0) {
        console.log("teamData is empty, skipping useEffect");
        return;
      }

      console.log("teamData (useEffect): ", teamData);
      console.log("playerName (useEffect): ", playerName);

      const memberData = teamData.find(row => row[0] === playerName);
      console.log("memberData (useEffect): ", memberData);

      if (memberData) {
        const validAccels = memberData[6].filter(value => !isNaN(value) && isFinite(value));
        console.log("validAccels (useEffect): ", validAccels);
        setAccelerationData(validAccels);
        setMemberData(memberData);
      } else {
        console.log("No member data found");
        setAccelerationData([]);
        setMemberData(null);
      }
    };

    fetchData();
  }, [teamData, playerName]);

  useEffect(() => {
    console.log("accelerationData (useEffect): ", accelerationData);
  }, [accelerationData]);

  useEffect(() => {
    console.log("Component Mounted");
    return () => {
      console.log("Component Unmounted");
    };
  }, []);

  if (loading) {
    return (
      <View style={styles.waitingContainer}>
        <Text style={styles.waitingText}>Waiting for data...</Text>
      </View>
    );
  }

  console.log("accelerationData (render): ", accelerationData);

  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.push('/teamPage')}>
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerText}>{playerName}</Text>
      </View>
      <View style={styles.chartContainer}>
        <View style={styles.yAxisContainer}>
          <Text style={styles.yAxisLabel}>Acceleration (g)</Text>
        </View>
        <ScrollView horizontal>
          {accelerationData.length > 0 ? (
            <LineChart
              data={{
                labels: accelerationData.map((_, index) => index.toString()),
                datasets: [
                  {
                    data: accelerationData,
                  },
                ],
              }}
              width={screenWidth * 2} // make the chart width double to make it scrollable
              height={220}
              yAxisLabel=""
              yAxisSuffix="g"
              yAxisInterval={1}
              chartConfig={{
                backgroundColor: '#333',
                backgroundGradientFrom: '#333',
                backgroundGradientTo: '#333',
                decimalPlaces: 2, // optional, defaults to 2dp
                color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
                labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
                style: {
                  borderRadius: 16,
                },
                propsForDots: {
                  r: '0', // Remove dots
                },
                propsForBackgroundLines: {
                  strokeDasharray: '', // solid background lines with no dashes
                },
              }}
              style={styles.chart}
              withDots={false} // Ensure no dots are displayed
            />
          ) : (
            <Text>No data available for chart</Text>
          )}
        </ScrollView>
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
    flexDirection: 'row',
    alignItems: 'center',
    margin: 10,
    padding: 10,
    backgroundColor: '#1A1A1A',
    borderRadius: 10,
  },
  backButton: {
    marginRight: 10,
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
  yAxisContainer: {
    justifyContent: 'center',
    paddingRight: 5,
  },
  yAxisLabel: {
    color: '#E0E0E0',
    fontSize: 12,
    transform: [{ rotate: '270deg' }],
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
