using ExerciseAPI.Models;
using ExerciseAPI.Services;
using Xunit;

namespace ExerciseAPI.Tests.Services
{
    public class RecordsAnalysisTests
    {
        [Fact]
        public void GetWeekStart_Monday_ReturnsSameDate()
        {
            var monday = new DateTime(2026, 10, 5);
            var result = RecordsAnalysis.GetWeekStart(monday);
            Assert.Equal(new DateTime(2026, 10, 5), result);
        }

        [Fact]
        public void GetWeekStart_Sunday_ReturnsPreviousMonday()
        {
            var sunday = new DateTime(2026, 10, 11);
            var result = RecordsAnalysis.GetWeekStart(sunday);
            Assert.Equal(new DateTime(2026, 10, 5), result);
        }

        [Fact]
        public void GetWeekStart_Wednesday_ReturnsMonday()
        {
            var wednesday = new DateTime(2026, 10, 7);
            var result = RecordsAnalysis.GetWeekStart(wednesday);
            Assert.Equal(new DateTime(2026, 10, 5), result);
        }

        [Fact]
        public void GetCalendarWeekCount_SameWeek_Returns1()
        {
            var start = new DateTime(2026, 10, 5);
            var end = new DateTime(2026, 10, 7);
            var result = RecordsAnalysis.GetCalendarWeekCount(start, end);
            Assert.Equal(1, result);
        }

        [Fact]
        public void GetCalendarWeekCount_TwoWeeks_Returns2()
        {
            var start = new DateTime(2026, 10, 5);
            var end = new DateTime(2026, 10, 18);
            var result = RecordsAnalysis.GetCalendarWeekCount(start, end);
            Assert.Equal(2, result);
        }

        [Fact]
        public void GetRepRange_1To5_ReturnsCorrectRange()
        {
            Assert.Equal("1-5", RecordsAnalysis.GetRepRange(1));
            Assert.Equal("1-5", RecordsAnalysis.GetRepRange(5));
        }

        [Fact]
        public void GetRepRange_6To10_ReturnsCorrectRange()
        {
            Assert.Equal("6-10", RecordsAnalysis.GetRepRange(6));
            Assert.Equal("6-10", RecordsAnalysis.GetRepRange(10));
        }

        [Fact]
        public void GetRepRange_11Plus_ReturnsCorrectRange()
        {
            Assert.Equal("11-15", RecordsAnalysis.GetRepRange(11));
            Assert.Equal("11-15", RecordsAnalysis.GetRepRange(15));
            Assert.Equal("11-15", RecordsAnalysis.GetRepRange(20));
        }

        [Fact]
        public void GetMuscleWeights_NullExercise_ReturnsEmpty()
        {
            var result = RecordsAnalysis.GetMuscleWeights(null);
            Assert.Empty(result);
        }

        [Fact]
        public void GetMuscleWeights_WithMappings_ReturnsMappings()
        {
            var exercise = new Exercise
            {
                MuscleGroupMappings = new List<ExerciseMuscleGroup>
                {
                    new ExerciseMuscleGroup { MuscleGroupKey = "chest_main", MuscleGroup = new MuscleGroup { NamePl = "Klatka" }, WeightPercentage = 0.8m }
                }
            };

            var result = RecordsAnalysis.GetMuscleWeights(exercise).ToList();
            Assert.Single(result);
            Assert.Equal("chest_main", result[0].Key);
            Assert.Equal("Klatka", result[0].Name);
            Assert.Equal(0.8m, result[0].Weight);
        }

        [Fact]
        public void GetMuscleWeights_WithoutMappings_UsesLegacyProperties()
        {
            var exercise = new Exercise
            {
                ChestMain = 0.8m,
                Biceps = 0.3m,
                Triceps = 0
            };

            var result = RecordsAnalysis.GetMuscleWeights(exercise).ToList();
            Assert.Equal(2, result.Count);
            Assert.Contains(result, x => x.Key == "chest_main" && x.Weight == 0.8m);
            Assert.Contains(result, x => x.Key == "biceps" && x.Weight == 0.3m);
            Assert.DoesNotContain(result, x => x.Key == "triceps");
        }
    }
}