using ExerciseAPI.Data;
using ExerciseAPI.Models;
using ExerciseAPI.Services;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace ExerciseAPI.Tests.Services
{
    public class PersonalRecordsServiceTests
    {
        private const int UserId = 7;
        private const int ExerciseId = 3;
        private static readonly DateTime Day = new(2026, 10, 1);

        private readonly AppDbContext _context;
        private readonly PersonalRecordsService _service;

        public PersonalRecordsServiceTests()
        {
            var options = new DbContextOptionsBuilder<AppDbContext>()
                .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
                .Options;

            _context = new AppDbContext(options);
            _service = new PersonalRecordsService(_context);
        }

        private static WorkingSetInput Set(
            decimal weight,
            int reps,
            decimal? rpe = null,
            SetType setType = SetType.Normal) => new()
        {
            Weight = weight,
            Reps = reps,
            Rpe = rpe,
            SetType = setType
        };

        private void SeedRecord(decimal weight, int reps)
        {
            _context.PersonalRecords.Add(new PersonalRecord
            {
                UserId = UserId,
                ExerciseId = ExerciseId,
                Weight = weight,
                Reps = reps,
                Date = Day.AddDays(-7)
            });
            _context.SaveChanges();
        }

        [Fact]
        public async Task RecordsFirstWorkingSet()
        {
            var outcome = await _service.RecordAsync(
                UserId, ExerciseId, new[] { Set(100m, 5) }, Day, 80m);

            Assert.True(outcome.IsPr);
            Assert.Equal(116.67m, outcome.Estimated1RM);

            var record = Assert.Single(_context.PersonalRecords);
            Assert.Equal(100m, record.Weight);
            Assert.Equal(5, record.Reps);
            Assert.Equal(80m, record.UserWeightAtTime);
            Assert.Equal(1.25m, record.StrengthToWeightRatio);
        }

        [Fact]
        public async Task HigherRepsCanBeatHeavierSingle()
        {
            SeedRecord(110m, 1);

            var outcome = await _service.RecordAsync(
                UserId, ExerciseId, new[] { Set(100m, 6) }, Day, null);

            Assert.True(outcome.IsPr);
            Assert.Equal(2, _context.PersonalRecords.Count());
        }

        [Fact]
        public async Task LowerE1RM_IsNotRecorded()
        {
            SeedRecord(100m, 6);

            var outcome = await _service.RecordAsync(
                UserId, ExerciseId, new[] { Set(110m, 1) }, Day, null);

            Assert.False(outcome.IsPr);
            Assert.Single(_context.PersonalRecords);
        }

        [Fact]
        public async Task RpeCanRaiseTheEstimate()
        {
            SeedRecord(100m, 5);

            var outcome = await _service.RecordAsync(
                UserId, ExerciseId, new[] { Set(100m, 5, 8m) }, Day, null);

            Assert.True(outcome.IsPr);
            Assert.Equal(123.33m, outcome.Estimated1RM);
        }

        [Fact]
        public async Task EqualE1RMWithHeavierWeight_IsRecorded()
        {
            SeedRecord(100m, 5);

            var outcome = await _service.RecordAsync(
                UserId, ExerciseId, new[] { Set(116.67m, 1) }, Day, null);

            Assert.True(outcome.IsPr);
        }

        [Fact]
        public async Task WarmupAndUnusableSets_AreIgnored()
        {
            var outcome = await _service.RecordAsync(
                UserId,
                ExerciseId,
                new[] { Set(100m, 5, setType: SetType.Warmup), Set(100m, 0) },
                Day,
                null);

            Assert.False(outcome.IsPr);
            Assert.Empty(_context.PersonalRecords);
        }

        [Fact]
        public async Task BestSetOfTheBatch_IsRecorded()
        {
            var outcome = await _service.RecordAsync(
                UserId,
                ExerciseId,
                new[] { Set(80m, 5), Set(100m, 5), Set(90m, 3) },
                Day,
                null);

            Assert.True(outcome.IsPr);

            var record = Assert.Single(_context.PersonalRecords);
            Assert.Equal(100m, record.Weight);
            Assert.Equal(5, record.Reps);
        }
    }
}
