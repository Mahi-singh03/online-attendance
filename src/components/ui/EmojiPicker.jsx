// components/EmojiPicker.jsx
import EmojiPicker from 'emoji-picker-react';

export const EmojiPickerComponent = ({ onEmojiClick }) => {
  return (
    <div className="shadow-2xl rounded-lg">
      <EmojiPicker 
        onEmojiClick={onEmojiClick}
        height={400}
        width={300}
        searchDisabled
        skinTonesDisabled
      />
    </div>
  );
};