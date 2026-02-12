# Backend Integration Plan for GovtJobApp

## Database Schema

### Jobs Table
```sql
CREATE TABLE jobs (
    id UUID PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    organization VARCHAR(255) NOT NULL,
    category VARCHAR(50) NOT NULL,
    description TEXT,
    qualification VARCHAR(500),
    min_age INTEGER,
    max_age INTEGER,
    total_vacancies INTEGER,
    application_fee VARCHAR(100),
    salary VARCHAR(100),
    location VARCHAR(255),
    application_start_date DATE,
    application_end_date DATE,
    exam_date DATE,
    application_url TEXT,
    is_new BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    eligibility_criteria TEXT[],
    selection_process TEXT,
    tags VARCHAR(50)[]
);
```

### Categories Table
```sql
CREATE TABLE categories (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    icon VARCHAR(10),
    description TEXT,
    color VARCHAR(7),
    created_at TIMESTAMP DEFAULT NOW()
);
```

### User Preferences Table
```sql
CREATE TABLE user_preferences (
    user_id UUID PRIMARY KEY,
    name VARCHAR(255),
    interested_categories VARCHAR(50)[],
    notification_categories VARCHAR(50)[],
    push_token VARCHAR(500),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

## API Endpoints

### Jobs API
- `GET /api/jobs` - Fetch jobs with pagination, filtering, sorting
- `GET /api/jobs/:id` - Get specific job details
- `POST /api/jobs` - Admin: Create new job
- `PUT /api/jobs/:id` - Admin: Update job
- `DELETE /api/jobs/:id` - Admin: Delete job

### Categories API
- `GET /api/categories` - Get all categories with job counts
- `GET /api/categories/:id/jobs` - Get jobs by category

### User API
- `POST /api/users/preferences` - Save user preferences
- `GET /api/users/preferences` - Get user preferences
- `POST /api/users/notifications/subscribe` - Subscribe to category notifications

### Push Notifications API
- `POST /api/notifications/send` - Send push notifications to subscribed users
- `POST /api/notifications/schedule` - Schedule job alerts

## Implementation Steps

### Phase 1: API Integration Layer
1. Create API service layer in app
2. Replace static data with API calls
3. Add loading states and error handling
4. Implement offline caching with React Query

### Phase 2: Real-time Features
1. WebSocket connection for live job updates
2. Real-time notification when new jobs are posted
3. Background sync for offline-first experience

### Phase 3: Advanced Features
1. Job application tracking
2. Bookmark synchronization across devices
3. Personalized job recommendations
4. Analytics and user behavior tracking

## Current Code Modifications Needed

### 1. API Service Layer
```typescript
// src/services/jobsApi.ts
export const jobsApi = {
  fetchJobs: async (filters?: JobFilters) => Promise<Job[]>,
  fetchJobById: async (id: string) => Promise<Job>,
  fetchJobsByCategory: async (categoryId: string) => Promise<Job[]>,
};
```

### 2. Update Store to use API
```typescript
// Replace static data loading with API calls
const { useQuery } = require('@tanstack/react-query');

export const useJobsStore = () => {
  const { data: jobs, isLoading } = useQuery({
    queryKey: ['jobs'],
    queryFn: jobsApi.fetchJobs
  });

  return { jobs, isLoading };
};
```

### 3. Add Loading States
```typescript
// Update all screens to handle loading/error states
const JobsScreen = () => {
  const { jobs, isLoading, error } = useJobsStore();

  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorMessage />;

  return <JobsList jobs={jobs} />;
};
```

## Technology Stack Options

### Backend Options:
1. **Node.js + Express + PostgreSQL**
2. **Firebase/Firestore** (quick setup)
3. **Supabase** (PostgreSQL with real-time)
4. **AWS Amplify** (full serverless)

### Recommended: Supabase
- Real-time subscriptions
- Built-in auth
- Automatic API generation
- Push notification support
- Easy to integrate with React Native

## Migration Strategy

1. **Keep Current Structure**: Static data as fallback
2. **Gradual Migration**: Replace components one by one
3. **Feature Flags**: Toggle between static/dynamic data
4. **Offline-First**: Cache API responses locally
5. **Backward Compatibility**: Support both data sources

## Admin Panel Features

1. **Job Management Dashboard**
   - Add/Edit/Delete jobs
   - Bulk import from government websites
   - Job posting scheduling
   - Analytics and insights

2. **User Management**
   - User registration trends
   - Popular categories
   - Notification engagement metrics

3. **Content Management**
   - Category management
   - Notification templates
   - App configuration

This plan ensures smooth transition from static to dynamic data while maintaining current functionality.