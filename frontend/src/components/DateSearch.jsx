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
          background: 'var(--color-bg-card)',
          border: '1px solid var(--color-border-default)',
          borderRadius: 8,
          color: 'var(--color-fg-primary)',
          fontSize: 14,
          fontFamily: 'DM Sans, sans-serif',
          outline: 'none',
          colorScheme: 'dark',
        }}
      />
    </div>
  );
}