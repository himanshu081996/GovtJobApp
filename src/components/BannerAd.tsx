import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { BannerAd as GoogleBannerAd, BannerAdSize, TestIds } from 'react-native-google-mobile-ads';
import { AdsService } from '../services/adsService';

interface BannerAdProps {
  placement: 'home' | 'latest' | 'categories' | 'detail' | 'category' | 'saved';
  onLog?: (message: string) => void;
}

export const BannerAd: React.FC<BannerAdProps> = ({ placement, onLog }) => {
  const [adLoaded, setAdLoaded] = useState(false);
  const adUnitId = __DEV__ ? TestIds.BANNER : 'ca-app-pub-1305313519701150/5923105315';

  const handleAdLoaded = () => {
    console.log(`${placement}: Ad loaded successfully`);
    onLog?.(`${placement}: Ad loaded`);
    setAdLoaded(true);
  };

  const handleAdFailedToLoad = (error: any) => {
    console.log(`${placement}: Ad failed to load:`, error);
    onLog?.(`${placement}: Failed - ${error.message || 'Unknown error'}`);
    setAdLoaded(false);
  };

  // Don't render anything if no ad is loaded
  if (!adLoaded) {
    return (
      <GoogleBannerAd
        unitId={adUnitId}
        size={BannerAdSize.BANNER}
        requestOptions={{
          requestNonPersonalizedAdsOnly: false,
        }}
        onAdLoaded={handleAdLoaded}
        onAdFailedToLoad={handleAdFailedToLoad}
        style={{ height: 0, opacity: 0 }} // Hidden while loading
      />
    );
  }

  return (
    <View style={styles.container}>
      <GoogleBannerAd
        unitId={adUnitId}
        size={BannerAdSize.BANNER}
        requestOptions={{
          requestNonPersonalizedAdsOnly: false,
        }}
        onAdLoaded={handleAdLoaded}
        onAdFailedToLoad={handleAdFailedToLoad}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 60,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 8,
    borderRadius: 8,
  },
  placeholderText: {
    color: '#666',
    fontSize: 12,
    fontStyle: 'italic',
  },
});