using ExerciseAPI.Data;
using ExerciseAPI.Interfaces;
using ExerciseAPI.Models;
using ExerciseAPI.Services;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace ExerciseAPI.Tests.Services
{
    public class MuscleRecoveryServiceTests
    {
        private static AppDbContext NewContext() =>
            new AppDbContext(new DbContextOptionsBuilder<AppDbContext>()
                .UseInMemoryDatabase(Guid.NewGuid().ToString()).Options);

        private static Exercise Bench() => new Exercise
        {
            Id = 1,
            Name = "Bench",
            ChestMain = 1,
            Biceps = 1,
        };

        [Fact]
        public void ComputeRecovery_AtT0_Equals100MinusDamage()
        {
            var (recovery, _) = MuscleRecoveryService.ComputeRecovery(40, 0.05, 0);
            Assert.InRange(recovery, 59.9, 60.1);
        }

        [Fact]
        public void ComputeRecovery_ZeroDamage_ReturnsFullRecovery()
        {
            var (recovery, remaining) = MuscleRecoveryService.ComputeRecovery(0, 0.05, 10);
            Assert.Equal(100, recovery);
            Assert.Equal(0, remaining);
        }

        [Fact]
        public void ComputeRecovery_RemainingTime_EqualsTimeTo98Percent()
        {
            // Damage 40%, lambda 0.05 -> t_98 = ln(2/40) / -0.05 ~= 59.9h.
            var (_, remaining) = MuscleRecoveryService.ComputeRecovery(40, 0.05, 0);
            Assert.InRange(remaining, 59.8, 60.0);
        }

        [Fact]
        public void ComputeRecovery_LargeElapsed_ApproachesFull()
        {
            var (recovery, remaining) = MuscleRecoveryService.ComputeRecovery(40, 0.05, 1000);
            Assert.InRange(recovery, 99.9, 100);
            Assert.Equal(0, remaining);
        }

        [Fact]
        public async Task RecordAndCompute_CapsDamageAt100()
        {
            var ctx = NewContext();
            ctx.Exercises.Add(Bench());
            // 50 sets @ RPE 10 -> far above the 100% cap for the primary chest.
            for (int i = 0; i < 50; i++)
                ctx.UserExercise.Add(new UserExercise
                {
                    UserId = 1,
                    ExerciseId = 1,
                    Date = DateTime.UtcNow.Date,
                    Sets = 1,
                    RPE = 10,
                    Status = WorkoutStatus.Completed,
                });
            await ctx.SaveChangesAsync();

            IMuscleDamageService damage = new MuscleDamageService(ctx);
            await damage.RecordSessionDamageAsync(1, DateTime.UtcNow.Date);

            var svc = new MuscleRecoveryService(ctx);
            var result = await svc.ComputeAsync(1);

            Assert.Contains(result, r => r.MuscleGroupKey == "chest_main" && r.DamagePercent == 100);
        }

        [Fact]
        public async Task RecordAndCompute_PrimaryHeavierThanSecondary()
        {
            var ctx = NewContext();
            ctx.Exercises.Add(new Exercise { Id = 1, Name = "Bench", ChestMain = 1, Biceps = 0.5m });
            for (int i = 0; i < 15; i++)
                ctx.UserExercise.Add(new UserExercise
                {
                    UserId = 1,
                    ExerciseId = 1,
                    Date = DateTime.UtcNow.Date,
                    Sets = 1,
                    RPE = 8,
                    Status = WorkoutStatus.Completed,
                });
            await ctx.SaveChangesAsync();

            IMuscleDamageService damage = new MuscleDamageService(ctx);
            await damage.RecordSessionDamageAsync(1, DateTime.UtcNow.Date);

            var svc = new MuscleRecoveryService(ctx);
            var result = await svc.ComputeAsync(1);

            var chest = result.Single(r => r.MuscleGroupKey == "chest_main");
            var biceps = result.Single(r => r.MuscleGroupKey == "biceps");
            // Chest is primary (x1.0), biceps secondary (x0.5) -> more damage on chest.
            Assert.True(chest.DamagePercent > biceps.DamagePercent);
            // Same session date -> more damage means lower recovery now.
            Assert.True(chest.RecoveryPercent < biceps.RecoveryPercent);
        }

        [Fact]
        public async Task ComputeAsync_NoDamage_ReturnsFullRecoveryForAll()
        {
            var ctx = NewContext();
            ctx.Exercises.Add(Bench());
            // RPE below 7 -> no damage recorded.
            ctx.UserExercise.Add(new UserExercise
            {
                UserId = 1,
                ExerciseId = 1,
                Date = DateTime.UtcNow.Date,
                Sets = 3,
                RPE = 5,
                Status = WorkoutStatus.Completed,
            });
            await ctx.SaveChangesAsync();

            var svc = new MuscleRecoveryService(ctx);
            var result = await svc.ComputeAsync(1);

            Assert.All(result, r => Assert.Equal(100, r.RecoveryPercent));
        }

        [Fact]
        public void MuscleCategories_MapsKnownKeys()
        {
            var small = MuscleCategories.Get("biceps");
            var large = MuscleCategories.Get("quadriceps");
            Assert.Equal("Małe", small.Category);
            Assert.Equal(48, small.TMax);
            Assert.Equal("Duże", large.Category);
            Assert.Equal(96, large.TMax);
        }
    }
}
