import React, { useState } from 'react';
import { List, arrayMove } from 'react-movable';

const DraggableFrame = () => {
  const [items, setItems] = useState([
    { id: 1, content: 'Frame 1' },
    { id: 2, content: 'Frame 2' },
    { id: 3, content: 'Frame 3' },
    // Add more frames as needed
  ]);

  const handleSort = ({ oldIndex, newIndex }) => {
    setItems(arrayMove(items, oldIndex, newIndex));
  };

  return (
    <List
      values={items}
      onChange={({ oldIndex, newIndex }) => handleSort({ oldIndex, newIndex })}
      renderList={({ children, props }) => <div {...props}>{children}</div>}
      renderItem={({ value, props, index }) => (
        <div {...props} style={{ border: '1px solid #ddd', padding: '8px', marginBottom: '8px', cursor: 'grab' }}>
          {value.content}
        </div>
      )}
    />
  );
};

export default DraggableFrame;
