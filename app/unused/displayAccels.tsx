import React, { useEffect, useState } from 'react';
import { Text, View, ScrollView, StyleSheet } from 'react-native';
import 'react-native-gesture-handler';
import { fetchAndFormatSensorData, TeamDataRow } from '@/scripts/fetchTeamDataBeta';
import 'nativewind';

const connectionIP = 'http://192.168.4.1';

interface SensorData {
  macAddress: string;
  accels: number[];
}

export default function SensorDataPage() {
  const [sensorData, setSensorData] = useState<SensorData[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data: TeamDataRow[] = await fetchAndFormatSensorData(connectionIP);
        const formattedData: SensorData[] = data.map(row => ({
          macAddress: row[0],
          accels: row[6],
        }));
        setSensorData(formattedData);
      } catch (error) {
        console.error('Error fetching sensor data:', error);
      }
    };

    fetchData();
    const intervalId = setInterval(fetchData, 1000);

    return () => clearInterval(intervalId);
  }, []);


  
  return (
    <View style={styles.container}>
      <Text style={styles.header}>Sensor Data</Text>
      <ScrollView>
        {sensorData.map((sensor, index) => (
          <View key={index} style={styles.sensorContainer}>
            <Text style={styles.macAddress}>{sensor.macAddress}</Text>
            {sensor.accels.map((accel, idx) => (
              <Text key={idx} style={styles.accel}>{accel}</Text>
            ))}
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#242424',
    padding: 10,
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#E0E0E0',
    textAlign: 'center',
    marginVertical: 10,
  },
  sensorContainer: {
    marginVertical: 10,
    padding: 10,
    backgroundColor: '#1A1A1A',
    borderRadius: 10,
  },
  macAddress: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#E0E0E0',
    marginBottom: 5,
  },
  accel: {
    fontSize: 16,
    color: '#FFFFFF',
  },
});
