import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Linking } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { useSensorData } from '@/context/SensorDataContext';

export default function StartSessionPage() {
  const [sessionName, setSessionName] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();
  const { startNewSession } = useSensorData();

  useEffect(() => {
    const initializeStorage = async () => {
      const currentSession = await AsyncStorage.getItem('currentSession');
      if (currentSession) {
        router.push('/teamPage');
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
      startNewSession(sessionName.trim());
      router.push('/teamPage');
    } catch (error) {
      setError('Error starting new session. Please try again.');
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
