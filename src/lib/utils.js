import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

// Utility function to merge Tailwind classes
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}


export const profileColors = [
    "#8B5CF6", // Violet
    "#6366F1", // Indigo
    "#3B82F6", // Blue
    "#0EA5E9", // Sky
    "#22D3EE", // Cyan
    "#10B981", // Emerald
    "#F59E0B", // Amber
    "#EF4444", // Red
    "#EC4899", // Pink
    "#A855F7", // Purple
];

