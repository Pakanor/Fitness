using ExerciseAPI.DTOs;

namespace ExerciseAPI.Interfaces
{
    public interface IRecordsService
    {
        // Analytics (delegate to RecordsAnalysis)
        Task<OneRepMaxProgressionResponseDto> Get1RMProgression(int userId);
        Task<ExerciseProgressResponseDto> GetExerciseProgress(int userId, int exerciseId, DateTime? startDate, DateTime? endDate);
        Task<GlobalAnalyticsResponseDto> GetOverview(int userId, DateTime? startDate, DateTime? endDate, string? timeZoneId = null);

        // Controller-direct (simple lookups)
        Task<IReadOnlyList<PersonalRecordDto>> GetHistory(int userId);
        Task<IReadOnlyList<ExerciseSearchDto>> SearchExercises(int userId, string query);
        Task<IReadOnlyList<PersonalRecordDto>> GetExerciseHistory(int userId, int exerciseId);
    }
}