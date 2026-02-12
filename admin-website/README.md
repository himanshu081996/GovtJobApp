# Govt Job App - Admin Panel

A simple web admin panel to manage government job listings for the Govt Job App. Built with React, TypeScript, and Firebase.

## Features

- ✅ Add new job listings
- ✅ Edit existing jobs
- ✅ Delete jobs
- ✅ View all jobs in a grid layout
- ✅ Responsive design
- ✅ Firebase Firestore integration
- ✅ Form validation
- ✅ Error handling

## Quick Start

### 1. Install Dependencies

```bash
cd admin-website
npm install
```

### 2. Firebase Setup

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Create a new project or select an existing one
3. Go to Project Settings → General → Your apps
4. Add a web app and copy the configuration
5. Replace the configuration in `src/services/firebase.ts`:

```typescript
const firebaseConfig = {
  apiKey: "your-actual-api-key",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-actual-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789012",
  appId: "your-actual-app-id"
};
```

6. Enable Firestore Database:
   - Go to Firestore Database
   - Click "Create database"
   - Choose "Start in test mode" for now
   - Select a location

### 3. Run the Admin Panel

```bash
npm run dev
```

Open [http://localhost:3001](http://localhost:3001) in your browser.

## Usage

### Adding a Job

1. Click "Add New Job" button
2. Fill in all required fields:
   - Job Title
   - Organization
   - Category
   - Description
   - Qualification
   - Age Limit
   - Total Vacancies
   - Application dates
   - Location
   - Apply URL
3. Optionally add exam date, salary, and tags
4. Click "Add Job"

### Editing a Job

1. Click "Edit" on any job card
2. Modify the fields as needed
3. Click "Update Job"

### Deleting a Job

1. Click "Delete" on any job card
2. Confirm the deletion

## Project Structure

```
admin-website/
├── src/
│   ├── components/
│   │   ├── JobForm.tsx      # Job add/edit form
│   │   └── JobList.tsx      # Job listings display
│   ├── services/
│   │   ├── firebase.ts      # Firebase configuration
│   │   └── jobService.ts    # Firebase CRUD operations
│   ├── types/
│   │   └── index.ts         # TypeScript interfaces
│   ├── utils/
│   │   └── categories.ts    # Job categories data
│   ├── App.tsx              # Main app component
│   ├── App.css              # Styles
│   └── main.tsx            # App entry point
├── package.json
└── README.md
```

## Job Categories

The app supports these job categories:

- Banking & Finance
- Railway
- Defense
- Police & Security
- Teaching
- Healthcare
- Engineering
- Administration
- Postal Services
- Agriculture

## Firestore Collections

The admin panel creates these Firestore collections:

- `jobs` - Job listings with all details
- `categories` - Job categories (optional, using static data for now)

## Technologies Used

- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool
- **Firebase 12** - Backend and database
- **React Hook Form** - Form handling
- **CSS3** - Styling with responsive design

## Deployment

### Option 1: Netlify
1. Build the project: `npm run build`
2. Deploy the `dist` folder to Netlify

### Option 2: Vercel
1. Connect your GitHub repo to Vercel
2. Auto-deploy on every push

### Option 3: Firebase Hosting
1. Install Firebase CLI: `npm install -g firebase-tools`
2. Login: `firebase login`
3. Initialize: `firebase init hosting`
4. Build: `npm run build`
5. Deploy: `firebase deploy`

## Security Notes

- The Firebase configuration in this demo uses placeholder values
- In production, consider:
  - Setting up Firebase Security Rules
  - Adding authentication for the admin panel
  - Using environment variables for sensitive config
  - Restricting admin access by IP or user roles

## Troubleshooting

### "Failed to load jobs" Error
- Check your Firebase configuration in `src/services/firebase.ts`
- Ensure Firestore is enabled in your Firebase project
- Check browser console for detailed error messages

### Jobs not appearing in the mobile app
- Ensure both the admin panel and mobile app use the same Firebase project
- Check that the collection names match (`jobs`)
- Verify the mobile app's Firebase configuration

## Support

If you encounter any issues:
1. Check the browser console for errors
2. Verify your Firebase setup
3. Ensure all required fields are filled when adding jobs