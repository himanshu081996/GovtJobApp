import React, { useState } from 'react';
import { OnboardingName } from '../screens/onboarding/OnboardingName';
import { OnboardingWelcome } from '../screens/onboarding/OnboardingWelcome';
import { OnboardingPreferences } from '../screens/onboarding/OnboardingPreferences';
import { useAppStore } from '../store';
import { InterstitialService } from '../services/interstitialService';

export const OnboardingFlow: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const { setOnboardingComplete } = useAppStore();

  const handleNext = () => {
    setCurrentStep(currentStep + 1);
  };

  const handleComplete = async () => {
    console.log('🎉 Completing onboarding and requesting notification permission...');

    await setOnboardingComplete();
  };

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 0:
        return <OnboardingName onNext={handleNext} />;
      case 1:
        return <OnboardingWelcome onNext={handleNext} />;
      case 2:
        return <OnboardingPreferences onComplete={handleComplete} />;
      default:
        return <OnboardingName onNext={handleNext} />;
    }
  };

  return renderCurrentStep();
};