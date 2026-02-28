import React from 'react';
import { BoardItem as BoardItemType } from '../types';
import BoardItem from './BoardItem';

interface MoodBoardProps {
  items: BoardItemType[];
  onUpdateItem: (id: string, updates: Partial<BoardItemType>) => void;
  onBringToFront: (id: string) => void;
  onSendToBack: (id: string) => void;
  onDeleteItem: (id: string) => void;
}

const MoodBoard: React.FC<MoodBoardProps> = ({ items, onUpdateItem, onBringToFront, onSendToBack, onDeleteItem }) => {
  return (
    <div className="relative w-full h-full bg-gray-100 overflow-hidden">
      {items.sort((a, b) => a.zIndex - b.zIndex).map(item => (
        <BoardItem 
          key={item.id} 
          item={item} 
          onUpdate={onUpdateItem} 
          onBringToFront={onBringToFront} 
          onSendToBack={onSendToBack}
          onDelete={onDeleteItem}
        />
      ))}
    </div>
  );
};

export default MoodBoard;
