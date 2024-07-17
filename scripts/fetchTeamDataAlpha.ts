import axios from 'axios';

export const fetchTeamData = async () => {
  try {
    const response = await axios.get('http://<ESP32_IP_ADDRESS>/teamdata'); 
    const data = response.data;

    // Ensure all elements are present in each row
    const formattedData = data.map((row: any[]) => ({
      playerName: row[0] || "0",
      number1: row[1] || 0,
      number2: row[2] || 0,
      number3: row[3] || 0,
      risk: row[4] || "0",
      riskNum: row[5] || 100,
    }));

    return formattedData;
  } catch (error) {
    console.error('Error fetching team data:', error);
    return [];
  }
};
