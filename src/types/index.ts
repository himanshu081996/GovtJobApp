export type Theme = 'light' | 'dark';

export interface UserPreferences {
  name?: string;
  age?: number;
  qualification?: string;
  interestedCategories?: string[];
  notificationCategories?: string[];
  hasCompletedOnboarding: boolean;
  theme: Theme;
  preferredLanguage: 'en' | 'hi';
  notifications: {
    newJobs: boolean;
    applicationReminders: boolean;
    examAlerts: boolean;
  };
}

export interface JobCategory {
  id: string;
  name: string;
  icon: string;
  description: string;
  totalJobs: number;
  color: string;
}

export interface Job {
  id: string;
  title: string;
  organization: string;
  category: string;
  description: string;
  qualification: string;
  ageLimit: string;
  totalVacancies: number;
  applicationStartDate: string;
  applicationEndDate?: string;
  examDate?: string;
  applicationFee: string;
  applyUrl: string;
  isNew: boolean;
  createdAt: string;
  tags: string[];
  location: string;
  salary?: string;
  jobType: 'permanent' | 'temporary' | 'contractual';
  notificationImageUrl?: string;
}

export interface OnboardingData {
  step: number;
  userPreferences: Partial<UserPreferences>;
}

export interface SavedJob {
  jobId: string;
  savedAt: string;
}

export interface AppState {
  // User preferences and onboarding
  userPreferences: UserPreferences;
  updateUserPreferences: (preferences: Partial<UserPreferences>) => void;
  setOnboardingComplete: () => void;
  resetOnboarding: () => void;

  // Theme
  theme: Theme;
  setTheme: (theme: Theme) => void;

  // Jobs
  jobs: Job[];
  savedJobs: SavedJob[];
  isLoadingJobs: boolean;
  setJobs: (jobs: Job[]) => void;
  fetchJobs: () => Promise<void>;
  addNewJob: (job: Omit<Job, 'id' | 'createdAt'>) => Promise<void>;
  findJobById: (jobId: string) => Job | null;
  addToSaved: (jobId: string) => void;
  removeFromSaved: (jobId: string) => void;

  // Categories
  categories: JobCategory[];
  setCategories: (categories: JobCategory[]) => void;

  // App state
  isLoading: boolean;
  setLoading: (loading: boolean) => void;

  // Search and filters
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedCategory: string | null;
  setSelectedCategory: (category: string | null) => void;

  // Push notifications
  pushToken: string | null;
  setPushToken: (token: string | null) => void;
  addNotificationCategory: (categoryId: string) => Promise<void>;
  removeNotificationCategory: (categoryId: string) => void;
  initializeNotifications: () => Promise<void>;
}