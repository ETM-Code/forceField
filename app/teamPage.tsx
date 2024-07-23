import React, { useEffect, useState } from 'react';
import { Text, View, ScrollView, TouchableOpacity, StyleSheet, Alert, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSensorData } from '@/context/SensorDataContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter, useLocalSearchParams } from 'expo-router';
import NetInfo from '@react-native-community/netinfo';
import 'nativewind';
import TeamMember from '@/components/teamMember';
import { Banner } from '@/components/teamMember';

interface TeamMemberData {
  playerName: string;
  number1: number;
  number2: number;
  number3: number;
  risk: string;
  accels: number[];
}

export default function Page() {
  const [sessionName, setSessionName] = useState<string | null>(null);
  const [isConnectedToWifi, setIsConnectedToWifi] = useState<boolean | null>(null);
  const [previousSession, setPreviousSession] = useState<string | null>(null);
  const router = useRouter();
  const { teamData, loading } = useSensorData();
  const { historical } = useLocalSearchParams();

  useEffect(() => {
    
    const getSessionName = async () => {
      const currentSession = await AsyncStorage.getItem('currentSession');
      await AsyncStorage.setItem('holdingSession', '');
      setSessionName(currentSession);

      if (historical && currentSession) {
        setPreviousSession(currentSession);
      }
    };

    getSessionName();
  }, [historical]);

  useEffect(() => {
    if (!historical) {
      const checkConnection = () => {
        NetInfo.fetch().then(state => {
          setIsConnectedToWifi(state.type === 'wifi' && state.isConnected);
        });
      };

      checkConnection();
      const unsubscribe = NetInfo.addEventListener(state => {
        setIsConnectedToWifi(state.type === 'wifi' && state.isConnected);
      });

      return () => unsubscribe();
    }
  }, [historical]);

  const saveSessionData = async () => {
    const previousSessions = JSON.parse(await AsyncStorage.getItem('previousSessions') || '[]');
    const macList = JSON.parse(await AsyncStorage.getItem(`${sessionName}_macList`) || '[]'); // Load the macList
    const newSession = { sessionName: sessionName, data: teamData, macList };
    previousSessions.push(newSession);
    await AsyncStorage.setItem('previousSessions', JSON.stringify(previousSessions));
  };

  const handleEndSession = async () => {
    await saveSessionData();
    await AsyncStorage.setItem('currentSession', '');
    router.push('/');
  };

  const confirmEndSession = () => {
    Alert.alert(
      "End Session",
      "Are you sure you want to end the session?",
      [
        {
          text: "No",
          style: "cancel"
        },
        {
          text: "Yes",
          onPress: handleEndSession
        }
      ],
      { cancelable: false }
    );
  };

  const handleExitHistorical = async () => {
    if (previousSession) {
      await AsyncStorage.setItem('currentSession', previousSession);
    }
    router.push('/LoadSessionPage');
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.homeButton}
          onPress={() => {
            if (historical) {
              handleExitHistorical();
            } else {
              router.push('/');
            }
          }}
        >
          <Ionicons name={historical ? "arrow-back" : "home"} size={24} color="black" />
        </TouchableOpacity>
        <Text style={styles.headerText}>{sessionName || 'Your Team'}</Text>
        <View style={styles.homeButtonPlaceholder} />
      </View>
      {!historical && (
        <TouchableOpacity style={styles.endSessionButton} onPress={confirmEndSession}>
          <Text style={styles.endSessionButtonText}>End Session</Text>
        </TouchableOpacity>
      )}
      {isConnectedToWifi === false && !historical && (
        <View style={styles.wifiWarningContainer}>
          <Text style={styles.wifiWarningText}>
            You are not connected to WiFi. For proper functionality, please connect to helmet WiFi. 
            <Text style={styles.link} onPress={() => Linking.openURL('App-Prefs:root=WIFI')}> Go to WiFi Settings</Text>
          </Text>
        </View>
      )}
      <View style={styles.content}>
        <Banner />
        <ScrollView>
          {teamData.map((member, index) => (
            <TeamMember
              key={index}
              playerName={member[0]}
              number1={member[1]}
              number2={member[2]}
              number3={member[3]}
              risk={member[4]}
              accels={member[6]} // Pass acceleration data
            />
          ))}
          <View className='py-80'></View>
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#828282',
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#c7c7c7',
    padding: 15,
    borderRadius: 10,
    marginTop: 40,
    marginBottom: 20,
  },
  homeButton: {
    padding: 10,
  },
  homeButtonPlaceholder: {
    width: 24, // to align the center text properly
  },
  headerText: {
    fontSize: 24,
    color: 'black',
    fontWeight: 'bold',
    textAlign: 'center',
    flex: 1,
  },
  endSessionButton: {
    backgroundColor: '#ff5e5e',
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
    marginBottom: 20,
    marginHorizontal: 20,
  },
  endSessionButtonText: {
    color: 'black',
    fontSize: 18,
    fontWeight: 'bold',
  },
  wifiWarningContainer: {
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 10,
    backgroundColor: '#FF4500',
    borderRadius: 5,
  },
  wifiWarningText: {
    color: 'white',
    fontSize: 16,
    textAlign: 'center',
  },
  link: {
    color: 'white',
    textDecorationLine: 'underline',
  },
  content: {
    flex: 1,
    backgroundColor: '#d9d9d9',
    padding: 10,
    borderRadius: 10,
  },
});
