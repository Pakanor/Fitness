namespace ExerciseAPI.DTOs
{
    public class MuscleStatsDto
    {
        public string NameKey { get; set; }
        public string NamePl { get; set; }
        public decimal Volume { get; set; }
        public decimal FatiguePercentage { get; set; }
        public bool IsFront { get; set; }
    }
}
