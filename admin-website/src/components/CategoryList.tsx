import React from 'react';
import { JobCategory } from '../types';

interface CategoryListProps {
  categories: JobCategory[];
  onEdit: (category: JobCategory) => void;
  onDelete: (id: string) => void;
  isLoading: boolean;
}

const CategoryList: React.FC<CategoryListProps> = ({ categories, onEdit, onDelete, isLoading }) => {
  const handleDelete = (category: JobCategory) => {
    if (category.totalJobs > 0) {
      alert(`Cannot delete "${category.name}" because it has ${category.totalJobs} job(s). Please reassign or delete those jobs first.`);
      return;
    }

    if (window.confirm(`Are you sure you want to delete the category "${category.name}"?`)) {
      onDelete(category.id);
    }
  };

  if (isLoading) {
    return (
      <div className="category-list">
        <div className="loading">Loading categories...</div>
      </div>
    );
  }

  if (categories.length === 0) {
    return (
      <div className="category-list">
        <div className="empty-state">
          <h3>No categories found</h3>
          <p>Click "Add New Category" to create your first job category.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="category-list">
      <h2>Job Categories ({categories.length})</h2>

      <div className="categories-grid">
        {categories.map((category) => (
          <div key={category.id} className="category-card">
            <div
              className="category-header"
              style={{ borderLeft: `4px solid ${category.color}` }}
            >
              <div className="category-info">
                <span className="category-icon" style={{ fontSize: '24px' }}>
                  {category.icon}
                </span>
                <div className="category-details">
                  <h3 className="category-name">{category.name}</h3>
                  <p className="category-id">ID: {category.id}</p>
                </div>
              </div>

              <div className="category-stats">
                <div className="job-count">
                  <strong>{category.totalJobs}</strong>
                  <small>job{category.totalJobs !== 1 ? 's' : ''}</small>
                </div>
              </div>
            </div>

            <div className="category-body">
              <p className="category-description">{category.description}</p>

              <div className="category-meta">
                <span className="color-indicator">
                  Color:
                  <span
                    className="color-swatch"
                    style={{ backgroundColor: category.color }}
                  ></span>
                  <code>{category.color}</code>
                </span>
              </div>
            </div>

            <div className="category-actions">
              <button
                onClick={() => onEdit(category)}
                className="edit-btn"
                title="Edit category"
              >
                ✏️ Edit
              </button>
              <button
                onClick={() => handleDelete(category)}
                className={`delete-btn ${category.totalJobs > 0 ? 'disabled' : ''}`}
                disabled={category.totalJobs > 0}
                title={category.totalJobs > 0 ? 'Cannot delete category with jobs' : 'Delete category'}
              >
                🗑️ Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="categories-summary">
        <div className="summary-stats">
          <div className="stat">
            <strong>Total Categories:</strong> {categories.length}
          </div>
          <div className="stat">
            <strong>Total Jobs:</strong> {categories.reduce((sum, cat) => sum + cat.totalJobs, 0)}
          </div>
          <div className="stat">
            <strong>Empty Categories:</strong> {categories.filter(cat => cat.totalJobs === 0).length}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CategoryList;