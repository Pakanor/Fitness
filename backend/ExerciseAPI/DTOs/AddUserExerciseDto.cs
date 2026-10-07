namespace ExerciseAPI.DTOs
{
    public class AddUserExerciseDto
    {
        public int ExerciseId { get; set; }
        public int? Sets { get; set; }
        public int? Reps { get; set; }
        public decimal? Weight { get; set; }
        public DateTime? Date { get; set; }
        public decimal? RPE { get; set; }
        public bool IsWarmup { get; set; }
    }
}
