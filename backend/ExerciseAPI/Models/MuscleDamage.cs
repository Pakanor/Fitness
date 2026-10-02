using System.ComponentModel.DataAnnotations;

namespace ExerciseAPI.Models
{
    public class MuscleDamage
    {
        [Key]
        public int Id { get; set; }

        public int UserId { get; set; }

        public string MuscleGroupKey { get; set; } = "";

        public DateTime SessionDate { get; set; }

        public double DamagePercent { get; set; }

        public bool IsPrimary { get; set; }
    }
}
