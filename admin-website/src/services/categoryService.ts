import {
  collection,
  addDoc,
  getDocs,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  where,
  getCountFromServer
} from 'firebase/firestore';
import { db } from './firebase';
import { JobCategory, CategoryFormData } from '../types';

export class CategoryService {
  private static readonly COLLECTION_NAME = 'categories';

  // Fetch all categories
  static async fetchCategories(): Promise<JobCategory[]> {
    try {
      const categoriesRef = collection(db, this.COLLECTION_NAME);
      const q = query(categoriesRef, orderBy('name'));
      const snapshot = await getDocs(q);

      const categories: JobCategory[] = [];

      for (const docSnap of snapshot.docs) {
        const categoryData = docSnap.data();

        // Count jobs for this category
        const jobsRef = collection(db, 'jobs');
        const jobsQuery = query(jobsRef, where('category', '==', docSnap.id));
        const jobsCountSnapshot = await getCountFromServer(jobsQuery);
        const totalJobs = jobsCountSnapshot.data().count;

        categories.push({
          id: docSnap.id,
          name: categoryData.name,
          icon: categoryData.icon,
          description: categoryData.description,
          color: categoryData.color,
          totalJobs: totalJobs
        });
      }

      return categories;
    } catch (error) {
      console.error('Error fetching categories:', error);
      throw new Error('Failed to fetch categories');
    }
  }

  // Add new category
  static async addCategory(categoryData: CategoryFormData): Promise<string> {
    try {
      // Check if category ID already exists
      const existingCategories = await this.fetchCategories();
      const existsId = existingCategories.some(cat => cat.id === categoryData.id);

      if (existsId) {
        throw new Error(`Category with ID '${categoryData.id}' already exists`);
      }

      const newCategory = {
        name: categoryData.name.trim(),
        icon: categoryData.icon.trim(),
        description: categoryData.description.trim(),
        color: categoryData.color.trim(),
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Create document with custom ID
      const customDocRef = doc(db, this.COLLECTION_NAME, categoryData.id);
      await setDoc(customDocRef, newCategory);

      return categoryData.id;
    } catch (error) {
      console.error('Error adding category:', error);
      throw error;
    }
  }

  // Update existing category
  static async updateCategory(categoryId: string, categoryData: Partial<CategoryFormData>): Promise<void> {
    try {
      const categoryRef = doc(db, this.COLLECTION_NAME, categoryId);

      const updateData: any = {
        updatedAt: new Date()
      };

      if (categoryData.name) updateData.name = categoryData.name.trim();
      if (categoryData.icon) updateData.icon = categoryData.icon.trim();
      if (categoryData.description) updateData.description = categoryData.description.trim();
      if (categoryData.color) updateData.color = categoryData.color.trim();

      await updateDoc(categoryRef, updateData);
    } catch (error) {
      console.error('Error updating category:', error);
      throw new Error('Failed to update category');
    }
  }

  // Delete category
  static async deleteCategory(categoryId: string): Promise<void> {
    try {
      // Check if there are any jobs using this category
      const jobsRef = collection(db, 'jobs');
      const jobsQuery = query(jobsRef, where('category', '==', categoryId));
      const jobsSnapshot = await getDocs(jobsQuery);

      if (!jobsSnapshot.empty) {
        throw new Error(`Cannot delete category '${categoryId}' because it has ${jobsSnapshot.size} job(s) assigned to it. Please reassign or delete those jobs first.`);
      }

      const categoryRef = doc(db, this.COLLECTION_NAME, categoryId);
      await deleteDoc(categoryRef);
    } catch (error) {
      console.error('Error deleting category:', error);
      throw error;
    }
  }

  // Validate category data
  static validateCategoryData(data: CategoryFormData): string[] {
    const errors: string[] = [];

    if (!data.id || data.id.trim() === '') {
      errors.push('Category ID is required');
    } else if (!/^[a-z0-9_-]+$/.test(data.id.trim())) {
      errors.push('Category ID must contain only lowercase letters, numbers, underscores, and dashes');
    }

    if (!data.name || data.name.trim() === '') {
      errors.push('Category name is required');
    }

    if (!data.icon || data.icon.trim() === '') {
      errors.push('Category icon is required');
    }

    if (!data.description || data.description.trim() === '') {
      errors.push('Category description is required');
    }

    if (!data.color || data.color.trim() === '') {
      errors.push('Category color is required');
    } else if (!/^#[0-9a-fA-F]{6}$/.test(data.color.trim())) {
      errors.push('Category color must be a valid hex color (e.g., #ff0000)');
    }

    return errors;
  }
}