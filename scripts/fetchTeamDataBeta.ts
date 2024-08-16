

import axios from 'axios';
import React, { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
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

let riskSum = 1;
let trueRisk = 0;

const assignLevels = (data: SensorData) => {
  data.lowaccels = [];
  data.medaccels = [];
  data.highaccels = [];


    // Calculate riskNum
    
  
    data.accels.forEach(value => {
      if (value > 30) {
        let riskValue;
        if (value < 890) {
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
  if(data.accels){
  data.accels.forEach(value => {
    if (value > 30 && value < 50) {
      data.lowaccels.push(value);
    } else if (value >= 50 && value < 80) {
      data.medaccels.push(value);
    } else if (value >= 80) {
      data.highaccels.push(value);
    }
  });
  }



  // Assign risk based on riskNum
  if (data.riskNum < 10) {
    data.risk = "Low";
  } 
  else if (data.riskNum < 25 && data.riskNum>10) {
    data.risk = "Med";
  } else if (data.riskNum < 60 && data.riskNum>25) {
    data.risk = "High";
  } else if (data.riskNum > 60){
    data.risk = "V. high";
  }
  else {data.risk = "Low";}
};
//first 3K bytes are the X,Y,Z acceleration from the first mac address, and the next 3K bytes are the X,Y,Z rotational acceleration from the first mac address, and then the subsequent 6K bytes follow the same pattern but for the second stored mac address.  the mac addresses of the devices are at the end of the message

const sequenceToFilter = [208, 157, 201, 63, 0, 0, 0, 0, 213, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 4, 0, 0, 0, 4, 0, 0, 0, 0, 1, 0, 0, 134, 65, 0, 66, 192, 64, 0, 66, 152, 156, 201, 63]
const sequence2Filter = [144, 109, 243, 120]
function filterSequence(array: number[], sequence: number[]): number[] {
  const sequenceLength = sequence.length;
  let filteredArray = [];

  for (let i = 0; i <= array.length - sequenceLength; i++) {
    // Check if the current slice matches the sequence
    const slice = array.slice(i, i + sequenceLength);

    if (slice.every((value, index) => value === sequence[index])) {
      // Skip the entire sequence
      i += sequenceLength - 1;
    } else {
      // If no match, add the current element to the filtered array
      filteredArray.push(array[i]);
    }
  }

  // Add any remaining elements after the last full slice check
  if (array.length % sequenceLength !== 0) {
    filteredArray = filteredArray.concat(array.slice(array.length - (array.length % sequenceLength)));
  }

  return filteredArray;
}

const processSensorData = async (
  sessionName: string,
  rawData: number[]
): Promise<Record<string, SensorData>> => {
  // const numDevices = Math.ceil(rawData.length/6407); // Define the number of devices here
  const macDataMap = await loadMacDataMap(sessionName);
  const macList = JSON.parse(await AsyncStorage.getItem(`${sessionName}_macList`) || '[]');
  const checkNetwork = await AsyncStorage.getItem('checkNetwork');
  const allowModification = checkNetwork !== 'no';

  // if (intMacAddress.every(byte => byte === 0)) {
  //   return {}; // Exit the function if all elements are zero
  // }

  const macAddress: string = "9C:9E:6E:02:E4:7C";

  // Extract the MAC addresses from the end of the rawData



  if(rawData.length<100){
    return(macDataMap)
  }

  const dataPerDevice = 6400; // 3.2K for acceleration + 3.2K for rotational acceleration

  // Start slicing after the 7th element
  const linAccels: number[] = [];
  const rawDataGyroArr: number[] = [];
  const angularAccels: number[] = [];

  // We loop until we reach the end of the relevant portion of the array (6407)
  
    // Slice the next 117 values for accelerometer data
    const rawDataAccel = rawData.slice(6, 3206).filter(value => value !== 0 && !isNaN(value) && isFinite(value));
    linAccels.push(
      ...Array.from(rawDataAccel)
      .filter(value => value !== 0 && !isNaN(value) && isFinite(value))
    );

    // Update offset to skip over the 117 accel values


    // Slice the next 117 values for gyroscope data
    const rawDataGyro = rawData.slice(3206, 6406).filter(value => value !== 0 && !isNaN(value) && isFinite(value));
    const rawDataGyroArray = Array.from(rawDataGyro);
    const filteredGyro = filterSequence(rawDataGyroArray, sequenceToFilter);
    const doubleFilteredGyro = filterSequence(filteredGyro, sequence2Filter)
    rawDataGyroArr.push(
      ...Array.from(doubleFilteredGyro)
      .filter(value => value !== 0 && !isNaN(value) && isFinite(value))
    );

    // Update offset to skip over the 117 gyro values

  


  let prevAV: number | null = null;
  // let prevX: number | null = null;
  // let prevY: number | null = null;
  // let prevZ: number | null = null;
  
  const timeInterval = 1 / 3200; // Time interval between each reading

// Iterate over the sliced rawDataGyro array, processing in chunks of 3 values (x, y, z)
  rawDataGyroArr.forEach((value, index) => {
    const aV = rawDataGyroArr[index];

    if (prevAV !== null){
      const accelA = Math.abs((aV - prevAV) / timeInterval);
      angularAccels.push(accelA);
    }

    prevAV = aV;

    // if (index % 3 === 0) {
    //   // If we're at the start of a new set of (x, y, z), extract these values
    //   const x = rawDataGyroArr[index]*100;
    //   const y = rawDataGyroArr[index + 1]*100;
    //   const z = rawDataGyroArr[index + 2]*100;

    //   // if (prevX !== null && prevY !== null && prevZ !== null) {
    //   //   // Calculate acceleration for each axis
    //   //   const accelX = Math.abs((x - prevX) / timeInterval);
    //   //   const accelY = Math.abs((y - prevY) / timeInterval);
    //   //   const accelZ = Math.abs((z - prevZ) / timeInterval);

    //   //   angularAccels.push(accelX, accelY, accelZ);
    //   // }

    //   // // Update previous values
    //   // prevX = x;
    //   // prevY = y;
    //   // prevZ = z;
    // }
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
      macDataMap[macAddress].accels.push(...linAccels);
      linAccels.forEach((value, index) => {
      macDataMap[macAddress].rotations.push(0);
      });
      assignLevels(macDataMap[macAddress]);
    };

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
      data.riskNum !== undefined ? data.riskNum : 0,
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

class WebSocketManager {
  private static instance: WebSocketManager | null = null;
  private ws: WebSocket | null = null;
  private dataCallback: ((data: number[]) => void) | null = null;
  private isConnecting: boolean = false;
  private url: string;

  private constructor(url: string) {
    this.url = url;
    this.connect();
  }

  public static getInstance(url: string): WebSocketManager {
    if (!WebSocketManager.instance) {
      WebSocketManager.instance = new WebSocketManager(url);
    }
    return WebSocketManager.instance;
  }

  private connect() {
    if (this.isConnecting || (this.ws && this.ws.readyState === WebSocket.OPEN)) {
      return;
    }

    this.isConnecting = true;
    this.ws = new WebSocket(this.url);
    this.ws.binaryType = 'arraybuffer';

    this.ws.onopen = () => {
      console.log('WebSocket connection opened');
      this.isConnecting = false;
    };

    this.ws.onmessage = (event) => {
      const data = event.data as string;
      const numberArray = data.split(',').map(value => parseFloat(value));
      if (this.dataCallback) {
        this.dataCallback(numberArray);
        this.dataCallback = null;
      }
    };

    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      this.isConnecting = false;
    };

    this.ws.onclose = () => {
      console.log('WebSocket connection closed');
      this.isConnecting = false;
      // Attempt to reconnect after a delay
      setTimeout(() => this.connect(), 5000);
    };
  }

  public getData(): Promise<number[]> {
    return new Promise((resolve, reject) => {
      if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
        this.connect();
      }

      const timeout = setTimeout(() => {
        this.dataCallback = null;
        reject(new Error('WebSocket getData request timed out'));
      }, 10000);  // 10 second timeout

      this.dataCallback = (data: number[]) => {
        clearTimeout(timeout);
        resolve(data);
      };

      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.ws.send("getData");
      } else {
        reject(new Error('WebSocket is not open'));
      }
    });
  }

  public close() {
    if (this.ws) {
      this.ws.close();
    }
  }
}

const wsManager = WebSocketManager.getInstance('ws://192.168.4.1:80/ws');

export const fetchAndFormatSensorData = async (url: string): Promise<TeamDataRow[]> => {
  const currentSession = await AsyncStorage.getItem('currentSession');
  if (!currentSession) {
    console.error('Current session not found');
    return [];
  }

  // Step 1: Establish a WebSocket connection and fetch the binary data
  
  // Create a single instance of WebSocketManager

  
  // In fetchAndFormatSensorData function:
  const rawDataBuffer = await wsManager.getData();

  try {
    const rawDataBuffer = await wsManager.getData();
    const macDataMap = await processSensorData(currentSession, rawDataBuffer);
    const formattedData = formatMacData(macDataMap);
    return formattedData;
  } catch (error) {
    console.error('Error fetching or processing data:', error);
    return [];
  }
};
