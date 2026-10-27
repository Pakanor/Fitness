namespace ExerciseAPI.Services
{
    public static class E1RMCalculator
    {
        public static decimal? CalculateE1RM(decimal weight, int reps, decimal? rpe = null)
        {
            if (!IsValidSet(weight, reps)) return 0;
            var rir = rpe.HasValue ? Math.Clamp(10m - rpe.Value, 0m, 4m) : 0m;
            var effectiveReps = reps + rir;
            if (effectiveReps > 12) return null;
            if (effectiveReps == 1) return weight;
            return Math.Round(weight * (1 + effectiveReps / 30.0m), 2);
        }

        public static decimal CalculateBest(decimal weight, int reps, decimal currentBest)
        {
            var e1rm = CalculateE1RM(weight, reps);
            return e1rm.HasValue && e1rm.Value > currentBest ? e1rm.Value : currentBest;
        }

        public static decimal CalculateBest(decimal weight, int reps, decimal? rpe, decimal currentBest)
        {
            var e1rm = CalculateE1RM(weight, reps, rpe);
            return e1rm.HasValue && e1rm.Value > currentBest ? e1rm.Value : currentBest;
        }

        public static decimal CalculateBestSession1RM(IEnumerable<(decimal Weight, int Reps)> sets)
        {
            decimal best = 0;
            foreach (var set in sets)
            {
                var rm = CalculateE1RM(set.Weight, set.Reps);
                if (rm.HasValue && rm.Value > best) best = rm.Value;
            }
            return best;
        }

        public static bool IsValidSet(decimal weight, int reps) => reps > 0 && weight >= 0;
    }
}