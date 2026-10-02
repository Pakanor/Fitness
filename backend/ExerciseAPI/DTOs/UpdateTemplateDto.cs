namespace ExerciseAPI.DTOs
{
    public class UpdateTemplateDto
    {
        public string Name { get; set; } = string.Empty;
        public List<int> ExerciseIds { get; set; } = new List<int>();
    }
}