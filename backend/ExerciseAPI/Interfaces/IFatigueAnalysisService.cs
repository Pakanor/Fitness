using ExerciseAPI.Models;

namespace ExerciseAPI.Interfaces
{
    public interface IFatigueAnalysisService
    {
        Task<List<MuscleDamageDto>> GetMuscleDamageAsync(int userId, DateTime? startDate = null, DateTime? endDate = null);
        Task<List<MuscleGroupDto>> GetMuscleGroupsAsync();
    }

    public class MuscleDamageDto
    {
        public string MuscleGroupKey { get; set; } = "";
        public string MuscleGroupName { get; set; } = "";
        public DateTime SessionDate { get; set; }
        public double DamagePercent { get; set; }
        public bool IsPrimary { get; set; }
    }

    public class MuscleGroupDto
    {
        public string Key { get; set; } = "";
        public string NamePl { get; set; } = "";
        public bool IsFront { get; set; }
        public double HalfLife { get; set; }
    }
}