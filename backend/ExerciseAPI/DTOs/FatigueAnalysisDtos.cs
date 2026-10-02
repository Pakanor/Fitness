using ExerciseAPI.Models;

namespace ExerciseAPI.DTOs
{
    public class FatigueAnalysisResponseDto
    {
        public AcwrResultDto Acwr { get; set; } = new();
        public List<MuscleRecoveryDto> MuscleRecovery { get; set; } = new();
    }

    public class AcwrResultDto
    {
        public double Ratio { get; set; }
        public double AcuteLoad { get; set; }
        public double ChronicLoad { get; set; }
        public string Status { get; set; } = "";
        public string? Alert { get; set; }
        public bool InsufficientData { get; set; }
        public bool ColdStart { get; set; }
        public int BaselineCollectionDaysRemaining { get; set; }
        public double EstimatedBaseline { get; set; }
        public List<DailyWorkloadDto> DailyWorkload { get; set; } = new();
    }

    public class DailyWorkloadDto
    {
        public DateTime Date { get; set; }
        public double Workload { get; set; }
    }

    public class MuscleRecoveryDto
    {
        public string MuscleGroupKey { get; set; } = "";
        public string NamePl { get; set; } = "";
        public string Category { get; set; } = "";
        public double TMaxHours { get; set; }
        public double Lambda { get; set; }
        public double DamagePercent { get; set; }
        public DateTime SessionTimestamp { get; set; }
        public double RecoveryPercent { get; set; }
        public double ElapsedHours { get; set; }
        public double RemainingHours { get; set; }
    }
}
