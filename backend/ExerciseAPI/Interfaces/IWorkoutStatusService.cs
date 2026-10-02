using ExerciseAPI.Models;

namespace ExerciseAPI.Interfaces
{
    public interface IWorkoutStatusService
    {
        Task<WorkoutStatus?> GetWorkoutStatus(int userId, DateTime date);
        Task UpdateWorkoutStatus(int userId, DateTime date, WorkoutStatus status);
        Task<bool> IsWorkoutActive(int userId, DateTime date);
    }
}