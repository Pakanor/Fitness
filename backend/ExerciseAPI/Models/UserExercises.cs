namespace ExerciseAPI.Models
{
    public class UserExercise
    {
        public int Id { get; set; }

        public int UserId { get; set; }      
        public int ExerciseId { get; set; }  

        public DateTime Date { get; set; }

        public WorkoutStartMode? StartMode { get; set; }
        public int? TemplateId { get; set; }
        public WorkoutStatus? Status { get; set; }

        public int? SessionId { get; set; }

        public Exercise? Exercise { get; set; }
        public WorkoutSession? Session { get; set; }
        public ICollection<WorkoutSet> Sets { get; set; } = new List<WorkoutSet>();
    }
}