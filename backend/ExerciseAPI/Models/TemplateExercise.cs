namespace ExerciseAPI.Models
{
    public class TemplateExercise
    {
        public int Id { get; set; }
        public int TemplateId { get; set; }
        public int ExerciseId { get; set; }
        public int Order { get; set; }
        
        public WorkoutTemplate Template { get; set; } = null!;
        public Exercise Exercise { get; set; } = null!;
    }
}