import { useEffect, useState } from 'react';
import { MainLayout } from '@/components/layouts/MainLayout';
import { useApp } from '@/contexts/AppContext';
import { getCompanyAnalytics, type CompanyAnalyticsResponse } from '@/api';
import { 
  MessageSquare, 
  Users, 
  MessageCircle, 
  ThumbsUp, 
  Activity, 
  CheckCircle, 
  Clock, 
  ThumbsDown,
  BarChart3
} from 'lucide-react';

export function AnalyticsPage() {
  const { token } = useApp();
  const [analytics, setAnalytics] = useState<CompanyAnalyticsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchAnalytics() {
      if (!token) return;
      
      try {
        setIsLoading(true);
        setError(null);
        const data = await getCompanyAnalytics(token);
        setAnalytics(data);
      } catch (err) {
        console.error('Error fetching analytics:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch analytics');
      } finally {
        setIsLoading(false);
      }
    }

    fetchAnalytics();
  }, [token]);

  const StatCard = ({ 
    title, 
    value, 
    subtext, 
    icon: Icon, 
    colorClass = "text-emerald-600",
    bgClass = "bg-emerald-100" 
  }: { 
    title: string; 
    value: number | string; 
    subtext?: string; 
    icon: any; 
    colorClass?: string;
    bgClass?: string;
  }) => (
    <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500 mb-1">{title}</p>
          <h3 className="text-2xl font-bold text-gray-900">{value}</h3>
          {subtext && <p className="text-xs text-gray-500 mt-1">{subtext}</p>}
        </div>
        <div className={`p-3 rounded-lg ${bgClass}`}>
          <Icon className={`w-6 h-6 ${colorClass}`} />
        </div>
      </div>
    </div>
  );

  return (
    <MainLayout>
      <div className="max-w-[1400px] mx-auto px-12 py-8 pb-16">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-gray-900 mb-2">Analytics</h1>
          <p className="text-gray-600">View usage statistics and performance metrics for your company</p>
        </div>

        {isLoading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 animate-pulse">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-gray-100 rounded-xl h-32"></div>
            ))}
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            <p className="font-medium">Error loading analytics</p>
            <p className="text-sm">{error}</p>
          </div>
        ) : analytics ? (
          <div className="space-y-8">
            {/* Top Level Stats */}
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCard
                title="Total Conversations"
                value={analytics.conversations.total}
                icon={MessageSquare}
                colorClass="text-blue-600"
                bgClass="bg-blue-100"
              />
              <StatCard
                title="Total Users"
                value={analytics.users.total_active_users}
                icon={Users}
                colorClass="text-purple-600"
                bgClass="bg-purple-100"
              />
              <StatCard
                title="User Messages"
                value={analytics.messages.user_messages_total}
                icon={MessageCircle}
                colorClass="text-indigo-600"
                bgClass="bg-indigo-100"
              />
              <StatCard
                title="Total Feedback"
                value={analytics.feedback.total}
                icon={Activity}
                colorClass="text-orange-600"
                bgClass="bg-orange-100"
              />
            </div>

            {/* Detailed Breakdown */}
            <div className="grid md:grid-cols-2 gap-6">
              {/* Conversation Status */}
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-gray-400" />
                  Conversation Status
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-green-100 rounded-md">
                        <Clock className="w-4 h-4 text-green-600" />
                      </div>
                      <span className="text-sm font-medium text-gray-700">Open / Active</span>
                    </div>
                    <span className="font-bold text-gray-900">{analytics.conversations.open}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-gray-200 rounded-md">
                        <CheckCircle className="w-4 h-4 text-gray-600" />
                      </div>
                      <span className="text-sm font-medium text-gray-700">Closed / Resolved</span>
                    </div>
                    <span className="font-bold text-gray-900">{analytics.conversations.closed}</span>
                  </div>
                </div>
              </div>

              {/* Feedback Sentiment */}
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Activity className="w-5 h-5 text-gray-400" />
                  Feedback Sentiment
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-green-100 rounded-md">
                        <ThumbsUp className="w-4 h-4 text-green-600" />
                      </div>
                      <span className="text-sm font-medium text-gray-700">Positive (Likes)</span>
                    </div>
                    <span className="font-bold text-green-600">{analytics.feedback.likes}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-red-100 rounded-md">
                        <ThumbsDown className="w-4 h-4 text-red-600" />
                      </div>
                      <span className="text-sm font-medium text-gray-700">Negative (Dislikes)</span>
                    </div>
                    <span className="font-bold text-red-600">{analytics.feedback.dislikes}</span>
                  </div>
                  {analytics.feedback.total > 0 && (
                    <div className="pt-2">
                       <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div 
                          className="bg-green-500 h-2.5 rounded-full transition-all duration-500" 
                          style={{ width: `${(analytics.feedback.likes / analytics.feedback.total) * 100}%` }}
                        ></div>
                      </div>
                      <p className="text-xs text-right mt-1 text-gray-500">
                        {Math.round((analytics.feedback.likes / analytics.feedback.total) * 100)}% Positive
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </MainLayout>
  );
}
