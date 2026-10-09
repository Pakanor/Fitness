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

        /// <summary>Individual set data. Use this for logging individual sets.</summary>
        public LogSingleSetDto? Set { get; set; }

        /// <summary>Multiple sets for bulk logging. If provided, Set is ignored.</summary>
        public List<LogSingleSetDto>? Sets { get; set; }

        /// <summary>Legacy: Number of sets (deprecated, use Sets collection)</summary>
        [Range(1, 100)]
        public int? SetsCount { get; set; }

        /// <summary>Legacy: Reps per set (deprecated, use Sets collection)</summary>
        [Range(1, 1000)]
        public int? Reps { get; set; }

        /// <summary>Legacy: Weight per set (deprecated, use Sets collection)</summary>
        [Range(0, 1000)]
        public decimal? Weight { get; set; }

        /// <summary>Legacy: RPE per set (deprecated, use Sets collection)</summary>
        [Range(typeof(decimal), "1", "10")]
        public decimal? RPE { get; set; }

        /// <summary>Legacy: Is warmup (deprecated, use Sets collection)</summary>
        public bool IsWarmup { get; set; }
    }

    public class LogSingleSetDto
    {
        [Range(1, 100)]
        public int SetNumber { get; set; }

        [Range(1, 1000)]
        public int Reps { get; set; }

        [Range(0, 1000)]
        public decimal Weight { get; set; }

        [Range(typeof(decimal), "1", "10")]
        public decimal? RPE { get; set; }

        public bool IsWarmup { get; set; } = false;
    }

    public class SessionExerciseDto
    {
        public int UserExerciseId { get; set; }
        public int ExerciseId { get; set; }
        public string ExerciseName { get; set; } = string.Empty;
        public string Category { get; set; } = string.Empty;
        public string GifUrl { get; set; } = string.Empty;
        
        /// <summary>Individual sets for this exercise</summary>
        public List<SessionSetDto> Sets { get; set; } = new();

        /// <summary>Legacy: Total sets count (deprecated)</summary>
        public int? SetsCount { get; set; }

        /// <summary>Legacy: Reps per set (deprecated)</summary>
        public int? Reps { get; set; }

        /// <summary>Legacy: Weight per set (deprecated)</summary>
        public decimal? Weight { get; set; }

        /// <summary>Legacy: RPE per set (deprecated)</summary>
        public decimal? RPE { get; set; }

        /// <summary>Legacy: Is warmup (deprecated)</summary>
        public bool IsWarmup { get; set; }

        /// <summary>Legacy: Total volume (deprecated, use Sets sum)</summary>
        public decimal Volume { get; set; }
    }

    public class SessionSetDto
    {
        public int Id { get; set; }
        public int SetNumber { get; set; }
        public decimal Weight { get; set; }
        public int Reps { get; set; }
        public decimal? RPE { get; set; }
        public bool IsWarmup { get; set; }
        public decimal Volume => Weight * Reps;
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
