using ExerciseAPI.Data;
using ExerciseAPI.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace ExerciseAPI.Services
{
    public class CarbohydrateScalingService : ICarbohydrateScalingService
    {
        private readonly AppDbContext _context;
        private readonly IWorkloadCalculationService _workloadCalculationService;

        private const decimal STANDARD_CARBS_PER_KG = 1.0m;
        private const decimal HEAVY_CARBS_PER_KG = 1.4m;
        public const decimal ACWR_THRESHOLD = 1.3m;

        public decimal AcwrThreshold => ACWR_THRESHOLD;

        public CarbohydrateScalingService(
            AppDbContext context,
            IWorkloadCalculationService workloadCalculationService)
        {
            _context = context;
            _workloadCalculationService = workloadCalculationService;
        }

        public async Task<decimal> CalculatePostWorkoutCarbs(int userId, decimal bodyWeight, DateTime workoutDate)
        {
            var workload = await _workloadCalculationService.CalculateWorkload(userId, workoutDate);
            var isAboveAverage = await _workloadCalculationService.IsWorkloadAboveAverage(userId, workload);
            
            var acwr = await GetAcwrValue(userId);
            
            bool isHeavyWorkout = isAboveAverage || (acwr.HasValue && acwr.Value > ACWR_THRESHOLD);
            
            decimal carbMultiplier = isHeavyWorkout ? HEAVY_CARBS_PER_KG : STANDARD_CARBS_PER_KG;
            
            return bodyWeight * carbMultiplier;
        }

        public async Task<Dictionary<int, decimal>> AdjustDailyMealCarbs(int userId, decimal additionalCarbs, DateTime date)
        {
            var userMeals = await _context.UserExercise
                .Where(ue => ue.UserId == userId && ue.Date.Date == date.Date)
                .GroupBy(ue => ue.ExerciseId)
                .Select(g => new { ExerciseId = g.Key, Count = g.Count() })
                .ToListAsync();

            var adjustments = new Dictionary<int, decimal>();
            
            if (additionalCarbs <= 0 || !userMeals.Any())
                return adjustments;

            decimal carbsPerMeal = additionalCarbs / userMeals.Count;
            
            foreach (var meal in userMeals)
            {
                adjustments[meal.ExerciseId] = -carbsPerMeal;
            }

            return adjustments;
        }

        // ACWR = acute load (avg of last 7 days) / chronic load (avg of last 28 days).
        // Daily load uses the same tonnage x avgRPE formula as WorkloadCalculationService.
        public async Task<decimal?> GetAcwrValue(int userId)
        {
            var since = DateTime.UtcNow.Date.AddDays(-27);
            var rows = await _context.UserExercise
                .Where(e => e.UserId == userId && e.Date >= since)
                .ToListAsync();

            if (!rows.Any())
                return null;

            var dailyWorkload = rows
                .GroupBy(e => e.Date.Date)
                .Select(g =>
                {
                    decimal tonnage = 0;
                    decimal totalRpe = 0;
                    int rpeCount = 0;
                    foreach (var e in g)
                    {
                        if (e.Sets.HasValue && e.Reps.HasValue && e.Weight.HasValue)
                            tonnage += e.Sets.Value * e.Reps.Value * e.Weight.Value;
                        if (e.RPE.HasValue)
                        {
                            totalRpe += e.RPE.Value;
                            rpeCount++;
                        }
                    }
                    decimal avgRpe = rpeCount > 0 ? totalRpe / rpeCount : 1;
                    return new { Date = g.Key, Workload = tonnage * avgRpe };
                })
                .ToList();

            var last7 = dailyWorkload.Where(d => d.Date >= DateTime.UtcNow.Date.AddDays(-6)).ToList();
            var acuteLoad = last7.Count > 0 ? last7.Average(d => d.Workload) : 0;

            var chronicLoad = dailyWorkload.Count > 0 ? dailyWorkload.Average(d => d.Workload) : 0;

            return chronicLoad > 0 ? acuteLoad / chronicLoad : null;
        }
    }
}