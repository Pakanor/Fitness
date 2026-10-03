using ExerciseAPI.DTOs;
using ExerciseAPI.Models;

namespace ExerciseAPI.Interfaces
{
    public interface IWorkoutSessionService
    {
        Task<WorkoutSession?> GetSessionByDate(int userId, DateTime date);

        Task<WorkoutSession?> GetSessionById(int sessionId, int userId);

        /// <summary>Most recent session still in progress, on any day — used to resume training.</summary>
        Task<WorkoutSession?> GetActiveSession(int userId);

        Task<WorkoutSession> CreateFromTemplate(int userId, int templateId, DateTime date);

        Task<WorkoutSession> Start(int userId, int sessionId);

        Task<WorkoutSession> Finish(int userId, int sessionId);

        /// <summary>Reopens a finished session so more sets can be logged.</summary>
        Task<WorkoutSession> Reopen(int userId, int sessionId);

        Task<(UserExercise Entry, WorkoutSession Session)> LogSet(int userId, LogSetDto dto, decimal? userWeight = null);

        Task<decimal> RecalculateVolume(WorkoutSession session);
    }
}
