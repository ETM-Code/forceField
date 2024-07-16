import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface TeamMemberProps {
  playerName: string;
  number1: number;
  number2: number;
  number3: number;
  risk: string;
}


const Banner: React.FC = () => {
  return (
    <View style={BannerStyles.bannerContainer}>
      <Text style={BannerStyles.bannerText}>Name</Text>
      <Text style={BannerStyles.divider}>|</Text>
      <Text style={BannerStyles.bannerText}>Mild</Text>
      <Text style={BannerStyles.divider}>|</Text>
      <Text style={BannerStyles.bannerText}>Mod</Text>
      <Text style={BannerStyles.divider}>|</Text>
      <Text style={BannerStyles.bannerText}>Major </Text>
      <Text style={BannerStyles.divider}>|</Text>
      <Text style={BannerStyles.bannerText}>Risk</Text>
    </View>
  );
};

const BannerStyles = StyleSheet.create({
  bannerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingVertical: 10,
    backgroundColor: '#333',
    borderRadius: 10,
    marginVertical: 5,
  },
  bannerText: {
    flex: 1,
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
  },
  divider: {
    fontSize: 18,
    color: '#fff',
    marginHorizontal: 0,
  },
});

export {Banner};


const TeamMember: React.FC<TeamMemberProps> = ({ playerName, number1, number2, number3, risk}) => {
  return (
    <View style={styles.container}>
      <Text style={styles.playerName}>{playerName}</Text>
      <View style={styles.numbersContainer}>
        <View style={[styles.numberBox, styles.yellow]}>
          <Text style={styles.numberTexty}>{number1}</Text>
        </View>
        <Text style={styles.divider}>|</Text>
        <View style={[styles.numberBox, styles.orange]}>
          <Text style={styles.numberTexty}>{number2}</Text>
        </View>
        <Text style={styles.divider}>|</Text>
        <View style={[styles.numberBox, styles.red]}>
          <Text style={styles.numberTexty}>{number3}</Text>
        </View>
        <Text style={styles.divider}>|</Text>
        <View style={[styles.numberBox]}>
          <Text style={styles.numberTexty}>{risk}</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    marginVertical: 5,
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  playerName: {
    flex: 1,
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  numbersContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  numberBox: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 5,
  },
  numberText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },

  numberTexty: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#00000',
  },
  
  yellow: {
    backgroundColor: 'yellow',
  },
  orange: {
    backgroundColor: 'orange',
  },
  red: {
    backgroundColor: 'red',
  },
  divider: {
    marginHorizontal: 5,
    fontSize: 18,
    color: '#333',
  },
});

export default TeamMember;
