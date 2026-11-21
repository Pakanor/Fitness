namespace ExerciseAPI.Models
{
    public record SetRecord
    {
        public DateTime Date { get; init; }
        public decimal Weight { get; init; }
        public int Reps { get; init; }
        public decimal? Rpe { get; init; }
        public SetType SetType { get; init; }
        public Exercise? Exercise { get; init; }
        public int ExerciseId { get; init; }
    }
}