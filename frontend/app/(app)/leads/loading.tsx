export default function LeadsLoading() {
  return (
    <div className="flex flex-col h-full">
      <div className="px-6 py-4 border-b border-border">
        <div className="h-7 w-40 bg-muted rounded shimmer mb-2" />
        <div className="h-9 bg-muted rounded-lg shimmer" />
      </div>
      <div className="p-4 space-y-2">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="h-14 bg-muted rounded-lg shimmer" />
        ))}
      </div>
    </div>
  );
}
