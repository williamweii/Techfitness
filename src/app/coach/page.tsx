import CoachDashboard from '@/components/coach/CoachDashboard';

export default function CoachPage() {
  return (
    <main className="min-h-screen bg-gray-950 text-white p-4 pb-24 max-w-xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">教練後台</h1>
        <p className="text-gray-400 text-sm mt-1">管理你的學員與邀請連結</p>
      </div>
      <CoachDashboard />
    </main>
  );
}
