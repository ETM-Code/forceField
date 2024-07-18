import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { RouteProp, useRoute } from '@react-navigation/native';
import { RootStackParamList } from './NavigationTypes'; // Ensure correct path

type TeamMemberDetailRouteProp = RouteProp<RootStackParamList, 'TeamMemberDetail'>;

const TeamMemberDetail: React.FC = () => {
  const route = useRoute<TeamMemberDetailRouteProp>();
  const { playerName, accels } = route.params;

  return (
    <View style={{ flex: 1, backgroundColor: '#242424' }}>
      <View style={{ margin: 10, padding: 10, backgroundColor: '#1A1A1A', borderRadius: 10 }}>
        <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#E0E0E0', textAlign: 'center' }}>{playerName}</Text>
      </View>
      <View style={{ flex: 1, margin: 10, padding: 10, backgroundColor: '#1A1A1A', borderRadius: 10 }}>
        <ScrollView horizontal>
          <LineChart
            data={{
              labels: accels.map((_: number, index: number) => index.toString()),
              datasets: [
                {
                  data: accels,
                },
              ],
            }}
            width={1000} // from react-native
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
            style={{
              marginVertical: 8,
              borderRadius: 16,
            }}
          />
        </ScrollView>
      </View>
    </View>
  );
};

export default TeamMemberDetail;
