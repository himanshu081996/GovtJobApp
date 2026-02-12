import {
  collection,
  addDoc,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  Timestamp
} from 'firebase/firestore';
import { db } from './firebase';
import { Job, JobFormData } from '../types';

export class JobService {
  static readonly JOBS_COLLECTION = 'jobs';

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
        jobs.push({
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt,
          applicationStartDate: data.applicationStartDate?.toDate?.()?.toISOString() || data.applicationStartDate,
          applicationEndDate: data.applicationEndDate?.toDate?.()?.toISOString() || data.applicationEndDate,
          examDate: data.examDate?.toDate?.()?.toISOString() || data.examDate,
        } as Job);
      });

      return jobs;
    } catch (error) {
      console.error('Error fetching jobs:', error);
      throw error;
    }
  }

  static async addJob(jobData: JobFormData): Promise<string> {
    try {
      console.log('JobService: Processing job data:', jobData);

      const job = {
        ...jobData,
        tags: jobData.tags ? jobData.tags.split(',').map(tag => tag.trim()).filter(tag => tag) : [],
        isNew: true,
        createdAt: Timestamp.now(),
        applicationStartDate: Timestamp.fromDate(new Date(jobData.applicationStartDate)),
        applicationEndDate: jobData.applicationEndDate ? Timestamp.fromDate(new Date(jobData.applicationEndDate)) : null,
        examDate: jobData.examDate ? Timestamp.fromDate(new Date(jobData.examDate)) : null,
      };

      console.log('JobService: Formatted job for Firebase:', job);
      const docRef = await addDoc(collection(db, this.JOBS_COLLECTION), job);
      console.log('JobService: Document created with ID:', docRef.id);
      return docRef.id;
    } catch (error) {
      console.error('JobService: Error adding job:', error);
      throw error;
    }
  }

  static async updateJob(id: string, jobData: JobFormData): Promise<void> {
    try {
      const jobRef = doc(db, this.JOBS_COLLECTION, id);

      const updates = {
        ...jobData,
        tags: jobData.tags.split(',').map(tag => tag.trim()).filter(tag => tag),
        applicationStartDate: Timestamp.fromDate(new Date(jobData.applicationStartDate)),
        applicationEndDate: jobData.applicationEndDate ? Timestamp.fromDate(new Date(jobData.applicationEndDate)) : null,
        examDate: jobData.examDate ? Timestamp.fromDate(new Date(jobData.examDate)) : null,
      };

      await updateDoc(jobRef, updates);
    } catch (error) {
      console.error('Error updating job:', error);
      throw error;
    }
  }

  static async deleteJob(id: string): Promise<void> {
    try {
      await deleteDoc(doc(db, this.JOBS_COLLECTION, id));
    } catch (error) {
      console.error('Error deleting job:', error);
      throw error;
    }
  }
}