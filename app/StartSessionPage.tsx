// StartSessionPage.tsx
import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Linking } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function StartSessionPage() {
  const [sessionName, setSessionName] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  useEffect(() => {
    AsyncStorage.setItem('checkNetwork', 'yes');
  }, []);

  useEffect(() => {
    const initializeStorage = async () => {
      try {
        const currentSession = await AsyncStorage.getItem('currentSession');
        if (currentSession === null) {
          await AsyncStorage.setItem('currentSession', '');
        }

        const existingSessions = await AsyncStorage.getItem('sessions');
        if (existingSessions === null) {
          await AsyncStorage.setItem('sessions', JSON.stringify([]));
        } else if (currentSession) {
          router.push('/teamPage');
        }

        const previousSessions = await AsyncStorage.getItem('previousSessions');
        if (previousSessions === null) {
          await AsyncStorage.setItem('previousSessions', JSON.stringify([]));
        }
      } catch (e) {
        console.error('Failed to initialize storage.', e);
      }
    };

    initializeStorage();
  }, []);

  const handleSubmit = async () => {
    if (!sessionName.trim()) {
      setError('Session name is required.');
      return;
    }
    try {
      const existingSessions = JSON.parse(await AsyncStorage.getItem('sessions') || '[]');
      let newSessionName = sessionName.trim();
  
      // Continuously append ' New' until a unique session name is found
      while (existingSessions.includes(newSessionName)) {
        newSessionName += ' New';
      }
  
      await AsyncStorage.setItem('currentSession', newSessionName);
      existingSessions.push(newSessionName);
      await AsyncStorage.setItem('sessions', JSON.stringify(existingSessions));
      router.push('/teamPage');
    } catch (error) {
      setError('Error saving session name. Please try again.');
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.homeButton} onPress={() => router.push('/')}>
        <Ionicons name="home" size={24} color="black" />
      </TouchableOpacity>
      <Text style={styles.header}>Start Session</Text>
      <Text style={styles.instructions}>
        Ensure you are connected to helmet WiFi for proper functionality (hint:
        <Text style={styles.link} onPress={() => Linking.openURL('App-Prefs:root=WIFI')}> go to WiFi Settings</Text>)
      </Text>
      <TextInput
        style={styles.input}
        placeholder="Session Name..."
        placeholderTextColor="#999"
        value={sessionName}
        onChangeText={setSessionName}
      />
      <TouchableOpacity style={styles.button} onPress={handleSubmit}>
        <Text style={styles.buttonText}>Start</Text>
      </TouchableOpacity>
      {error ? <Text style={styles.error}>{error}</Text> : null}
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
    color: 'black',
  },
  header: {
    fontSize: 32,
    color: 'black',
    textAlign: 'center',
    marginTop: 100,
    marginBottom: 20,
    fontFamily: 'Poppins_700Bold',
  },
  instructions: {
    color: 'black',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
  link: {
    color: 'black',
    textDecorationLine: 'underline',
  },
  input: {
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    borderRadius: 5,
    paddingHorizontal: 10,
    color: 'black',
    backgroundColor: '#d9d9d9',
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#1E90FF',
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontFamily: 'Poppins_700Bold',
  },
  error: {
    color: 'red',
    textAlign: 'center',
    marginTop: 10,
  },
});
