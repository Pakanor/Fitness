using ExerciseAPI.Data;
using ExerciseAPI.Interfaces;
using ExerciseAPI.Models;
using Microsoft.EntityFrameworkCore;

namespace ExerciseAPI.Services
{
    public class WorkloadCalculationService : IWorkloadCalculationService
    {
        private readonly AppDbContext _context;

        public WorkloadCalculationService(AppDbContext context)
        {
            _context = context;
        }

        public async Task<decimal> CalculateTonnage(int userId, DateTime date)
        {
            var exercises = await _context.UserExercise
                .Where(ue => ue.UserId == userId && ue.Date.Date == date.Date)
                .ToListAsync();

            decimal tonnage = 0;
            foreach (var exercise in exercises)
            {
                if (exercise.Sets.HasValue && exercise.Reps.HasValue && exercise.Weight.HasValue)
                {
                    tonnage += exercise.Sets.Value * exercise.Reps.Value * exercise.Weight.Value;
                }
            }

            return tonnage;
        }

        public async Task<decimal> CalculateWorkload(int userId, DateTime date)
        {
            var exercises = await _context.UserExercise
                .Where(ue => ue.UserId == userId && ue.Date.Date == date.Date)
                .ToListAsync();

            decimal tonnage = 0;
            decimal totalRpe = 0;
            int rpeCount = 0;

            foreach (var exercise in exercises)
            {
                if (exercise.Sets.HasValue && exercise.Reps.HasValue && exercise.Weight.HasValue)
                {
                    tonnage += exercise.Sets.Value * exercise.Reps.Value * exercise.Weight.Value;
                }

                if (exercise.RPE.HasValue)
                {
                    totalRpe += exercise.RPE.Value;
                    rpeCount++;
                }
            }

            decimal averageRpe = rpeCount > 0 ? totalRpe / rpeCount : 1;
            return tonnage * averageRpe;
        }

        // Average workload across the user's last 5 COMPLETED sessions (workouts),
        // not a rolling daily window. A session is identified by a workout Date that
        // has at least one Completed exercise row.
        public async Task<decimal> GetUserAverageWorkload(int userId, int sessionCount = 5)
        {
            var completedDates = await _context.UserExercise
                .Where(ue => ue.UserId == userId && ue.Status == WorkoutStatus.Completed)
                .Select(ue => ue.Date.Date)
                .Distinct()
                .OrderByDescending(d => d)
                .Take(sessionCount)
                .ToListAsync();

            if (!completedDates.Any())
                return 0;

            decimal totalWorkload = 0;
            foreach (var date in completedDates)
            {
                totalWorkload += await CalculateWorkload(userId, date);
            }

            return totalWorkload / completedDates.Count;
        }

        public async Task<bool> IsWorkloadAboveAverage(int userId, decimal currentWorkload)
        {
            var averageWorkload = await GetUserAverageWorkload(userId);
            return currentWorkload > averageWorkload;
        }
    }
}