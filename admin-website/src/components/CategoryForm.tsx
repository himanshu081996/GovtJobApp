import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { JobCategory, CategoryFormData } from '../types';

interface CategoryFormProps {
  category?: JobCategory;
  onSubmit: (data: CategoryFormData) => Promise<void>;
  onCancel: () => void;
  isSubmitting: boolean;
}

const CategoryForm: React.FC<CategoryFormProps> = ({ category, onSubmit, onCancel, isSubmitting }) => {
  const [previewColor, setPreviewColor] = useState(category?.color || '#2196F3');

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue
  } = useForm<CategoryFormData>({
    defaultValues: category ? {
      id: category.id,
      name: category.name,
      icon: category.icon,
      description: category.description,
      color: category.color,
    } : {
      id: '',
      name: '',
      icon: '',
      description: '',
      color: '#2196F3',
    },
  });

  const watchedColor = watch('color');

  React.useEffect(() => {
    setPreviewColor(watchedColor || '#2196F3');
  }, [watchedColor]);

  const handleColorChange = (color: string) => {
    setValue('color', color);
    setPreviewColor(color);
  };

  const predefinedColors = [
    '#2196F3', // Blue
    '#4CAF50', // Green
    '#FF9800', // Orange
    '#9C27B0', // Purple
    '#F44336', // Red
    '#607D8B', // Blue Grey
    '#795548', // Brown
    '#009688', // Teal
    '#E91E63', // Pink
    '#3F51B5', // Indigo
    '#FFEB3B', // Yellow
    '#00BCD4', // Cyan
  ];

  const commonIcons = [
    '🏛️', '🚔', '🚄', '🏦', '🎓', '⚖️', '🏥', '🔬',
    '✈️', '🚢', '📊', '💼', '🔧', '🌾', '📱', '🎯'
  ];

  return (
    <div className="category-form">
      <h2>{category ? 'Edit Category' : 'Add New Category'}</h2>
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="form-group">
          <label htmlFor="id">Category ID *</label>
          <input
            type="text"
            id="id"
            placeholder="e.g., healthcare, education"
            disabled={!!category} // Disable ID editing for existing categories
            {...register('id', {
              required: 'Category ID is required',
              pattern: {
                value: /^[a-z0-9_-]+$/,
                message: 'ID must contain only lowercase letters, numbers, underscores, and dashes'
              }
            })}
          />
          {errors.id && <span className="error">{errors.id.message}</span>}
          <small>Used internally. Cannot be changed after creation. Use lowercase letters, numbers, underscores, and dashes only.</small>
        </div>

        <div className="form-group">
          <label htmlFor="name">Category Name *</label>
          <input
            type="text"
            id="name"
            placeholder="e.g., Healthcare, Education"
            {...register('name', { required: 'Category name is required' })}
          />
          {errors.name && <span className="error">{errors.name.message}</span>}
        </div>

        <div className="form-group">
          <label htmlFor="icon">Icon *</label>
          <input
            type="text"
            id="icon"
            placeholder="🏥"
            {...register('icon', { required: 'Icon is required' })}
          />
          {errors.icon && <span className="error">{errors.icon.message}</span>}

          <div className="icon-suggestions">
            <small>Common icons:</small>
            <div className="icon-grid">
              {commonIcons.map(icon => (
                <button
                  key={icon}
                  type="button"
                  className="icon-btn"
                  onClick={() => setValue('icon', icon)}
                >
                  {icon}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="description">Description *</label>
          <textarea
            id="description"
            rows={3}
            placeholder="Brief description of this job category"
            {...register('description', { required: 'Description is required' })}
          />
          {errors.description && <span className="error">{errors.description.message}</span>}
        </div>

        <div className="form-group">
          <label htmlFor="color">Category Color *</label>
          <div className="color-input-wrapper">
            <input
              type="color"
              id="color"
              {...register('color', { required: 'Color is required' })}
              onChange={(e) => handleColorChange(e.target.value)}
            />
            <div
              className="color-preview"
              style={{ backgroundColor: previewColor }}
            />
            <input
              type="text"
              placeholder="#2196F3"
              value={previewColor}
              onChange={(e) => handleColorChange(e.target.value)}
              className="color-hex-input"
            />
          </div>
          {errors.color && <span className="error">{errors.color.message}</span>}

          <div className="color-suggestions">
            <small>Predefined colors:</small>
            <div className="color-grid">
              {predefinedColors.map(color => (
                <button
                  key={color}
                  type="button"
                  className="color-btn"
                  style={{ backgroundColor: color }}
                  onClick={() => handleColorChange(color)}
                  title={color}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="category-preview">
          <h4>Preview:</h4>
          <div className="category-card" style={{ borderLeft: `4px solid ${previewColor}` }}>
            <div className="category-header">
              <span className="category-icon">{watch('icon') || '📋'}</span>
              <span className="category-name">{watch('name') || 'Category Name'}</span>
            </div>
            <p className="category-description">
              {watch('description') || 'Category description will appear here'}
            </p>
          </div>
        </div>

        <div className="form-actions">
          <button type="button" onClick={onCancel} disabled={isSubmitting}>
            Cancel
          </button>
          <button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : (category ? 'Update Category' : 'Add Category')}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CategoryForm;