// src/components/CategoryBadge.jsx
import { getCategoryColor } from '../utils/helpers';

export default function CategoryBadge({ category }) {
  const colors = getCategoryColor(category);
  return (
    <span
      className="category-badge"
      style={{ background: colors.bg, color: colors.text }}
    >
      {category || 'Uncategorized'}
    </span>
  );
}
