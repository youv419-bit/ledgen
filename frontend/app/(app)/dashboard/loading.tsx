export default function DashboardLoading() {
  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="h-8 w-48 bg-muted rounded shimmer" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => <div key={i} className="h-24 bg-muted rounded-xl shimmer" />)}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {[...Array(3)].map((_, i) => <div key={i} className="h-56 bg-muted rounded-xl shimmer" />)}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[...Array(2)].map((_, i) => <div key={i} className="h-64 bg-muted rounded-xl shimmer" />)}
      </div>
    </div>
  );
}
