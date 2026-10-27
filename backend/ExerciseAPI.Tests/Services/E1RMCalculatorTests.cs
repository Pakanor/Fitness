using ExerciseAPI.Services;
using Xunit;

namespace ExerciseAPI.Tests.Services
{
    public class E1RMCalculatorTests
    {
        [Theory]
        [InlineData(100, 1, 100)]
        [InlineData(100, 5, 116.67)]
        [InlineData(90, 3, 99)]
        [InlineData(60, 10, 80)]
        [InlineData(50, 0, 0)]
        [InlineData(50, -3, 0)]
        [InlineData(50, 2, 53.33)]
        public void CalculateE1RM_ReturnsExpectedValue(decimal weight, int reps, decimal expected)
        {
            var result = E1RMCalculator.CalculateE1RM(weight, reps);

            Assert.Equal(expected, result);
        }

        [Fact]
        public void CalculateE1RM_SingleRep_ReturnsLiftedWeight()
        {
            Assert.Equal(140m, E1RMCalculator.CalculateE1RM(140m, 1));
        }

        [Fact]
        public void CalculateE1RM_HeavierFewerReps_BeatsLighterMoreReps()
        {
            var heavy = E1RMCalculator.CalculateE1RM(100m, 3);
            var light = E1RMCalculator.CalculateE1RM(80m, 10);

            Assert.True(heavy > light);
        }

        [Fact]
        public void CalculateE1RM_WithoutRpe_UsesOnlyRepetitions()
        {
            Assert.Equal(116.67m, E1RMCalculator.CalculateE1RM(100m, 5));
        }

        [Fact]
        public void CalculateE1RM_WithRpe_AddsRepsInReserve()
        {
            var withoutRpe = E1RMCalculator.CalculateE1RM(100m, 5);
            var withRpe = E1RMCalculator.CalculateE1RM(100m, 5, 8m);

            Assert.True(withRpe > withoutRpe);
            Assert.Equal(123.33m, withRpe);
        }

        [Fact]
        public void CalculateBest_KeepsHigherValue()
        {
            var best = E1RMCalculator.CalculateBest(100m, 5, 0);
            best = E1RMCalculator.CalculateBest(60m, 5, best);

            Assert.Equal(116.67m, best);
        }

        [Fact]
        public void CalculateBest_InvalidSet_DoesNotRaiseBest()
        {
            Assert.Equal(100m, E1RMCalculator.CalculateBest(0m, 5, 100m));
            Assert.Equal(100m, E1RMCalculator.CalculateBest(90m, 0, 100m));
        }

        [Fact]
        public void CalculateBestSession1RM_ReturnsHighestAcrossSets()
        {
            var sets = new[]
            {
                (100m, 5),
                (90m, 3),
                (60m, 10)
            };

            var result = E1RMCalculator.CalculateBestSession1RM(sets);

            Assert.Equal(116.67m, result);
        }

        [Fact]
        public void CalculateBestSession1RM_EmptyCollection_ReturnsZero()
        {
            var result = E1RMCalculator.CalculateBestSession1RM(Enumerable.Empty<(decimal, int)>());
            Assert.Equal(0m, result);
        }

        [Theory]
        [InlineData(100, 5, true)]
        [InlineData(0, 5, true)]
        [InlineData(100, 0, false)]
        [InlineData(-1, 5, false)]
        public void IsValidSet_MatchesRules(decimal weight, int reps, bool expected)
        {
            Assert.Equal(expected, E1RMCalculator.IsValidSet(weight, reps));
        }
    }
}