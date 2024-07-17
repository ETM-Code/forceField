import axios from 'axios';

import React, { useEffect, useState } from 'react';

const fetchHtmlPage = async (url: string): Promise<string> => {
  try {
    const response = await fetch(url);
    const htmlText = await response.text();
    return htmlText;
  } catch (error) {
    console.error('Error fetching HTML page:', error);
    return ''; // Return an empty string in case of error
  }
};

const parseHtmlContent = (htmlText: string): string[] => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlText, 'text/html');
    const preElements = doc.querySelectorAll('pre');
    return Array.from(preElements).map(pre => pre.textContent || '');
  };

  interface SensorData {
    accels: number[];
    highaccels: number[];
  }
  
const processSensorData = (preContents: string[]): Record<string, SensorData> => {
const macDataMap: Record<string, SensorData> = {};

preContents.forEach(content => {
    const macMatch = content.match(/Received sensor data from MAC: ([\w:]+)/);
    const dataMatch = content.match(/Sensor data: ([\d.\s]+)/);

    if (macMatch && dataMatch) {
    const macAddress = macMatch[1];
    const accels = dataMatch[1].trim().split(/\s+/).map(Number);

    // Initialize new arrays if the MAC address is not already in the map
    if (!macDataMap[macAddress]) {
        macDataMap[macAddress] = {
        accels: [],
        highaccels: [],
        };
    }

    // Append the new sensor data to the arrays
    macDataMap[macAddress].accels.push(...accels);
    accels.forEach(value => {
        if (value > 8) {
        macDataMap[macAddress].highaccels.push(value);
        }
    });
    }
});

return macDataMap;
};

export type TeamDataRow = [string, number, number, number, string, number];

const formatMacData = (macDataMap: Record<string, SensorData>): TeamDataRow[] => {
  return Object.entries(macDataMap).map(([mac, data]) => {
    return [
      mac,  
      data.accels.length,  
      1,            
      data.highaccels.length, 
      "0",               
      50                 
    ];
  });
};

export const fetchAndFormatSensorData = async (url: string): Promise<TeamDataRow[]> => {
    // Step 1: Fetch the HTML page
    const htmlText = await fetchHtmlPage(url);
  
    // Step 2: Parse the HTML content to extract the relevant text
    const preContents = parseHtmlContent(htmlText);
  
    // Step 3: Process the extracted text to build a map of MAC addresses to sensor data
    const macDataMap = processSensorData(preContents);
  
    // Step 4: Format the processed data into the desired format
    const formattedData = formatMacData(macDataMap);
  
    return formattedData;
  };
  

