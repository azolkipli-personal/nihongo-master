import { useState, useEffect } from 'react';
import { User, BookOpen, Target, TrendingUp, Award, Calendar } from 'lucide-react';
import { loadConfig } from '../../utils/configManager';

export function ShinchokuTab() {
  const [progressData, setProgressData] = useState({
    overallProgress: 0,
    weeklyGoal: 0,
    streakCount: 0,
    totalStudyTime: 0,
    achievements: [] as string[]
  });

  const [recentSessions, setRecentSessions] = useState<any[]>([]);
  const [config, setConfig] = useState<any>(null);

  useEffect(() => {
    const cfg = loadConfig();
    setConfig(cfg as any);
    loadProgressData();
    loadRecentSessions();
  }, []);

  const loadProgressData = async () => {
    try {
      // Load sessions from session storage
      const { loadSessions } = await import('../../utils/sessionStorage');
      const sessions = loadSessions();
      
      // Calculate metrics
      const overallProgress = calculateOverallProgress(sessions);
      const weeklyGoal = config?.weeklyGoal || 7;
      const streakCount = calculateStreak(sessions);
      const totalStudyTime = calculateTotalStudyTime(sessions);
      const achievements = calculateAchievements(sessions);

      setProgressData({
        overallProgress,
        weeklyGoal,
        streakCount,
        totalStudyTime,
        achievements
      });
    } catch (error) {
      console.error('Failed to load progress data:', error);
    }
  };

  const loadRecentSessions = async () => {
    try {
      // Load recent sessions from storage
      const { loadSessions } = await import('../../utils/sessionStorage');
      const sessions = loadSessions();
      const recent = sessions.slice(-10).reverse(); // Last 10 sessions
      setRecentSessions(recent as any);
    } catch (error) {
      console.error('Failed to load recent sessions:', error);
    }
  };

  const calculateOverallProgress = (sessions: any[]) => {
    // Simple progress calculation based on session count and consistency
    if (!sessions || sessions.length === 0) return 0;
    return Math.min(100, sessions.length * 2);
  };

  const calculateStreak = (sessions: any[]) => {
    if (!sessions || sessions.length === 0) return 0;
    
    let streak = 0;
    const today = new Date();
    
    // Simple streak calculation (would be more sophisticated in real implementation)
    for (let i = sessions.length - 1; i >= 0; i--) {
      const sessionDate = new Date(sessions[i].date || sessions[i].timestamp);
      const daysDiff = Math.floor((today.getTime() - sessionDate.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysDiff <= streak + 1) {
        streak++;
      } else {
        break;
      }
    }
    
    return streak;
  };

  const calculateTotalStudyTime = (sessions: any[]) => {
    if (!sessions || sessions.length === 0) return 0;
    
    return sessions.reduce((total, session) => {
      return total + (session.duration || session.studyTime || 0);
    }, 0);
  };

  const calculateAchievements = (sessions: any[]) => {
    const achievements = [];
    
    if (sessions.length >= 1) achievements.push('First Steps');
    if (sessions.length >= 7) achievements.push('Week Warrior');
    if (sessions.length >= 30) achievements.push('Monthly Master');
    if (sessions.length >= 100) achievements.push('Century Club');
    
    return achievements;
  };

  const formatStudyTime = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes}m`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <TrendingUp className="h-8 w-8 text-blue-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">進捗 (Shinchoku)</h1>
              <p className="text-gray-600">Track your Japanese learning progress</p>
            </div>
          </div>
        </div>
      </div>

      {/* Progress Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <Target className="h-8 w-8 text-green-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Overall Progress</p>
              <p className="text-2xl font-bold text-gray-900">{progressData.overallProgress}%</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <Calendar className="h-8 w-8 text-blue-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Current Streak</p>
              <p className="text-2xl font-bold text-gray-900">{progressData.streakCount} days</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <User className="h-8 w-8 text-purple-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Study Time</p>
              <p className="text-2xl font-bold text-gray-900">{formatStudyTime(progressData.totalStudyTime)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <Award className="h-8 w-8 text-yellow-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Achievements</p>
              <p className="text-2xl font-bold text-gray-900">{progressData.achievements.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Sessions */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center space-x-2 mb-4">
          <BookOpen className="h-6 w-6 text-blue-600" />
          <h2 className="text-xl font-bold text-gray-900">Recent Sessions</h2>
        </div>
        
        {recentSessions.length === 0 ? (
          <div className="text-center py-8">
            <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No recent sessions found. Start learning to see your progress!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {recentSessions.map((session, index) => (
              <div key={index} className="border-l-4 border-blue-500 pl-4 py-2">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium text-gray-900">
                      {session.type || 'Study Session'}
                    </p>
                    <p className="text-sm text-gray-600">
                      {new Date(session.date || session.timestamp).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">
                      {formatStudyTime(session.duration || session.studyTime || 0)}
                    </p>
                    <p className="text-xs text-gray-500">
                      {session.score || session.accuracy || 'No score'}%
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Weekly Goal Progress */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Weekly Goal Progress</h2>
        <div className="mb-2">
          <div className="flex justify-between text-sm text-gray-600 mb-1">
            <span>This Week</span>
            <span>{Math.min(progressData.overallProgress, 100)}% Complete</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${Math.min(progressData.overallProgress, 100)}%` }}
            ></div>
          </div>
        </div>
        <p className="text-sm text-gray-600">
          Goal: {progressData.weeklyGoal} sessions this week
        </p>
      </div>

      {/* Achievements */}
      {progressData.achievements.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center space-x-2 mb-4">
            <Award className="h-6 w-6 text-yellow-600" />
            <h2 className="text-xl font-bold text-gray-900">Achievements</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {progressData.achievements.map((achievement, index) => (
              <div key={index} className="text-center p-4 bg-yellow-50 rounded-lg">
                <Award className="h-8 w-8 text-yellow-600 mx-auto mb-2" />
                <p className="text-sm font-medium text-gray-900">{achievement}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}