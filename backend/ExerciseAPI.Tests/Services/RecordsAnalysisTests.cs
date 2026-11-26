using ExerciseAPI.DTOs;
using ExerciseAPI.Models;
using ExerciseAPI.Services;
using Xunit;

namespace ExerciseAPI.Tests.Services
{
    public class RecordsAnalysisTests
    {
        private static readonly DateTime D1 = new(2026, 10, 5);
        private static readonly DateTime D2 = new(2026, 10, 6);

        private static SetRecord Set(
            int exerciseId,
            string name,
            DateTime date,
            decimal weight,
            int reps,
            decimal? rpe = null,
            bool isBenchmark = false,
            bool warmup = false,
            params (string Key, string Name, decimal Weight)[] muscles)
            => new(
                date,
                exerciseId,
                weight,
                reps,
                rpe,
                warmup ? SetType.Warmup : SetType.Normal,
                name,
                "Chest",
                isBenchmark,
                muscles.ToList());

        [Fact]
        public void Analyze1RMProgression_ReturnsEmpty_WhenNoBenchmarkSets()
        {
            var sets = new[] { Set(1, "Bench Press", D1, 100m, 5) };

            var result = RecordsAnalysis.Analyze1RMProgression(sets);

            Assert.Empty(result.Lifts);
        }

        [Fact]
        public void Analyze1RMProgression_GroupsByExercise_AndOrdersByDate()
        {
            var sets = new[]
            {
                Set(1, "Squat", D1, 100m, 5, isBenchmark: true),
                Set(1, "Squat", D2, 110m, 3, isBenchmark: true),
                Set(2, "Bench Press", D1, 80m, 5, isBenchmark: true)
            };

            var result = RecordsAnalysis.Analyze1RMProgression(sets);

            Assert.Equal(2, result.Lifts.Count);
            // Squat's latest e1RM (110x3 = 121) beats Bench (80x5 = 93.33) -> Squat first.
            Assert.Equal("Squat", result.Lifts[0].LiftName);
            Assert.Equal(2, result.Lifts[0].History.Count);
            Assert.Equal(D1, result.Lifts[0].History[0].Date);
            Assert.Equal(D2, result.Lifts[0].History[1].Date);
            Assert.Equal(121m, result.Lifts[0].Current1RM);
        }

        [Fact]
        public void AnalyzeExerciseProgress_ComputesE1RM_WithRpe()
        {
            var sets = new[] { Set(1, "Bench Press", D1, 100m, 5, 8m) };

            var result = RecordsAnalysis.AnalyzeExerciseProgress(sets, 1, "Bench Press");

            var point = Assert.Single(result.DataPoints);
            Assert.True(point.HasRpe);
            // 100 x (1 + (5 + 2)/30) = 123.33
            Assert.Equal(123.33m, point.MaxE1RM);
            Assert.Equal(100m, point.TopSetWeight);
        }

        [Fact]
        public void AnalyzeExerciseProgress_MuscleAnalytics_UsesMuscleWeights()
        {
            var sets = new[]
            {
                Set(1, "Bench Press", D1, 100m, 5, muscles: ("chest_main", "Klatka", 0.8m))
            };

            var result = RecordsAnalysis.AnalyzeExerciseProgress(sets, 1, "Bench Press");

            var muscle = Assert.Single(result.MuscleAnalytics);
            Assert.Equal("chest_main", muscle.Key);
            Assert.Equal(0.8m, muscle.WeeklyHardSets[0].HardSets);
        }

        [Fact]
        public void AnalyzeExerciseProgress_Workload_TonnageAndReps()
        {
            var sets = new[]
            {
                Set(1, "Bench Press", D1, 100m, 5),
                Set(1, "Bench Press", D1, 100m, 5)
            };

            var result = RecordsAnalysis.AnalyzeExerciseProgress(sets, 1, "Bench Press");

            var day = Assert.Single(result.Workload);
            Assert.Equal(1000m, day.Tonnage);
            Assert.Equal(10, day.Repetitions);
            Assert.Equal(5m, day.AverageReps);
            Assert.Equal(2m, day.HardSets);
        }

        [Fact]
        public void AnalyzeExerciseProgress_IgnoresWarmupSets()
        {
            var sets = new[]
            {
                Set(1, "Bench Press", D1, 100m, 5, warmup: true)
            };

            var result = RecordsAnalysis.AnalyzeExerciseProgress(sets, 1, "Bench Press");

            Assert.Empty(result.DataPoints);
            Assert.Equal(0, result.TotalSets);
        }

        [Fact]
        public void AnalyzeOverview_MuscleVolume_AveragesPerWeek()
        {
            var sets = new[]
            {
                Set(1, "Bench Press", D1, 100m, 5, muscles: ("chest_main", "Klatka", 0.8m)),
                Set(1, "Bench Press", D1, 100m, 5, muscles: ("chest_main", "Klatka", 0.8m)),
                Set(1, "Bench Press", D1, 100m, 5, muscles: ("chest_main", "Klatka", 0.8m)),
                Set(1, "Bench Press", D1, 100m, 5, muscles: ("chest_main", "Klatka", 0.8m))
            };

            var result = RecordsAnalysis.AnalyzeOverview(sets, new DateTime(2026, 10, 1), new DateTime(2026, 10, 7));

            var volume = Assert.Single(result.MuscleVolume);
            // 4 hard sets * 0.8 = 3.2 over 2 calendar weeks = 1.6
            Assert.Equal(1.6m, volume.HardSets);
            Assert.Single(result.Activity);
        }

        [Fact]
        public void AnalyzeOverview_WeeklyTrend_GroupsByWeek()
        {
            var sets = new[]
            {
                Set(1, "Bench Press", D1, 100m, 5),
                Set(1, "Bench Press", D1.AddDays(7), 100m, 5)
            };

            var result = RecordsAnalysis.AnalyzeOverview(sets, null, null);

            Assert.Equal(2, result.WeeklyTrend.Count);
            Assert.Equal("2026-10-05", result.WeeklyTrend[0].Week);
            Assert.Equal("2026-10-12", result.WeeklyTrend[1].Week);
        }

        [Fact]
        public void AnalyzeOverview_Insights_IncludedFromPrecomputed()
        {
            var precomputed = new List<InsightDto>
            {
                new() { Type = "Plateau", Title = "Plateau: Bench", ExerciseId = 1 }
            };

            var result = RecordsAnalysis.AnalyzeOverview(
                new[] { Set(1, "Bench Press", D1, 100m, 5) },
                null,
                null,
                precomputed);

            Assert.Contains(result.Insights, i => i.Type == "Plateau");
        }
    }
}