namespace ExerciseAPI.Services
{
    public class OneRepMaxCalculator
    {
        public decimal CalculateEpley(decimal weight, int reps)
        {
            if (weight <= 0 || reps <= 0) return 0;
            return Math.Round(weight * (1 + reps / 30.0m), 2);
        }

        public decimal CalculateBestSession1RM(IEnumerable<(decimal Weight, int Reps)> sets)
        {
            decimal best = 0;
            foreach (var set in sets)
            {
                decimal rm = CalculateEpley(set.Weight, set.Reps);
                if (rm > best) best = rm;
            }
            return best;
        }
    }
}
