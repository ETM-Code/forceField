import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, Dimensions, StyleSheet } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { RouteProp, useRoute } from '@react-navigation/native';
import { RootStackParamList } from './NavigationTypes';
import { useSensorData } from '@/context/SensorDataContext';
import { TeamDataRow } from '@/scripts/fetchTeamDataBeta';
import TeamMember from '@/components/teamMember';

const screenWidth = Dimensions.get("window").width;

type TeamMemberDetailRouteProp = RouteProp<RootStackParamList, 'TeamMemberDetail'>;

const TeamMemberDetail: React.FC = () => {
  const route = useRoute<TeamMemberDetailRouteProp>();
  const { playerName } = route.params;
  const { teamData, loading } = useSensorData();
  const [memberData, setMemberData] = useState<TeamDataRow | null>(null);
  const [accelerationData, setAccelerationData] = useState<number[]>([]);

  useEffect(() => {
    // console.log("Using effect")
    const memberData = teamData.find(row => row[0] === playerName);
    if (memberData) {
      // console.log("member data exists");
      const validAccels = memberData[6].filter(value => !isNaN(value) && isFinite(value));
      setAccelerationData(validAccels);
      setMemberData(memberData);
      // console.log("Accels: ", memberData[6])
    } else {
      // console.log("member data doesn't exist");
      setAccelerationData([]);
      setMemberData(null);
    }
  }, [teamData, playerName]);

  if (loading) {
    return (
      <View style={styles.waitingContainer}>
        <Text style={styles.waitingText}>Waiting for data...</Text>
      </View>
    );
  }

  return (
  

        <LineChart
    data={{
      labels: ["January", "February", "March", "April", "May", "June"],
      datasets: [
        {
          data: accelerationData
        }
      ]
    }}
    width={Dimensions.get("window").width} // from react-native
    height={220}
    yAxisLabel="$"
    yAxisSuffix="k"
    yAxisInterval={1} // optional, defaults to 1
    chartConfig={{
      backgroundColor: "#e26a00",
      backgroundGradientFrom: "#fb8c00",
      backgroundGradientTo: "#ffa726",
      decimalPlaces: 2, // optional, defaults to 2dp
      color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
      labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
      style: {
        borderRadius: 16
      },
      propsForDots: {
        r: "0",
        strokeWidth: "2",
        stroke: "#ffa726"
      }
    }}
    bezier
    style={{
      marginVertical: 8,
      borderRadius: 16
    }}
  />


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
