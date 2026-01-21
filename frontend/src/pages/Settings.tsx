export default function Settings() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">Settings</h1>
        <p className="mt-2 text-gray-400">
          Konfiguriere NOVA v3 und die Agenten
        </p>
      </div>

      <div className="space-y-6">
        {/* General Settings */}
        <div className="p-6 bg-gray-800 rounded-lg border border-gray-700">
          <h2 className="text-xl font-bold text-white mb-4">General</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                System Name
              </label>
              <input
                type="text"
                defaultValue="NOVA v3"
                className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-nova-primary"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                API Endpoint
              </label>
              <input
                type="text"
                defaultValue="http://localhost:8000"
                className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-nova-primary"
              />
            </div>
          </div>
        </div>

        {/* Agent Settings */}
        <div className="p-6 bg-gray-800 rounded-lg border border-gray-700">
          <h2 className="text-xl font-bold text-white mb-4">Agents</h2>
          
          <div className="space-y-4">
            {['CORE', 'FORGE', 'PHOENIX', 'GUARDIAN'].map((agent) => (
              <div key={agent} className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-white">{agent}</p>
                  <p className="text-xs text-gray-400">Enable/Disable agent</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" defaultChecked className="sr-only peer" />
                  <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-nova-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-nova-primary"></div>
                </label>
              </div>
            ))}
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <button className="px-6 py-2 bg-nova-primary text-white rounded-lg hover:bg-nova-primary/80 transition-colors">
            Save Settings
          </button>
        </div>
      </div>
    </div>
  )
}
