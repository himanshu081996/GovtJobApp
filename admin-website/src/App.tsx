import React, { useState, useEffect } from 'react';
import JobList from './components/JobList';
import JobForm from './components/JobForm';
import CategoryList from './components/CategoryList';
import CategoryForm from './components/CategoryForm';
import { Job, JobFormData, JobCategory, CategoryFormData } from './types';
import { JobService } from './services/jobService';
import { CategoryService } from './services/categoryService';
import './App.css';

function App() {
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

  // Job handlers
  const handleAddJob = async (data: JobFormData) => {
    try {
      setIsSubmittingJob(true);
      console.log('Attempting to add job:', data);
      const jobId = await JobService.addJob(data);
      console.log('Job added successfully with ID:', jobId);
      await loadJobs();
      await loadCategories(); // Refresh categories to update job counts
      setShowJobForm(false);
      alert('Job added successfully!');
    } catch (error) {
      console.error('Detailed error adding job:', error);
      alert(`Failed to add job: ${error.message || error}`);
    } finally {
      setIsSubmittingJob(false);
    }
  };

  const handleUpdateJob = async (data: JobFormData) => {
    if (!editingJob) return;

    try {
      setIsSubmittingJob(true);
      await JobService.updateJob(editingJob.id, data);
      await loadJobs();
      await loadCategories(); // Refresh categories to update job counts
      setEditingJob(null);
    } catch (error) {
      alert('Failed to update job. Please try again.');
      console.error('Error updating job:', error);
    } finally {
      setIsSubmittingJob(false);
    }
  };

  // Category handlers
  const handleAddCategory = async (data: CategoryFormData) => {
    try {
      setIsSubmittingCategory(true);

      // Validate data
      const errors = CategoryService.validateCategoryData(data);
      if (errors.length > 0) {
        alert(`Validation errors:\n${errors.join('\n')}`);
        return;
      }

      console.log('Attempting to add category:', data);
      const categoryId = await CategoryService.addCategory(data);
      console.log('Category added successfully with ID:', categoryId);
      await loadCategories();
      setShowCategoryForm(false);
      alert('Category added successfully!');
    } catch (error) {
      console.error('Detailed error adding category:', error);
      alert(`Failed to add category: ${error.message || error}`);
    } finally {
      setIsSubmittingCategory(false);
    }
  };

  const handleUpdateCategory = async (data: CategoryFormData) => {
    if (!editingCategory) return;

    try {
      setIsSubmittingCategory(true);

      // Validate data (except ID which can't be changed)
      const errors = CategoryService.validateCategoryData(data);
      if (errors.length > 0) {
        alert(`Validation errors:\n${errors.join('\n')}`);
        return;
      }

      await CategoryService.updateCategory(editingCategory.id, data);
      await loadCategories();
      setEditingCategory(null);
      alert('Category updated successfully!');
    } catch (error) {
      alert('Failed to update category. Please try again.');
      console.error('Error updating category:', error);
    } finally {
      setIsSubmittingCategory(false);
    }
  };

  const handleDeleteJob = async (id: string) => {
    try {
      await JobService.deleteJob(id);
      await loadJobs();
      await loadCategories(); // Refresh categories to update job counts
    } catch (error) {
      alert('Failed to delete job. Please try again.');
      console.error('Error deleting job:', error);
    }
  };

  const handleDeleteCategory = async (id: string) => {
    try {
      await CategoryService.deleteCategory(id);
      await loadCategories();
      alert('Category deleted successfully!');
    } catch (error) {
      alert(`Failed to delete category: ${error.message || error}`);
      console.error('Error deleting category:', error);
    }
  };

  const handleEditJob = (job: Job) => {
    setEditingJob(job);
  };

  const handleEditCategory = (category: JobCategory) => {
    setEditingCategory(category);
  };

  const handleCancelJobForm = () => {
    setShowJobForm(false);
    setEditingJob(null);
  };

  const handleCancelCategoryForm = () => {
    setShowCategoryForm(false);
    setEditingCategory(null);
  };

  if (error) {
    return (
      <div className="app">
        <header className="app-header">
          <h1>Govt Job App - Admin Panel</h1>
        </header>
        <main className="app-main">
          <div className="error-state">
            <h2>Configuration Error</h2>
            <p>{error}</p>
            <div className="firebase-setup">
              <h3>Firebase Setup Instructions:</h3>
              <ol>
                <li>Go to <a href="https://console.firebase.google.com" target="_blank" rel="noopener noreferrer">Firebase Console</a></li>
                <li>Create a new project or select an existing one</li>
                <li>Go to Project Settings → General → Your apps</li>
                <li>Add a web app and copy the configuration</li>
                <li>Replace the configuration in <code>src/services/firebase.ts</code></li>
                <li>Enable Firestore Database in the Firebase Console</li>
              </ol>
            </div>
            <button onClick={() => { loadJobs(); loadCategories(); }} className="retry-btn">
              Retry Connection
            </button>
          </div>
        </main>
      </div>
    );
  }

  const isFormVisible = showJobForm || editingJob || showCategoryForm || editingCategory;

  return (
    <div className="app">
      <header className="app-header">
        <h1>Govt Job App - Admin Panel</h1>

        <nav className="tab-navigation">
          <button
            className={`tab ${activeTab === 'jobs' ? 'active' : ''}`}
            onClick={() => setActiveTab('jobs')}
          >
            Jobs ({jobs.length})
          </button>
          <button
            className={`tab ${activeTab === 'categories' ? 'active' : ''}`}
            onClick={() => setActiveTab('categories')}
          >
            Categories ({categories.length})
          </button>
        </nav>

        {!isFormVisible && (
          <div className="header-actions">
            {activeTab === 'jobs' && (
              <button onClick={() => setShowJobForm(true)} className="add-btn">
                Add New Job
              </button>
            )}
            {activeTab === 'categories' && (
              <button onClick={() => setShowCategoryForm(true)} className="add-btn">
                Add New Category
              </button>
            )}
          </div>
        )}
      </header>

      <main className="app-main">
        {/* Job Forms */}
        {showJobForm && (
          <JobForm
            onSubmit={handleAddJob}
            onCancel={handleCancelJobForm}
            isSubmitting={isSubmittingJob}
          />
        )}

        {editingJob && (
          <JobForm
            job={editingJob}
            onSubmit={handleUpdateJob}
            onCancel={handleCancelJobForm}
            isSubmitting={isSubmittingJob}
          />
        )}

        {/* Category Forms */}
        {showCategoryForm && (
          <CategoryForm
            onSubmit={handleAddCategory}
            onCancel={handleCancelCategoryForm}
            isSubmitting={isSubmittingCategory}
          />
        )}

        {editingCategory && (
          <CategoryForm
            category={editingCategory}
            onSubmit={handleUpdateCategory}
            onCancel={handleCancelCategoryForm}
            isSubmitting={isSubmittingCategory}
          />
        )}

        {/* Content Lists */}
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

export default App;