namespace ExerciseAPI.DTOs
{
    public class AnalyticsDashboardDto
    {
        public string WeekStart { get; set; }
        public string WeekEnd { get; set; }
        public List<MuscleVolumeLandmarkDto> VolumeLandmarks { get; set; } = new();
        public List<SfrRankingDto> TopSfr { get; set; } = new();
        public List<SfrRankingDto> BottomSfr { get; set; } = new();
        public decimal AnteriorSets { get; set; }
        public decimal PosteriorSets { get; set; }
        public decimal AnteriorPercentage { get; set; }
        public decimal PosteriorPercentage { get; set; }
        public string? BalanceWarning { get; set; }
    }
}
