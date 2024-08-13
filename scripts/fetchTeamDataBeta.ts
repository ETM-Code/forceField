

import axios from 'axios';
import React, { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
const DOMParser = require('react-native-html-parser').DOMParser;
import CRC32 from 'crc-32';

interface SensorData {
  accels: number[];
  rotations: number[];
  lowaccels: number[];
  medaccels: number[];
  highaccels: number[];
  risk?: string;
  riskNums?: number[];
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


    // Calculate riskNum
    let riskSum = 1;
    let trueRisk = 0;
  
    data.accels.forEach(value => {
      if (value > 20) {
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
        data.riskNums?.push(riskProb);
      }
    });
  
    data.riskNum = trueRisk;

  // Classify the risk values into different levels
  if(data.riskNums){
  data.riskNums.forEach(value => {
    if (value > 35.9 && value < 46.5) {
      data.lowaccels.push(value);
    } else if (value >= 46.5 && value < 52.0) {
      data.medaccels.push(value);
    } else if (value >= 52.0) {
      data.highaccels.push(value);
    }
  });
  }



  // Assign risk based on riskNum
  if (data.riskNum < 10) {
    data.risk = "Low";
  } else if (data.riskNum < 25 && data.riskNum>10) {
    data.risk = "Med";
  } else if (data.riskNum < 60 && data.riskNum>25) {
    data.risk = "High";
  } else if (data.riskNum > 60){
    data.risk = "V. high";
  }
  else {data.risk = "Low";}
};
//first 3K bytes are the X,Y,Z acceleration from the first mac address, and the next 3K bytes are the X,Y,Z rotational acceleration from the first mac address, and then the subsequent 6K bytes follow the same pattern but for the second stored mac address.  the mac addresses of the devices are at the end of the message

const processSensorData = async (
  sessionName: string,
  rawData: Uint8Array
): Promise<Record<string, SensorData>> => {
  // const numDevices = Math.ceil(rawData.length/6407); // Define the number of devices here
  const macDataMap = await loadMacDataMap(sessionName);
  const macList = JSON.parse(await AsyncStorage.getItem(`${sessionName}_macList`) || '[]');
  const checkNetwork = await AsyncStorage.getItem('checkNetwork');
  const allowModification = checkNetwork !== 'no';

  const intMacAddress = Array.from(rawData.slice(0,6));
  let macAddress: string = "";

  // Extract the MAC addresses from the end of the rawData

    macAddress = intMacAddress.map(byte => byte.toString(16).padStart(2, '0')).join(':');

  

  const dataPerDevice = 6400; // 3.2K for acceleration + 3.2K for rotational acceleration

  const rawDataAccel = rawData.slice(7, 3207);
  const accels = Array.from(rawDataAccel);
  const rawDataGyro = rawData.slice(3207,6407);
  const angularAccels: number[] = [];

  let prevX: number | null = null;
  let prevY: number | null = null;
  let prevZ: number | null = null;
  
  const timeInterval = 1 / 3200; // Time interval between each reading

// Iterate over the sliced rawDataGyro array, processing in chunks of 3 values (x, y, z)
  rawDataGyro.forEach((value, index) => {
    if (index % 3 === 0) {
      // If we're at the start of a new set of (x, y, z), extract these values
      const x = rawDataGyro[index];
      const y = rawDataGyro[index + 1];
      const z = rawDataGyro[index + 2];

      if (prevX !== null && prevY !== null && prevZ !== null) {
        // Calculate acceleration for each axis
        const accelX = Math.abs((x - prevX) / timeInterval);
        const accelY = Math.abs((y - prevY) / timeInterval);
        const accelZ = Math.abs((z - prevZ) / timeInterval);

        angularAccels.push(accelX, accelY, accelZ);
      }

      // Update previous values
      prevX = x;
      prevY = y;
      prevZ = z;
    }
  });

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
      data.risk || "Low",
      data.riskNum !== undefined ? data.riskNum : 100,
      data.accels,
      data.rotations,
    ];
  });
};


function verifyReceivedData(dataWithChecksum: Uint8Array): boolean {
  const dataSize = dataWithChecksum.length - 4;  // Subtract 4 bytes for checksum
  const data = dataWithChecksum.slice(0, dataSize);  // Extract data part
  const receivedChecksumArray = dataWithChecksum.slice(dataSize);  // Extract checksum part

  // Reconstruct the received checksum from the last 4 bytes
  const receivedChecksum = (
    (receivedChecksumArray[0] << 24) |
    (receivedChecksumArray[1] << 16) |
    (receivedChecksumArray[2] << 8) |
    receivedChecksumArray[3]
  ) >>> 0;  // Unsigned right shift to ensure it's a 32-bit unsigned integer

  // Calculate the checksum of the received data
  const calculatedChecksum = CRC32.buf(data);

  // Compare the received checksum with the calculated checksum
  return receivedChecksum === calculatedChecksum;
}


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
    const rawDataWithChecksum = new Uint8Array(rawDataBuffer);
    const rawData = rawDataWithChecksum.slice(0,-4);

    if(verifyReceivedData(rawDataWithChecksum)){

    // Step 2: Process the binary data to build a map of MAC addresses to sensor data
    const macDataMap = await processSensorData(currentSession, rawData);

    // Step 3: Format the processed data into the desired format
    const formattedData = formatMacData(macDataMap);

    return formattedData;}
    else{
      console.error('Data is corrupted');
      return [];
    }
  } catch (error) {
    console.error('Error fetching or processing data:', error);
    return [];
  }
};
