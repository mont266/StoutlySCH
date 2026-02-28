import React from 'react';

interface ToolbarProps {
  onAddItem: (type: 'text' | 'image') => void;
}

const Toolbar: React.FC<ToolbarProps> = ({ onAddItem }) => {
  return (
    <div className="absolute top-4 left-4 z-10 bg-white p-2 rounded-lg shadow-md flex space-x-2">
      <button onClick={() => onAddItem('text')} className="px-4 py-2 bg-blue-500 text-white rounded-md">Add Text</button>
      <button onClick={() => onAddItem('image')} className="px-4 py-2 bg-green-500 text-white rounded-md">Add Image</button>
    </div>
  );
};

export default Toolbar;
