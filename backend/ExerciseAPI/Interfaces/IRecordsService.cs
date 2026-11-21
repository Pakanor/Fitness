using ExerciseAPI.DTOs;

namespace ExerciseAPI.Interfaces
{
    public interface IRecordsService
    {
        Task<OneRepMaxProgressionResponseDto> Get1RMProgression(int userId);
        Task<ExerciseProgressResponseDto> GetExerciseProgress(int userId, int exerciseId, DateTime? startDate, DateTime? endDate);
        Task<GlobalAnalyticsResponseDto> GetOverview(int userId, DateTime? startDate, DateTime? endDate, string? timeZoneId = null);
    }
}