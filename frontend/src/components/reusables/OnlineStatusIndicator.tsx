interface OnlineStatusIndicatorProps {
  isOnline: boolean;
  size?: "sm" | "md" | "lg";
  showOffline?: boolean;
}

const sizeClasses = {
  sm: "size-2.5",
  md: "size-3",
  lg: "size-4",
};

const OnlineStatusIndicator = ({
  isOnline,
  size = "sm",
  showOffline = false,
}: OnlineStatusIndicatorProps) => {
  if (!isOnline && !showOffline) return null;

  return (
    <span
      className={`absolute bottom-0 right-0 ${sizeClasses[size]} ${
        isOnline ? "bg-success" : "bg-base-content/40"
      } rounded-full ring-2 ring-base-100`}
      aria-label={isOnline ? "Online" : "Offline"}
    />
  );
};

export default OnlineStatusIndicator;
