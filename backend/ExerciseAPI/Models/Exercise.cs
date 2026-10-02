using System.ComponentModel.DataAnnotations;

namespace ExerciseAPI.Models
{
    public class Exercise
    {
        [Key]
        public int Id { get; set; }
        public string? ExternalId { get; set; }
        public string Name { get; set; } = "";
        public string? Description { get; set; }
        public string Category { get; set; } = "";
        public string? ImageUrl { get; set; }
        public string? GifUrl { get; set; }

        public decimal ChestMain { get; set; }
        public decimal DeltoidAnterior { get; set; }
        public decimal DeltoidLateral { get; set; }
        public decimal DeltoidPosterior { get; set; }
        public decimal Biceps { get; set; }
        public decimal Triceps { get; set; }
        public decimal Forearms { get; set; }
        public decimal Lats { get; set; }
        public decimal Rhomboids { get; set; }
        public decimal LowerBack { get; set; }
        public decimal Abs { get; set; }
        public decimal CoreStabilizers { get; set; }
        public decimal Quadriceps { get; set; }
        public decimal Hamstrings { get; set; }
        public decimal Glutes { get; set; }
        public decimal Calves { get; set; }

        public bool IsBenchmark { get; set; }

        public ICollection<ExerciseMuscleGroup> MuscleGroupMappings { get; set; } = new List<ExerciseMuscleGroup>();
    }
}
