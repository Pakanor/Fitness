using ExerciseAPI.Services;
using Xunit;

namespace ExerciseAPI.Tests.Services
{
    public class PerformanceTests
    {
        [Theory]
        [InlineData(100, 1, null, 100)]
        [InlineData(100, 5, null, 116.67)]
        [InlineData(90, 3, null, 99)]
        [InlineData(60, 10, null, 80)]
        [InlineData(100, 5, 8, 123.33)]
        public void E1RM_ReturnsExpectedValue(decimal weight, int reps, int? rpe, decimal expected)
        {
            var result = Performance.E1RM(new PerformanceSet(weight, reps, rpe));

            Assert.Equal(expected, result);
        }

        [Theory]
        [InlineData(0, 5)]
        [InlineData(-10, 5)]
        [InlineData(100, 0)]
        [InlineData(100, -3)]
        public void E1RM_UnusableSet_ReturnsNull(decimal weight, int reps)
        {
            Assert.Null(Performance.E1RM(new PerformanceSet(weight, reps)));
        }

        [Theory]
        [InlineData(100, 13, null)]
        [InlineData(100, 9, 6)]
        [InlineData(100, 10, 6)]
        public void E1RM_MoreThanTwelveEffectiveReps_ReturnsNull(decimal weight, int reps, int? rpe)
        {
            Assert.Null(Performance.E1RM(new PerformanceSet(weight, reps, rpe)));
        }

        [Fact]
        public void E1RM_TwelveEffectiveReps_IsStillSupported()
        {
            Assert.Equal(140m, Performance.E1RM(new PerformanceSet(100m, 8, 6m)));
        }

        [Fact]
        public void E1RM_ClampsRepsInReserveAtFour()
        {
            var atRpeFive = Performance.E1RM(new PerformanceSet(100m, 5, 5m));
            var atRpeSix = Performance.E1RM(new PerformanceSet(100m, 5, 6m));

            Assert.Equal(130m, atRpeFive);
            Assert.Equal(atRpeSix, atRpeFive);
        }

        [Fact]
        public void SessionBest_ReturnsHighestValueAcrossSets()
        {
            var sets = new[]
            {
                new PerformanceSet(100m, 5),
                new PerformanceSet(90m, 3),
                new PerformanceSet(60m, 10)
            };

            Assert.Equal(116.67m, Performance.SessionBest(sets));
        }

        [Fact]
        public void SessionBest_EmptyOrUnusableSets_ReturnsNull()
        {
            Assert.Null(Performance.SessionBest(Array.Empty<PerformanceSet>()));
            Assert.Null(Performance.SessionBest(new[] { new PerformanceSet(0m, 5), new PerformanceSet(100m, 0) }));
        }

        [Fact]
        public void EvaluatePr_FirstRecordedSet_IsPr()
        {
            var outcome = Performance.EvaluatePr(new PerformanceSet(100m, 5), null);

            Assert.True(outcome.IsPr);
            Assert.Equal(116.67m, outcome.Estimated1RM);
            Assert.Null(outcome.PreviousEstimated1RM);
        }

        [Fact]
        public void EvaluatePr_HigherRepsCanBeatHeavierSingle()
        {
            var previous = new PreviousPr(110m, 110m, 1);

            var outcome = Performance.EvaluatePr(new PerformanceSet(100m, 6), previous);

            Assert.True(outcome.IsPr);
            Assert.Equal(120m, outcome.Estimated1RM);
        }

        [Fact]
        public void EvaluatePr_LowerE1RM_IsNotPr()
        {
            var previous = new PreviousPr(120m, 100m, 6);

            var outcome = Performance.EvaluatePr(new PerformanceSet(110m, 1), previous);

            Assert.False(outcome.IsPr);
            Assert.Equal(110m, outcome.Estimated1RM);
            Assert.Equal(120m, outcome.PreviousEstimated1RM);
        }

        [Fact]
        public void EvaluatePr_EqualE1RMWithHeavierWeight_IsPr()
        {
            var previous = new PreviousPr(116.67m, 100m, 5);

            var outcome = Performance.EvaluatePr(new PerformanceSet(116.67m, 1), previous);

            Assert.True(outcome.IsPr);
        }

        [Fact]
        public void EvaluatePr_EqualE1RMWithLighterWeight_IsNotPr()
        {
            var previous = new PreviousPr(116.67m, 116.67m, 1);

            var outcome = Performance.EvaluatePr(new PerformanceSet(100m, 5), previous);

            Assert.False(outcome.IsPr);
        }

        [Fact]
        public void EvaluatePr_UnusableSet_IsNotPr()
        {
            var outcome = Performance.EvaluatePr(new PerformanceSet(100m, 0), new PreviousPr(100m, 100m, 1));

            Assert.False(outcome.IsPr);
            Assert.Null(outcome.Estimated1RM);
        }

        [Fact]
        public void EvaluatePr_RpeRaisesEstimate()
        {
            var previous = new PreviousPr(116.67m, 100m, 5);

            var outcome = Performance.EvaluatePr(new PerformanceSet(100m, 5, 8m), previous);

            Assert.True(outcome.IsPr);
            Assert.Equal(123.33m, outcome.Estimated1RM);
        }
    }
}
