import React, { useState, useEffect } from 'react';
import JobList from './JobList';
import JobForm from './JobForm';
import CategoryList from './CategoryList';
import CategoryForm from './CategoryForm';
import { useAuth } from '../contexts/AuthContext';
import { Job, JobFormData, JobCategory, CategoryFormData } from '../types';
import { JobService } from '../services/jobService';
import { CategoryService } from '../services/categoryService';

export function AdminDashboard() {
  const { logout, currentUser } = useAuth();

  // Tab management
  const [activeTab, setActiveTab] = useState<'jobs' | 'categories'>('jobs');

  // Jobs state
  const [jobs, setJobs] = useState<Job[]>([]);
  const [isLoadingJobs, setIsLoadingJobs] = useState(true);
  const [isSubmittingJob, setIsSubmittingJob] = useState(false);
  const [showJobForm, setShowJobForm] = useState(false);
  const [editingJob, setEditingJob] = useState<Job | null>(null);

  // Categories state
  const [categories, setCategories] = useState<JobCategory[]>([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);
  const [isSubmittingCategory, setIsSubmittingCategory] = useState(false);
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState<JobCategory | null>(null);

  // Common state
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadJobs();
    loadCategories();
  }, []);

  const loadJobs = async () => {
    try {
      setIsLoadingJobs(true);
      setError(null);
      const fetchedJobs = await JobService.fetchJobs();
      setJobs(fetchedJobs);
    } catch (error) {
      setError('Failed to load jobs. Please check your Firebase configuration.');
      console.error('Error loading jobs:', error);
    } finally {
      setIsLoadingJobs(false);
    }
  };

  const loadCategories = async () => {
    try {
      setIsLoadingCategories(true);
      setError(null);
      const fetchedCategories = await CategoryService.fetchCategories();
      setCategories(fetchedCategories);
    } catch (error) {
      setError('Failed to load categories. Please check your Firebase configuration.');
      console.error('Error loading categories:', error);
    } finally {
      setIsLoadingCategories(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Failed to log out:', error);
    }
  };

  // Job handlers
  const handleCreateJob = () => {
    setEditingJob(null);
    setShowJobForm(true);
  };

  const handleEditJob = (job: Job) => {
    setEditingJob(job);
    setShowJobForm(true);
  };

  const handleJobFormSubmit = async (jobData: JobFormData) => {
    try {
      setIsSubmittingJob(true);
      setError(null);

      if (editingJob) {
        await JobService.updateJob(editingJob.id, jobData);
      } else {
        await JobService.addJob(jobData);
      }

      await loadJobs();
      setShowJobForm(false);
      setEditingJob(null);
    } catch (error) {
      setError('Failed to save job. Please try again.');
      console.error('Error saving job:', error);
    } finally {
      setIsSubmittingJob(false);
    }
  };

  const handleJobFormCancel = () => {
    setShowJobForm(false);
    setEditingJob(null);
  };

  const handleDeleteJob = async (jobId: string) => {
    if (!window.confirm('Are you sure you want to delete this job?')) {
      return;
    }

    try {
      setError(null);
      await JobService.deleteJob(jobId);
      await loadJobs();
    } catch (error) {
      setError('Failed to delete job. Please try again.');
      console.error('Error deleting job:', error);
    }
  };

  // Category handlers
  const handleCreateCategory = () => {
    setEditingCategory(null);
    setShowCategoryForm(true);
  };

  const handleEditCategory = (category: JobCategory) => {
    setEditingCategory(category);
    setShowCategoryForm(true);
  };

  const handleCategoryFormSubmit = async (categoryData: CategoryFormData) => {
    try {
      setIsSubmittingCategory(true);
      setError(null);

      if (editingCategory) {
        await CategoryService.updateCategory(editingCategory.id, categoryData);
      } else {
        await CategoryService.addCategory(categoryData);
      }

      await loadCategories();
      await loadJobs(); // Reload jobs to update category counts
      setShowCategoryForm(false);
      setEditingCategory(null);
    } catch (error) {
      setError('Failed to save category. Please try again.');
      console.error('Error saving category:', error);
    } finally {
      setIsSubmittingCategory(false);
    }
  };

  const handleCategoryFormCancel = () => {
    setShowCategoryForm(false);
    setEditingCategory(null);
  };

  const handleDeleteCategory = async (categoryId: string) => {
    try {
      setError(null);
      await CategoryService.deleteCategory(categoryId);
      await loadCategories();
      await loadJobs(); // Reload jobs to update category counts
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete category. Please try again.';
      setError(errorMessage);
      console.error('Error deleting category:', error);
    }
  };

  const isFormVisible = showJobForm || showCategoryForm;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {/* Header */}
      <header style={{
        backgroundColor: '#007bff',
        color: 'white',
        padding: '1rem 2rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <h1 style={{ margin: 0 }}>Government Jobs Admin</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <span>Welcome, {currentUser?.email}</span>
          <button
            onClick={handleLogout}
            style={{
              backgroundColor: 'rgba(255,255,255,0.2)',
              color: 'white',
              border: '1px solid rgba(255,255,255,0.3)',
              padding: '0.5rem 1rem',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Logout
          </button>
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav style={{
        backgroundColor: '#f8f9fa',
        borderBottom: '1px solid #dee2e6',
        padding: '0 2rem'
      }}>
        <div style={{ display: 'flex', gap: '2rem' }}>
          <button
            onClick={() => setActiveTab('jobs')}
            style={{
              background: 'none',
              border: 'none',
              padding: '1rem 0',
              borderBottom: activeTab === 'jobs' ? '3px solid #007bff' : '3px solid transparent',
              color: activeTab === 'jobs' ? '#007bff' : '#6c757d',
              cursor: 'pointer',
              fontWeight: activeTab === 'jobs' ? 'bold' : 'normal'
            }}
          >
            Jobs Management
          </button>
          <button
            onClick={() => setActiveTab('categories')}
            style={{
              background: 'none',
              border: 'none',
              padding: '1rem 0',
              borderBottom: activeTab === 'categories' ? '3px solid #007bff' : '3px solid transparent',
              color: activeTab === 'categories' ? '#007bff' : '#6c757d',
              cursor: 'pointer',
              fontWeight: activeTab === 'categories' ? 'bold' : 'normal'
            }}
          >
            Categories Management
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <main style={{ flex: 1, padding: '2rem' }}>
        {error && (
          <div style={{
            backgroundColor: '#f8d7da',
            color: '#721c24',
            padding: '0.75rem 1.25rem',
            marginBottom: '1rem',
            border: '1px solid #f5c6cb',
            borderRadius: '0.25rem'
          }}>
            {error}
          </div>
        )}

        {/* Action Buttons */}
        {!isFormVisible && (
          <div style={{ marginBottom: '1.5rem' }}>
            {activeTab === 'jobs' && (
              <button
                onClick={handleCreateJob}
                style={{
                  backgroundColor: '#28a745',
                  color: 'white',
                  border: 'none',
                  padding: '0.75rem 1.5rem',
                  borderRadius: '0.25rem',
                  cursor: 'pointer',
                  fontSize: '1rem'
                }}
              >
                + Add New Job
              </button>
            )}
            {activeTab === 'categories' && (
              <button
                onClick={handleCreateCategory}
                style={{
                  backgroundColor: '#28a745',
                  color: 'white',
                  border: 'none',
                  padding: '0.75rem 1.5rem',
                  borderRadius: '0.25rem',
                  cursor: 'pointer',
                  fontSize: '1rem'
                }}
              >
                + Add New Category
              </button>
            )}
          </div>
        )}

        {/* Forms */}
        {showJobForm && (
          <JobForm
            job={editingJob}
            categories={categories}
            onSubmit={handleJobFormSubmit}
            onCancel={handleJobFormCancel}
            isSubmitting={isSubmittingJob}
          />
        )}

        {showCategoryForm && (
          <CategoryForm
            category={editingCategory}
            onSubmit={handleCategoryFormSubmit}
            onCancel={handleCategoryFormCancel}
            isSubmitting={isSubmittingCategory}
          />
        )}

        {/* Lists */}
        {!isFormVisible && activeTab === 'jobs' && (
          <JobList
            jobs={jobs}
            onEdit={handleEditJob}
            onDelete={handleDeleteJob}
            isLoading={isLoadingJobs}
          />
        )}

        {!isFormVisible && activeTab === 'categories' && (
          <CategoryList
            categories={categories}
            onEdit={handleEditCategory}
            onDelete={handleDeleteCategory}
            isLoading={isLoadingCategories}
          />
        )}
      </main>
    </div>
  );
}