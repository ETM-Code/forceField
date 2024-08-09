// App.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Font from 'expo-font';
import { Poppins_400Regular, Poppins_700Bold } from '@expo-google-fonts/poppins';
import AppLoading from 'expo-app-loading';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Import the images
import BackgroundImage from '../assets/images/helmet.png';
import LogoImage from '../assets/images/Force.png'; // Replace with your logo image path

const HomePage: React.FC = () => {

  useEffect(() => {
    console.log("Current Session: ", AsyncStorage.getItem('currentSession'))
    const manageSession = async () => {
      try {
        const holdingSesh = await AsyncStorage.getItem('holdingSession');
        await AsyncStorage.setItem('leftLoad', 'yes');
        if (holdingSesh) {
          await AsyncStorage.setItem('currentSession', holdingSesh);
          await AsyncStorage.setItem('holdingSession', '');
        }
        else{await AsyncStorage.setItem('currentSession', '');
          await AsyncStorage.setItem('holdingSession', '');
        }
      } catch (error) {
        console.error('Error managing sessions:', error);
      }
    };

    manageSession();
  }, []);


  useEffect(() => {
    AsyncStorage.setItem('checkNetwork', 'no');
  }, []);
  useEffect(() => {
    AsyncStorage.setItem('checkNetwork', 'yes');
    
  }, []);
  const [fontsLoaded, setFontsLoaded] = useState(false);
  const router = useRouter();

  useEffect(() => {
    async function loadFonts() {
      await Font.loadAsync({
        Poppins_400Regular,
        Poppins_700Bold,
      });
      setFontsLoaded(true);
    }
    loadFonts();
  }, []);

  if (!fontsLoaded) {
    return <AppLoading />;
  }

  return (
    <View style={styles.container}>
      <Image source={BackgroundImage} style={styles.backgroundImage} />
      <Image source={LogoImage} style={styles.logo} />
      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.button} onPress={() => router.push('/StartSessionPage')}>
          <Ionicons name="play" size={24} color="black" />
          <Text style={styles.buttonText}>Start Session</Text>
          <View style={styles.underline}></View>
        </TouchableOpacity>
        <TouchableOpacity style={styles.button} onPress={() => router.push('/LoadSessionPage')}>
          <Ionicons name="reload" size={24} color="black" />
          <Text style={styles.buttonText}>Load Session</Text>
          <View style={styles.underline}></View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.button} onPress={() => router.push('/testingGamma')}>
          <Ionicons name="reload" size={24} color="black" />
          <Text style={styles.buttonText}>Test</Text>
          <View style={styles.underline}></View>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default HomePage;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
    justifyContent: 'flex-start',
    padding: 20,
  },
  backgroundImage: {
    position: 'absolute',
    left: 0,
    top: '30%',
    zIndex: -1,
    opacity: 0.2,
    width: 500, // Adjust size as needed
    height: 500, // Adjust size as needed
  },
  logo: {
    width: 400,
    height: 120,
    marginBottom: 0,
    resizeMode: 'contain',
    marginTop: 50, // Adjust margin as needed
  },
  buttonContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'flex-end',
    width: '100%',
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    marginVertical: 30,
    position: 'relative',
  },
  buttonText: {
    color: 'black',
    fontSize: 24,
    marginLeft: 10,
    fontFamily: 'Poppins_400Regular',
  },
  underline: {
    position: 'absolute',
    bottom: -5,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: '#0096FF',
  },
});
