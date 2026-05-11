type ProgressBarProps = {
	value: number;
	label?: string;
};

export function ProgressBar({ value, label }: ProgressBarProps) {
	const safeValue = Math.max(0, Math.min(100, value));

	return (
		<div className="space-y-2">
			<div className="flex items-center justify-between text-sm text-[hsl(var(--text-secondary))]">
				<span>{label ?? "Progress"}</span>
				<span>{Math.round(safeValue)}%</span>
			</div>
			<div className="h-3 overflow-hidden rounded-full bg-[hsl(var(--surface-tertiary))]">
				<div
					className="h-full rounded-full bg-[hsl(var(--brand))] transition-all"
					style={{ width: `${safeValue}%` }}
				/>
			</div>
		</div>
	);
}
