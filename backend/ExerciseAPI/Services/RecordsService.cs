using ExerciseAPI.Data;
using ExerciseAPI.DTOs;
using ExerciseAPI.Interfaces;
using ExerciseAPI.Models;
using Microsoft.EntityFrameworkCore;
using System.Linq.Expressions;

namespace ExerciseAPI.Services
{
    public class RecordsService
    {
        private readonly AppDbContext _context;
        private readonly OneRepMaxCalculator _calculator;
        private readonly IE1RMCalculatorService _e1rmCalculator;

        private static readonly string[] MainCompoundLifts = new[]
        {
            "squat", "bench press", "deadlift", "overhead press",
            "przysiad", "wyciskanie sztangi", "martwy ciąg", "wyciskanie nad głowę"
        };

        public RecordsService(AppDbContext context, OneRepMaxCalculator calculator, IE1RMCalculatorService e1rmCalculator)
        {
            _context = context;
            _calculator = calculator;
            _e1rmCalculator = e1rmCalculator;
        }

        /// <summary>
        /// PLANNED sessions are plans, not training: they never reach volume, streak
        /// or record statistics. Legacy rows without a session always count.
        /// </summary>
        private Expression<Func<UserExercise, bool>> CountsTowardsStats => ue =>
            ue.SessionId == null
            || _context.WorkoutSessions.Any(s => s.Id == ue.SessionId && s.Status != WorkoutStatus.Planned);

        public async Task<OneRepMaxProgressionResponseDto> Get1RMProgression(int userId)
        {
            var userExercises = await _context.UserExercise
                .Where(ue => ue.UserId == userId && ue.Weight.HasValue && ue.Reps.HasValue)
                .Where(CountsTowardsStats)
                .Join(_context.Exercises,
                    ue => ue.ExerciseId,
                    e => e.Id,
                    (ue, e) => new
                    {
                        ue.Date,
                        ue.Weight,
                        ue.Reps,
                        e.Name,
                        e.Category,
                        e.IsBenchmark
                    })
                .OrderBy(x => x.Date)
                .ToListAsync();

            var exercisesByName = userExercises
                .GroupBy(x => x.Name.ToLower())
                .ToDictionary(
                    g => g.Key,
                    g => g.First()
                );

            var benchmarkExercises = userExercises
                .Where(x => x.IsBenchmark)
                .GroupBy(x => x.Name.ToLower())
                .ToList();

            var lifts = new List<OneRepMaxLiftDto>();

            foreach (var exGroup in benchmarkExercises)
            {
                var exName = exGroup.Key;
                var firstEntry = exGroup.First();

                var history = exGroup
                    .GroupBy(x => x.Date.Date)
                    .Select(g =>
                    {
                        var bestSet = g.OrderByDescending(x =>
                            _calculator.CalculateEpley(x.Weight!.Value, x.Reps!.Value))
                            .First();
                        return new OneRepMaxDataPointDto
                        {
                            Date = g.Key,
                            Estimated1RM = _calculator.CalculateEpley(
                                bestSet.Weight!.Value, bestSet.Reps!.Value)
                        };
                    })
                    .OrderBy(h => h.Date)
                    .ToList();

                var latest1RM = history.LastOrDefault()?.Estimated1RM ?? 0;

                lifts.Add(new OneRepMaxLiftDto
                {
                    LiftName = firstEntry.Name,
                    ExerciseCategory = firstEntry.Category,
                    Current1RM = latest1RM,
                    History = history
                });
            }

            lifts = lifts.OrderByDescending(l => l.Current1RM).ToList();

            return new OneRepMaxProgressionResponseDto { Lifts = lifts };
        }

