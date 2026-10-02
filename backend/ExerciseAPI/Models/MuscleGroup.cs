using System.ComponentModel.DataAnnotations;

namespace ExerciseAPI.Models
{
    public class MuscleGroup
    {
        [Key]
        public string Key { get; set; }
        public string NamePl { get; set; }
        public bool IsFront { get; set; }
        public double HalfLife { get; set; }
    }
}
