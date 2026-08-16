import React, { useRef, useState, useEffect } from 'react';

interface OtpInputProps {
  length?: number;
  value: string;
  onChange: (otp: string) => void;
  disabled?: boolean;
  isAlphaNumeric?: boolean; // For MFA recovery codes
}

export const OtpInput: React.FC<OtpInputProps> = ({
  length = 6,
  value,
  onChange,
  disabled = false,
  isAlphaNumeric = false,
}) => {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [digits, setDigits] = useState<string[]>(Array(length).fill(''));

  useEffect(() => {
    const valArr = value.split('').slice(0, length);
    while (valArr.length < length) valArr.push('');
    setDigits(valArr);
  }, [value, length]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>, idx: number) => {
    const char = e.target.value.slice(-1);
    if (!char) return;

    if (!isAlphaNumeric && !/^\d$/.test(char)) return;

    const newDigits = [...digits];
    newDigits[idx] = char.toUpperCase();
    setDigits(newDigits);
    onChange(newDigits.join(''));

    if (idx < length - 1) {
      inputRefs.current[idx + 1]?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, idx: number) => {
    if (e.key === 'Backspace') {
      if (!digits[idx] && idx > 0) {
        inputRefs.current[idx - 1]?.focus();
      }
      const newDigits = [...digits];
      newDigits[idx] = '';
      setDigits(newDigits);
      onChange(newDigits.join(''));
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData('text').trim().replace(/[^a-zA-Z0-9]/g, '');
    const chars = pasteData.slice(0, length).split('');
    const newDigits = [...digits];
    chars.forEach((c, i) => {
      if (i < length) newDigits[i] = isAlphaNumeric ? c.toUpperCase() : c;
    });
    setDigits(newDigits);
    onChange(newDigits.join(''));
    const nextIdx = Math.min(chars.length, length - 1);
    inputRefs.current[nextIdx]?.focus();
  };

  return (
    <div className="flex justify-center gap-2" onPaste={handlePaste}>
      {digits.map((digit, idx) => (
        <input
          key={idx}
          ref={(el) => (inputRefs.current[idx] = el)}
          type="text"
          maxLength={1}
          value={digit}
          disabled={disabled}
          onChange={(e) => handleChange(e, idx)}
          onKeyDown={(e) => handleKeyDown(e, idx)}
          className="w-12 h-12 text-center text-xl font-bold border-2 rounded-lg border-gray-300 focus:border-blue-600 focus:outline-none disabled:bg-gray-100 disabled:text-gray-400 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
        />
      ))}
    </div>
  );
};