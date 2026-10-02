namespace ExerciseAPI.Models
{
    public class PersonalRecord
    {
        public int Id { get; set; }
        public int UserId { get; set; }
        public int ExerciseId { get; set; }
        public decimal Weight { get; set; }
        public int Reps { get; set; }
        public DateTime Date { get; set; }
        public decimal? UserWeightAtTime { get; set; }
        public int? UserAgeAtTime { get; set; }
        public int? DietStatusAtTime { get; set; }
        public decimal? StrengthToWeightRatio { get; set; }
    }
}
