// Modify my react native code in the following ways:
// - It should work with the new tcp server binary transmission methods. Remember to use the tcp-socket library if necessary, among other required tools.
// - It should take the first 3,000 uint8_t's as acceleration, in the ordering x,y,z,x,y,z  and find the absolute values of each trio of acceleration data, storing the resulting values in the accels array, which, as can be seen from the code, is later used to calculate risk values
// - The next 3,000 uint8_t's should be taken as angular velocity, in the ordering x,y,z,x,y,z. From this, angular acceleration should be calculated assuming the time between each trio is 0.001s. The end accelerations should be assumed to be the same as the one before, in order to ensure the angular acceleration array adds up to 1,000 elements. From this, the absolute angular acceleration should also be calculated.
// - make a note of anything added, removed or changed
// - work through what you need to do step by step and ensure all code is of high quality
// - note any considerations at the end
// - make a note of any changes that will be required to be made to files that call the functions in this one
// - note that all this compute should occur in the react app, rather than on the esp-32
// - use vector3 structs where applicable
// - ensure that asyncStorage is used in the same way it's currently used, ask if unsure




import axios from 'axios';
import React, { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
const DOMParser = require('react-native-html-parser').DOMParser;

const fetchHtmlPage = async (url: string): Promise<string> => {
  try {
    const response = await fetch(url);
    const htmlText = await response.text();
    return htmlText;
  } catch (error) {
    // console.error('Error fetching HTML page:', error);
    return ''; // Return an empty string in case of error
  }
};

const parseHtmlContent = (htmlText: string): string[] => {
  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlText, 'text/html');
  const preElements = doc.getElementsByTagName('pre');
  if (preElements.length > 0) {
    const preContent = preElements[0].textContent || '';
    return preContent.split('\n\n');
  }
  return [];
};

interface SensorData {
  accels: number[];
  lowaccels: number[];
  medaccels: number[];
  highaccels: number[];
  risk?: string;
  riskNum?: number;
}

const loadMacDataMap = async (sessionName: string): Promise<Record<string, SensorData>> => {
  try {
    const storedData = await AsyncStorage.getItem(sessionName);
    return storedData ? JSON.parse(storedData) : {};
  } catch (error) {
    console.error('Error loading data from AsyncStorage:', error);
    return {};
  }
};

const saveMacDataMap = async (sessionName: string, macDataMap: Record<string, SensorData>, macList: string[]) => {
  const checkNetwork = await AsyncStorage.getItem('checkNetwork');
  if (checkNetwork === 'no') {
    console.log('Network check is "no", modifications are disabled');
    return;
  }
  try {
    await AsyncStorage.setItem(sessionName, JSON.stringify(macDataMap));
    await AsyncStorage.setItem(`${sessionName}_macList`, JSON.stringify(macList));
  } catch (error) {
    console.error('Error saving data to AsyncStorage:', error);
  }
};

const assignLevels = (data: SensorData) => {
  data.lowaccels = [];
  data.medaccels = [];
  data.highaccels = [];

  // Classify the accels values into different levels
  data.accels.forEach(value => {
    if (value > 35.9 && value < 46.5) {
      data.lowaccels.push(value);
    } else if (value >= 46.5 && value < 52.0) {
      data.medaccels.push(value);
    } else if (value >= 52.0) {
      data.highaccels.push(value);
    }
  });

  // Calculate riskNum
  let riskSum = 1;
  let trueRisk = 0;

  data.accels.forEach(value => {
    if (value > 25) {
      let riskValue;
      if (value < 89) {
        riskValue = -0.0004 * Math.pow(value, 3) + 0.0631 * Math.pow(value, 2) - 2.1851 * value + 21.545;
      } else {
        riskValue = 100;
      }
      if (riskValue > 100) { riskValue = 100; }
      let riskProb = 1 - (riskValue / 100);

      riskSum = riskSum * riskProb;
      trueRisk = (1 - riskSum) * 100;
    }
  });

  data.riskNum = trueRisk;

  // Assign risk based on riskNum
  if (data.riskNum < 10) {
    data.risk = "Low";
  } else if (data.riskNum < 25) {
    data.risk = "Med";
  } else if (data.riskNum < 40) {
    data.risk = "High";
  } else {
    data.risk = "V. high";
  }
};

const processSensorData = async (sessionName: string, preContents: string[]): Promise<Record<string, SensorData>> => {
  const macDataMap = await loadMacDataMap(sessionName);
  const macList = JSON.parse(await AsyncStorage.getItem(`${sessionName}_macList`) || '[]');
  const checkNetwork = await AsyncStorage.getItem('checkNetwork');
  const allowModification = checkNetwork !== 'no';

  preContents.forEach(content => {
    const macMatch = content.match(/Received sensor data from MAC: ([\w:]+)/);
    const dataMatch = content.match(/Sensor data: ([\d.\s]+)/);

    if (macMatch && dataMatch) {
      const macAddress = macMatch[1];
      const accels = dataMatch[1].trim().split(/\s+/).map(parseFloat); // Use parseFloat here

      // Add MAC address to the list if not already present
      if (!macList.includes(macAddress)) {
        macList.push(macAddress);
      }

      // Initialize new arrays if the MAC address is not already in the map
      if (!macDataMap[macAddress]) {
        macDataMap[macAddress] = {
          accels: [],
          lowaccels: [],
          medaccels: [],
          highaccels: [],
        };
      }

      if (allowModification) {
        // Append the new sensor data to the arrays
        macDataMap[macAddress].accels.push(...accels);

        // Assign levels and calculate risk
        assignLevels(macDataMap[macAddress]);
      }
    }
  });

  if (allowModification) {
    await saveMacDataMap(sessionName, macDataMap, macList);
  }

  return macDataMap;
};

export type TeamDataRow = [string, number, number, number, string, number, number[]];

const formatMacData = (macDataMap: Record<string, SensorData>): TeamDataRow[] => {
  return Object.entries(macDataMap).map(([mac, data]) => {
    return [
      mac,
      data.lowaccels.length,
      data.medaccels.length,
      data.highaccels.length,
      data.risk || "V. High",
      data.riskNum !== undefined ? data.riskNum : 100,
      data.accels,
    ];
  });
};

export const fetchAndFormatSensorData = async (url: string): Promise<TeamDataRow[]> => {
  const currentSession = await AsyncStorage.getItem('currentSession');
  if (!currentSession) {
    console.error('Current session not found');
    return [];
  }

  // Step 1: Fetch the HTML page
  const htmlText = await fetchHtmlPage(url);

  // Step 2: Parse the HTML content to extract the relevant text
  const preContents = parseHtmlContent(htmlText);

  // Step 3: Process the extracted text to build a map of MAC addresses to sensor data
  const macDataMap = await processSensorData(currentSession, preContents);

  // Step 4: Format the processed data into the desired format
  const formattedData = formatMacData(macDataMap);

  return formattedData;
};
