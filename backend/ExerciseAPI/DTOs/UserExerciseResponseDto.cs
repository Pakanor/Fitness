namespace ExerciseAPI.DTOs
{
    public class UserExerciseResponseDto
    {
        public int Id { get; set; }
        public int ExerciseId { get; set; }

        /// <summary>Individual sets for this exercise entry.</summary>
        public List<SessionSetDto>? Sets { get; set; }

        /// <summary>Legacy: Total sets count (deprecated, use Sets)</summary>
        public int? SetsCount { get; set; }

        /// <summary>Legacy: Reps per set (deprecated, use Sets)</summary>
        public int? Reps { get; set; }

        /// <summary>Legacy: Weight per set (deprecated, use Sets)</summary>
        public decimal? Weight { get; set; }

        public DateTime Date { get; set; }

        /// <summary>Legacy: RPE per set (deprecated, use Sets)</summary>
        public decimal? RPE { get; set; }

        /// <summary>Legacy: Is warmup (deprecated, use Sets)</summary>
        public bool IsWarmup { get; set; }
    }
}