// fetchTeamData.ts
export type TeamDataRow = [string, number, number, number, string, number];

export const fetchTeamData = async (): Promise<TeamDataRow[]> => {
  // Simulate an API call that returns a matrix
  return [
    ["John Doe", 23, 45, 67, "Low", 0],
    ["Jane Smith", 12, 34, 56, "Medium", 0],
    ["John Doe", 23, 45, 67, "Low", 0],
    ["Jane Smith", 12, 34, 56, "Medium", 0],
    ["John Doe", 23, 45, 67, "Low", 0],
    ["Jane Smith", 12, 34, 56, "Medium", 0],
    ["John Doe", 23, 45, 67, "Low", 0],
    ["Jane Smith", 12, 34, 56, "Medium", 0],
    ["John Doe", 23, 45, 67, "Low", 0],
    ["Jane Smith", 12, 34, 56, "Medium", 0],
    // Add more rows as needed
  ];
};
