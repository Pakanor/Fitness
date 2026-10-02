namespace ExerciseAPI.Models
{
    public class WorkoutTemplate
    {
        public int Id { get; set; }
        public int UserId { get; set; }
        public string Name { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
        
        public ICollection<TemplateExercise> TemplateExercises { get; set; } = new List<TemplateExercise>();
    }
}