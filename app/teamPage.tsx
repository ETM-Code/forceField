import {Text, View, Button, Linking, Platform, StyleSheet, TouchableOpacity, ScrollView} from 'react-native';
import 'react-native-gesture-handler';
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import 'nativewind';
import TeamMember from '@/components/teamMember';
import { Banner } from '@/components/teamMember';




export default function Page() {
  return( 
  <View className="bg-gray-900 min-h-screen">
    <View className='m-10 p-5 bg-purple-500/50 rounded-2xl'>
        <Text className='text-white text-4xl  text-center'>TEAM NAME</Text>
    </View>
    <View className='bg-gray-600 p-5 mx-4 rounded-2xl min-h-screen'>
        <Banner></Banner>
        <ScrollView>
            <TeamMember playerName="John Doe" number1={23} number2={45} number3={67} risk="Low"/>
            <TeamMember playerName="John Doe" number1={23} number2={45} number3={67} risk="Low"/>
            <TeamMember playerName="Jim" number1={23} number2={45} number3={67} risk="Low"/>
            <TeamMember playerName="John Doe" number1={23} number2={45} number3={67} risk="Low"/>
            <TeamMember playerName="John Doe" number1={23} number2={45} number3={67} risk="Low"/>
            <TeamMember playerName="John Doe" number1={23} number2={45} number3={67} risk="Low"/>
            <TeamMember playerName="John Doe" number1={23} number2={45} number3={67} risk="Low"/>
            <TeamMember playerName="John Doe" number1={23} number2={45} number3={67} risk="Low"/>
            <TeamMember playerName="John Doe" number1={23} number2={45} number3={67} risk="Low"/>
            <TeamMember playerName="John Doe" number1={23} number2={45} number3={67} risk="Low"/>
            <TeamMember playerName="John Doe" number1={23} number2={45} number3={67} risk="Low"/>
            <TeamMember playerName="John Doe" number1={23} number2={45} number3={67} risk="Low"/>
            <TeamMember playerName="John Doe" number1={23} number2={45} number3={67} risk="Low"/>
            <TeamMember playerName="John Doe" number1={23} number2={45} number3={67} risk="Low"/>
            <TeamMember playerName="John Doe" number1={23} number2={45} number3={67} risk="Low"/>
            <TeamMember playerName="John Doe" number1={23} number2={45} number3={67} risk="Low"/>
            <TeamMember playerName="John Doe" number1={23} number2={45} number3={67} risk="Low"/>
            <TeamMember playerName="John Doe" number1={23} number2={45} number3={67} risk="Low"/>
            <TeamMember playerName="John Doe" number1={23} number2={45} number3={67} risk="Low"/>
            <TeamMember playerName="John Doe" number1={23} number2={45} number3={67} risk="Low"/>
            <TeamMember playerName="John Doe" number1={23} number2={45} number3={67} risk="Low"/>
            <TeamMember playerName="John Doe" number1={23} number2={45} number3={67} risk="Low"/>
            <TeamMember playerName="John Doe" number1={23} number2={45} number3={67} risk="Low"/>
            <TeamMember playerName="John Doe" number1={23} number2={45} number3={67} risk="Low"/>
            <TeamMember playerName="John Doe" number1={23} number2={45} number3={67} risk="Low"/>
            <TeamMember playerName="John Doe" number1={23} number2={45} number3={67} risk="Low"/>
            <TeamMember playerName="John Doe" number1={23} number2={45} number3={67} risk="Low"/>
            <TeamMember playerName="John Doe" number1={23} number2={45} number3={67} risk="Low"/>
            <TeamMember playerName="John Doe" number1={23} number2={45} number3={67} risk="Low"/>
            <TeamMember playerName="John Doe" number1={23} number2={45} number3={67} risk="Low"/>
            <View className='py-60'></View>
        </ScrollView>
    </View>
    
  </View>
  );
}