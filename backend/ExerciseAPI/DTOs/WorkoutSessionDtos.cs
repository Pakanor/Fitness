using System.ComponentModel.DataAnnotations;

namespace ExerciseAPI.DTOs
{
    public class CreateSessionFromTemplateDto
    {
        [Required]
        public DateTime Date { get; set; }
    }

    public class LogSetDto
    {
        [Range(1, int.MaxValue)]
        public int SessionId { get; set; }

        /// <summary>Existing session item to update. When null a new item is created.</summary>
        public int? UserExerciseId { get; set; }

        [Range(1, int.MaxValue)]
        public int ExerciseId { get; set; }

        [Range(1, 100)]
        public int? Sets { get; set; }

        [Range(1, 1000)]
        public int? Reps { get; set; }

        [Range(0, 1000)]
        public decimal? Weight { get; set; }

        [Range(typeof(decimal), "1", "10")]
        public decimal? RPE { get; set; }
    }

    public class SessionExerciseDto
    {
        public int UserExerciseId { get; set; }
        public int ExerciseId { get; set; }
        public string ExerciseName { get; set; } = string.Empty;
        public string Category { get; set; } = string.Empty;
        public string GifUrl { get; set; } = string.Empty;
        public int? Sets { get; set; }
        public int? Reps { get; set; }
        public decimal? Weight { get; set; }
        public decimal? RPE { get; set; }
        public decimal Volume { get; set; }
    }

    public class WorkoutSessionResponseDto
    {
        public int Id { get; set; }
        public int UserId { get; set; }
        public DateTime Date { get; set; }

        /// <summary>planned | in_progress | completed</summary>
        public string Status { get; set; } = string.Empty;

        public int? TemplateId { get; set; }
        public string? TemplateName { get; set; }
        public string StartMode { get; set; } = string.Empty;
        public decimal TotalVolume { get; set; }
        public int ExerciseCount { get; set; }
        public bool CanLogSets { get; set; }

        /// <summary>True for a finished session, which can be reopened to log more sets.</summary>
        public bool CanReopen { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
        public DateTime? StartedAt { get; set; }
        public DateTime? CompletedAt { get; set; }
        public List<SessionExerciseDto> Exercises { get; set; } = new List<SessionExerciseDto>();
    }
}
