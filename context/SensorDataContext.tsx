// SensorDataContext.tsx
import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { fetchAndFormatSensorData, TeamDataRow } from '@/scripts/fetchTeamDataBeta';

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
        const data: TeamDataRow[] = await fetchAndFormatSensorData(connectionIP);
        setTeamData(data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching team data:', error);
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
