namespace ExerciseAPI.Models
{
    /// <summary>
    /// A single workout set flattened with its owning exercise context, ready for
    /// in-memory analysis. The adapter (<see cref="ExerciseAPI.Services.RecordsService"/>)
    /// builds these from EF entities; the pure core (<see cref="ExerciseAPI.Services.RecordsAnalysis"/>)
    /// consumes them without touching the database.
    /// </summary>
    public record SetRecord(
        DateTime Date,
        int ExerciseId,
        decimal Weight,
        int Reps,
        decimal? Rpe,
        SetType SetType,
        string ExerciseName,
        string ExerciseCategory,
        bool IsBenchmark,
        IReadOnlyList<(string Key, string Name, decimal Weight)> MuscleWeights);
}