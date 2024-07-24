import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { fetchAndFormatSensorData, TeamDataRow } from '@/scripts/fetchTeamDataBeta';
import AsyncStorage from '@react-native-async-storage/async-storage';

// AsyncStorage.clear()

const connectionIP = 'http://192.168.4.1';

interface SensorDataContextType {
  teamData: TeamDataRow[];
  loading: boolean;
}

interface SensorDataProviderProps {
  children: ReactNode;
}

const SensorDataContext = createContext<SensorDataContextType>({
  teamData: [],
  loading: true,
});

export const useSensorData = () => useContext(SensorDataContext);

export const SensorDataProvider: React.FC<SensorDataProviderProps> = ({ children }) => {
  const [teamData, setTeamData] = useState<TeamDataRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const currentSession = await AsyncStorage.getItem('currentSession');
        if (currentSession) {
          const data: TeamDataRow[] = await fetchAndFormatSensorData(connectionIP);
          const macList = JSON.parse(await AsyncStorage.getItem(`${currentSession}_macList`) || '[]');

          setTeamData(data);
          setLoading(false);

          // Store the session data in previousSessions
          const previousSessions = JSON.parse(await AsyncStorage.getItem('previousSessions') || '[]');
          const sessionIndex = previousSessions.findIndex((session: any) => session.sessionName === currentSession);
          if (sessionIndex !== -1) {
            previousSessions[sessionIndex].data = data;
            previousSessions[sessionIndex].macList = macList;
          } else {
            previousSessions.push({ sessionName: currentSession, data, macList });
          }
          await AsyncStorage.setItem('previousSessions', JSON.stringify(previousSessions));
        } else {
          setLoading(false);
        }
      } catch (error) {
        // console.error('Error fetching team data:', error);
        setLoading(false);
      }
    };

    fetchData();
    const intervalId = setInterval(fetchData, 1000);

    return () => clearInterval(intervalId);
  }, []);

  return (
    <SensorDataContext.Provider value={{ teamData, loading }}>
      {children}
    </SensorDataContext.Provider>
  );
};
