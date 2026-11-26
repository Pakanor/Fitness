namespace ExerciseAPI.Models
{
    public class WorkoutSet
    {
        public int Id { get; set; }

        public int UserExerciseId { get; set; }

        public int SetNumber { get; set; }

        public decimal Weight { get; set; }

        public int Reps { get; set; }

        public decimal? RPE { get; set; }

        public SetType SetType { get; set; } = SetType.Normal;

        public int? DurationSeconds { get; set; }

        public UserExercise UserExercise { get; set; } = null!;
    }
}