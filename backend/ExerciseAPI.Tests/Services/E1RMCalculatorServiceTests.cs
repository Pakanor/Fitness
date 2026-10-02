using ExerciseAPI.Services;
using Xunit;

namespace ExerciseAPI.Tests.Services
{
    public class E1RMCalculatorServiceTests
    {
        private readonly E1RMCalculatorService _calculator = new E1RMCalculatorService();

        [Theory]
        [InlineData(100, 1, 100)]
        [InlineData(100, 5, 116.67)]
        [InlineData(90, 3, 99)]
        [InlineData(60, 10, 80)]
        [InlineData(50, 0, 0)]
        [InlineData(50, -3, 0)]
        [InlineData(50, 2, 53.33)]
        public void CalculateEpley_ReturnsExpectedValue(decimal weight, int reps, decimal expected)
        {
            var result = _calculator.CalculateEpley(weight, reps);

            Assert.Equal(expected, result);
        }

        [Fact]
        public void CalculateEpley_SingleRep_ReturnsLiftedWeight()
        {
            Assert.Equal(140m, _calculator.CalculateEpley(140m, 1));
        }

        [Fact]
        public void CalculateEpley_HeavierFewerReps_BeatsLighterMoreReps()
        {
            var heavy = _calculator.CalculateEpley(100m, 3);
            var light = _calculator.CalculateEpley(80m, 10);

            Assert.True(heavy > light);
        }

        [Fact]
        public void CalculateBest_KeepsHigherValue()
        {
            var best = _calculator.CalculateBest(100m, 5, 0);
            best = _calculator.CalculateBest(60m, 5, best);

            Assert.Equal(116.67m, best);
        }

        [Fact]
        public void CalculateBest_InvalidSet_DoesNotRaiseBest()
        {
            Assert.Equal(100m, _calculator.CalculateBest(0m, 5, 100m));
            Assert.Equal(100m, _calculator.CalculateBest(90m, 0, 100m));
        }

        [Theory]
        [InlineData(100, 5, true)]
        [InlineData(0, 5, true)]
        [InlineData(100, 0, false)]
        [InlineData(-1, 5, false)]
        public void IsValidSet_MatchesRules(decimal weight, int reps, bool expected)
        {
            Assert.Equal(expected, _calculator.IsValidSet(weight, reps));
        }
    }
}
