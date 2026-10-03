namespace ExerciseAPI.Models
{
    /// <summary>
    /// A single workout session on a given day. Created as Planned (from a template),
    /// moved to InProgress when the user starts it and finally to Completed.
    /// Only sets logged in InProgress/Completed sessions count towards statistics.
    /// </summary>
    public class WorkoutSession
    {
        public int Id { get; set; }
        public int UserId { get; set; }
        public DateTime Date { get; set; }
        public WorkoutStatus Status { get; set; } = WorkoutStatus.Planned;
        public int? TemplateId { get; set; }
        public WorkoutStartMode StartMode { get; set; } = WorkoutStartMode.FromTemplate;
        public decimal TotalVolume { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
        public DateTime? StartedAt { get; set; }
        public DateTime? CompletedAt { get; set; }

        public WorkoutTemplate? Template { get; set; }
        public ICollection<UserExercise> Exercises { get; set; } = new List<UserExercise>();

        /// <summary>Volume = sum(sets * reps * weight) over exercises with all three values.</summary>
        public const decimal EmptyVolume = 0m;

        public bool IsLocked => Status != WorkoutStatus.InProgress;
    }
}
