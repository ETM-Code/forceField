import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';

interface TeamMemberProps {
  playerName: string;
  number1: number;
  number2: number;
  number3: number;
  risk: string;
  accels: number[];
}

const TeamMember: React.FC<TeamMemberProps> = ({ playerName, number1, number2, number3, risk, accels }) => {
  const router = useRouter();

  const handlePress = () => {
    console.log(accels);
    router.push({
      pathname: '/teamMemberDetail',
      params: { playerName, accels },
    });
  };

  return (
    <TouchableOpacity onPress={handlePress}>
      <View style={styles.container}>
        <Text style={styles.playerName}>{playerName}</Text>
        <View style={styles.numbersContainer}>
          <View style={[styles.numberBox, styles.mild]}>
            <Text style={styles.numberText}>{number1}</Text>
          </View>
          <Text style={styles.divider}>|</Text>
          <View style={[styles.numberBox, styles.mod]}>
            <Text style={styles.numberText}>{number2}</Text>
          </View>
          <Text style={styles.divider}>|</Text>
          <View style={[styles.numberBox, styles.major]}>
            <Text style={styles.numberText}>{number3}</Text>
          </View>
          <Text style={styles.divider}>|</Text>
          <View style={styles.numberBox}>
            <Text style={styles.riskText}>{risk}</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

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
    justifyContent: 'space-around',
    paddingVertical: 10,
    backgroundColor: '#a1a1a1',
    borderRadius: 10,
    marginVertical: 5,
    paddingHorizontal: 10,
  },
  bannerText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'black',
    textAlign: 'center',
  },
  divider: {
    fontSize: 18,
    color: '#E0E0E0',
  },
});

export { Banner };

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    marginVertical: 5,
    backgroundColor: '#a1a1a1',
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
    color: 'black',
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
    color: '#000000',
  },
  riskText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FF4081',
  },
  mild: {
    backgroundColor: '#FFC107',
  },
  mod: {
    backgroundColor: '#FF9800',
  },
  major: {
    backgroundColor: '#F44336',
  },
  divider: {
    marginHorizontal: 5,
    fontSize: 18,
    color: '#E0E0E0',
  },
});

export default TeamMember;