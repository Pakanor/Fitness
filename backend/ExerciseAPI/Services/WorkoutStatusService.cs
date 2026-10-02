using ExerciseAPI.Data;
using ExerciseAPI.Interfaces;
using ExerciseAPI.Models;
using Microsoft.EntityFrameworkCore;

namespace ExerciseAPI.Services
{
    public class WorkoutStatusService : IWorkoutStatusService
    {
        private readonly AppDbContext _context;

        public WorkoutStatusService(AppDbContext context)
        {
            _context = context;
        }

        public async Task<WorkoutStatus?> GetWorkoutStatus(int userId, DateTime date)
        {
            var target = DateTime.SpecifyKind(date, DateTimeKind.Utc).Date;
            var exercises = await _context.UserExercise
                .Where(ue => ue.UserId == userId && ue.Date.Date == target)
                .ToListAsync();

            if (!exercises.Any())
                return null;

            var statuses = exercises.Where(e => e.Status.HasValue).Select(e => e.Status!.Value).ToList();
            
            if (!statuses.Any())
                return WorkoutStatus.Planned;

            if (statuses.All(s => s == WorkoutStatus.Completed))
                return WorkoutStatus.Completed;

            if (statuses.Any(s => s == WorkoutStatus.Active))
                return WorkoutStatus.Active;

            return WorkoutStatus.Planned;
        }

        public async Task UpdateWorkoutStatus(int userId, DateTime date, WorkoutStatus status)
        {
            var target = DateTime.SpecifyKind(date, DateTimeKind.Utc).Date;
            var exercises = await _context.UserExercise
                .Where(ue => ue.UserId == userId && ue.Date.Date == target)
                .ToListAsync();

            foreach (var exercise in exercises)
            {
                exercise.Status = status;
            }

            await _context.SaveChangesAsync();
        }

        public async Task<bool> IsWorkoutActive(int userId, DateTime date)
        {
            var status = await GetWorkoutStatus(userId, date);
            return status == WorkoutStatus.Active;
        }
    }
}