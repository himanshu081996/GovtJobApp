import mobileAds from 'react-native-google-mobile-ads';
import { InterstitialService } from './interstitialService';

export class AdsService {
  private static isInitialized = false;
  private static initStatus: 'pending' | 'success' | 'error' = 'pending';
  private static errorMessage: string | null = null;

  static async initialize() {
    if (this.isInitialized) return;

    try {
      console.log('🎯 Initializing Google Mobile Ads...');
      await mobileAds().initialize();

      this.isInitialized = true;
      this.initStatus = 'success';
      console.log('✅ Google Mobile Ads initialized successfully');

      // Initialize interstitial service
      console.log('🎬 Initializing interstitial ads...');
      InterstitialService.preloadNextAd();

    } catch (error) {
      this.initStatus = 'error';
      this.errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('❌ Failed to initialize Google Mobile Ads:', error);
    }
  }

  static isReady(): boolean {
    return this.isInitialized;
  }

  static getStatus(): { status: 'pending' | 'success' | 'error'; error?: string } {
    return {
      status: this.initStatus,
      error: this.errorMessage || undefined
    };
  }
}