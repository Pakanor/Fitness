using ExerciseAPI.Data;
using ExerciseAPI.Interfaces;
using ExerciseAPI.Models;
using Microsoft.EntityFrameworkCore;

namespace ExerciseAPI.Services
{
    public class WorkoutStartModeService : IWorkoutStartModeService
    {
        private readonly AppDbContext _context;

        public WorkoutStartModeService(AppDbContext context)
        {
            _context = context;
        }

        public async Task<List<UserExercise>> GetPreviousWorkoutExercises(int userId)
        {
            var lastWorkoutDate = await _context.UserExercise
                .Where(ue => ue.UserId == userId)
                .OrderByDescending(ue => ue.Date)
                .Select(ue => ue.Date)
                .FirstOrDefaultAsync();

            if (lastWorkoutDate == default)
                return new List<UserExercise>();

            return await _context.UserExercise
                .Where(ue => ue.UserId == userId && ue.Date == lastWorkoutDate)
                .Include(ue => ue.Exercise)
                .OrderBy(ue => ue.Id)
                .ToListAsync();
        }

        // Type-safe: returns the most recent COMPLETED session whose TemplateId matches.
        // Never returns the global most-recent workout of a different template.
        public async Task<List<UserExercise>> GetPreviousWorkoutByTemplate(int userId, int templateId)
        {
            var lastMatchingDate = await _context.UserExercise
                .Where(ue => ue.UserId == userId
                             && ue.TemplateId == templateId
                             && ue.Status == WorkoutStatus.Completed)
                .OrderByDescending(ue => ue.Date)
                .Select(ue => ue.Date)
                .FirstOrDefaultAsync();

            if (lastMatchingDate == default)
                return new List<UserExercise>();

            return await _context.UserExercise
                .Where(ue => ue.UserId == userId
                             && ue.Date == lastMatchingDate
                             && ue.TemplateId == templateId)
                .Include(ue => ue.Exercise)
                .OrderBy(ue => ue.Id)
                .ToListAsync();
        }

        public async Task<List<UserExercise>> CreateWorkoutFromTemplate(int userId, int templateId)
        {
            var template = await _context.WorkoutTemplates
                .Include(t => t.TemplateExercises)
                .FirstOrDefaultAsync(t => t.Id == templateId && t.UserId == userId);

            if (template == null)
                throw new InvalidOperationException("Template not found");

            var today = DateTime.UtcNow.Date;
            var userExercises = new List<UserExercise>();

            foreach (var templateExercise in template.TemplateExercises.OrderBy(te => te.Order))
            {
                var exerciseExists = await _context.Exercises
                    .AnyAsync(e => e.Id == templateExercise.ExerciseId);

                if (!exerciseExists)
                    continue;

                var userExercise = new UserExercise
                {
                    UserId = userId,
                    ExerciseId = templateExercise.ExerciseId,
                    Date = today,
                    StartMode = WorkoutStartMode.FromTemplate,
                    TemplateId = templateId
                };

                userExercises.Add(userExercise);
            }

            if (userExercises.Any())
            {
                _context.UserExercise.AddRange(userExercises);
                await _context.SaveChangesAsync();
            }

            return userExercises;
        }

        // Copy from the most recent COMPLETED session of the given template (type-safe).
        // New rows have empty inputs but keep the TemplateId so the UI can show prior
        // values as "Poprzednio" hints matched by ExerciseId.
        public async Task<List<UserExercise>> CopyPreviousWorkout(int userId, int? templateId = null)
        {
            List<UserExercise> previousExercises;

            if (templateId.HasValue)
            {
                previousExercises = await GetPreviousWorkoutByTemplate(userId, templateId.Value);
                if (!previousExercises.Any())
                    throw new InvalidOperationException("No previous workouts for this template");
            }
            else
            {
                previousExercises = await GetPreviousWorkoutExercises(userId);
                if (!previousExercises.Any())
                    throw new InvalidOperationException("No previous workouts to copy");
            }

            var today = DateTime.UtcNow.Date;
            var userExercises = new List<UserExercise>();

            foreach (var prevExercise in previousExercises)
            {
                var userExercise = new UserExercise
                {
                    UserId = userId,
                    ExerciseId = prevExercise.ExerciseId,
                    Date = today,
                    // inputs intentionally left empty; prior values shown as hints
                    StartMode = WorkoutStartMode.CopyPrevious,
                    TemplateId = prevExercise.TemplateId
                };

                userExercises.Add(userExercise);
            }

            _context.UserExercise.AddRange(userExercises);
            await _context.SaveChangesAsync();

            return userExercises;
        }
    }
}
