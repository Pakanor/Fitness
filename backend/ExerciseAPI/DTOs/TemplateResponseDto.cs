namespace ExerciseAPI.DTOs
{
    public class TemplateResponseDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
        public List<TemplateExerciseDto> Exercises { get; set; } = new List<TemplateExerciseDto>();
    }

    public class TemplateExerciseDto
    {
        public int ExerciseId { get; set; }
        public string ExerciseName { get; set; } = string.Empty;
        public string Category { get; set; } = string.Empty;
        public int Order { get; set; }
    }
}