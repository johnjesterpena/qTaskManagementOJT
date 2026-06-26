const URL_REGEX = /(https?:\/\/[^\s<>"']+)/g;

export default function LinkText({ text, className }) {
  if (!text) return null;

  const parts = text.split(URL_REGEX);

  return (
    <span className={className}>
      {parts.map((part, i) =>
            /^https?:\/\/[^\s<>"']+$/.test(part) ? (
                <a key={i} href={part} target="_blank" rel="noopener noreferrer"
                className="text-blue-500 underline hover:text-blue-700 break-all"
                onClick={(e) => e.stopPropagation()}>
                {part}
                </a>
            ) : (
                part
            ),
            )}
    </span>
  );
}