namespace ExerciseAPI.Interfaces
{
    public interface IE1RMCalculatorService
    {
        decimal CalculateEpley(decimal weight, int reps);

        decimal CalculateBrzycki(decimal weight, int reps, decimal? rpe = null);

        decimal CalculateBest(decimal weight, int reps, decimal currentBest);

        decimal CalculateBest(decimal weight, int reps, decimal? rpe, decimal currentBest);

        bool IsValidSet(decimal weight, int reps);
    }
}
