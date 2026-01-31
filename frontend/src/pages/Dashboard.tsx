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
      {/* Hero Section with NOVA v3 Image */}
      <div className="relative overflow-hidden rounded-2xl">
        <div className="relative h-[400px] w-full">
          <img 
            src="/nova-hero.png" 
            alt="NOVA v3" 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/50 to-transparent"></div>
          <div className="absolute bottom-0 left-0 right-0 p-8">
            <h1 className="text-5xl font-bold text-white mb-2 drop-shadow-lg">
              NOVA v3
            </h1>
            <p className="text-xl text-gray-200 drop-shadow-md">
              AI Agent Dashboard - 4-Agenten-System für moderne DevOps
            </p>
          </div>
        </div>
      </div>

      {/* System Status */}
      <div>
        <h2 className="mb-4 text-2xl font-bold text-white">System Status</h2>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <div className="p-6 bg-gray-800 rounded-lg border border-gray-700 hover:border-nova-primary transition-all duration-300">
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

          <div className="p-6 bg-gray-800 rounded-lg border border-gray-700 hover:border-nova-primary transition-all duration-300">
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

          <div className="p-6 bg-gray-800 rounded-lg border border-gray-700 hover:border-nova-primary transition-all duration-300">
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
      </div>

      {/* Agents Overview */}
      <div>
        <h2 className="mb-4 text-2xl font-bold text-white">Active Agents</h2>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          {agents?.data?.map((agent: any) => (
            <div
              key={agent.id}
              className="p-6 bg-gray-800 rounded-lg border border-gray-700 hover:border-nova-primary transition-all duration-300 hover:shadow-lg hover:shadow-nova-primary/20"
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

      {/* Features Section */}
      <div className="mt-12">
        <h2 className="mb-6 text-2xl font-bold text-white">Features</h2>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          <div className="p-6 bg-gradient-to-br from-blue-900/30 to-blue-800/10 rounded-lg border border-blue-700/50">
            <div className="text-4xl mb-4">🧠</div>
            <h3 className="text-lg font-bold text-white mb-2">CORE</h3>
            <p className="text-sm text-gray-300">
              Orchestrator für intelligente Aufgabenverteilung und Koordination
            </p>
          </div>

          <div className="p-6 bg-gradient-to-br from-orange-900/30 to-orange-800/10 rounded-lg border border-orange-700/50">
            <div className="text-4xl mb-4">⚒️</div>
            <h3 className="text-lg font-bold text-white mb-2">FORGE</h3>
            <p className="text-sm text-gray-300">
              Development und Deployment Automation
            </p>
          </div>

          <div className="p-6 bg-gradient-to-br from-red-900/30 to-red-800/10 rounded-lg border border-red-700/50">
            <div className="text-4xl mb-4">🐦‍🔥</div>
            <h3 className="text-lg font-bold text-white mb-2">PHOENIX</h3>
            <p className="text-sm text-gray-300">
              DevOps und Self-Healing Mechanismen
            </p>
          </div>

          <div className="p-6 bg-gradient-to-br from-green-900/30 to-green-800/10 rounded-lg border border-green-700/50">
            <div className="text-4xl mb-4">🛡️</div>
            <h3 className="text-lg font-bold text-white mb-2">GUARDIAN</h3>
            <p className="text-sm text-gray-300">
              Monitoring und Security Überwachung
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
