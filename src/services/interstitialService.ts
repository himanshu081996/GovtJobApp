import { InterstitialAd, AdEventType, TestIds } from 'react-native-google-mobile-ads';

class InterstitialAdService {
  private static instance: InterstitialAdService;
  private interstitialAd: InterstitialAd | null = null;
  private isLoading = false;
  private isReady = false;
  private lastShownTime = 0;
  private readonly MIN_INTERVAL = 60000; // 60 seconds between ads

  private constructor() {
    this.initializeAd();
  }

  public static getInstance(): InterstitialAdService {
    if (!InterstitialAdService.instance) {
      InterstitialAdService.instance = new InterstitialAdService();
    }
    return InterstitialAdService.instance;
  }

  private initializeAd() {
    const adUnitId = __DEV__ ? TestIds.INTERSTITIAL : 'ca-app-pub-1305313519701150/9988772590';

    this.interstitialAd = InterstitialAd.createForAdRequest(adUnitId, {
      requestNonPersonalizedAdsOnly: false,
    });

    this.setupEventListeners();
    this.loadAd();
  }

  private setupEventListeners() {
    if (!this.interstitialAd) return;

    this.interstitialAd.addAdEventListener(AdEventType.LOADED, () => {
      console.log('🎯 Interstitial ad loaded successfully');
      this.isReady = true;
      this.isLoading = false;
    });

    this.interstitialAd.addAdEventListener(AdEventType.ERROR, (error) => {
      console.log('❌ Interstitial ad failed to load:', error);
      this.isReady = false;
      this.isLoading = false;
      // Retry loading after 10 seconds
      setTimeout(() => this.loadAd(), 10000);
    });

    this.interstitialAd.addAdEventListener(AdEventType.OPENED, () => {
      console.log('👀 Interstitial ad opened');
    });

    this.interstitialAd.addAdEventListener(AdEventType.CLOSED, () => {
      console.log('❌ Interstitial ad closed');
      this.isReady = false;
      this.lastShownTime = Date.now();
      // Load next ad
      setTimeout(() => this.loadAd(), 1000);
    });
  }

  private loadAd() {
    if (this.isLoading || this.isReady || !this.interstitialAd) return;

    console.log('🔄 Loading interstitial ad...');
    this.isLoading = true;
    this.interstitialAd.load();
  }

  public async showAd(): Promise<boolean> {
    const now = Date.now();

    // Check minimum interval between ads
    if (now - this.lastShownTime < this.MIN_INTERVAL) {
      console.log('⏰ Interstitial ad cooldown active, skipping');
      return false;
    }

    if (!this.isReady || !this.interstitialAd) {
      console.log('🚫 Interstitial ad not ready');
      // Try to load if not loading
      if (!this.isLoading) {
        this.loadAd();
      }
      return false;
    }

    try {
      console.log('🎬 Showing interstitial ad');
      this.interstitialAd.show();
      return true;
    } catch (error) {
      console.error('❌ Error showing interstitial ad:', error);
      this.isReady = false;
      this.loadAd();
      return false;
    }
  }

  public isAdReady(): boolean {
    return this.isReady;
  }

  public preloadNextAd() {
    if (!this.isReady && !this.isLoading) {
      this.loadAd();
    }
  }

}

export const InterstitialService = InterstitialAdService.getInstance();