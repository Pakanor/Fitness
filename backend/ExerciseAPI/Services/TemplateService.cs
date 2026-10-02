using ExerciseAPI.Data;
using ExerciseAPI.Interfaces;
using ExerciseAPI.Models;
using Microsoft.EntityFrameworkCore;

namespace ExerciseAPI.Services
{
    public class TemplateService : ITemplateService
    {
        private readonly AppDbContext _context;

        public TemplateService(AppDbContext context)
        {
            _context = context;
        }

        public async Task<WorkoutTemplate> CreateTemplate(int userId, string name, List<int> exerciseIds)
        {
            if (string.IsNullOrWhiteSpace(name))
                throw new ArgumentException("Template name is required");

            if (exerciseIds == null || !exerciseIds.Any())
                throw new ArgumentException("Template must contain at least one exercise");

            var existingExercises = await _context.Exercises
                .Where(e => exerciseIds.Contains(e.Id))
                .Select(e => e.Id)
                .ToListAsync();

            var missingExercises = exerciseIds.Except(existingExercises).ToList();
            if (missingExercises.Any())
                throw new ArgumentException($"Exercises not found: {string.Join(", ", missingExercises)}");

            var template = new WorkoutTemplate
            {
                UserId = userId,
                Name = name.Trim(),
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            _context.WorkoutTemplates.Add(template);
            await _context.SaveChangesAsync();

            var templateExercises = exerciseIds.Select((exerciseId, index) => new TemplateExercise
            {
                TemplateId = template.Id,
                ExerciseId = exerciseId,
                Order = index
            }).ToList();

            _context.TemplateExercises.AddRange(templateExercises);
            await _context.SaveChangesAsync();

            return await GetTemplateById(template.Id, userId)
                ?? throw new InvalidOperationException("Failed to retrieve created template");
        }

        public async Task<WorkoutTemplate?> GetTemplateById(int templateId, int userId)
        {
            return await _context.WorkoutTemplates
                .Include(t => t.TemplateExercises)
                    .ThenInclude(te => te.Exercise)
                .FirstOrDefaultAsync(t => t.Id == templateId && t.UserId == userId);
        }

        public async Task<List<WorkoutTemplate>> GetUserTemplates(int userId)
        {
            return await _context.WorkoutTemplates
                .Include(t => t.TemplateExercises)
                    .ThenInclude(te => te.Exercise)
                .Where(t => t.UserId == userId)
                .OrderByDescending(t => t.CreatedAt)
                .ToListAsync();
        }

        public async Task<WorkoutTemplate> UpdateTemplate(int templateId, int userId, string name, List<int> exerciseIds)
        {
            if (string.IsNullOrWhiteSpace(name))
                throw new ArgumentException("Template name is required");

            if (exerciseIds == null || !exerciseIds.Any())
                throw new ArgumentException("Template must contain at least one exercise");

            var existingExercises = await _context.Exercises
                .Where(e => exerciseIds.Contains(e.Id))
                .Select(e => e.Id)
                .ToListAsync();

            var missingExercises = exerciseIds.Except(existingExercises).ToList();
            if (missingExercises.Any())
                throw new ArgumentException($"Exercises not found: {string.Join(", ", missingExercises)}");

            var template = await _context.WorkoutTemplates
                .Include(t => t.TemplateExercises)
                .FirstOrDefaultAsync(t => t.Id == templateId && t.UserId == userId);

            if (template == null)
                throw new InvalidOperationException("Template not found");

            template.Name = name.Trim();
            template.UpdatedAt = DateTime.UtcNow;

            _context.TemplateExercises.RemoveRange(template.TemplateExercises);

            var templateExercises = exerciseIds.Select((exerciseId, index) => new TemplateExercise
            {
                TemplateId = templateId,
                ExerciseId = exerciseId,
                Order = index
            }).ToList();

            _context.TemplateExercises.AddRange(templateExercises);
            await _context.SaveChangesAsync();

            return await GetTemplateById(templateId, userId)
                ?? throw new InvalidOperationException("Failed to retrieve updated template");
        }

        public async Task<bool> DeleteTemplate(int templateId, int userId)
        {
            var template = await _context.WorkoutTemplates
                .FirstOrDefaultAsync(t => t.Id == templateId && t.UserId == userId);

            if (template == null)
                return false;

            var templateExercises = await _context.TemplateExercises
                .Where(te => te.TemplateId == templateId)
                .ToListAsync();

            _context.TemplateExercises.RemoveRange(templateExercises);
            _context.WorkoutTemplates.Remove(template);
            await _context.SaveChangesAsync();

            return true;
        }

        public async Task<bool> TemplateExists(int templateId, int userId)
        {
            return await _context.WorkoutTemplates
                .AnyAsync(t => t.Id == templateId && t.UserId == userId);
        }
    }
}