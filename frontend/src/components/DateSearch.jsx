import React, { useState, useEffect } from "react";

export default function DateSearch({ selectedDate, onSearch }) {
  const [localDate, setLocalDate] = useState(selectedDate);

useEffect(() => {
  const timeout = setTimeout(() => { onSearch(localDate); }, 500);
  return () => clearTimeout(timeout);
}, [localDate, onSearch]);
  return (
    <div style={{ marginBottom: 16 }}>
      <input
        type="date"
        value={localDate}
        onChange={(e) => setLocalDate(e.target.value)}
        style={{
          padding: '8px 12px',
          background: '#16161a',
          border: '1px solid #2a2a30',
          borderRadius: 8,
          color: '#f0ede8',
          fontSize: 14,
          fontFamily: 'DM Sans, sans-serif',
          outline: 'none',
          colorScheme: 'dark',
        }}
      />
    </div>
  );
}