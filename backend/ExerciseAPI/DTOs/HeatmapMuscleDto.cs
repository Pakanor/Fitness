namespace ExerciseAPI.DTOs
{
    public class HeatmapMuscleDto
    {
        public string NameKey { get; set; }
        public string NamePl { get; set; }
        public bool IsFront { get; set; }
        public double CooldownPercent { get; set; }
        public int CooldownRemainingMinutes { get; set; }
        public int WeeklyVolumeSets { get; set; }
        public int VolumeGoalSets { get; set; }
        public decimal? EstimatedOneRM { get; set; }
        public int? BaseExerciseId { get; set; }
    }
}
