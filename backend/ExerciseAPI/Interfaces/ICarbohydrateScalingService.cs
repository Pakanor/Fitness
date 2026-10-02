using ExerciseAPI.Interfaces;

namespace ExerciseAPI.Interfaces
{
    public interface ICarbohydrateScalingService
    {
        Task<decimal> CalculatePostWorkoutCarbs(int userId, decimal bodyWeight, DateTime workoutDate);
        Task<Dictionary<int, decimal>> AdjustDailyMealCarbs(int userId, decimal additionalCarbs, DateTime date);
        Task<decimal?> GetAcwrValue(int userId);
        decimal AcwrThreshold { get; }
    }
}