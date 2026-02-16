import React, { useState, useRef, useEffect } from 'react';
import EmojiPicker from 'emoji-picker-react';
import { HiOutlineEmojiHappy } from 'react-icons/hi';

export default function EmojiPickerComponent({ onEmojiSelect, buttonClassName = '' }) {
  const [showPicker, setShowPicker] = useState(false);
  const pickerRef = useRef(null);
  const buttonRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        pickerRef.current &&
        !pickerRef.current.contains(event.target) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target)
      ) {
        setShowPicker(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleEmojiClick = (emojiData) => {
    onEmojiSelect(emojiData.emoji);
    setShowPicker(false);
  };

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setShowPicker((v) => !v)}
        className={buttonClassName || 'p-2.5 rounded-full hover:bg-gray-100 text-gray-500 transition-colors'}
        title="Emoji"
      >
        <HiOutlineEmojiHappy className="w-5 h-5" />
      </button>

      {showPicker && (
        <div
          ref={pickerRef}
          className="absolute bottom-full left-0 mb-2 z-50 shadow-xl rounded-2xl overflow-hidden"
        >
          <EmojiPicker
            onEmojiClick={handleEmojiClick}
            autoFocusSearch={false}
            lazyLoadEmojis
            searchPlaceholder="Search emoji..."
            width={320}
            height={380}
          />
        </div>
      )}
    </div>
  );
}
