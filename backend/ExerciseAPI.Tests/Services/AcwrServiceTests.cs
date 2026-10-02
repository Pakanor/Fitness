using ExerciseAPI.Data;
using ExerciseAPI.DTOs;
using ExerciseAPI.Interfaces;
using ExerciseAPI.Models;
using ExerciseAPI.Services;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace ExerciseAPI.Tests.Services
{
    public class AcwrServiceTests
    {
        private static AppDbContext NewContext() =>
            new AppDbContext(new DbContextOptionsBuilder<AppDbContext>()
                .UseInMemoryDatabase(Guid.NewGuid().ToString()).Options);

        private static UserExercise Session(int userId, int exerciseId, int daysAgo, int sets, int reps, decimal weight, int rpe) =>
            new UserExercise
            {
                UserId = userId,
                ExerciseId = exerciseId,
                Date = DateTime.UtcNow.Date.AddDays(-daysAgo),
                Sets = sets,
                Reps = reps,
                Weight = weight,
                RPE = rpe,
                Status = WorkoutStatus.Completed,
            };

        [Fact]
        public async Task GetAcwr_UsesDailyAverages_UniformLoad_RatioIsOne()
        {
            var ctx = NewContext();
            ctx.Exercises.Add(new Exercise { Id = 1, Name = "X" });
            // 28 uniform training days -> acute == chronic -> ratio ~= 1.0
            for (int i = 0; i < 28; i++)
                ctx.UserExercise.Add(Session(1, 1, i, 1, 1, 100, 10));
            await ctx.SaveChangesAsync();

            var svc = new AcwrService(ctx, null);
            var result = await svc.GetAcwrAsync(1);

            Assert.False(result.ColdStart);
            Assert.InRange(result.Ratio, 0.99, 1.01);
            Assert.Equal(28, result.DailyWorkload.Count);
        }

        [Fact]
        public async Task GetAcwr_ColdStart_Below14Days_SuppressesAlarm()
        {
            var ctx = NewContext();
            ctx.Exercises.Add(new Exercise { Id = 1, Name = "X" });
            // only 3 distinct training days -> cold start
            for (int i = 0; i < 3; i++)
                ctx.UserExercise.Add(Session(1, 1, i, 1, 1, 100, 10));
            await ctx.SaveChangesAsync();

            var svc = new AcwrService(ctx, null);
            var result = await svc.GetAcwrAsync(1);

            Assert.True(result.ColdStart);
            Assert.Equal(11, result.BaselineCollectionDaysRemaining);
            // No token -> default baseline 75kg x factor 8 = 600
            Assert.Equal(600, result.EstimatedBaseline);
            // Chronic is the estimated baseline (not 0) so ratio stays sane
            Assert.Equal(600, result.ChronicLoad);
            // Alarm widget suppressed
            Assert.Equal("", result.Status);
            Assert.Null(result.Alert);
            // Chart still contains all 28 calendar days (rest = 0)
            Assert.Equal(28, result.DailyWorkload.Count);
            Assert.Contains(result.DailyWorkload, d => d.Workload > 0);
        }

        [Fact]
        public async Task GetAcwr_SingleLightDay_RendersProportionalMicroBar()
        {
            var ctx = NewContext();
            ctx.Exercises.Add(new Exercise { Id = 1, Name = "X" });
            // one light session ~1000 workload points, 27 rest days
            ctx.UserExercise.Add(Session(1, 1, 7, 1, 1, 100, 10));
            ctx.UserExercise.Add(Session(1, 1, 10, 1, 1, 100, 10));
            await ctx.SaveChangesAsync();

            var svc = new AcwrService(ctx, null);
            var result = await svc.GetAcwrAsync(1);

            var trained = result.DailyWorkload.Where(d => d.Workload > 0).ToList();
            Assert.Equal(2, trained.Count);
            Assert.All(trained, d => Assert.Equal(1000, d.Workload));
            // rest days present and zero
            Assert.Contains(result.DailyWorkload, d => d.Workload == 0);
        }
    }
}
