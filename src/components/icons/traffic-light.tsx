
export function TrafficLight(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <rect x="7" y="2" width="10" height="20" rx="5" />
      <circle cx="12" cy="7" r="2" fill="#ef4444" stroke="none" />
      <circle cx="12" cy="12" r="2" fill="#facc15" stroke="none" />
      <circle cx="12" cy="17" r="2" fill="#4ade80" stroke="none" />
    </svg>
  );
}
