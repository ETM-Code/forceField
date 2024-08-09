import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { fetchAngularAccelerationX } from '../scripts/fetchDataTester';

const AngularAccelXDisplay: React.FC = () => {
  const [angularAccelX, setAngularAccelX] = useState<number[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await fetchAngularAccelerationX('192.168.4.1', 80); // host and port
        setAngularAccelX(data);
      } catch (error) {
        console.error('Error fetching angular acceleration X data:', error);
      }
    };

    fetchData();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Most Recent 10 Angular Acceleration X Values</Text>
      <FlatList
        data={angularAccelX}
        renderItem={({ item, index }) => <Text style={styles.item}>{index + 1}. {item}</Text>}
        keyExtractor={(item, index) => index.toString()}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  header: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  item: {
    fontSize: 16,
    marginVertical: 5,
  },
});

export default AngularAccelXDisplay;
