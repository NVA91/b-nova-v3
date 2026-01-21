import { useQuery } from '@tanstack/react-query'
import { apiClient } from '../services/apiClient'

export default function Dashboard() {
  const { data: health, isLoading } = useQuery({
    queryKey: ['health'],
    queryFn: () => apiClient.get('/health'),
    refetchInterval: 5000,
  })

  const { data: agents } = useQuery({
    queryKey: ['agents'],
    queryFn: () => apiClient.get('/api/v1/agents'),
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-white">Loading...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white">Dashboard</h1>
        <p className="mt-2 text-gray-400">
          Übersicht über alle NOVA v3 Agenten und System-Status
        </p>
      </div>

      {/* System Status */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <div className="p-6 bg-gray-800 rounded-lg border border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">CPU Usage</p>
              <p className="mt-2 text-2xl font-bold text-white">
                {health?.data?.system?.cpu_percent?.toFixed(1)}%
              </p>
            </div>
            <div className="text-4xl">💻</div>
          </div>
        </div>

        <div className="p-6 bg-gray-800 rounded-lg border border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Memory Usage</p>
              <p className="mt-2 text-2xl font-bold text-white">
                {health?.data?.system?.memory_percent?.toFixed(1)}%
              </p>
            </div>
            <div className="text-4xl">🧠</div>
          </div>
        </div>

        <div className="p-6 bg-gray-800 rounded-lg border border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Disk Usage</p>
              <p className="mt-2 text-2xl font-bold text-white">
                {health?.data?.system?.disk_percent?.toFixed(1)}%
              </p>
            </div>
            <div className="text-4xl">💾</div>
          </div>
        </div>
      </div>

      {/* Agents Overview */}
      <div>
        <h2 className="mb-4 text-xl font-bold text-white">Active Agents</h2>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          {agents?.data?.map((agent: any) => (
            <div
              key={agent.id}
              className="p-6 bg-gray-800 rounded-lg border border-gray-700 hover:border-nova-primary transition-colors"
            >
              <div className="flex items-center justify-between mb-4">
                <span className="text-4xl">{agent.emoji}</span>
                <span
                  className={`px-2 py-1 text-xs font-medium rounded ${
                    agent.enabled
                      ? 'bg-green-500/20 text-green-400'
                      : 'bg-red-500/20 text-red-400'
                  }`}
                >
                  {agent.enabled ? 'Online' : 'Offline'}
                </span>
              </div>
              <h3 className="text-lg font-bold text-white">{agent.name}</h3>
              <p className="mt-1 text-sm text-gray-400">{agent.role}</p>
              <p className="mt-2 text-xs text-gray-500">{agent.description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
