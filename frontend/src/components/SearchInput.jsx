import "./search-input.css";

export default function SearchInput({
  value,
  onChange,
  placeholder = "Search",
  ariaLabel = "Search",
  className = "",
}) {
  const inputValue = value.inputValue ?? "";
  const tags = value.tags ?? [];

  function handleInputChange(event) {
    onChange({
      ...value,
      inputValue: event.target.value,
    });
  }

  function addTag(rawValue) {
    const nextTag = rawValue.trim();

    if (!nextTag) {
      return;
    }

    const alreadyExists = tags.some(
      (tag) => tag.toLowerCase() === nextTag.toLowerCase()
    );

    if (alreadyExists) {
      onChange({
        ...value,
        inputValue: "",
      });
      return;
    }

    onChange({
      tags: [...tags, nextTag],
      inputValue: "",
    });
  }

  function removeTag(tagToRemove) {
    onChange({
      ...value,
      tags: tags.filter((tag) => tag !== tagToRemove),
    });
  }

  function handleKeyDown(event) {
    if (event.key === "Enter" || event.key === ",") {
      event.preventDefault();
      addTag(inputValue);
      return;
    }

    if (event.key === "Backspace" && !inputValue && tags.length > 0) {
      event.preventDefault();
      const updatedTags = [...tags];
      updatedTags.pop();

      onChange({
        ...value,
        tags: updatedTags,
      });
    }
  }

  function handleClearAll() {
    onChange({
      tags: [],
      inputValue: "",
    });
  }

  const showClear = inputValue.length > 0 || tags.length > 0;

  return (
    <div className={`search-input-wrapper ${className}`.trim()}>
      <span className="search-input-icon" aria-hidden="true">
        ⌕
      </span>

      <div className="search-input-field">
        {tags.length > 0 && (
          <div className="search-input-tags">
            {tags.map((tag) => (
              <span key={tag} className="search-input-tag">
                <span className="search-input-tag-label">{tag}</span>
                <button
                  type="button"
                  className="search-input-tag-remove"
                  onClick={() => removeTag(tag)}
                  aria-label={`Remove ${tag}`}
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        )}

        <input
          type="text"
          className="search-input-control"
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          aria-label={ariaLabel}
        />
      </div>

      <button
        type="button"
        className={`search-input-clear ${
          showClear ? "search-input-clear-visible" : ""
        }`}
        onClick={handleClearAll}
        aria-label="Clear search"
        disabled={!showClear}
      >
        ×
      </button>
    </div>
  );
}