using System.ComponentModel.DataAnnotations;

namespace ExerciseAPI.Models
{
    public class ExerciseMuscleGroup
    {
        [Key]
        public int Id { get; set; }

        public int ExerciseId { get; set; }
        public Exercise Exercise { get; set; }

        public string MuscleGroupKey { get; set; }
        public MuscleGroup MuscleGroup { get; set; }
        public decimal WeightPercentage { get; set; }
    }
}
