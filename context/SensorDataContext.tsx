import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { fetchAndFormatSensorData, TeamDataRow } from '@/scripts/fetchTeamDataBeta';

interface SensorData {
  accels: number[];
  lowaccels: number[];
  medaccels: number[];
  highaccels: number[];
  risk?: string;
  riskNum?: number;
}

interface SensorDataContextProps {
  teamData: TeamDataRow[];
  loading: boolean;
  setTeamData: (data: TeamDataRow[]) => void;
  saveMacDataMap: (macDataMap: Record<string, SensorData>) => Promise<void>;
  startNewSession: (sessionName: string) => void;
}

interface SensorDataProviderProps {
  children: ReactNode;
}

const SensorDataContext = createContext<SensorDataContextProps | undefined>(undefined);

export const SensorDataProvider: React.FC<SensorDataProviderProps> = ({ children }) => {
  const [teamData, setTeamData] = useState<TeamDataRow[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const loadMacDataMap = async (): Promise<Record<string, SensorData>> => {
    try {
      const storedData = await AsyncStorage.getItem('macDataMap');
      return storedData ? JSON.parse(storedData) : {};
    } catch (error) {
      console.error('Error loading data from AsyncStorage:', error);
      return {};
    }
  };

  const saveMacDataMap = async (macDataMap: Record<string, SensorData>) => {
    try {
      await AsyncStorage.setItem('macDataMap', JSON.stringify(macDataMap));
    } catch (error) {
      console.error('Error saving data to AsyncStorage:', error);
    }
  };

  const startNewSession = async (sessionName: string) => {
    try {
      await AsyncStorage.setItem('currentSession', sessionName);
      setTeamData([]); // Clear the current team data
    } catch (error) {
      console.error('Error starting new session:', error);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    const macDataMap = await loadMacDataMap();
    const formattedData = formatMacData(macDataMap);
    setTeamData(formattedData);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10000); // Fetch data every 10 seconds

    return () => clearInterval(interval); // Cleanup interval on component unmount
  }, []);

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

  return (
    <SensorDataContext.Provider value={{ teamData, loading, setTeamData, saveMacDataMap, startNewSession }}>
      {children}
    </SensorDataContext.Provider>
  );
};

export const useSensorData = (): SensorDataContextProps => {
  const context = useContext(SensorDataContext);
  if (context === undefined) {
    throw new Error('useSensorData must be used within a SensorDataProvider');
  }
  return context;
};
