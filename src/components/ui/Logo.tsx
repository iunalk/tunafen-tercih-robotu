export function Logo({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="tunafen-logo-grad" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#818cf8" />
          <stop offset="1" stopColor="#4f46e5" />
        </linearGradient>
      </defs>
      <rect width="40" height="40" rx="11" fill="url(#tunafen-logo-grad)" />
      <path
        d="M11 15.5L20 11l9 4.5-9 4.5-9-4.5Z"
        fill="white"
        fillOpacity="0.95"
      />
      <path
        d="M14 18.2v5.3c0 1.9 2.7 3.5 6 3.5s6-1.6 6-3.5v-5.3"
        stroke="white"
        strokeOpacity="0.95"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <path d="M27.2 17v6" stroke="white" strokeOpacity="0.95" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}
