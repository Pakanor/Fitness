using ExerciseAPI.Data;
using ExerciseAPI.Models;
using Microsoft.EntityFrameworkCore;

namespace ExerciseAPI.Services
{
    public sealed class ExerciseStartupSeeder : IHostedService
    {
        private static readonly (int ExerciseId, string MuscleGroupKey, decimal WeightPercentage)[] SeedMappings =
        [
            (1028, "lower_back", 40),
            (1028, "glutes", 30),
            (1028, "hamstrings", 30),
            (1111, "glutes", 40),
            (1111, "hamstrings", 30),
            (1111, "quadriceps", 20),
            (1111, "lower_back", 10)
        ];

        private readonly IServiceScopeFactory _scopeFactory;
        private readonly ExerciseDbImportService _importService;
        private readonly ILogger<ExerciseStartupSeeder> _logger;

        public ExerciseStartupSeeder(IServiceScopeFactory scopeFactory, ExerciseDbImportService importService, ILogger<ExerciseStartupSeeder> logger)
        {
            _scopeFactory = scopeFactory;
            _importService = importService;
            _logger = logger;
        }

        public async Task StartAsync(CancellationToken cancellationToken)
        {
            using var scope = _scopeFactory.CreateScope();
            var context = scope.ServiceProvider.GetRequiredService<AppDbContext>();

            await _importService.ImportExercisesAsync();
            await SeedExerciseMuscleGroupsAsync(context, cancellationToken);
        }

        public Task StopAsync(CancellationToken cancellationToken) => Task.CompletedTask;

        private async Task SeedExerciseMuscleGroupsAsync(AppDbContext context, CancellationToken cancellationToken)
        {
            if (!await context.Exercises.AnyAsync(cancellationToken))
            {
                _logger.LogWarning("Exercise seeder skipped because no exercises are available yet.");
                return;
            }

            foreach (var seed in SeedMappings)
            {
                var exists = await context.ExerciseMuscleGroups.AnyAsync(
                    emg => emg.ExerciseId == seed.ExerciseId && emg.MuscleGroupKey == seed.MuscleGroupKey,
                    cancellationToken);

                if (exists)
                    continue;

                var exerciseExists = await context.Exercises.AnyAsync(e => e.Id == seed.ExerciseId, cancellationToken);
                var muscleExists = await context.MuscleGroups.AnyAsync(mg => mg.Key == seed.MuscleGroupKey, cancellationToken);

                if (!exerciseExists || !muscleExists)
                {
                    _logger.LogWarning(
                        "Skipping ExerciseMuscleGroup seed {ExerciseId}/{MuscleGroupKey} because a parent row is missing.",
                        seed.ExerciseId,
                        seed.MuscleGroupKey);
                    continue;
                }

                context.ExerciseMuscleGroups.Add(new ExerciseMuscleGroup
                {
                    ExerciseId = seed.ExerciseId,
                    MuscleGroupKey = seed.MuscleGroupKey,
                    WeightPercentage = seed.WeightPercentage
                });
            }

            await context.SaveChangesAsync(cancellationToken);
        }
    }
}