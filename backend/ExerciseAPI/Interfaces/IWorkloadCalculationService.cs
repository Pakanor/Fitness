using ExerciseAPI.Models;

namespace ExerciseAPI.Interfaces
{
    public interface IWorkloadCalculationService
    {
        Task<decimal> CalculateTonnage(int userId, DateTime date);
        Task<decimal> CalculateWorkload(int userId, DateTime date);
        Task<decimal> GetUserAverageWorkload(int userId, int sessionCount = 5);
        Task<bool> IsWorkloadAboveAverage(int userId, decimal currentWorkload);
    }
}