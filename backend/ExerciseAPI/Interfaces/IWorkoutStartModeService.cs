using ExerciseAPI.Models;

namespace ExerciseAPI.Interfaces
{
    public interface IWorkoutStartModeService
    {
        Task<List<UserExercise>> GetPreviousWorkoutExercises(int userId);
        Task<List<UserExercise>> GetPreviousWorkoutByTemplate(int userId, int templateId);
        Task<List<UserExercise>> CreateWorkoutFromTemplate(int userId, int templateId);
        Task<List<UserExercise>> CopyPreviousWorkout(int userId, int? templateId = null);
    }
}