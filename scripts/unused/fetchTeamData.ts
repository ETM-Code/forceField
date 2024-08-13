// fetchTeamData.ts
export type TeamDataRow = [string, number, number, number, string, number];

export const fetchAndFormatSensorData = async (): Promise<TeamDataRow[]> => {
  // Simulate an API call that returns a matrix
  return [
    ["John Doe", 23, 45, 67, "Low", 0],
    ["Jane Smith", 12, 34, 56, "Medium", 0],
    ["John Doe", 23, 45, 67, "Low", 0],
    ["Jane Smith", 12, 34, 56, "Medium", 70],
    ["John Doe", 23, 45, 67, "Low", 0],
    ["Jane Smith", 12, 34, 56, "Medium", 0],
    ["John Doe", 23, 45, 67, "Low", 0],
    ["Jane Smith", 12, 34, 56, "Medium", 0],
    ["John Doe", 23, 45, 67, "Low", 0],
    ["Billy", 12, 34, 56, "Medium", 500],
    // Add more rows as needed
  ];
};