        public async Task<ExerciseProgressResponseDto> GetExerciseProgress(
            int userId,
            int exerciseId,
            DateTime? startDate,
            DateTime? endDate)
        {
            var exerciseName = await _context.Exercises
                .Where(e => e.Id == exerciseId)
                .Select(e => e.Name)
                .FirstOrDefaultAsync() ?? "";

            var query = _context.UserExercise
                .Where(ue => ue.UserId == userId
                    && ue.ExerciseId == exerciseId
                    && ue.Weight.HasValue
                    && ue.Reps.HasValue)
                .Where(CountsTowardsStats);

            if (startDate.HasValue)
                query = query.Where(ue => ue.Date >= startDate.Value.Date);

            if (endDate.HasValue)
                query = query.Where(ue => ue.Date <= endDate.Value.Date.AddDays(1).AddTicks(-1));

            var entries = await query
                .Include(ue => ue.Exercise)
                .ThenInclude(e => e!.MuscleGroupMappings)
                .ThenInclude(mapping => mapping.MuscleGroup)
                .ToListAsync();

            var dataPoints = new List<ExerciseProgressPointDto>();
            var allTimeMax = 0m;

            var validEntries = entries
                .Where(x => _e1rmCalculator.IsValidSet(x.Weight!.Value, x.Reps!.Value))
                .ToList();

            var days = validEntries.GroupBy(x => x.Date.Date);

            foreach (var day in days)
            {
                var best = day
                    .Select(x => new
                    {
                        Weight = x.Weight!.Value,
                        Reps = x.Reps!.Value,
                        Rpe = x.RPE,
                        E1RM = _e1rmCalculator.CalculateEpley(x.Weight!.Value, x.Reps!.Value)
                    })
                    .Where(x => x.E1RM > 0)
                    .OrderByDescending(x => x.E1RM)
                    .ThenByDescending(x => x.Weight)
                    .FirstOrDefault();

                if (best == null) continue;

                var topSet = day
                    .OrderByDescending(x => x.Weight!.Value)
                    .ThenByDescending(x => x.Reps!.Value)
                    .First();

                dataPoints.Add(new ExerciseProgressPointDto
                {
                    Date = day.Key.ToString("yyyy-MM-dd"),
                    MaxE1RM = best.E1RM,
                    TopSetWeight = topSet.Weight!.Value,
                    TopSetReps = topSet.Reps!.Value,
                    TopSetRpe = topSet.RPE
                });

                allTimeMax = _e1rmCalculator.CalculateBest(best.Weight, best.Reps, allTimeMax);
            }

            var muscleAnalytics = entries
                .Where(x => x.RPE.HasValue && x.RPE.Value >= 7)
                .SelectMany(x => x.Exercise?.MuscleGroupMappings ?? Enumerable.Empty<ExerciseMuscleGroup>(),
                    (entry, mapping) => new
                    {
                        mapping.MuscleGroupKey,
                        Name = mapping.MuscleGroup?.NamePl ?? mapping.MuscleGroupKey,
                        Week = GetWeekStart(entry.Date),
                        HardSets = (entry.Sets ?? 1) * mapping.WeightPercentage,
                        Reps = entry.Reps!.Value
                    })
                .GroupBy(x => new { x.MuscleGroupKey, x.Name })
                .Select(group => new MuscleAnalyticsDto
                {
                    Key = group.Key.MuscleGroupKey,
                    Name = group.Key.Name,
                    WeeklyHardSets = group
                        .GroupBy(x => x.Week)
                        .OrderBy(x => x.Key)
                        .Select(week => new WeeklyHardSetsDto
                        {
                            Week = week.Key.ToString("yyyy-MM-dd"),
                            HardSets = week.Sum(x => x.HardSets)
                        })
                        .ToList(),
                    RepRanges = group
                        .GroupBy(x => GetRepRange(x.Reps))
                        .OrderBy(x => x.Key)
                        .Select(range => new RepRangeDistributionDto
                        {
                            Range = range.Key,
                            HardSets = range.Sum(x => x.HardSets)
                        })
                        .ToList()
                })
                .OrderBy(x => x.Name)
                .ToList();

            return new ExerciseProgressResponseDto
            {
                ExerciseId = exerciseId,
                ExerciseName = exerciseName,
                DataPoints = dataPoints.OrderBy(p => p.Date, StringComparer.Ordinal).ToList(),
                AllTimeMaxE1RM = allTimeMax,
                MuscleAnalytics = muscleAnalytics
            };
        }

        private static DateTime GetWeekStart(DateTime date)
        {
            var day = date.Date;
            var offset = ((int)day.DayOfWeek + 6) % 7;
            return day.AddDays(-offset);
        }

        private static string GetRepRange(int reps) => reps <= 5 ? "1-5" : reps <= 10 ? "6-10" : "11-15";
    }
}
