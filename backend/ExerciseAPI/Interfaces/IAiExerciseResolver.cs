using ExerciseAPI.DTOs;

namespace ExerciseAPI.Interfaces
{
    public interface IAiExerciseResolver
    {
        Task<AiExerciseResponseDto> ResolveAsync(int userId, string text, string domain, string language);
    }
}