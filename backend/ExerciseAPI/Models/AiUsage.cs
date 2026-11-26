using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ExerciseAPI.Models
{
    public class AiUsage
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public int UserId { get; set; }

        [Required]
        [MaxLength(7)]
        // Format: "yyyy-MM" (e.g., "2026-11")
        public string Month { get; set; } = "";

        [Required]
        public int RequestCount { get; set; } = 0;

        [Required]
        [Column(TypeName = "decimal(10,4)")]
        public decimal EstimatedCostUsd { get; set; } = 0m;
    }
}