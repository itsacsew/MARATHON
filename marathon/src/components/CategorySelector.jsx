import React from 'react';

const CategorySelector = ({ selectedCategory, onCategoryChange, categories }) => {
  return (
    <div className="category-selector">
      <h2>SELECT CATEGORY</h2>
      <div className="category-buttons">
        {categories.map((category) => (
          <button
            key={category.id}
            className={`category-btn ${selectedCategory === category.id ? 'active' : ''}`}
            onClick={() => onCategoryChange(category.id)}
          >
            {category.name}
          </button>
        ))}
      </div>
    </div>
  );
};

export default CategorySelector;