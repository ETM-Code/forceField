import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';

interface Session {
  sessionName: string;
  data: any; // Adjust the type of `data` according to the actual structure of your session data
}

export default function LoadSessionPage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const router = useRouter();

  useEffect(() => {
    const manageSession = async () => {
      try {
        const currentSesh = await AsyncStorage.getItem('currentSession');
        const leftLoad = await AsyncStorage.getItem('leftLoad');
        
        if (currentSesh && leftLoad!='no') {
          await AsyncStorage.setItem('holdingSession', currentSesh);
          console.log('Holding session set successfully');
        }
        
      } catch (error) {
        console.error('Error managing sessions:', error);
      }
      const leftLoad = await AsyncStorage.setItem('leftLoad', 'no');
      
    };

    manageSession();
  }, []);


  useEffect(() => {
    AsyncStorage.setItem('checkNetwork', 'no');
  }, []);

  useEffect(() => {
    const loadSessions = async () => {
      const storedSessions = await AsyncStorage.getItem('previousSessions');
      const currentSession = await AsyncStorage.getItem('currentSession');
      if (storedSessions) {
        const sessionsList: Session[] = JSON.parse(storedSessions);
        const filteredSessions = sessionsList.filter(session => session.sessionName !== currentSession);
        setSessions(filteredSessions);
      }
    };

    loadSessions();
  }, []);

  const handleLoadSession = async (sessionName: string) => {
    await AsyncStorage.setItem('currentSession', sessionName);
    router.push('/teamPage?historical=true');
  };

  const handleDeleteSession = async (sessionName: string) => {
    const updatedSessions = sessions.filter(session => session.sessionName !== sessionName);
    setSessions(updatedSessions);
    await AsyncStorage.setItem('previousSessions', JSON.stringify(updatedSessions));
  };

  const confirmDeleteSession = (sessionName: string) => {
    Alert.alert(
      "Delete Session",
      "Are you sure you want to delete this session?",
      [
        {
          text: "No",
          style: "cancel"
        },
        {
          text: "Yes",
          onPress: () => handleDeleteSession(sessionName)
        }
      ],
      { cancelable: false }
    );
  };

  const handleExportSession = async (sessionName: string) => {
    const session = sessions.find(s => s.sessionName === sessionName);
    if (!session) {
      Alert.alert('Error', 'Session not found.');
      return;
    }

    const csvData = convertToCSV(session.data);
    const fileUri = `${FileSystem.documentDirectory}${sessionName}.csv`;

    await FileSystem.writeAsStringAsync(fileUri, csvData, {
      encoding: FileSystem.EncodingType.UTF8,
    });

    await Sharing.shareAsync(fileUri);
  };

  const convertToCSV = (data: any) => {
    const headers = Object.keys(data[0]).join(',');
    const rows = data.map((row: any) => Object.values(row).join(',')).join('\n');
    return `${headers}\n${rows}`;
  };

  const handlePress = async () => {
    try {
      // Update the AsyncStorage value
      let holdingSesh = await AsyncStorage.getItem('holdingSession')
      if (holdingSesh){
      await AsyncStorage.setItem('currentSession', holdingSesh);}
      else {await AsyncStorage.setItem('currentSession', '');}

      // Navigate to the home screen
      router.push('/');
    } catch (error) {
      console.error('Error updating AsyncStorage:', error);
    }
  };



  return (


    <View style={styles.container}>
      <TouchableOpacity style={styles.homeButton} onPress={handlePress}>
        <Ionicons name="home" size={24} color="black" />
      </TouchableOpacity>
      <Text style={styles.header}>Load Session</Text>
      <ScrollView style={styles.scrollView}>
        {sessions.map((session, index) => (
          <View key={index} style={styles.sessionContainer}>
            <Text style={styles.sessionText}>{session.sessionName}</Text>
            <View style={styles.sessionButtons}>
              <TouchableOpacity style={styles.loadButton} onPress={() => handleLoadSession(session.sessionName)}>
                <Text style={styles.buttonText}>Load</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.deleteButton} onPress={() => confirmDeleteSession(session.sessionName)}>
                <Text style={styles.buttonText}>Delete</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.exportButton} onPress={() => handleExportSession(session.sessionName)}>
                <Text style={styles.buttonText}>Export</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f0f0',
    padding: 20,
  },
  homeButton: {
    position: 'absolute',
    top: 40,
    left: 20,
    zIndex: 10,
  },
  header: {
    fontSize: 32,
    color: 'black',
    textAlign: 'center',
    marginTop: 100,
    marginBottom: 20,
    fontFamily: 'Poppins_700Bold',
  },
  scrollView: {
    marginTop: 20,
  },
  sessionContainer: {
    backgroundColor: '#c7c7c7',
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
  },
  sessionText: {
    fontSize: 20,
    color: 'black',
    marginBottom: 10,
  },
  sessionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  loadButton: {
    backgroundColor: '#1E90FF',
    padding: 10,
    borderRadius: 5,
  },
  deleteButton: {
    backgroundColor: '#CA3535',
    padding: 10,
    borderRadius: 5,
  },
  exportButton: {
    backgroundColor: '#FF8C00',
    padding: 10,
    borderRadius: 5,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
  },
});
