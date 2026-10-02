using ExerciseAPI.Data;
using ExerciseAPI.Models;
using ExerciseAPI.Services;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace ExerciseAPI.Tests.Services
{
    public class TemplateServiceTests
    {
        private readonly AppDbContext _context;
        private readonly TemplateService _templateService;

        public TemplateServiceTests()
        {
            var options = new DbContextOptionsBuilder<AppDbContext>()
                .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
                .Options;

            _context = new AppDbContext(options);
            _templateService = new TemplateService(_context);
        }

        [Fact]
        public async Task CreateTemplate_WithValidData_CreatesTemplate()
        {
            // Arrange
            var userId = 1;
            var name = "Test Template";
            var exerciseIds = new List<int> { 1, 2, 3 };

            // Act
            var result = await _templateService.CreateTemplate(userId, name, exerciseIds);

            // Assert
            Assert.NotNull(result);
            Assert.Equal(name, result.Name);
            Assert.Equal(userId, result.UserId);
            Assert.Equal(3, result.TemplateExercises.Count);
        }

        [Fact]
        public async Task CreateTemplate_WithEmptyExercises_ThrowsArgumentException()
        {
            // Arrange
            var userId = 1;
            var name = "Test Template";
            var exerciseIds = new List<int>();

            // Act & Assert
            await Assert.ThrowsAsync<ArgumentException>(
                () => _templateService.CreateTemplate(userId, name, exerciseIds));
        }

        [Fact]
        public async Task CreateTemplate_WithNullExercises_ThrowsArgumentException()
        {
            // Arrange
            var userId = 1;
            var name = "Test Template";

            // Act & Assert
            await Assert.ThrowsAsync<ArgumentException>(
                () => _templateService.CreateTemplate(userId, name, null));
        }

        [Fact]
        public async Task GetTemplateById_WithValidId_ReturnsTemplate()
        {
            // Arrange
            var userId = 1;
            var name = "Test Template";
            var exerciseIds = new List<int> { 1, 2 };
            var template = await _templateService.CreateTemplate(userId, name, exerciseIds);

            // Act
            var result = await _templateService.GetTemplateById(template.Id, userId);

            // Assert
            Assert.NotNull(result);
            Assert.Equal(template.Id, result.Id);
            Assert.Equal(name, result.Name);
        }

        [Fact]
        public async Task GetTemplateById_WithInvalidId_ReturnsNull()
        {
            // Arrange
            var userId = 1;
            var invalidId = 999;

            // Act
            var result = await _templateService.GetTemplateById(invalidId, userId);

            // Assert
            Assert.Null(result);
        }

        [Fact]
        public async Task GetUserTemplates_ReturnsUserTemplates()
        {
            // Arrange
            var userId = 1;
            await _templateService.CreateTemplate(userId, "Template 1", new List<int> { 1 });
            await _templateService.CreateTemplate(userId, "Template 2", new List<int> { 2 });
            await _templateService.CreateTemplate(2, "Other User Template", new List<int> { 1 });

            // Act
            var result = await _templateService.GetUserTemplates(userId);

            // Assert
            Assert.Equal(2, result.Count);
            Assert.All(result, t => Assert.Equal(userId, t.UserId));
        }

        [Fact]
        public async Task UpdateTemplate_WithValidData_UpdatesTemplate()
        {
            // Arrange
            var userId = 1;
            var template = await _templateService.CreateTemplate(userId, "Old Name", new List<int> { 1 });
            var newName = "New Name";
            var newExerciseIds = new List<int> { 2, 3 };

            // Act
            var result = await _templateService.UpdateTemplate(template.Id, userId, newName, newExerciseIds);

            // Assert
            Assert.Equal(newName, result.Name);
            Assert.Equal(2, result.TemplateExercises.Count);
        }

        [Fact]
        public async Task DeleteTemplate_WithValidId_DeletesTemplate()
        {
            // Arrange
            var userId = 1;
            var template = await _templateService.CreateTemplate(userId, "Test Template", new List<int> { 1 });

            // Act
            var result = await _templateService.DeleteTemplate(template.Id, userId);

            // Assert
            Assert.True(result);
            var deletedTemplate = await _templateService.GetTemplateById(template.Id, userId);
            Assert.Null(deletedTemplate);
        }

        [Fact]
        public async Task DeleteTemplate_WithInvalidId_ReturnsFalse()
        {
            // Arrange
            var userId = 1;
            var invalidId = 999;

            // Act
            var result = await _templateService.DeleteTemplate(invalidId, userId);

            // Assert
            Assert.False(result);
        }
    }
}