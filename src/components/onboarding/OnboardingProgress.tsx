interface Props {
  current: number;
  total: number;
}

export default function OnboardingProgress({ current, total }: Props) {
  return (
    <div className="w-full mb-8">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-muted-foreground">שלב {current} מתוך {total}</span>
        <span className="text-xs text-primary font-medium">{Math.round((current / total) * 100)}%</span>
      </div>
      <div className="flex gap-1.5">
        {Array.from({ length: total }).map((_, i) => (
          <div
            key={i}
            className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${
              i < current ? "bg-gradient-to-l from-primary to-secondary" : "bg-muted"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
