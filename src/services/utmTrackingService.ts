import { Linking, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { PlayInstallReferrer } from 'react-native-play-install-referrer';
import { logger } from '../components/DebugConsole';
import { AnalyticsService } from './analyticsService';
import { FacebookTrackingService } from './facebookTrackingService';

interface UTMParameters {
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
  utm_term?: string;
}

interface AttributionData {
  utm_source: string;
  utm_medium: string;
  utm_campaign: string;
  utm_content: string;
  utm_term: string;
  attribution_method: string;
  timestamp: number;
  link_url?: string;
}

export class UTMTrackingService {
  private static readonly ATTRIBUTION_KEY = 'utm_attribution_data';
  private static readonly ATTRIBUTION_TRACKED_KEY = 'utm_attribution_tracked';
  private static isInitialized = false;

  // Initialize UTM tracking - WITH GOOGLE PLAY INSTALL REFERRER
  static async initialize(): Promise<void> {
    try {
      if (this.isInitialized) {
        return;
      }

      logger.log('🔗 Initializing UTM tracking service...', 'info');

      // Check if attribution already tracked for this install
      const alreadyTracked = await AsyncStorage.getItem(this.ATTRIBUTION_TRACKED_KEY);
      if (alreadyTracked) {
        logger.log('🔗 Attribution already tracked for this install', 'info');
        this.isInitialized = true;
        return;
      }

      // For Android - try to get install referrer data
      if (Platform.OS === 'android') {
        await this.trackInstallReferrer();
      } else {
        // For iOS - track as organic since install referrer is Android-only
        await this.trackOrganicInstall();
      }

      this.isInitialized = true;
      logger.log('✅ UTM tracking service initialized', 'success');

    } catch (error) {
      logger.log(`❌ UTM tracking initialization failed: ${error}`, 'error');
      console.error('UTM tracking initialization error:', error);
    }
  }

  // Track install using Google Play Install Referrer
  private static async trackInstallReferrer(): Promise<void> {
    try {
      logger.log('🔗 Attempting to get Google Play Install Referrer...', 'info');

      // Check if PlayInstallReferrer is available
      if (!PlayInstallReferrer || typeof PlayInstallReferrer.getInstallReferrerInfo !== 'function') {
        logger.log('🔗 PlayInstallReferrer API not available, tracking as organic', 'info');
        await this.trackOrganicInstall();
        return;
      }

      // Get install referrer info using the correct callback API
      await new Promise<void>((resolve) => {
        PlayInstallReferrer.getInstallReferrerInfo((installReferrerInfo, error) => {
          if (!error && installReferrerInfo) {
            logger.log(`🔗 Install referrer received: ${installReferrerInfo.installReferrer}`, 'info');
            logger.log(`🔗 Install referrer response: ${JSON.stringify(installReferrerInfo)}`, 'info');

            // Parse UTM parameters from install referrer string
            const utmParams = this.parseUTMFromReferrer(installReferrerInfo.installReferrer);

            if (utmParams && Object.values(utmParams).some(value => value !== undefined)) {
              // We have UTM parameters from install referrer
              const attributionData: AttributionData = {
                utm_source: utmParams.utm_source || 'play-store',
                utm_medium: utmParams.utm_medium || 'install_referrer',
                utm_campaign: utmParams.utm_campaign || 'unknown',
                utm_content: utmParams.utm_content || '',
                utm_term: utmParams.utm_term || '',
                attribution_method: 'play_install_referrer',
                timestamp: Date.now(),
              };

              this.storeAttributionData(attributionData)
                .then(() => this.trackInstallAttribution(attributionData))
                .then(() => AsyncStorage.setItem(this.ATTRIBUTION_TRACKED_KEY, 'true'))
                .then(() => {
                  logger.log(`✅ UTM attribution tracked from install referrer: ${attributionData.utm_source}`, 'success');
                  resolve();
                })
                .catch((trackingError) => {
                  logger.log(`❌ Error tracking install attribution: ${trackingError}`, 'error');
                  this.trackOrganicInstall().then(resolve);
                });
            } else {
              // No UTM in install referrer, track as organic
              logger.log('🔗 No UTM parameters in install referrer, tracking as organic', 'info');
              this.trackOrganicInstall().then(resolve);
            }
          } else {
            // Error getting install referrer or no data available
            logger.log(`🔗 Install referrer error or no data: ${error || 'No data'}`, 'info');
            this.trackOrganicInstall().then(resolve);
          }
        });
      });

    } catch (error) {
      logger.log(`❌ Error in trackInstallReferrer: ${error}`, 'error');
      console.error('Install referrer error details:', error);
      // Fallback to organic tracking on error
      await this.trackOrganicInstall();
    }
  }

  // Parse UTM parameters from install referrer string
  private static parseUTMFromReferrer(referrerString: string): UTMParameters | null {
    try {
      logger.log(`🔗 Parsing UTM from referrer: ${referrerString}`, 'info');

      const params: UTMParameters = {};

      // Install referrer can be URL encoded, so decode it first
      const decodedReferrer = decodeURIComponent(referrerString);

      // Create a URL object to parse query parameters
      // Install referrer format is typically: utm_source=xxx&utm_medium=yyy&utm_campaign=zzz
      const searchParams = new URLSearchParams(decodedReferrer);

      params.utm_source = searchParams.get('utm_source') || undefined;
      params.utm_medium = searchParams.get('utm_medium') || undefined;
      params.utm_campaign = searchParams.get('utm_campaign') || undefined;
      params.utm_content = searchParams.get('utm_content') || undefined;
      params.utm_term = searchParams.get('utm_term') || undefined;

      logger.log(`🔗 Parsed UTM parameters: ${JSON.stringify(params)}`, 'info');

      return params;

    } catch (error) {
      logger.log(`❌ Error parsing UTM from referrer: ${error}`, 'error');
      return null;
    }
  }

  // Track organic install (fallback when no UTM available)
  private static async trackOrganicInstall(): Promise<void> {
    try {
      const attributionData: AttributionData = {
        utm_source: 'play-store',
        utm_medium: 'organic',
        utm_campaign: 'unknown',
        utm_content: '',
        utm_term: '',
        attribution_method: 'organic_fallback',
        timestamp: Date.now(),
      };

      await this.storeAttributionData(attributionData);
      await this.trackInstallAttribution(attributionData);
      await AsyncStorage.setItem(this.ATTRIBUTION_TRACKED_KEY, 'true');

      logger.log('✅ Organic install tracked', 'success');

    } catch (error) {
      logger.log(`❌ Error tracking organic install: ${error}`, 'error');
    }
  }

  // Parse UTM from deep link URL - MAIN UTM TRACKING METHOD
  static async parseDeepLinkUTM(url: string): Promise<UTMParameters | null> {
    try {
      logger.log(`🔗 Parsing UTM from deep link: ${url}`, 'info');

      const urlObj = new URL(url);
      const params: UTMParameters = {};

      // Extract UTM parameters from URL
      params.utm_source = urlObj.searchParams.get('utm_source') || undefined;
      params.utm_medium = urlObj.searchParams.get('utm_medium') || undefined;
      params.utm_campaign = urlObj.searchParams.get('utm_campaign') || undefined;
      params.utm_content = urlObj.searchParams.get('utm_content') || undefined;
      params.utm_term = urlObj.searchParams.get('utm_term') || undefined;

      // Check if any UTM parameters exist
      const hasUTMParams = Object.values(params).some(value => value !== undefined);

      if (hasUTMParams) {
        logger.log(`🎯 UTM parameters found: ${JSON.stringify(params)}`, 'success');

        // Create attribution data for deep link
        const attributionData: AttributionData = {
          utm_source: params.utm_source || 'unknown',
          utm_medium: params.utm_medium || 'deep_link',
          utm_campaign: params.utm_campaign || 'unknown',
          utm_content: params.utm_content || '',
          utm_term: params.utm_term || '',
          attribution_method: 'deep_link',
          timestamp: Date.now(),
          link_url: url,
        };

        // Track deep link attribution
        await this.trackDeepLinkAttribution(attributionData);

        return params;
      } else {
        logger.log('🔗 No UTM parameters found in deep link', 'info');
        return null;
      }

    } catch (error) {
      logger.log(`❌ Error parsing deep link UTM: ${error}`, 'error');
      return null;
    }
  }

  // Track install attribution in Firebase + Facebook
  private static async trackInstallAttribution(attributionData: AttributionData): Promise<void> {
    try {
      // Track in Firebase Analytics
      await AnalyticsService.logCustomEvent('app_install_attributed', {
        utm_source: attributionData.utm_source,
        utm_medium: attributionData.utm_medium,
        utm_campaign: attributionData.utm_campaign,
        utm_content: attributionData.utm_content,
        utm_term: attributionData.utm_term,
        attribution_method: attributionData.attribution_method,
      });

      // Set user properties for Firebase
      await AnalyticsService.setUserProperty('attribution_source', attributionData.utm_source);
      await AnalyticsService.setUserProperty('attribution_medium', attributionData.utm_medium);
      await AnalyticsService.setUserProperty('attribution_campaign', attributionData.utm_campaign);

      // Track first open attribution
      await AnalyticsService.logCustomEvent('first_open_attributed', {
        attribution_source: attributionData.utm_source,
        campaign_name: attributionData.utm_campaign,
        medium: attributionData.utm_medium,
      });

      // Track in Facebook for Meta ads attribution
      await FacebookTrackingService.trackUserEngagement('InstallAttribution', {
        utm_source: attributionData.utm_source,
        utm_medium: attributionData.utm_medium,
        utm_campaign: attributionData.utm_campaign,
        attribution_method: attributionData.attribution_method,
      });

      logger.log('📊 Install attribution tracked in Firebase + Facebook', 'success');

    } catch (error) {
      logger.log(`❌ Error tracking install attribution: ${error}`, 'error');
    }
  }

  // Track deep link attribution
  private static async trackDeepLinkAttribution(attributionData: AttributionData): Promise<void> {
    try {
      // Track deep link UTM in Firebase Analytics
      await AnalyticsService.logCustomEvent('deep_link_attribution', {
        utm_source: attributionData.utm_source,
        utm_medium: attributionData.utm_medium,
        utm_campaign: attributionData.utm_campaign,
        utm_content: attributionData.utm_content,
        utm_term: attributionData.utm_term,
        link_url: attributionData.link_url || '',
      });

      // Track in Facebook for Meta ads
      await FacebookTrackingService.trackUserEngagement('DeepLinkAttribution', {
        utm_source: attributionData.utm_source,
        utm_medium: attributionData.utm_medium,
        utm_campaign: attributionData.utm_campaign,
        link_source: 'deep_link',
      });

      logger.log(`📊 Deep link attribution tracked: ${attributionData.utm_source}`, 'success');

    } catch (error) {
      logger.log(`❌ Error tracking deep link attribution: ${error}`, 'error');
    }
  }

  // Store attribution data locally
  private static async storeAttributionData(attributionData: AttributionData): Promise<void> {
    try {
      await AsyncStorage.setItem(this.ATTRIBUTION_KEY, JSON.stringify(attributionData));
      logger.log('💾 Attribution data stored locally', 'success');
    } catch (error) {
      logger.log(`❌ Error storing attribution data: ${error}`, 'error');
    }
  }

  // Get stored attribution data
  static async getAttributionData(): Promise<AttributionData | null> {
    try {
      const storedData = await AsyncStorage.getItem(this.ATTRIBUTION_KEY);
      return storedData ? JSON.parse(storedData) : null;
    } catch (error) {
      logger.log(`❌ Error getting attribution data: ${error}`, 'error');
      return null;
    }
  }

  // Track campaign click (for retargeting campaigns)
  static async trackCampaignClick(utmSource: string, utmMedium: string, utmCampaign: string): Promise<void> {
    try {
      // Track in Firebase Analytics
      await AnalyticsService.logCustomEvent('campaign_click', {
        utm_source: utmSource,
        utm_medium: utmMedium,
        utm_campaign: utmCampaign,
        timestamp: Date.now(),
      });

      // Track in Facebook
      await FacebookTrackingService.trackUserEngagement('CampaignClick', {
        utm_source: utmSource,
        utm_medium: utmMedium,
        utm_campaign: utmCampaign,
      });

      logger.log(`📊 Campaign click tracked: ${utmSource}`, 'success');

    } catch (error) {
      logger.log(`❌ Error tracking campaign click: ${error}`, 'error');
    }
  }

  // Check if service is initialized
  static isServiceInitialized(): boolean {
    return this.isInitialized;
  }

  // Reset attribution (for testing)
  static async resetAttribution(): Promise<void> {
    try {
      await AsyncStorage.removeItem(this.ATTRIBUTION_KEY);
      await AsyncStorage.removeItem(this.ATTRIBUTION_TRACKED_KEY);
      this.isInitialized = false;

      logger.log('🔄 UTM attribution data reset', 'info');

    } catch (error) {
      logger.log(`❌ Error resetting attribution: ${error}`, 'error');
    }
  }

  // Handle initial app link (if app was opened from a UTM link)
  static async handleInitialLink(): Promise<void> {
    try {
      const initialUrl = await Linking.getInitialURL();
      if (initialUrl) {
        logger.log(`🔗 Initial app link detected: ${initialUrl}`, 'info');
        await this.parseDeepLinkUTM(initialUrl);
      } else {
        logger.log('🔗 No initial app link found', 'info');
      }
    } catch (error) {
      logger.log(`❌ Error handling initial link: ${error}`, 'error');
    }
  }
}