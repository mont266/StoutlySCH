import React, { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import MoodBoard from './components/MoodBoard';
import Toolbar from './components/Toolbar';
import { BoardItem } from './types';

const App: React.FC = () => {
  const [items, setItems] = useState<BoardItem[]>([]);

  useEffect(() => {
    const savedItems = localStorage.getItem('mood-board-items');
    if (savedItems) {
      setItems(JSON.parse(savedItems));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('mood-board-items', JSON.stringify(items));
  }, [items]);

  const handleAddItem = (type: 'text' | 'image') => {
    const newItem: BoardItem = {
      id: uuidv4(),
      type,
      x: 50,
      y: 50,
      width: 200,
      height: type === 'text' ? 100 : 200,
      content: type === 'text' ? 'New Note' : 'https://picsum.photos/200',
      zIndex: items.length,
    };
    setItems([...items, newItem]);
  };

  const handleUpdateItem = (id: string, updates: Partial<BoardItem>) => {
    setItems(items.map(item => (item.id === id ? { ...item, ...updates } : item)));
  };

  const handleBringToFront = (id: string) => {
    setItems(items.map(item => 
      item.id === id 
        ? { ...item, zIndex: items.length } 
        : { ...item, zIndex: item.zIndex > items.find(i => i.id === id)!.zIndex ? item.zIndex - 1 : item.zIndex }
    ));
  };

  const handleSendToBack = (id: string) => {
    setItems(items.map(item =>
      item.id === id
        ? { ...item, zIndex: 0 }
        : { ...item, zIndex: item.zIndex < items.find(i => i.id === id)!.zIndex ? item.zIndex + 1 : item.zIndex }
    ));
  };

  const handleDeleteItem = (id: string) => {
    setItems(items.filter(item => item.id !== id));
  };

  return (
    <div className="w-screen h-screen font-sans">
      <Toolbar onAddItem={handleAddItem} />
      <MoodBoard 
        items={items} 
        onUpdateItem={handleUpdateItem} 
        onBringToFront={handleBringToFront}
        onSendToBack={handleSendToBack}
        onDeleteItem={handleDeleteItem}
      />
    </div>
  );
};

export default App;
