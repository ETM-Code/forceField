import TcpSocket from 'react-native-tcp-socket';

export const fetchAngularAccelerationX = async (host: string, port: number): Promise<number[]> => {
  return new Promise((resolve, reject) => {
    const client = TcpSocket.createConnection({ host, port }, () => {
      client.write('GET / HTTP/1.1\r\n\r\n');
    });

    client.on('data', (data: string | Buffer) => {
      if (typeof data === 'string') {
        console.error('Received data in unexpected format');
        reject(new Error('Received data in unexpected format'));
        return;
      }
      const rawData = new Uint8Array(data.buffer);
      const angularAccelX: number[] = [];

      for (let i = 3006; i < 6006; i += 6) {
        const x1 = rawData[i];
        const x2 = rawData[i + 6] || x1;

        const angularAccelXValue = (x2 - x1) / 0.001;
        angularAccelX.push(angularAccelXValue);
      }

      resolve(angularAccelX.slice(-10)); // Get the most recent 10 values
      client.destroy();
    });

    client.on('error', (error: Error) => {
      console.error('TCP connection error:', error);
      reject(error);
      client.destroy();
    });

    client.on('close', () => {
      console.log('Connection closed');
    });
  });
};
