using ExerciseAPI.Data;
using ExerciseAPI.Models;
using ExerciseAPI.Services;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace ExerciseAPI.Tests.Services
{
    public class RecordsServiceProgressTests
    {
        private const int UserId = 7;
        private const int ExerciseId = 3;

        private readonly AppDbContext _context;
        private readonly RecordsService _recordsService;

        public RecordsServiceProgressTests()
        {
            var options = new DbContextOptionsBuilder<AppDbContext>()
                .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
                .Options;

            _context = new AppDbContext(options);
            _recordsService = new RecordsService(
                _context,
                new OneRepMaxCalculator(),
                new E1RMCalculatorService());
        }

        private void SeedExercise(string name = "Bench Press")
        {
            _context.Exercises.Add(new Exercise { Id = ExerciseId, Name = name });
            _context.SaveChanges();
        }

        private void SeedLog(DateTime date, decimal? weight, int? reps)
        {
            _context.UserExercise.Add(new UserExercise
            {
                UserId = UserId,
                ExerciseId = ExerciseId,
                Date = date,
                Weight = weight,
                Reps = reps
            });
            _context.SaveChanges();
        }

        private void SeedMuscleMapping(decimal weightPercentage = 0.8m)
        {
            _context.MuscleGroups.Add(new MuscleGroup { Key = "chest_main", NamePl = "Klatka piersiowa" });
            _context.ExerciseMuscleGroups.Add(new ExerciseMuscleGroup
            {
                ExerciseId = ExerciseId,
                MuscleGroupKey = "chest_main",
                WeightPercentage = weightPercentage
            });
            _context.SaveChanges();
        }

        [Fact]
        public async Task GroupsByDate_KeepingHighestE1RMOfTheDay()
        {
            SeedExercise();
            var day = new DateTime(2026, 10, 1);

            SeedLog(day, 100m, 1);
            SeedLog(day, 80m, 5);
            SeedLog(day.AddDays(1), 90m, 3);

            var result = await _recordsService.GetExerciseProgress(UserId, ExerciseId, null, null);

            Assert.Equal(2, result.DataPoints.Count);
            Assert.Equal("2026-10-01", result.DataPoints[0].Date);
            Assert.Equal(100m, result.DataPoints[0].MaxE1RM);
            Assert.Equal(100m, result.DataPoints[0].TopSetWeight);
            Assert.Equal(1, result.DataPoints[0].TopSetReps);
        }

        [Fact]
        public async Task SingleRepSet_TopSetWeightEqualsLiftedWeight()
        {
            SeedExercise();
            var day = new DateTime(2026, 10, 2);

            SeedLog(day, 140m, 1);

            var result = await _recordsService.GetExerciseProgress(UserId, ExerciseId, null, null);

            Assert.Equal(140m, result.DataPoints[0].MaxE1RM);
            Assert.Equal(140m, result.DataPoints[0].TopSetWeight);
        }

        [Fact]
        public async Task Progress_UsesRpeWhenPresentAndMarksFallbackWhenMissing()
        {
            SeedExercise();
            var day = new DateTime(2026, 10, 2);

            _context.UserExercise.AddRange(
                new UserExercise { UserId = UserId, ExerciseId = ExerciseId, Date = day, Weight = 100m, Reps = 5 },
                new UserExercise { UserId = UserId, ExerciseId = ExerciseId, Date = day.AddDays(1), Weight = 100m, Reps = 5, RPE = 8m });
            _context.SaveChanges();

            var result = await _recordsService.GetExerciseProgress(UserId, ExerciseId, null, null);

            Assert.False(result.DataPoints[0].HasRpe);
            Assert.True(result.DataPoints[1].HasRpe);
            Assert.True(result.DataPoints[1].MaxE1RM > result.DataPoints[0].MaxE1RM);
        }

        [Fact]
        public async Task HardSets_WithoutRpeCountAsWorkingSets()
        {
            SeedExercise();
            SeedMuscleMapping();
            _context.UserExercise.Add(new UserExercise
            {
                UserId = UserId,
                ExerciseId = ExerciseId,
                Date = new DateTime(2026, 10, 2),
                Sets = 4,
                Reps = 5,
                Weight = 100m
            });
            _context.SaveChanges();

            var result = await _recordsService.GetExerciseProgress(UserId, ExerciseId, null, null);

            Assert.Equal(3.2m, result.MuscleAnalytics[0].WeeklyHardSets[0].HardSets);
        }

        [Fact]
        public async Task HardSets_IgnoreWarmupsAndVeryLightSets()
        {
            SeedExercise();
            SeedMuscleMapping();
            var date = new DateTime(2026, 10, 2);
            _context.UserExercise.AddRange(
                new UserExercise { UserId = UserId, ExerciseId = ExerciseId, Date = date, Sets = 4, Reps = 5, Weight = 100m },
                new UserExercise { UserId = UserId, ExerciseId = ExerciseId, Date = date, Sets = 5, Reps = 5, Weight = 40m },
                new UserExercise { UserId = UserId, ExerciseId = ExerciseId, Date = date, Sets = 5, Reps = 5, Weight = 100m, IsWarmup = true });
            _context.SaveChanges();

            var result = await _recordsService.GetExerciseProgress(UserId, ExerciseId, null, null);

            Assert.Equal(3.2m, result.MuscleAnalytics[0].WeeklyHardSets[0].HardSets);
        }

        [Fact]
        public async Task InvalidSets_AreIgnored()
        {
            SeedExercise();
            var day = new DateTime(2026, 10, 3);

            SeedLog(day, 100m, 0);
            SeedLog(day, 100m, -5);
            SeedLog(day, null, 5);
            SeedLog(day, 100m, null);

            var result = await _recordsService.GetExerciseProgress(UserId, ExerciseId, null, null);

            Assert.Empty(result.DataPoints);
            Assert.Equal(0m, result.AllTimeMaxE1RM);
        }

        [Fact]
        public async Task AllTimeMax_UsesHighestValueAcrossDays()
        {
            SeedExercise();
            var day = new DateTime(2026, 10, 1);

            SeedLog(day, 100m, 5);
            SeedLog(day.AddDays(1), 100m, 1);
            SeedLog(day.AddDays(2), 60m, 10);

            var result = await _recordsService.GetExerciseProgress(UserId, ExerciseId, null, null);

            Assert.Equal(112.51m, result.AllTimeMaxE1RM);
        }

        [Fact]
        public async Task DateRange_FiltersOutDaysOutsideWindow()
        {
            SeedExercise();
            var day = new DateTime(2026, 10, 1);

            SeedLog(day, 100m, 5);
            SeedLog(day.AddDays(5), 110m, 5);

            var result = await _recordsService.GetExerciseProgress(
                UserId, ExerciseId, day.AddDays(4), day.AddDays(6));

            Assert.Single(result.DataPoints);
            Assert.Equal("2026-10-06", result.DataPoints[0].Date);
        }

        [Fact]
        public async Task ReturnsExerciseNameAndId()
        {
            SeedExercise("Deadlift");

            var result = await _recordsService.GetExerciseProgress(UserId, ExerciseId, null, null);

            Assert.Equal(ExerciseId, result.ExerciseId);
            Assert.Equal("Deadlift", result.ExerciseName);
        }

        [Fact]
        public async Task IgnoresOtherUsersLogs()
        {
            SeedExercise();
            var day = new DateTime(2026, 10, 1);

            _context.UserExercise.Add(new UserExercise
            {
                UserId = 999,
                ExerciseId = ExerciseId,
                Date = day,
                Weight = 200m,
                Reps = 5
            });
            _context.SaveChanges();

            var result = await _recordsService.GetExerciseProgress(UserId, ExerciseId, null, null);

            Assert.Empty(result.DataPoints);
        }
    }
}
