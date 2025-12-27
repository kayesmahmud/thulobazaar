export function EditorLoadingScreen({ message = 'Loading...' }: { message?: string }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50">
      <div className="text-center">
        <div className="relative">
          <div className="w-20 h-20 mx-auto mb-6">
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full animate-ping opacity-20" />
            <div className="relative w-20 h-20 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full flex items-center justify-center shadow-lg">
              <span className="text-4xl text-white">⏳</span>
            </div>
          </div>
          <div className="text-lg font-semibold text-gray-700">{message}</div>
        </div>
      </div>
    </div>
  );
}
