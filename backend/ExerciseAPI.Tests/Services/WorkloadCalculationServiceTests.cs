using ExerciseAPI.Data;
using ExerciseAPI.Models;
using ExerciseAPI.Services;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace ExerciseAPI.Tests.Services
{
    public class WorkloadCalculationServiceTests
    {
        private readonly AppDbContext _context;
        private readonly WorkloadCalculationService _workloadCalculationService;

        public WorkloadCalculationServiceTests()
        {
            var options = new DbContextOptionsBuilder<AppDbContext>()
                .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
                .Options;

            _context = new AppDbContext(options);
            _workloadCalculationService = new WorkloadCalculationService(_context);
        }

        [Fact]
        public async Task CalculateTonnage_WithValidData_ReturnsCorrectTonnage()
        {
            // Arrange
            var userId = 1;
            var date = DateTime.UtcNow.Date;
            
            _context.UserExercise.AddRange(
                new UserExercise { UserId = userId, ExerciseId = 1, Date = date, Sets = 3, Reps = 10, Weight = 100 },
                new UserExercise { UserId = userId, ExerciseId = 2, Date = date, Sets = 4, Reps = 8, Weight = 80 }
            );
            await _context.SaveChangesAsync();

            // Act
            var tonnage = await _workloadCalculationService.CalculateTonnage(userId, date);

            // Assert
            Assert.Equal(3 * 10 * 100 + 4 * 8 * 80, tonnage);
        }

        [Fact]
        public async Task CalculateTonnage_WithNoExercises_ReturnsZero()
        {
            // Arrange
            var userId = 1;
            var date = DateTime.UtcNow.Date;

            // Act
            var tonnage = await _workloadCalculationService.CalculateTonnage(userId, date);

            // Assert
            Assert.Equal(0, tonnage);
        }

        [Fact]
        public async Task CalculateWorkload_WithValidData_ReturnsCorrectWorkload()
        {
            // Arrange
            var userId = 1;
            var date = DateTime.UtcNow.Date;
            
            _context.UserExercise.AddRange(
                new UserExercise { UserId = userId, ExerciseId = 1, Date = date, Sets = 3, Reps = 10, Weight = 100, RPE = 8 },
                new UserExercise { UserId = userId, ExerciseId = 2, Date = date, Sets = 4, Reps = 8, Weight = 80, RPE = 7 }
            );
            await _context.SaveChangesAsync();

            // Act
            var workload = await _workloadCalculationService.CalculateWorkload(userId, date);

            // Assert
            decimal expectedTonnage = 3 * 10 * 100 + 4 * 8 * 80;
            decimal expectedAverageRpe = (8 + 7) / 2m;
            Assert.Equal(expectedTonnage * expectedAverageRpe, workload);
        }

        [Fact]
        public async Task CalculateWorkload_WithNoExercises_ReturnsZero()
        {
            // Arrange
            var userId = 1;
            var date = DateTime.UtcNow.Date;

            // Act
            var workload = await _workloadCalculationService.CalculateWorkload(userId, date);

            // Assert
            Assert.Equal(0, workload);
        }

        [Fact]
        public async Task GetUserAverageWorkload_WithNoData_ReturnsZero()
        {
            // Arrange
            var userId = 1;

            // Act
            var average = await _workloadCalculationService.GetUserAverageWorkload(userId);

            // Assert
            Assert.Equal(0, average);
        }

        [Fact]
        public async Task IsWorkloadAboveAverage_WithAboveAverage_ReturnsTrue()
        {
            // Arrange
            var userId = 1;
            var date = DateTime.UtcNow.Date;
            
            _context.UserExercise.AddRange(
                new UserExercise { UserId = userId, ExerciseId = 1, Date = date, Sets = 3, Reps = 10, Weight = 100, RPE = 8 }
            );
            await _context.SaveChangesAsync();

            var currentWorkload = await _workloadCalculationService.CalculateWorkload(userId, date);

            // Act
            var result = await _workloadCalculationService.IsWorkloadAboveAverage(userId, currentWorkload);

            // Assert
            Assert.True(result);
        }
    }
}