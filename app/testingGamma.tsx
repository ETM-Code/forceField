import React, { useState, useEffect } from 'react';
import { Text, View, ScrollView, StyleSheet } from 'react-native';
import * as Network from 'expo-network';
import { Buffer } from 'buffer'; // Import Buffer

const parseBinaryData = (data: ArrayBuffer, macCount: number, messageSize: number, addLog: (message: string) => void) => {
  const messages: any[] = [];
  const dataView = new DataView(data);
  const totalMessagesSize = messageSize * macCount;

  for (let i = 0; i < macCount; i++) {
    const macAddressOffset = totalMessagesSize + i * 6;
    const macBytes = [];
    for (let j = 0; j < 6; j++) {
      macBytes.push(dataView.getUint8(macAddressOffset + j));
    }
    const macAddress = macBytes.map(b => b.toString(16).padStart(2, '0')).join(':');
    addLog(`Parsed MAC Address: ${macAddress}`);
    addLog(`Message Size: ${messageSize}`);
    const messageBytes = new Uint8Array(data.slice(i * messageSize, (i + 1) * messageSize));
    const messageData = Buffer.from(messageBytes).toString('utf-8'); // Use Buffer to decode UTF-8
    messages.push({ macAddress, messageData });
  }

  return messages;
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
          const data = event.data as ArrayBuffer;
          const macCount = 5; // Number of MAC addresses/messages
          const messageSize = 6000; // Size of each message
          const parsedMessages = parseBinaryData(data, macCount, messageSize, addLog);

          if (parsedMessages.length > 0 && parsedMessages[0].macAddress) {
            const firstMessage = parsedMessages[0];
            if(firstMessage){
              addLog(`Displaying message: ${firstMessage.messageData}`);
              setDisplayMessage(`${firstMessage.macAddress}: Message Number 1: ${firstMessage.messageData}`);
            }
          }
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
    maxHeight: 200, // Limit the height of the log container
  },
  logText: {
    fontSize: 12,
    color: '#333',
  },
});

export default WebSocketClient;
