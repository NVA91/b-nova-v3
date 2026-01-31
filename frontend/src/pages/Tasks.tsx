import { useQuery } from '@tanstack/react-query'
import { apiClient } from '../services/apiClient'

export default function Tasks() {
  const { data: tasks, isLoading } = useQuery({
    queryKey: ['tasks'],
    queryFn: () => apiClient.get('/api/v1/tasks'),
    refetchInterval: 3000,
  })

  if (isLoading) {
    return <div className="text-white">Loading tasks...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Tasks</h1>
          <p className="mt-2 text-gray-400">
            Übersicht aller laufenden und abgeschlossenen Tasks
          </p>
        </div>
        <button className="px-4 py-2 bg-nova-primary text-white rounded-lg hover:bg-nova-primary/80 transition-colors">
          + New Task
        </button>
      </div>

      {tasks?.data?.length === 0 ? (
        <div className="p-12 text-center bg-gray-800 rounded-lg border border-gray-700">
          <p className="text-gray-400">Keine Tasks vorhanden</p>
        </div>
      ) : (
        <div className="overflow-hidden bg-gray-800 rounded-lg border border-gray-700">
          <table className="min-w-full divide-y divide-gray-700">
            <thead className="bg-gray-900">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Task ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Agent
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Action
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Created
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {tasks?.data?.map((task: any) => (
                <tr key={task.task_id} className="hover:bg-gray-700/50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-300">
                    {task.task_id.slice(0, 8)}...
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                    {task.agent_id}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                    {task.action}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded ${
                        task.status === 'completed'
                          ? 'bg-green-500/20 text-green-400'
                          : task.status === 'failed'
                            ? 'bg-red-500/20 text-red-400'
                            : task.status === 'running'
                              ? 'bg-blue-500/20 text-blue-400'
                              : 'bg-gray-500/20 text-gray-400'
                      }`}
                    >
                      {task.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                    {new Date(task.created_at).toLocaleString('de-DE')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
