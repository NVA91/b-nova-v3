import { useQuery } from '@tanstack/react-query'
import { apiClient } from '../services/apiClient'

export default function Agents() {
  const { data: agents, isLoading } = useQuery({
    queryKey: ['agents'],
    queryFn: () => apiClient.get('/api/v1/agents'),
  })

  if (isLoading) {
    return <div className="text-white">Loading agents...</div>
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">Agents</h1>
        <p className="mt-2 text-gray-400">
          Verwalte die 4 NOVA v3 Agenten: CORE, FORGE, PHOENIX, GUARDIAN
        </p>
      </div>

      <div className="space-y-4">
        {agents?.data?.map((agent: any) => (
          <div
            key={agent.id}
            className="p-6 bg-gray-800 rounded-lg border border-gray-700"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-4">
                <span className="text-5xl">{agent.emoji}</span>
                <div>
                  <h3 className="text-xl font-bold text-white">{agent.name}</h3>
                  <p className="mt-1 text-sm text-gray-400">{agent.role}</p>
                  <p className="mt-2 text-sm text-gray-300">{agent.description}</p>
                  
                  <div className="mt-4">
                    <p className="text-xs font-medium text-gray-400 mb-2">Capabilities:</p>
                    <div className="flex flex-wrap gap-2">
                      {agent.capabilities?.map((cap: string) => (
                        <span
                          key={cap}
                          className="px-2 py-1 text-xs bg-nova-primary/20 text-nova-primary rounded"
                        >
                          {cap}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <span
                className={`px-3 py-1 text-sm font-medium rounded ${
                  agent.enabled
                    ? 'bg-green-500/20 text-green-400'
                    : 'bg-red-500/20 text-red-400'
                }`}
              >
                {agent.enabled ? 'Enabled' : 'Disabled'}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
