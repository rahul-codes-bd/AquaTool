

function App() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 max-w-md w-full text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Workspace Restored</h1>
        <p className="text-gray-600 mb-6">
          The previous files in this workspace were removed, but the core application framework has been restored. 
        </p>
        <p className="text-sm text-gray-500">
          You can now start rebuilding your tools or request specific features.
        </p>
      </div>
    </div>
  );
}

export default App;
