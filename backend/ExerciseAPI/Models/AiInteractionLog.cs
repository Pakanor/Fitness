using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ExerciseAPI.Models
{
    public class AiInteractionLog
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public int UserId { get; set; }

        [Required]
        [MaxLength(50)]
        public string Domain { get; set; } = "";

        [Required]
        [MaxLength(2000)]
        public string UserText { get; set; } = "";

        [Required]
        [Column(TypeName = "text")]
        public string AiResponseJson { get; set; } = "";

        public int? ChosenExerciseId { get; set; }

        [Required]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        [ForeignKey(nameof(ChosenExerciseId))]
        public Exercise? ChosenExercise { get; set; }
    }
}