import React from 'react';
import { Job } from '../types';
import { jobCategories } from '../utils/categories';

interface JobListProps {
  jobs: Job[];
  onEdit: (job: Job) => void;
  onDelete: (id: string) => void;
  isLoading: boolean;
}

const JobList: React.FC<JobListProps> = ({ jobs, onEdit, onDelete, isLoading }) => {
  const getCategoryName = (categoryId: string) => {
    const category = jobCategories.find(cat => cat.id === categoryId);
    return category ? category.name : categoryId;
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "Announced Soon";
    return new Date(dateString).toLocaleDateString('en-IN');
  };

  if (isLoading) {
    return <div className="loading">Loading jobs...</div>;
  }

  if (jobs.length === 0) {
    return (
      <div className="empty-state">
        <h3>No jobs found</h3>
        <p>Click "Add New Job" to create your first job listing.</p>
      </div>
    );
  }

  return (
    <div className="job-list">
      <h2>Job Listings ({jobs.length})</h2>
      <div className="jobs-grid">
        {jobs.map((job) => (
          <div key={job.id} className="job-card">
            <div className="job-header">
              <h3>{job.title}</h3>
              <div className="job-actions">
                <button onClick={() => onEdit(job)} className="edit-btn">
                  Edit
                </button>
                <button
                  onClick={() => {
                    if (window.confirm('Are you sure you want to delete this job?')) {
                      onDelete(job.id);
                    }
                  }}
                  className="delete-btn"
                >
                  Delete
                </button>
              </div>
            </div>

            <div className="job-details">
              <p><strong>Organization:</strong> {job.organization}</p>
              <p><strong>Category:</strong> {getCategoryName(job.category)}</p>
              <p><strong>Location:</strong> {job.location}</p>
              <p><strong>Vacancies:</strong> {job.totalVacancies}</p>
              <p><strong>Job Type:</strong> {job.jobType}</p>
              <p><strong>Application Fee:</strong> {job.applicationFee}</p>
              {job.salary && <p><strong>Salary:</strong> {job.salary}</p>}
            </div>

            <div className="job-dates">
              <p><strong>Apply From:</strong> {formatDate(job.applicationStartDate)}</p>
              <p><strong>Apply Till:</strong> {formatDate(job.applicationEndDate)}</p>
              {job.examDate && <p><strong>Exam Date:</strong> {formatDate(job.examDate)}</p>}
            </div>

            <div className="job-description">
              <p><strong>Description:</strong></p>
              <p>{job.description.length > 150 ? job.description.substring(0, 150) + '...' : job.description}</p>
            </div>

            {job.tags.length > 0 && (
              <div className="job-tags">
                {job.tags.map((tag, index) => (
                  <span key={index} className="tag">{tag}</span>
                ))}
              </div>
            )}

            <div className="job-footer">
              <span className={`status ${job.isNew ? 'new' : 'old'}`}>
                {job.isNew ? 'New' : 'Active'}
              </span>
              <span className="created-date">
                Created: {formatDate(job.createdAt)}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default JobList;