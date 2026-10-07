namespace ExerciseAPI.DTOs
{
    public class ExerciseProgressPointDto
    {
        public string Date { get; set; } = "";
        public decimal MaxE1RM { get; set; }
        public decimal TopSetWeight { get; set; }
        public int TopSetReps { get; set; }
        public decimal? TopSetRpe { get; set; }
        public bool HasRpe { get; set; }
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

    public class ExerciseWorkloadPointDto
    {
        public string Date { get; set; } = "";
        public decimal Tonnage { get; set; }
        public int Repetitions { get; set; }
        public decimal AverageReps { get; set; }
        public decimal HardSets { get; set; }
    }

    public class ExerciseRepRangeDto
    {
        public string Range { get; set; } = "";
        public decimal Sets { get; set; }
    }

    public class ExerciseProgressResponseDto
    {
        public int ExerciseId { get; set; }
        public string ExerciseName { get; set; } = "";
        public List<ExerciseProgressPointDto> DataPoints { get; set; } = new();
        public decimal AllTimeMaxE1RM { get; set; }
        public List<MuscleAnalyticsDto> MuscleAnalytics { get; set; } = new();
        public List<ExerciseWorkloadPointDto> Workload { get; set; } = new();
        public List<ExerciseRepRangeDto> RepRanges { get; set; } = new();
        public decimal AllTimePrWeight { get; set; }
        public int AllTimePrReps { get; set; }
        public decimal TotalSets { get; set; }
        public string? LastPerformedDate { get; set; }
    }

    public class GlobalMuscleVolumeDto
    {
        public string Key { get; set; } = "";
        public string Name { get; set; } = "";
        public decimal HardSets { get; set; }
    }

    public class TrainingActivityDayDto
    {
        public string Date { get; set; } = "";
        public decimal HardSets { get; set; }
    }

    public class WeeklyTrainingTrendDto
    {
        public string Week { get; set; } = "";
        public decimal HardSets { get; set; }
        public decimal? AverageRpe { get; set; }
    }

    public class GlobalAnalyticsResponseDto
    {
        public List<GlobalMuscleVolumeDto> MuscleVolume { get; set; } = new();
        public List<TrainingActivityDayDto> Activity { get; set; } = new();
        public List<WeeklyTrainingTrendDto> WeeklyTrend { get; set; } = new();
    }
}
