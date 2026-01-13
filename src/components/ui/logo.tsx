import { cn } from "@/lib/utils";

interface LogoIconProps {
  className?: string;
  size?: number;
  showCheckmark?: boolean;
}

// Shield + House icon (Option 1)
export function LogoIcon({ className, size = 32, showCheckmark = true }: LogoIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 60 60"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Shield */}
      <path
        d="M30 4L6 14V28C6 42.36 16.08 55.64 30 59C43.92 55.64 54 42.36 54 28V14L30 4Z"
        fill="currentColor"
        className="text-primary"
      />
      {/* House inside shield */}
      <path
        d="M30 18L18 27V42H25V33H35V42H42V27L30 18Z"
        fill="white"
      />
      {/* Checkmark badge */}
      {showCheckmark && (
        <>
          <circle cx="44" cy="16" r="10" fill="#F59E0B" />
          <path
            d="M40 16L43 19L49 13"
            stroke="white"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </>
      )}
    </svg>
  );
}

interface LogoProps {
  className?: string;
  iconSize?: number;
  showCheckmark?: boolean;
  showText?: boolean;
  textClassName?: string;
}

// Full logo with icon and text
export function Logo({
  className,
  iconSize = 32,
  showCheckmark = true,
  showText = true,
  textClassName,
}: LogoProps) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <LogoIcon size={iconSize} showCheckmark={showCheckmark} />
      {showText && (
        <span className={cn("font-semibold text-foreground", textClassName)}>
          LandlordComply
        </span>
      )}
    </div>
  );
}
