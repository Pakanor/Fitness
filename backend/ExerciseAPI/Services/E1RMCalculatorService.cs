namespace ExerciseAPI.Services
{
    public class E1RMCalculatorService : Interfaces.IE1RMCalculatorService
    {
        public decimal CalculateEpley(decimal weight, int reps)
        {
            if (!IsValidSet(weight, reps)) return 0;
            if (reps == 1) return weight;

            return Math.Round(weight * (1 + reps / 30.0m), 2);
        }

        public decimal CalculateBrzycki(decimal weight, int reps, decimal? rpe = null)
        {
            if (!IsValidSet(weight, reps)) return 0;

            var effectiveReps = reps + (rpe.HasValue ? 10m - rpe.Value : 0m);
            var denominator = 1.0278m - 0.0278m * effectiveReps;
            if (denominator <= 0) return 0;

            return Math.Round(weight / denominator, 2);
        }

        public decimal CalculateBest(decimal weight, int reps, decimal currentBest)
        {
            var e1rm = CalculateEpley(weight, reps);
            return e1rm > currentBest ? e1rm : currentBest;
        }

        public decimal CalculateBest(decimal weight, int reps, decimal? rpe, decimal currentBest)
        {
            var e1rm = CalculateBrzycki(weight, reps, rpe);
            return e1rm > currentBest ? e1rm : currentBest;
        }

        public bool IsValidSet(decimal weight, int reps) => reps > 0 && weight >= 0;
    }
}
