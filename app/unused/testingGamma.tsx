import React, { useState, useEffect } from 'react';
import { Text, View, ScrollView, StyleSheet } from 'react-native';
import * as Network from 'expo-network';
import { Buffer } from 'buffer'; // Import Buffer
import CRC32 from 'crc-32'; // Import CRC-32 for checksum validation


const parseBinaryData = (data: number[], macCount: number, messageSize: number, addLog: (message: string) => void) => {
  const messages: any[] = [];


    const macBytes = Array.from(data.slice(0, 6));
    const macAddress = macBytes.map(b => b.toString(16).padStart(2, '0')).join(':');
    addLog(`Parsed MAC Address: ${macAddress}`);
    addLog(`Message Size: ${messageSize}`);
    const messageBytes = data.slice(7, messageSize).filter(value => value!=0);
    const messageData = Array.from(messageBytes).map(byte => byte.toString()).join(','); // Use Buffer to decode UTF-8
    messages.push({ macAddress, messageData });


  return messages;
};

const verifyReceivedData = (dataWithChecksum: number[]): boolean => {
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
};

const WebSocketClient = () => {
  const [displayMessage, setDisplayMessage] = useState<string>('');
  const [webSocket, setWebSocket] = useState<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (message: string) => {
    setLogs(prevLogs => [...prevLogs, message]);
  };

  useEffect(() => {
    let pingInterval: NodeJS.Timeout;

    const createWebSocketConnection = async () => {
      const networkState = await Network.getNetworkStateAsync();
      addLog(`Network state: ${JSON.stringify(networkState)}`);

      if (networkState.isConnected && networkState.isInternetReachable) {
        if (webSocket && webSocket.readyState === WebSocket.OPEN) {
          // addLog('WebSocket already connected, skipping reconnect...');
          return;
        }

        addLog('Attempting to connect to WebSocket...');
        const ws = new WebSocket('ws://192.168.4.1:80/ws');

        ws.binaryType = 'arraybuffer';

        ws.onopen = () => {
          addLog('Connected to ESP32 server');
          setIsConnected(true); // Update connection status
          ws.send("getData"); // Send "getData" message to the ESP-32

          // Set up periodic pinging for data
          pingInterval = setInterval(() => {
            if (ws.readyState === WebSocket.OPEN) {
              ws.send("getData");
              addLog('Pinged server for data');
            }
          }, 5000); // Ping every 5 seconds or as needed
        };

        ws.onmessage = (event) => {
          addLog('Message received from server');
          const dataString = event.data as string;
          const data = dataString.split(',').map(value => parseFloat(value));
          // const dataWithChecksum = new Uint8Array(event.data as ArrayBuffer);

          // if (verifyReceivedData(dataWithChecksum)) {
            addLog('Data checksum verified successfully');
            // const data = dataWithChecksum.slice(0, -4); // Remove checksum bytes
            const macCount = 1; // Number of MAC addresses/messages
            const messageSize = 6400; // Size of each message
            const parsedMessages = parseBinaryData(data, macCount, messageSize, addLog);

            if (parsedMessages.length > 0 && parsedMessages[0].macAddress) {
              const firstMessage = parsedMessages[0];
              if (firstMessage) {
                addLog(`Displaying message: ${firstMessage.messageData}`);
                // setDisplayMessage(`${firstMessage.macAddress}: Message Number 1: ${firstMessage.messageData}`);
              }
            }
          // } 
          // else {
          //   addLog('Data checksum verification failed');
          // }
        };

        ws.onerror = (error) => {
          addLog(`WebSocket error: ${JSON.stringify(error)}`);
          setIsConnected(false);
          if (pingInterval) clearInterval(pingInterval); // Clear ping interval on error
        };

        ws.onclose = () => {
          addLog('Connection closed');
          setIsConnected(false);
          if (pingInterval) clearInterval(pingInterval); // Clear ping interval on close
          createWebSocketConnection(); // Attempt to reconnect
        };

        setWebSocket(ws);
      } else {
        addLog('Not connected to the ESP-32 WiFi network');
        setIsConnected(false);
      }
    };

    createWebSocketConnection();

    return () => {
      if (webSocket) {
        webSocket.close();
      }
      if (pingInterval) clearInterval(pingInterval);
    };
  }, []);

  return (
    <View style={[styles.container, isConnected && styles.connectedBackground]}>
      <Text>Messages:</Text>
      <Text style={styles.messageText}>{displayMessage}</Text>
      <ScrollView style={styles.logContainer}>
        {logs.map((log, index) => (
          <Text key={index} style={styles.logText}>{log}</Text>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5fcff', // Default background color
  },
  connectedBackground: {
    backgroundColor: '#f0f8ff', // Very pale blue background color when connected
  },
  messageText: {
    fontSize: 16,
    textAlign: 'center',
    margin: 10,
  },
  logContainer: {
    marginTop: 20,
    maxHeight: 250, // Limit the height of the log container
  },
  logText: {
    fontSize: 12,
    color: '#333',
  },
});

export default WebSocketClient;
