import React, { useState, useRef, useEffect } from "react";

const CopticKeyboard = ({
  isOpen,
  onClose,
  onInsert,
  targetInputRef,
  inline = false,
}) => {
  const [shiftPressed, setShiftPressed] = useState(false);
  const [currentInput, setCurrentInput] = useState(null);
  const keyboardRef = useRef(null);

  // Coptic characters layout
  const copticLayout = {
    normal: [
      ["ϣ", "ϥ", "ϧ", "ϩ", "ϫ", "ϭ", "ϯ", "ϱ", "ϳ", "ϴ"],
      ["ϸ", "Ϲ", "Ϻ", "ϻ", "ϼ", "Ͻ", "Ͼ", "Ͽ", "Ⲁ", "Ⲃ"],
      ["Ⲅ", "Ⲇ", "Ⲉ", "Ⲋ", "Ⲍ", "Ⲏ", "Ⲑ", "Ⲓ", "Ⲕ", "Ⲗ"],
      ["Ⲙ", "Ⲛ", "Ⲝ", "Ⲟ", "Ⲡ", "Ⲣ", "Ⲥ", "Ⲧ", "Ⲩ", "Ⲫ"],
      ["Ⲭ", "Ⲯ", "Ⲱ", "Ⲳ", "Ⲵ", "Ⲷ", "Ⲹ", "Ⲻ", "Ⲽ", "Ⲿ"],
      ["Ⳁ", "Ⳃ", "Ⳅ", "Ⳇ", "Ⳉ", "Ⳋ", "Ⳍ", "Ⳏ", "Ⳑ", "Ⳓ"],
      ["Ⳕ", "Ⳗ", "Ⳙ", "Ⳛ", "Ⳝ", "Ⳟ", "Ⳡ", "Ⳣ", "Ⳬ", "Ⳮ"],
      ["⳯", "⳱", "ⳳ", "⳵", "⳷", "⳹", "⳻", "⳽", "⳿", "ⴀ"],
      ["ⴂ", "ⴄ", "ⴆ", "ⴈ", "ⴊ", "ⴌ", "ⴎ", "ⴐ", "ⴑ", "ⴒ"],
      ["ⴔ", "ⴖ", "ⴘ", "ⴚ", "ⴜ", "ⴝ", "ⴠ", "ⴢ", "ⴤ", "⴦"],
    ],
    shifted: [
      ["Ϣ", "Ϥ", "Ϧ", "Ϩ", "Ϫ", "Ϭ", "Ϯ", "ϰ", "ϲ", "ϳ"],
      ["Ϸ", "ϸ", "Ϲ", "Ϻ", "ϻ", "ϼ", "Ͻ", "Ͼ", "Ͽ", "ⲁ"],
      ["ⲃ", "ⲅ", "ⲇ", "ⲉ", "ⲋ", "ⲍ", "ⲏ", "ⲑ", "ⲓ", "ⲕ"],
      ["ⲗ", "ⲙ", "ⲛ", "ⲝ", "ⲟ", "ⲡ", "ⲣ", "ⲥ", "ⲧ", "ⲩ"],
      ["ⲫ", "ⲭ", "ⲯ", "ⲱ", "ⲳ", "ⲵ", "ⲷ", "ⲹ", "ⲻ", "ⲽ"],
      ["ⲿ", "ⳁ", "ⳃ", "ⳅ", "ⳇ", "ⳉ", "ⳋ", "ⳍ", "ⳏ", "ⳑ"],
      ["ⳓ", "ⳕ", "ⳗ", "ⳙ", "ⳛ", "ⳝ", "ⳟ", "ⳡ", "ⳬ", "ⳮ"],
      ["⳰", "Ⳳ", "⳴", "⳶", "⳸", "⳺", "⳼", "⳾", "⳿", "ⴀ"],
      ["ⴁ", "ⴃ", "ⴅ", "ⴇ", "ⴋ", "ⴍ", "ⴏ", "ⴑ", "ⴓ", "ⴕ"],
      ["ⴗ", "ⴙ", "ⴛ", "ⴝ", "ⴟ", "ⴡ", "ⴣ", "ⴥ", "ⴧ", "⴩"],
    ],
  };

  // Common Coptic words/phrases for quick insertion
  const commonPhrases = [
    "ⲁⲙⲏⲛ",
    "ⲡⲁⲧⲏⲣ",
    "ⲭⲣⲓⲥⲧⲟⲥ",
    "ⲡⲛⲉⲩⲙⲁ",
    "ⲙⲁⲣⲓⲁ",
    "ⲓⲏⲥⲟⲩⲥ",
    "ⲁⲗⲗⲏⲗⲟⲩⲓⲁ",
  ];

  useEffect(() => {
    if (isOpen && targetInputRef?.current) {
      setCurrentInput(targetInputRef.current);
    }
  }, [isOpen, targetInputRef]);

  const insertCharacter = (char) => {
    if (currentInput) {
      const start = currentInput.selectionStart ?? currentInput.value.length;
      const end = currentInput.selectionEnd ?? currentInput.value.length;
      const value = currentInput.value ?? "";
      const newValue = value.substring(0, start) + char + value.substring(end);
      currentInput.value = newValue;
      currentInput.setSelectionRange(start + char.length, start + char.length);
      const event = new Event("input", { bubbles: true });
      currentInput.dispatchEvent(event);
      onInsert && onInsert(char);
    }
  };

  const insertPhrase = (phrase) => {
    if (currentInput) {
      const start = currentInput.selectionStart ?? currentInput.value.length;
      const end = currentInput.selectionEnd ?? currentInput.value.length;
      const value = currentInput.value ?? "";
      const newValue =
        value.substring(0, start) + phrase + " " + value.substring(end);
      currentInput.value = newValue;
      currentInput.setSelectionRange(
        start + phrase.length + 1,
        start + phrase.length + 1
      );
      const event = new Event("input", { bubbles: true });
      currentInput.dispatchEvent(event);
      onInsert && onInsert(phrase);
    }
  };

  const handleKeyClick = (char) => insertCharacter(char);
  const handlePhraseClick = (phrase) => insertPhrase(phrase);
  const toggleShift = () => setShiftPressed(!shiftPressed);
  const handleBackspace = () => insertCharacter("");
  const handleSpace = () => insertCharacter(" ");

  if (!isOpen) return null;

  const currentLayout = shiftPressed
    ? copticLayout.shifted
    : copticLayout.normal;

  if (inline) {
    return (
      <div className="bg-white rounded-lg shadow p-3 mt-2">
        {/* Common Phrases */}
        <div className="mb-3">
          <h4 className="text-sm font-medium text-gray-700 mb-2">
            عبارات شائعة:
          </h4>
          <div className="flex flex-wrap gap-2">
            {commonPhrases.map((phrase, index) => (
              <button
                key={index}
                onClick={() => handlePhraseClick(phrase)}
                className="px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded text-sm"
              >
                {phrase}
              </button>
            ))}
          </div>
        </div>

        {/* Keyboard */}
        <div className="space-y-2">
          {currentLayout.map((row, rowIndex) => (
            <div key={rowIndex} className="flex flex-wrap gap-1">
              {row.map((char, charIndex) => (
                <button
                  key={charIndex}
                  onClick={() => handleKeyClick(char)}
                  className="w-10 h-10 bg-gray-100 hover:bg-gray-200 rounded text-lg font-medium"
                >
                  {char}
                </button>
              ))}
            </div>
          ))}
        </div>

        {/* Controls */}
        <div className="flex justify-between items-center gap-2 mt-3">
          <div className="flex items-center gap-2">
            <button
              onClick={toggleShift}
              className={`px-3 py-1 rounded text-sm ${
                shiftPressed
                  ? "bg-primary text-white"
                  : "bg-gray-200 hover:bg-gray-300"
              }`}
            >
              Shift
            </button>
            <button
              onClick={handleSpace}
              className="px-4 py-1 bg-gray-200 hover:bg-gray-300 rounded text-sm"
            >
              Space
            </button>
          </div>
          <button
            onClick={onClose}
            className="px-3 py-1 text-sm text-gray-600 hover:text-gray-900"
          >
            إغلاق
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div
        ref={keyboardRef}
        className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[80vh] overflow-hidden"
      >
        {/* Header */}
        <div className="bg-primary text-white p-4 flex justify-between items-center">
          <h3 className="text-lg font-semibold">لوحة المفاتيح القبطية</h3>
          <button
            onClick={onClose}
            className="text-white hover:text-gray-200 text-xl"
          >
            ×
          </button>
        </div>

        {/* Common Phrases */}
        <div className="p-4 border-b">
          <h4 className="text-sm font-medium text-gray-700 mb-2">
            عبارات شائعة:
          </h4>
          <div className="flex flex-wrap gap-2">
            {commonPhrases.map((phrase, index) => (
              <button
                key={index}
                onClick={() => handlePhraseClick(phrase)}
                className="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded text-sm"
              >
                {phrase}
              </button>
            ))}
          </div>
        </div>

        {/* Keyboard */}
        <div className="p-4 overflow-y-auto max-h-96">
          <div className="space-y-2">
            {currentLayout.map((row, rowIndex) => (
              <div key={rowIndex} className="flex justify-center gap-1">
                {row.map((char, charIndex) => (
                  <button
                    key={charIndex}
                    onClick={() => handleKeyClick(char)}
                    className="w-10 h-10 bg-gray-100 hover:bg-gray-200 rounded text-lg font-medium"
                  >
                    {char}
                  </button>
                ))}
              </div>
            ))}
          </div>

          {/* Control Keys */}
          <div className="flex justify-center gap-2 mt-4">
            <button
              onClick={toggleShift}
              className={`px-4 py-2 rounded font-medium ${
                shiftPressed
                  ? "bg-primary text-white"
                  : "bg-gray-200 hover:bg-gray-300"
              }`}
            >
              Shift
            </button>
            <button
              onClick={handleSpace}
              className="px-8 py-2 bg-gray-200 hover:bg-gray-300 rounded font-medium"
            >
              Space
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-900 rounded font-medium"
            >
              إغلاق
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 p-4 text-center text-sm text-gray-600">
          انقر على الأحرف لإدراجها في النص
        </div>
      </div>
    </div>
  );
};

export default CopticKeyboard;
