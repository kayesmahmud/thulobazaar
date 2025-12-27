export interface ServiceStatus {
  status: 'healthy' | 'unhealthy';
  responseTime: number | null;
  message: string;
}

export interface SystemHealthData {
  timestamp: string;
  serviceStatus: {
    postgresql: ServiceStatus;
    typesense: ServiceStatus;
    backend: ServiceStatus;
  };
  databaseHealth: {
    connections: {
      total_connections: string;
      active_connections: string;
      idle_connections: string;
    };
    databaseSize: string;
    topTables: Array<{
      tablename: string;
      size: string;
    }>;
    slowQueries: number | string;
  };
  performanceMetrics: {
    errorsLast24h: number;
    activeUsers: number;
  };
  businessMetrics: {
    ads: {
      active_ads: string;
      pending_ads: string;
      rejected_ads: string;
      deleted_ads: string;
      total_ads: string;
    };
    users: {
      active_users: string;
      suspended_users: string;
      verified_businesses: string;
      verified_individuals: string;
      total_users: string;
    };
    pendingVerifications: {
      pending_business: string;
      pending_individual: string;
    };
    paymentsLast24h: {
      successful_payments: string;
      failed_payments: string;
      total_revenue_24h: string;
    };
  };
  criticalEvents: Array<{
    type: string;
    severity: 'low' | 'medium' | 'high';
    message: string;
    timestamp: string;
  }>;
  systemInfo: {
    nodeVersion: string;
    platform: string;
    uptime: number;
    memoryUsage: {
      rss: string;
      heapTotal: string;
      heapUsed: string;
    };
  };
}

export function getStatusColor(status: 'healthy' | 'unhealthy'): string {
  return status === 'healthy' ? 'text-green-600 bg-green-100' : 'text-red-600 bg-red-100';
}

export function getSeverityColor(severity: 'low' | 'medium' | 'high'): string {
  switch (severity) {
    case 'high':
      return 'bg-red-100 border-red-200 text-red-800';
    case 'medium':
      return 'bg-yellow-100 border-yellow-200 text-yellow-800';
    case 'low':
      return 'bg-blue-100 border-blue-200 text-blue-800';
  }
}

export function getSeverityIcon(severity: 'low' | 'medium' | 'high'): string {
  switch (severity) {
    case 'high':
      return '⚠️';
    case 'medium':
      return '⚡';
    case 'low':
      return 'ℹ️';
  }
}

export function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return `${days}d ${hours}h ${minutes}m`;
}
