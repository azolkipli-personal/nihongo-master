import { useState, useEffect } from 'react';
import { BookOpen, Target, TrendingUp, Award, Calendar, BookMarked } from 'lucide-react';
import { StudySession } from '../../types';

export function ShinchokuTab() {
  const [progressData, setProgressData] = useState({
    overallProgress: 0,
    weeklyGoal: 0,
    streakCount: 0,
    totalStudyTime: 0,
    achievements: [] as string[],
  });

  const [recentSessions, setRecentSessions] = useState<StudySession[]>([]);
  const [vocabData, setVocabData] = useState({
    wanikani: 0,
    setsTotal: 0,
    setsStudied: 0,
    setsUsed: 0,
  });

  useEffect(() => {
    loadProgressData();
    loadRecentSessions();
    loadVocabData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadVocabData = () => {
    // WaniKani vocab
    const wk = localStorage.getItem('nihongo-master-vocabulary');
    const wanikaniCount = wk ? JSON.parse(wk).length : 0;

    // Sets vocab (custom captured words)
    const sets = localStorage.getItem('nihongo-master-vocab-sets');
    let setsTotal = 0, setsStudied = 0, setsUsed = 0;
    if (sets) {
      try {
        const parsed = JSON.parse(sets);
        setsTotal = parsed.length;
        setsStudied = parsed.filter((e: any) => e.studied).length;
        setsUsed = parsed.reduce((sum: number, e: any) => sum + (e.times_used || 0), 0);
      } catch {}
    }

    setVocabData({ wanikani: wanikaniCount, setsTotal, setsStudied, setsUsed });
  };

  const loadProgressData = async () => {
    try {
      const { loadSessions } = await import('../../utils/sessionStorage');
      const sessions = loadSessions();

      setProgressData({
        overallProgress: calculateOverallProgress(sessions),
        weeklyGoal: 7,
        streakCount: calculateStreak(sessions),
        totalStudyTime: calculateTotalStudyTime(sessions),
        achievements: calculateAchievements(sessions),
      });
    } catch (error) {
      console.error('Failed to load progress data:', error);
    }
  };

  useEffect(() => {
    // Grammar count is loaded on demand via vocabData
  }, []); // eslint-disable-line no-empty

  const loadRecentSessions = async () => {
    try {
      const { loadSessions } = await import('../../utils/sessionStorage');
      const sessions = loadSessions();
      setRecentSessions(sessions.slice(-10).reverse());
    } catch (error) {
      console.error('Failed to load recent sessions:', error);
    }
  };

  const calculateOverallProgress = (sessions: StudySession[]) => {
    if (!sessions || sessions.length === 0) return 0;
    return Math.min(100, sessions.length * 2);
  };

  const calculateStreak = (sessions: StudySession[]) => {
    if (!sessions || sessions.length === 0) return 0;
    let streak = 0;
    const today = new Date();
    for (let i = sessions.length - 1; i >= 0; i--) {
      const sessionDate = new Date(sessions[i].date);
      const daysDiff = Math.floor((today.getTime() - sessionDate.getTime()) / (1000 * 60 * 60 * 24));
      if (daysDiff <= streak + 1) streak++;
      else break;
    }
    return streak;
  };

  const calculateTotalStudyTime = (sessions: StudySession[]) => {
    if (!sessions || sessions.length === 0) return 0;
    return sessions.reduce((total, s) => total + (s.duration || 0), 0);
  };

  const calculateAchievements = (sessions: StudySession[]) => {
    const a: string[] = [];
    if (sessions.length >= 1) a.push('First Steps');
    if (sessions.length >= 7) a.push('Week Warrior');
    if (sessions.length >= 30) a.push('Monthly Master');
    if (sessions.length >= 100) a.push('Century Club');
    if (vocabData.setsStudied >= 10) a.push('Vocab Collector');
    if (vocabData.setsUsed >= 20) a.push('Conversation Starter');
    return a;
  };

  const formatStudyTime = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`;
    return `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
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
              <p className="text-sm font-medium text-gray-600">Words Tracked</p>
              <div className="flex gap-4">
                <div>
                  <span className="text-2xl font-bold text-gray-900">{vocabData.wanikani + vocabData.setsTotal}</span>
                  <span className="text-xs text-gray-500 block">Total</span>
                </div>
                <div>
                  <span className="text-2xl font-bold text-purple-600">{vocabData.setsTotal}</span>
                  <span className="text-xs text-gray-500 block">Custom</span>
                </div>
                <div>
                  <span className="text-2xl font-bold text-blue-600">{vocabData.wanikani}</span>
                  <span className="text-xs text-gray-500 block">WaniKani</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <BookMarked className="h-8 w-8 text-purple-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Sets Progress</p>
              <div className="flex gap-4">
                <div>
                  <span className="text-2xl font-bold text-green-600">{vocabData.setsStudied}</span>
                  <span className="text-xs text-gray-500 block">Studied</span>
                </div>
                <div>
                  <span className="text-2xl font-bold text-orange-600">{vocabData.setsUsed}</span>
                  <span className="text-xs text-gray-500 block">Used</span>
                </div>
              </div>
              {vocabData.setsTotal > 0 && (
                <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2">
                  <div className="bg-purple-500 h-1.5 rounded-full transition-all"
                    style={{ width: `${Math.round((vocabData.setsStudied / vocabData.setsTotal) * 100)}%` }} />
                </div>
              )}
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
                    <p className="font-medium text-gray-900">{session.type || 'Study Session'}</p>
                    <p className="text-sm text-gray-600">{new Date(session.date).toLocaleDateString()}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">{formatStudyTime(session.duration || 0)}</p>
                    <p className="text-xs text-gray-500">{session.score || 'No score'}%</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Weekly Goal */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Weekly Goal Progress</h2>
        <div className="mb-2">
          <div className="flex justify-between text-sm text-gray-600 mb-1">
            <span>This Week</span>
            <span>{Math.min(progressData.overallProgress, 100)}% Complete</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${Math.min(progressData.overallProgress, 100)}%` }} />
          </div>
        </div>
        <p className="text-sm text-gray-600">Goal: {progressData.weeklyGoal} sessions this week</p>
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
