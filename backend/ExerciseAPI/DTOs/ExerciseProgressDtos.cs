namespace ExerciseAPI.DTOs
{
    public class ExerciseProgressPointDto
    {
        public string Date { get; set; } = "";
        public decimal MaxE1RM { get; set; }
        public decimal TopSetWeight { get; set; }
        public int TopSetReps { get; set; }
        public decimal? TopSetRpe { get; set; }
    }

    public class WeeklyHardSetsDto
    {
        public string Week { get; set; } = "";
        public decimal HardSets { get; set; }
    }

    public class RepRangeDistributionDto
    {
        public string Range { get; set; } = "";
        public decimal HardSets { get; set; }
    }

    public class MuscleAnalyticsDto
    {
        public string Key { get; set; } = "";
        public string Name { get; set; } = "";
        public List<WeeklyHardSetsDto> WeeklyHardSets { get; set; } = new();
        public List<RepRangeDistributionDto> RepRanges { get; set; } = new();
    }

    public class ExerciseProgressResponseDto
    {
        public int ExerciseId { get; set; }
        public string ExerciseName { get; set; } = "";
        public List<ExerciseProgressPointDto> DataPoints { get; set; } = new();
        public decimal AllTimeMaxE1RM { get; set; }
        public List<MuscleAnalyticsDto> MuscleAnalytics { get; set; } = new();
    }
}
