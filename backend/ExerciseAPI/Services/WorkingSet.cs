using ExerciseAPI.Models;

namespace ExerciseAPI.Services
{
    public readonly record struct WorkingSetInput
    {
        public decimal Weight { get; init; }
        public int Reps { get; init; }
        public decimal? Rpe { get; init; }
        public SetType SetType { get; init; }
    }

    public static class WorkingSet
    {
        private const decimal HardSetThreshold = 0.5m;

        public static bool Counts(WorkingSetInput set, decimal? bestE1RM = null)
        {
            if (set.Reps <= 0 || set.Weight <= 0m)
                return false;

            if (set.SetType == SetType.Warmup)
                return false;

            var best = bestE1RM ?? 0m;
            return best <= 0m || set.Weight >= best * HardSetThreshold;
        }

        public static IReadOnlyList<WorkingSetInput> Select(IEnumerable<WorkingSetInput> sets, decimal? bestE1RM = null)
        {
            return sets.Where(s => Counts(s, bestE1RM)).ToList();
        }

        public static decimal GetBestE1RM(IEnumerable<WorkingSetInput> sets)
        {
            return Performance.SessionBest(
                sets.Select(s => new PerformanceSet(s.Weight, s.Reps, s.Rpe))) ?? 0m;
        }
    }
}