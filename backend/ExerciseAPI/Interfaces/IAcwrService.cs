namespace ExerciseAPI.Interfaces
{
    public interface IAcwrService
    {
        System.Threading.Tasks.Task<ExerciseAPI.DTOs.AcwrResultDto> GetAcwrAsync(int userId, double weightKg, string trainingExperience);
    }

    public interface IMuscleRecoveryService
    {
        System.Threading.Tasks.Task<System.Collections.Generic.List<ExerciseAPI.DTOs.MuscleRecoveryDto>> ComputeAsync(int userId);
    }

    public interface IMuscleDamageService
    {
        // Recomputes (idempotently, by replaying all completed sessions) the stored
        // per-muscle Damage% for the user. `sessionDay` is the day that triggered
        // the recompute; the full history is always rebuilt.
        System.Threading.Tasks.Task RecordSessionDamageAsync(int userId, System.DateTime sessionDay);
    }
}
