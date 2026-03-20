import CoachDashboard from '@/components/coach/CoachDashboard';

export default function CoachPage() {
  return (
    <div className="min-h-screen bg-gray-950 text-white overflow-x-hidden">
      <div className="w-full max-w-xl mx-auto px-4 pt-4 pb-28">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white">教練後台</h1>
          <p className="text-gray-400 text-sm mt-1">管理你的學員與邀請連結</p>
        </div>
        <CoachDashboard />
      </div>
    </div>
  );
}

