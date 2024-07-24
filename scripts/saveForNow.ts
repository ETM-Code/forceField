import React, { useEffect, useState } from 'react';
import { Text, View, Button } from 'react-native';
import TcpSocket from 'react-native-tcp-socket';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Define Vector3 struct
interface Vector3 {
  x: number;
  y: number;
  z: number;
}

// Define SensorData interface
interface SensorData {
  accels: number[];
  lowaccels: number[];
  medaccels: number[];
  highaccels: number[];
  angAccels?: number[];
  risk?: string;
  riskNum?: number;
}

// Define the IP and port of the ESP32
const ESP32_IP = '192.168.4.1';
const ESP32_PORT = 80;

// Function to fetch binary data
const fetchBinaryData = async (): Promise<Buffer> => {
  return new Promise((resolve, reject) => {
    const client = TcpSocket.createConnection({ port: ESP32_PORT, host: ESP32_IP }, () => {
      console.log('Connected to ESP32');
      client.write('GET / HTTP/1.1\r\nHost: ' + ESP32_IP + '\r\n\r\n');
    });

    client.on('data', (data) => {
      console.log('Received data');
      resolve(data);
      client.destroy();
    });

    client.on('error', (error) => {
      console.error('Error: ' + error);
      reject(error);
    });

    client.on('close', () => {
      console.log('Connection closed');
    });
  });
};

// Function to process data
const processData = (data: Buffer): Record<string, SensorData> => {
  let offset = 0;
  const macDataMap: Record<string, SensorData> = {};

  while (offset < data.length) {
    const macAddress = Array.from(data.slice(offset, offset + 6))
      .map(b => b.toString(16).padStart(2, '0'))
      .join(':');
    offset += 6;

    const length = (data[offset] << 8) | data[offset + 1];
    offset += 2;

    const sensorData = data.slice(offset, offset + length);
    offset += length;

    if (!macDataMap[macAddress]) {
      macDataMap[macAddress] = {
        accels: [],
        lowaccels: [],
        medaccels: [],
        highaccels: [],
        angAccels: []
      };
    }

    const accels: number[] = [];
    const angAccels: number[] = [];

    for (let i = 0; i < 3000; i += 6) {
      const x = sensorData[i];
      const y = sensorData[i + 1];
      const z = sensorData[i + 2];
      const absAccel = Math.sqrt(x * x + y * y + z * z);
      accels.push(absAccel);
    }

    for (let i = 3000; i < 6000; i += 6) {
      const x1 = sensorData[i];
      const y1 = sensorData[i + 1];
      const z1 = sensorData[i + 2];
      const x2 = sensorData[i + 3] || x1;
      const y2 = sensorData[i + 4] || y1;
      const z2 = sensorData[i + 5] || z1;
      const angAccel = Math.sqrt(
        Math.pow((x2 - x1) / 0.001, 2) +
        Math.pow((y2 - y1) / 0.001, 2) +
        Math.pow((z2 - z1) / 0.001, 2)
      );
      angAccels.push(angAccel);
    }

    macDataMap[macAddress].accels = accels;
    macDataMap[macAddress].angAccels = angAccels;
  }

  return macDataMap;
};

// Define missing functions
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

// Function to assign levels and calculate risk
const assignLevels = (data: SensorData) => {
  data.lowaccels = [];
  data.medaccels = [];
  data.highaccels = [];

  data.accels.forEach(value => {
    if (value > 35.9 && value < 46.5) {
      data.lowaccels.push(value);
    } else if (value >= 46.5 && value < 52.0) {
      data.medaccels.push(value);
    } else if (value >= 52.0) {
      data.highaccels.push(value);
    }
  });

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

// Function to process sensor data
const processSensorData = async (sessionName: string, data: Buffer): Promise<Record<string, SensorData>> => {
  const macDataMap = await loadMacDataMap(sessionName);
  const macList = JSON.parse(await AsyncStorage.getItem(`${sessionName}_macList`) || '[]');
  const checkNetwork = await AsyncStorage.getItem('checkNetwork');
  const allowModification = checkNetwork !== 'no';

  const newMacDataMap = processData(data);

  for (const [macAddress, sensorData] of Object.entries(newMacDataMap)) {
    if (!macList.includes(macAddress)) {
      macList.push(macAddress);
    }

    if (!macDataMap[macAddress]) {
      macDataMap[macAddress] = sensorData;
    } else {
      macDataMap[macAddress].accels.push(...sensorData.accels);
      macDataMap[macAddress].angAccels?.push(...sensorData.angAccels || []);
    }

    if (allowModification) {
      assignLevels(macDataMap[macAddress]);
    }
  }

  if (allowModification) {
    await saveMacDataMap(sessionName, macDataMap, macList);
  }

  return macDataMap;
};

// Function to fetch and format sensor data
export const fetchAndFormatSensorData = async (url: string): Promise<TeamDataRow[]> => {
  const currentSession = await AsyncStorage.getItem('currentSession');
  if (!currentSession) {
    console.error('Current session not found');
    return [];
  }

  const data = await fetchBinaryData();

  const macDataMap = await processSensorData(currentSession, data);

  const formattedData = formatMacData(macDataMap);

  return formattedData;
};

// Function to format MAC data
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
      data.angAccels || []
    ];
  });
};

// Define TeamDataRow type
export type TeamDataRow = [string, number, number, number, string, number, number[], number[]];
