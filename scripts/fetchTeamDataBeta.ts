

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
  rotations: number[];
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
  } else if (data.riskNum > 40){
    data.risk = "V. high";
  }
  else {data.risk = "Low";}
};
//first 3K bytes are the X,Y,Z acceleration from the first mac address, and the next 3K bytes are the X,Y,Z rotational acceleration from the first mac address, and then the subsequent 6K bytes follow the same pattern but for the second stored mac address.  the mac addresses of the devices are at the end of the message

const processSensorData = async (
  sessionName: string,
  rawData: Uint8Array
): Promise<Record<string, SensorData>> => {
  const numDevices = 2; // Define the number of devices here
  const macDataMap = await loadMacDataMap(sessionName);
  const macList = JSON.parse(await AsyncStorage.getItem(`${sessionName}_macList`) || '[]');
  const checkNetwork = await AsyncStorage.getItem('checkNetwork');
  const allowModification = checkNetwork !== 'no';

  const macAddresses: string[] = [];

  // Extract the MAC addresses from the end of the rawData
  for (let i = 0; i < numDevices; i++) {
    const macStartIndex = rawData.length - (6 * (numDevices - i));
    const macAddress = Array.from(rawData.slice(macStartIndex, macStartIndex + 6))
      .map(byte => byte.toString(16).padStart(2, '0')).join(':');
    macAddresses.push(macAddress);
  }

  const dataPerDevice = 6000; // 3K for acceleration + 3K for rotational acceleration

  for (let deviceIndex = 0; deviceIndex < numDevices; deviceIndex++) {
    const baseIndex = deviceIndex * dataPerDevice;

    const accels: number[] = [];
    const angularAccels: number[] = [];

    // Extract X, Y, Z acceleration data (first 3K bytes)
    for (let i = baseIndex; i < baseIndex + 3000; i += 6) {
      const x = rawData[i]/9.81;
      const y = rawData[i + 1]/9.81;
      const z = rawData[i + 2]/9.81;
      accels.push(Math.abs(x), Math.abs(y), Math.abs(z));
    }

    // Extract X, Y, Z rotational acceleration data (next 3K bytes)
    for (let i = baseIndex + 3000; i < baseIndex + 6000; i += 6) {
      const x = rawData[i];
      const y = rawData[i + 1];
      const z = rawData[i + 2];
      angularAccels.push(Math.abs(x), Math.abs(y), Math.abs(z));
    }

    const macAddress = macAddresses[deviceIndex];

    if (!macList.includes(macAddress)) {
      macList.push(macAddress);
    }

    if (!macDataMap[macAddress]) {
      macDataMap[macAddress] = {
        accels: [],
        rotations: [],
        lowaccels: [],
        medaccels: [],
        highaccels: [],
      };
    }

    if (allowModification) {
      macDataMap[macAddress].accels.push(...accels);
      macDataMap[macAddress].accels.push(...angularAccels);

      assignLevels(macDataMap[macAddress]);
    }
  }

  if (allowModification) {
    await saveMacDataMap(sessionName, macDataMap, macList);
  }

  return macDataMap;
};



export type TeamDataRow = [string, number, number, number, string, number, number[], number[]];

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
      data.rotations,
    ];
  });
};

export const fetchAndFormatSensorData = async (url: string): Promise<TeamDataRow[]> => {
  const currentSession = await AsyncStorage.getItem('currentSession');
  if (!currentSession) {
    console.error('Current session not found');
    return [];
  }

  // Step 1: Establish a WebSocket connection and fetch the binary data
  const fetchWebSocketData = (): Promise<ArrayBuffer> => {
    return new Promise((resolve, reject) => {
      const ws = new WebSocket('ws://192.168.4.1:80/ws');

      ws.binaryType = 'arraybuffer';

      ws.onopen = () => {
        ws.send("getData"); // Request data from the server
      };

      ws.onmessage = (event) => {
        resolve(event.data as ArrayBuffer);
        ws.close(); // Close the WebSocket connection after receiving data
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        reject(error);
        ws.close();
      };

      ws.onclose = () => {
        console.log('WebSocket connection closed');
      };
    });
  };

  try {
    // Fetch binary data from WebSocket
    const rawDataBuffer = await fetchWebSocketData();
    const rawData = new Uint8Array(rawDataBuffer);

    // Step 2: Process the binary data to build a map of MAC addresses to sensor data
    const macDataMap = await processSensorData(currentSession, rawData);

    // Step 3: Format the processed data into the desired format
    const formattedData = formatMacData(macDataMap);

    return formattedData;
  } catch (error) {
    console.error('Error fetching or processing data:', error);
    return [];
  }
};
