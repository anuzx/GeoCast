import { useState, type ReactNode, type ButtonHTMLAttributes, type AnchorHTMLAttributes } from "react";
import { Link } from "@tanstack/react-router";

interface ArrowFillButtonBaseProps {
  children: ReactNode;
  /** Fill color on hover — defaults to var(--foreground) */
  fillColor?: string;
  /** Text color after fill — defaults to var(--background) */
  textOnFill?: string;
  variant?: "outline" | "ghost" | "solid";
  size?: "sm" | "md" | "lg";
  className?: string;
}

type ArrowFillButtonProps =
  | (ArrowFillButtonBaseProps & ButtonHTMLAttributes<HTMLButtonElement> & { href?: never })
  | (ArrowFillButtonBaseProps & AnchorHTMLAttributes<HTMLAnchorElement> & { href: string });

const sizes = {
  sm: "px-3 py-1.5 text-xs gap-2",
  md: "px-4 py-2 text-sm gap-2.5",
  lg: "px-5 py-2.5 text-base gap-3",
};

const variants = {
  outline: "border border-border bg-transparent text-foreground hover:border-foreground",
  ghost: "border border-transparent bg-transparent text-foreground",
  solid: "border border-foreground bg-foreground text-background",
};

/**
 * ObsidianUI — Arrow Fill Button with TanStack SPA Link support.
 */
export function ArrowFillButton({
  children,
  fillColor = "var(--color-foreground)",
  textOnFill = "var(--color-background)",
  variant = "outline",
  size = "md",
  className = "",
  ...props
}: ArrowFillButtonProps) {
  const [hovered, setHovered] = useState(false);

  const sharedStyle: React.CSSProperties = {
    position: "relative",
    display: "inline-flex",
    alignItems: "center",
    fontWeight: 500,
    letterSpacing: "-0.01em",
    overflow: "hidden",
    transition: "color 0.25s ease, border-color 0.25s ease",
    color: hovered && variant !== "solid" ? textOnFill : undefined,
    cursor: "pointer",
  };

  const fillStyle: React.CSSProperties = {
    content: '""',
    position: "absolute",
    inset: 0,
    background: fillColor,
    transform: hovered ? "scaleX(1)" : "scaleX(0)",
    transformOrigin: "left",
    transition: "transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
    zIndex: 0,
  };

  const inner = (
    <>
      {/* Fill layer */}
      <span aria-hidden="true" style={fillStyle} />
      {/* Content */}
      <span style={{ position: "relative", zIndex: 1 }}>{children}</span>
      {/* Arrow */}
      <span
        aria-hidden="true"
        style={{
          position: "relative",
          zIndex: 1,
          display: "inline-flex",
          alignItems: "center",
          transform: hovered ? "translateX(3px)" : "translateX(0)",
          transition: "transform 0.25s ease",
          opacity: hovered ? 1 : 0.6,
        }}
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 14 14"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M1 7H13M13 7L7.5 1.5M13 7L7.5 12.5"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
    </>
  );

  const commonProps = {
    onMouseEnter: () => setHovered(true),
    onMouseLeave: () => setHovered(false),
    className: [variants[variant], sizes[size], "rounded-md", className].join(" "),
    style: sharedStyle,
  };

  if ("href" in props && props.href) {
    const { href } = props as ArrowFillButtonBaseProps & { href: string };
    return (
      <Link to={href} {...commonProps}>
        {inner}
      </Link>
    );
  }

  return (
    <button type="button" {...commonProps} {...(props as ButtonHTMLAttributes<HTMLButtonElement>)}>
      {inner}
    </button>
  );
}
