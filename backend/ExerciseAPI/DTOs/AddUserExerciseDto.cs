namespace ExerciseAPI.DTOs
{
    public class AddUserExerciseDto
    {
        public int ExerciseId { get; set; }
        public DateTime? Date { get; set; }

        /// <summary>Granular sets for this exercise. Each set carries its own weight, reps, rpe.</summary>
        public List<LogSingleSetDto>? Sets { get; set; }

        /// <summary>Legacy: Number of sets (deprecated, use Sets collection)</summary>
        public int? SetsCount { get; set; }

        /// <summary>Legacy: Reps per set (deprecated, use Sets collection)</summary>
        public int? Reps { get; set; }

        /// <summary>Legacy: Weight per set (deprecated, use Sets collection)</summary>
        public decimal? Weight { get; set; }

        /// <summary>Legacy: RPE per set (deprecated, use Sets collection)</summary>
        public decimal? RPE { get; set; }

        /// <summary>Legacy: Is warmup (deprecated, use Sets collection)</summary>
        public bool IsWarmup { get; set; }
    }
}