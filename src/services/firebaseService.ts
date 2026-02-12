import {
  collection,
  addDoc,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  where,
  onSnapshot,
  Timestamp
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { Job, JobCategory } from '../types';

export class FirebaseService {
  // Jobs Collection
  static readonly JOBS_COLLECTION = 'jobs';
  static readonly CATEGORIES_COLLECTION = 'categories';

  // Fetch all jobs from Firebase
  static async fetchJobs(): Promise<Job[]> {
    try {
      const q = query(
        collection(db, this.JOBS_COLLECTION),
        orderBy('createdAt', 'desc')
      );

      const querySnapshot = await getDocs(q);
      const jobs: Job[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        const createdAt = data.createdAt?.toDate?.()?.toISOString() || data.createdAt;

        // Calculate if job is new (within 7 days)
        const jobCreatedDate = new Date(createdAt);
        const now = new Date();
        const daysDiff = Math.floor((now.getTime() - jobCreatedDate.getTime()) / (1000 * 60 * 60 * 24));
        const isNew = daysDiff <= 7;

        jobs.push({
          id: doc.id,
          ...data,
          // Convert Firestore Timestamps to ISO strings
          createdAt,
          applicationStartDate: data.applicationStartDate?.toDate?.()?.toISOString() || data.applicationStartDate,
          applicationEndDate: data.applicationEndDate?.toDate?.()?.toISOString() || data.applicationEndDate,
          examDate: data.examDate?.toDate?.()?.toISOString() || data.examDate,
          // Override isNew with time-based calculation
          isNew,
        } as Job);
      });

      return jobs;
    } catch (error) {
      console.error('Error fetching jobs:', error);
      return [];
    }
  }

  // Fetch jobs by category
  static async fetchJobsByCategory(categoryId: string): Promise<Job[]> {
    try {
      const q = query(
        collection(db, this.JOBS_COLLECTION),
        where('category', '==', categoryId),
        orderBy('createdAt', 'desc')
      );

      const querySnapshot = await getDocs(q);
      const jobs: Job[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        const createdAt = data.createdAt?.toDate?.()?.toISOString() || data.createdAt;

        // Calculate if job is new (within 7 days)
        const jobCreatedDate = new Date(createdAt);
        const now = new Date();
        const daysDiff = Math.floor((now.getTime() - jobCreatedDate.getTime()) / (1000 * 60 * 60 * 24));
        const isNew = daysDiff <= 7;

        jobs.push({
          id: doc.id,
          ...data,
          createdAt,
          applicationStartDate: data.applicationStartDate?.toDate?.()?.toISOString() || data.applicationStartDate,
          applicationEndDate: data.applicationEndDate?.toDate?.()?.toISOString() || data.applicationEndDate,
          examDate: data.examDate?.toDate?.()?.toISOString() || data.examDate,
          // Override isNew with time-based calculation
          isNew,
        } as Job);
      });

      return jobs;
    } catch (error) {
      console.error('Error fetching jobs by category:', error);
      return [];
    }
  }

  // Fetch categories from Firebase
  static async fetchCategories(): Promise<JobCategory[]> {
    try {
      const querySnapshot = await getDocs(collection(db, this.CATEGORIES_COLLECTION));
      const categories: JobCategory[] = [];

      querySnapshot.forEach((doc) => {
        categories.push({
          id: doc.id,
          ...doc.data(),
        } as JobCategory);
      });

      return categories;
    } catch (error) {
      console.error('Error fetching categories:', error);
      return [];
    }
  }

  // Add a new job (for admin website)
  static async addJob(job: Omit<Job, 'id' | 'createdAt'>): Promise<string | null> {
    try {
      const jobData = {
        ...job,
        createdAt: Timestamp.now(),
        applicationStartDate: Timestamp.fromDate(new Date(job.applicationStartDate)),
        applicationEndDate: Timestamp.fromDate(new Date(job.applicationEndDate)),
        examDate: job.examDate ? Timestamp.fromDate(new Date(job.examDate)) : null,
      };

      const docRef = await addDoc(collection(db, this.JOBS_COLLECTION), jobData);
      return docRef.id;
    } catch (error) {
      console.error('Error adding job:', error);
      return null;
    }
  }

  // Update job (for admin website)
  static async updateJob(id: string, updates: Partial<Job>): Promise<boolean> {
    try {
      const jobRef = doc(db, this.JOBS_COLLECTION, id);

      // Convert date strings to Timestamps if present
      const updateData: any = { ...updates };
      if (updates.applicationStartDate) {
        updateData.applicationStartDate = Timestamp.fromDate(new Date(updates.applicationStartDate));
      }
      if (updates.applicationEndDate) {
        updateData.applicationEndDate = Timestamp.fromDate(new Date(updates.applicationEndDate));
      }
      if (updates.examDate) {
        updateData.examDate = Timestamp.fromDate(new Date(updates.examDate));
      }

      await updateDoc(jobRef, updateData);
      return true;
    } catch (error) {
      console.error('Error updating job:', error);
      return false;
    }
  }

  // Delete job (for admin website)
  static async deleteJob(id: string): Promise<boolean> {
    try {
      await deleteDoc(doc(db, this.JOBS_COLLECTION, id));
      return true;
    } catch (error) {
      console.error('Error deleting job:', error);
      return false;
    }
  }

  // Real-time listener for jobs (optional)
  static subscribeToJobs(callback: (jobs: Job[]) => void): () => void {
    const q = query(
      collection(db, this.JOBS_COLLECTION),
      orderBy('createdAt', 'desc')
    );

    return onSnapshot(q, (querySnapshot) => {
      const jobs: Job[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        const createdAt = data.createdAt?.toDate?.()?.toISOString() || data.createdAt;

        // Calculate if job is new (within 7 days)
        const jobCreatedDate = new Date(createdAt);
        const now = new Date();
        const daysDiff = Math.floor((now.getTime() - jobCreatedDate.getTime()) / (1000 * 60 * 60 * 24));
        const isNew = daysDiff <= 7;

        jobs.push({
          id: doc.id,
          ...data,
          createdAt,
          applicationStartDate: data.applicationStartDate?.toDate?.()?.toISOString() || data.applicationStartDate,
          applicationEndDate: data.applicationEndDate?.toDate?.()?.toISOString() || data.applicationEndDate,
          examDate: data.examDate?.toDate?.()?.toISOString() || data.examDate,
          // Override isNew with time-based calculation
          isNew,
        } as Job);
      });
      callback(jobs);
    });
  }

  // Add category (for admin website)
  static async addCategory(category: JobCategory): Promise<boolean> {
    try {
      await addDoc(collection(db, this.CATEGORIES_COLLECTION), category);
      return true;
    } catch (error) {
      console.error('Error adding category:', error);
      return false;
    }
  }

  // Initialize default categories (run once)
  static async initializeCategories(categories: JobCategory[]): Promise<void> {
    try {
      for (const category of categories) {
        await addDoc(collection(db, this.CATEGORIES_COLLECTION), category);
      }
      console.log('Categories initialized successfully');
    } catch (error) {
      console.error('Error initializing categories:', error);
    }
  }
}