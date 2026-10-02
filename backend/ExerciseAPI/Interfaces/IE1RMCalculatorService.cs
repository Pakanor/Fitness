namespace ExerciseAPI.Interfaces
{
    public interface IE1RMCalculatorService
    {
        decimal CalculateEpley(decimal weight, int reps);

        decimal CalculateBest(decimal weight, int reps, decimal currentBest);

        bool IsValidSet(decimal weight, int reps);
    }
}
