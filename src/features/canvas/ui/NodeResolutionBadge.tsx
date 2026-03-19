type NodeResolutionBadgeProps = {
  resolution: string;
  title?: string;
};

export function NodeResolutionBadge({ resolution, title }: NodeResolutionBadgeProps) {
  return (
    <span
      title={title}
      className="shrink-0 text-[14px] leading-none font-normal text-[rgba(15,23,42,0.68)] dark:text-white/55"
    >
      {resolution}
    </span>
  );
}
