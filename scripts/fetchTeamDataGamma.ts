import React, { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NativeModules } from 'react-native';

interface Vector3 {
  x: number;
  y: number;
  z: number;
}

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

const processSensorData = async (sessionName: string, rawData: Uint8Array): Promise<Record<string, SensorData>> => {
  const macDataMap = await loadMacDataMap(sessionName);
  const macList = JSON.parse(await AsyncStorage.getItem(`${sessionName}_macList`) || '[]');
  const checkNetwork = await AsyncStorage.getItem('checkNetwork');
  const allowModification = checkNetwork !== 'no';

  const macAddress = Array.from(rawData.slice(0, 6)).map(byte => byte.toString(16).padStart(2, '0')).join(':');
  const accels: number[] = [];
  const angularAccels: number[] = [];

  for (let i = 6; i < 3006; i += 6) {
    const x = rawData[i];
    const y = rawData[i + 1];
    const z = rawData[i + 2];
    accels.push(Math.abs(x), Math.abs(y), Math.abs(z));
  }

  for (let i = 3006; i < 6006; i += 6) {
    const x1 = rawData[i];
    const y1 = rawData[i + 1];
    const z1 = rawData[i + 2];
    const x2 = rawData[i + 6] || x1;
    const y2 = rawData[i + 7] || y1;
    const z2 = rawData[i + 8] || z1;

    const angularAccelX = (x2 - x1) / 0.001;
    const angularAccelY = (y2 - y1) / 0.001;
    const angularAccelZ = (z2 - z1) / 0.001;

    console.log("X-Angular Acceleration: ", angularAccelX);
    angularAccels.push(Math.abs(angularAccelX), Math.abs(angularAccelY), Math.abs(angularAccelZ));
  }

  if (!macList.includes(macAddress)) {
    macList.push(macAddress);
  }

  if (!macDataMap[macAddress]) {
    macDataMap[macAddress] = {
      accels: [],
      lowaccels: [],
      medaccels: [],
      highaccels: [],
    };
  }

  if (allowModification) {
    macDataMap[macAddress].accels.push(...accels);
    // Assuming angularAccels are stored similarly, adjust based on actual use case
    macDataMap[macAddress].accels.push(...angularAccels);

    assignLevels(macDataMap[macAddress]);
  }

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

export const fetchAndFormatSensorData = async (host: string, port: number): Promise<TeamDataRow[]> => {
  const currentSession = await AsyncStorage.getItem('currentSession');
  if (!currentSession) {
    console.error('Current session not found');
    return [];
  }

  return new Promise((resolve, reject) => {
    const startTime = new Date().getTime();
    NativeModules.TcpSocket.sendDataToSocket(
      host,
      port.toString(),
      'GET / HTTP/1.1\r\n\r\n',
      async (error: any, response: any) => {
        if (error) {
          console.error('TCP connection error:', error);
          reject(error);
          return;
        }

        const endTime = new Date().getTime();
        if ((endTime - startTime) / 1000 > 4) {
          console.error('TCP connection timeout');
          reject(new Error('TCP connection timeout'));
          return;
        }

        const rawData = new Uint8Array(response);
        const macDataMap = await processSensorData(currentSession, rawData);
        const formattedData = formatMacData(macDataMap);
        resolve(formattedData);
      }
    );
  });
};
