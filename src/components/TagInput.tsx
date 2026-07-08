import { useState, type KeyboardEvent } from 'react';

interface TagInputProps {
  label: string;
  values: string[];
  onChange: (values: string[]) => void;
  placeholder?: string;
}

export function TagInput({ label, values, onChange, placeholder }: TagInputProps) {
  const [draft, setDraft] = useState('');

  function commitDraft() {
    const tag = draft.trim();
    if (tag && !values.some((v) => v.toLowerCase() === tag.toLowerCase())) {
      onChange([...values, tag]);
    }
    setDraft('');
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      commitDraft();
    } else if (e.key === 'Backspace' && draft === '' && values.length > 0) {
      onChange(values.slice(0, -1));
    }
  }

  function removeTag(tag: string) {
    onChange(values.filter((v) => v !== tag));
  }

  return (
    <div className="tag-input">
      <label>{label}</label>
      <div className="tag-input-box">
        {values.map((tag) => (
          <span className="tag-chip" key={tag}>
            {tag}
            <button type="button" onClick={() => removeTag(tag)} aria-label={`Remove ${tag}`}>
              ×
            </button>
          </span>
        ))}
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={commitDraft}
          placeholder={placeholder}
        />
      </div>
    </div>
  );
}
