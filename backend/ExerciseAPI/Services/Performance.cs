namespace ExerciseAPI.Services
{
    /// <summary>
    /// Single owner of the estimated 1RM formula and PR semantics.
    ///
    /// A PR is the best estimated 1RM ever recorded for an exercise, so a set
    /// like 100 x 6 beats 110 x 1 even though it uses less weight. Warmup and
    /// hard-set filtering belongs to <see cref="WorkingSet"/>; this module
    /// computes a value for every positive set it is given.
    ///
    /// Error contract: anything that cannot produce a meaningful e1RM
    /// (weight &lt;= 0, reps &lt;= 0, more than 12 effective reps after RIR)
    /// returns null instead of 0 or an exception.
    /// </summary>
    public static class Performance
    {
        private const decimal MaxEffectiveReps = 12m;
        private const decimal MaxRepsInReserve = 4m;

        public static decimal? E1RM(PerformanceSet set)
        {
            if (set.Weight <= 0m || set.Reps <= 0)
                return null;

            var rir = set.Rpe.HasValue
                ? Math.Clamp(10m - set.Rpe.Value, 0m, MaxRepsInReserve)
                : 0m;
            var effectiveReps = set.Reps + rir;

            if (effectiveReps > MaxEffectiveReps)
                return null;

            if (effectiveReps == 1)
                return set.Weight;

            return Math.Round(set.Weight * (1 + effectiveReps / 30.0m), 2);
        }

        public static decimal? SessionBest(IEnumerable<PerformanceSet> sets)
        {
            decimal? best = null;
            foreach (var set in sets)
            {
                var e1rm = E1RM(set);
                if (e1rm.HasValue && (!best.HasValue || e1rm.Value > best.Value))
                    best = e1rm;
            }
            return best;
        }

        public static PrOutcome EvaluatePr(PerformanceSet set, PreviousPr? previousPr)
        {
            var e1rm = E1RM(set);
            if (!e1rm.HasValue)
                return new PrOutcome(false, null, previousPr?.Estimated1RM);

            if (previousPr == null)
                return new PrOutcome(true, e1rm, null);

            var isPr = e1rm.Value > previousPr.Value.Estimated1RM
                || (e1rm.Value == previousPr.Value.Estimated1RM && set.Weight > previousPr.Value.Weight);

            return new PrOutcome(isPr, e1rm, previousPr.Value.Estimated1RM);
        }
    }

    public readonly record struct PerformanceSet(decimal Weight, int Reps, decimal? Rpe = null);

    public readonly record struct PreviousPr(decimal Estimated1RM, decimal Weight, int Reps);

    public readonly record struct PrOutcome(bool IsPr, decimal? Estimated1RM, decimal? PreviousEstimated1RM);
}
