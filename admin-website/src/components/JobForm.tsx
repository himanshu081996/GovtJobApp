import React from 'react';
import { useForm } from 'react-hook-form';
import { Job, JobFormData } from '../types';
import { jobCategories } from '../utils/categories';

interface JobFormProps {
  job?: Job;
  onSubmit: (data: JobFormData) => Promise<void>;
  onCancel: () => void;
  isSubmitting: boolean;
}

const JobForm: React.FC<JobFormProps> = ({ job, onSubmit, onCancel, isSubmitting }) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<JobFormData>({
    defaultValues: job ? {
      ...job,
      tags: job.tags.join(', '),
      applicationStartDate: job.applicationStartDate.split('T')[0],
      applicationEndDate: job.applicationEndDate ? job.applicationEndDate.split('T')[0] : '',
      examDate: job.examDate ? job.examDate.split('T')[0] : '',
    } : {
      jobType: 'permanent',
      totalVacancies: 1,
    },
  });

  return (
    <div className="job-form">
      <h2>{job ? 'Edit Job' : 'Add New Job'}</h2>
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="form-group">
          <label htmlFor="title">Job Title *</label>
          <input
            type="text"
            id="title"
            {...register('title', { required: 'Job title is required' })}
          />
          {errors.title && <span className="error">{errors.title.message}</span>}
        </div>

        <div className="form-group">
          <label htmlFor="organization">Organization *</label>
          <input
            type="text"
            id="organization"
            {...register('organization', { required: 'Organization is required' })}
          />
          {errors.organization && <span className="error">{errors.organization.message}</span>}
        </div>

        <div className="form-group">
          <label htmlFor="category">Category *</label>
          <select
            id="category"
            {...register('category', { required: 'Category is required' })}
          >
            <option value="">Select Category</option>
            {jobCategories.map((cat) => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
          {errors.category && <span className="error">{errors.category.message}</span>}
        </div>

        <div className="form-group">
          <label htmlFor="description">Description *</label>
          <textarea
            id="description"
            rows={4}
            {...register('description', { required: 'Description is required' })}
          />
          {errors.description && <span className="error">{errors.description.message}</span>}
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="qualification">Qualification *</label>
            <input
              type="text"
              id="qualification"
              {...register('qualification', { required: 'Qualification is required' })}
            />
            {errors.qualification && <span className="error">{errors.qualification.message}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="ageLimit">Age Limit *</label>
            <input
              type="text"
              id="ageLimit"
              {...register('ageLimit', { required: 'Age limit is required' })}
            />
            {errors.ageLimit && <span className="error">{errors.ageLimit.message}</span>}
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="totalVacancies">Total Vacancies *</label>
            <input
              type="number"
              id="totalVacancies"
              min="1"
              {...register('totalVacancies', {
                required: 'Total vacancies is required',
                min: { value: 1, message: 'Must be at least 1' }
              })}
            />
            {errors.totalVacancies && <span className="error">{errors.totalVacancies.message}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="jobType">Job Type *</label>
            <select
              id="jobType"
              {...register('jobType', { required: 'Job type is required' })}
            >
              <option value="permanent">Permanent</option>
              <option value="temporary">Temporary</option>
              <option value="contractual">Contractual</option>
            </select>
            {errors.jobType && <span className="error">{errors.jobType.message}</span>}
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="applicationStartDate">Application Start Date *</label>
            <input
              type="date"
              id="applicationStartDate"
              {...register('applicationStartDate', { required: 'Start date is required' })}
            />
            {errors.applicationStartDate && <span className="error">{errors.applicationStartDate.message}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="applicationEndDate">Application End Date</label>
            <input
              type="date"
              id="applicationEndDate"
              {...register('applicationEndDate')}
            />
            <small>Leave empty if date will be announced soon</small>
            {errors.applicationEndDate && <span className="error">{errors.applicationEndDate.message}</span>}
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="examDate">Exam Date</label>
          <input
            type="date"
            id="examDate"
            {...register('examDate')}
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="applicationFee">Application Fee *</label>
            <input
              type="text"
              id="applicationFee"
              placeholder="e.g., ₹100, Free"
              {...register('applicationFee', { required: 'Application fee is required' })}
            />
            {errors.applicationFee && <span className="error">{errors.applicationFee.message}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="salary">Salary</label>
            <input
              type="text"
              id="salary"
              placeholder="e.g., ₹25,000 - ₹50,000"
              {...register('salary')}
            />
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="location">Location *</label>
          <input
            type="text"
            id="location"
            {...register('location', { required: 'Location is required' })}
          />
          {errors.location && <span className="error">{errors.location.message}</span>}
        </div>

        <div className="form-group">
          <label htmlFor="applyUrl">Apply URL *</label>
          <input
            type="url"
            id="applyUrl"
            {...register('applyUrl', { required: 'Apply URL is required' })}
          />
          {errors.applyUrl && <span className="error">{errors.applyUrl.message}</span>}
        </div>

        <div className="form-group">
          <label htmlFor="notificationImageUrl">Notification Image URL</label>
          <input
            type="url"
            id="notificationImageUrl"
            placeholder="https://example.com/job-image.jpg"
            {...register('notificationImageUrl')}
          />
          <small>Optional: Image URL to display in push notifications (recommended size: 512x256px)</small>
          {errors.notificationImageUrl && <span className="error">{errors.notificationImageUrl.message}</span>}
        </div>

        <div className="form-group">
          <label htmlFor="tags">Tags (comma separated)</label>
          <input
            type="text"
            id="tags"
            placeholder="e.g., urgent, high salary, remote"
            {...register('tags')}
          />
        </div>

        <div className="form-actions">
          <button type="button" onClick={onCancel} disabled={isSubmitting}>
            Cancel
          </button>
          <button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : (job ? 'Update Job' : 'Add Job')}
          </button>
        </div>
      </form>
    </div>
  );
};

export default JobForm;