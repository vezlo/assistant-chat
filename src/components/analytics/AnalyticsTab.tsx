import React, { useEffect, useState } from 'react';
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
  BarChart3,
  HelpCircle,
  MessageSquareText,
  Sparkles,
  UserCheck
} from 'lucide-react';

export function AnalyticsTab() {
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

  const Tooltip = ({ text, children }: { text: string; children: React.ReactNode }) => {
    const [isVisible, setIsVisible] = useState(false);

    return (
      <div className="relative inline-flex items-center">
        <div
          onMouseEnter={() => setIsVisible(true)}
          onMouseLeave={() => setIsVisible(false)}
          className="cursor-help"
        >
          {children}
        </div>
        {isVisible && (
          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg shadow-lg z-50 max-w-lg min-w-[240px] break-words">
            {text}
            <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1">
              <div className="border-4 border-transparent border-t-gray-900"></div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const StatCard = ({
    title, 
    value, 
    subtext, 
    icon: Icon, 
    colorClass = "text-emerald-600",
    bgClass = "bg-emerald-100",
    tooltip
  }: {
    title: string; 
    value: number | string; 
    subtext?: string; 
    icon: any; 
    colorClass?: string;
    bgClass?: string;
    tooltip?: string;
  }) => (
    <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <p className="text-sm font-medium text-gray-500">{title}</p>
            {tooltip && (
              <Tooltip text={tooltip}>
                <HelpCircle className="w-4 h-4 text-gray-400 hover:text-gray-600 transition-colors" />
              </Tooltip>
            )}
          </div>
          <h3 className="text-2xl font-bold text-gray-900">{value}</h3>
          {subtext && <p className="text-xs text-gray-500 mt-1">{subtext}</p>}
        </div>
        <div className={`p-3 rounded-lg ${bgClass}`}>
          <Icon className={`w-6 h-6 ${colorClass}`} />
        </div>
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <div className="p-6 space-y-8">
        {/* Top Level Stats Loading */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 animate-pulse">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-gray-100 rounded-xl h-32"></div>
          ))}
        </div>
        {/* Message Breakdown Loading */}
        <div className="animate-pulse">
          <div className="bg-gray-100 rounded-xl h-48"></div>
        </div>
        {/* Bottom Row Loading */}
        <div className="grid md:grid-cols-2 gap-6 animate-pulse">
          <div className="bg-gray-100 rounded-xl h-64"></div>
          <div className="bg-gray-100 rounded-xl h-64"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          <p className="font-medium">Error loading analytics</p>
          <p className="text-sm">{error}</p>
        </div>
      </div>
    );
  }

  if (!analytics) return null;

  return (
    <div className="p-6 space-y-8">
      {/* Top Level Stats */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Conversations"
          value={analytics.conversations?.total || 0}
          icon={MessageSquare}
          colorClass="text-blue-600"
          bgClass="bg-blue-100"
          tooltip="Total number of conversations created in your workspace"
        />
        <StatCard
          title="Total Users"
          value={analytics.users?.total_active_users || 0}
          icon={Users}
          colorClass="text-purple-600"
          bgClass="bg-purple-100"
          tooltip="Number of active users with access to your workspace"
        />
        <StatCard
          title="Total Messages"
          value={analytics.messages?.total || 0}
          icon={MessageCircle}
          colorClass="text-indigo-600"
          bgClass="bg-indigo-100"
          tooltip="Total messages sent across all conversations (users, AI, and agents)"
        />
        <StatCard
          title="Total Feedback"
          value={analytics.feedback?.total || 0}
          icon={Activity}
          colorClass="text-orange-600"
          bgClass="bg-orange-100"
          tooltip="Total feedback responses received from users (likes and dislikes)"
        />
      </div>

      {/* Message Breakdown - Full Width Row */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-indigo-600" />
            Message Interactions Breakdown
          </h3>
          <Tooltip text="Breakdown of messages by sender type: users, AI assistant, and human agents">
            <HelpCircle className="w-4 h-4 text-gray-400 hover:text-gray-600 transition-colors cursor-help" />
          </Tooltip>
        </div>
        <div className="grid md:grid-cols-3 gap-4">
          <div className="flex items-center justify-between p-4 bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-lg border border-blue-200/50">
            <div className="flex items-center gap-3 flex-1">
              <div className="p-2.5 bg-blue-500 rounded-lg shadow-sm">
                <MessageSquareText className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-xs font-medium text-gray-600 uppercase tracking-wide">User Messages</p>
                  <Tooltip text="Messages sent by end users/customers">
                    <HelpCircle className="w-3 h-3 text-gray-400 hover:text-gray-600 transition-colors cursor-help" />
                  </Tooltip>
                </div>
                <p className="text-2xl font-bold text-gray-900 mt-1">{analytics.messages.user_messages_total || 0}</p>
              </div>
            </div>
          </div>
          <div className="flex items-center justify-between p-4 bg-gradient-to-br from-purple-50 to-purple-100/50 rounded-lg border border-purple-200/50">
            <div className="flex items-center gap-3 flex-1">
              <div className="p-2.5 bg-purple-500 rounded-lg shadow-sm">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-xs font-medium text-gray-600 uppercase tracking-wide">AI Assistant</p>
                  <Tooltip text="Automated responses generated by the AI assistant">
                    <HelpCircle className="w-3 h-3 text-gray-400 hover:text-gray-600 transition-colors cursor-help" />
                  </Tooltip>
                </div>
                <p className="text-2xl font-bold text-gray-900 mt-1">{analytics.messages.assistant_messages_total || 0}</p>
              </div>
            </div>
          </div>
          <div className="flex items-center justify-between p-4 bg-gradient-to-br from-indigo-50 to-indigo-100/50 rounded-lg border border-indigo-200/50">
            <div className="flex items-center gap-3 flex-1">
              <div className="p-2.5 bg-indigo-500 rounded-lg shadow-sm">
                <UserCheck className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-xs font-medium text-gray-600 uppercase tracking-wide">Human Agents</p>
                  <Tooltip text="Messages sent by human support agents">
                    <HelpCircle className="w-3 h-3 text-gray-400 hover:text-gray-600 transition-colors cursor-help" />
                  </Tooltip>
                </div>
                <p className="text-2xl font-bold text-gray-900 mt-1">{analytics.messages.agent_messages_total || 0}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Conversation Status & Feedback Sentiment - Two Column Row */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Conversation Status */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-5">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-blue-600" />
              Conversation Status
            </h3>
            <Tooltip text="Current status of conversations: open (active) or closed (resolved)">
              <HelpCircle className="w-4 h-4 text-gray-400 hover:text-gray-600 transition-colors cursor-help" />
            </Tooltip>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200/50">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-green-500 rounded-lg shadow-sm">
                  <Clock className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">Open / Active</p>
                  <p className="text-xs text-gray-500 mt-0.5">Currently ongoing</p>
                </div>
              </div>
              <span className="text-2xl font-bold text-gray-900">{analytics.conversations.open || 0}</span>
            </div>
            <div className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-slate-50 rounded-lg border border-gray-200/50">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-gray-500 rounded-lg shadow-sm">
                  <CheckCircle className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">Closed / Resolved</p>
                  <p className="text-xs text-gray-500 mt-0.5">Completed conversations</p>
                </div>
              </div>
              <span className="text-2xl font-bold text-gray-900">{analytics.conversations.closed || 0}</span>
            </div>
          </div>
        </div>

        {/* Feedback Sentiment */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-5">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Activity className="w-5 h-5 text-orange-600" />
              Feedback Sentiment
            </h3>
            <Tooltip text="User feedback on AI responses: positive (likes) and negative (dislikes)">
              <HelpCircle className="w-4 h-4 text-gray-400 hover:text-gray-600 transition-colors cursor-help" />
            </Tooltip>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200/50">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-green-500 rounded-lg shadow-sm">
                  <ThumbsUp className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">Positive (Likes)</p>
                  <p className="text-xs text-gray-500 mt-0.5">Satisfied users</p>
                </div>
                <span className="text-sm font-medium text-gray-700">Positive (Likes)</span>
              </div>
              <span className="text-2xl font-bold text-green-600">{analytics.feedback?.likes || 0}</span>
            </div>
            <div className="flex items-center justify-between p-4 bg-gradient-to-r from-red-50 to-rose-50 rounded-lg border border-red-200/50">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-red-500 rounded-lg shadow-sm">
                  <ThumbsDown className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">Negative (Dislikes)</p>
                  <p className="text-xs text-gray-500 mt-0.5">Needs improvement</p>
                </div>
                <span className="text-sm font-medium text-gray-700">Negative (Dislikes)</span>
              </div>
              <span className="text-2xl font-bold text-red-600">{analytics.feedback?.dislikes || 0}</span>
            </div>
            {(analytics.feedback?.total || 0) > 0 && (
              <div className="pt-3 mt-3 border-t border-gray-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-gray-600">Overall Satisfaction</span>
                  <span className="text-sm font-semibold text-gray-900">
                    {Math.round(((analytics.feedback?.likes || 0) / (analytics.feedback?.total || 1)) * 100)}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-green-500 to-emerald-500 h-3 rounded-full transition-all duration-700 shadow-sm"
                    style={{ width: `${((analytics.feedback?.likes || 0) / (analytics.feedback?.total || 1)) * 100}%` }}
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
  );
}

