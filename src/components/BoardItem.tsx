import React from 'react';
import { Rnd } from 'react-rnd';
import { BoardItem as BoardItemType } from '../types';

interface BoardItemProps {
  item: BoardItemType;
  onUpdate: (id: string, updates: Partial<BoardItemType>) => void;
  onBringToFront: (id: string) => void;
  onSendToBack: (id: string) => void;
  onDelete: (id: string) => void;
}

const BoardItem: React.FC<BoardItemProps> = ({ item, onUpdate, onBringToFront, onSendToBack, onDelete }) => {
  return (
    <Rnd
      size={{ width: item.width, height: item.height }}
      position={{ x: item.x, y: item.y }}
      onDragStop={(e, d) => onUpdate(item.id, { x: d.x, y: d.y })}
      onResizeStop={(e, direction, ref, delta, position) => {
        onUpdate(item.id, {
          width: parseInt(ref.style.width, 10),
          height: parseInt(ref.style.height, 10),
          ...position,
        });
      }}
      onDragStart={() => onBringToFront(item.id)}
      className="shadow-lg"
    >
      <div className="w-full h-full relative">
        {item.type === 'text' ? (
          <textarea
            className="w-full h-full bg-yellow-200 p-2 resize-none border-2 border-transparent focus:border-blue-500 outline-none"
            value={item.content}
            onChange={(e) => onUpdate(item.id, { content: e.target.value })}
            onMouseDown={(e) => e.stopPropagation()} // Prevent drag from starting on text area click
          />
        ) : (
          <img src={item.content} alt="mood board item" className="w-full h-full object-cover" />
        )}
        <div className="absolute -top-8 left-0 flex space-x-1 opacity-0 hover:opacity-100 transition-opacity">
          <button onClick={() => onBringToFront(item.id)} className="bg-white px-2 py-1 rounded-md shadow-sm">Bring to Front</button>
          <button onClick={() => onSendToBack(item.id)} className="bg-white px-2 py-1 rounded-md shadow-sm">Send to Back</button>
          <button onClick={() => onDelete(item.id)} className="bg-red-500 text-white px-2 py-1 rounded-md shadow-sm">Delete</button>
        </div>
      </div>
    </Rnd>
  );
};

export default BoardItem;
