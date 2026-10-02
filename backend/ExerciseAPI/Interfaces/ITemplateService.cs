using ExerciseAPI.Models;

namespace ExerciseAPI.Interfaces
{
    public interface ITemplateService
    {
        Task<WorkoutTemplate> CreateTemplate(int userId, string name, List<int> exerciseIds);
        Task<WorkoutTemplate?> GetTemplateById(int templateId, int userId);
        Task<List<WorkoutTemplate>> GetUserTemplates(int userId);
        Task<WorkoutTemplate> UpdateTemplate(int templateId, int userId, string name, List<int> exerciseIds);
        Task<bool> DeleteTemplate(int templateId, int userId);
        Task<bool> TemplateExists(int templateId, int userId);
    }
}