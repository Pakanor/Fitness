using ExerciseAPI.Data;
using ExerciseAPI.DTOs;
using ExerciseAPI.Interfaces;
using Microsoft.EntityFrameworkCore;

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

        public async Task<OneRepMaxProgressionResponseDto> Get1RMProgression(int userId)
        {
            var userExercises = await _context.UserExercise
                .Where(ue => ue.UserId == userId && ue.Weight.HasValue && ue.Reps.HasValue)
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
                    && ue.Reps.HasValue);

            if (startDate.HasValue)
                query = query.Where(ue => ue.Date >= startDate.Value.Date);

            if (endDate.HasValue)
                query = query.Where(ue => ue.Date <= endDate.Value.Date.AddDays(1).AddTicks(-1));

            var entries = await query
                .Select(ue => new { ue.Date, ue.Weight, ue.Reps })
                .ToListAsync();

            var dataPoints = new List<ExerciseProgressPointDto>();
            var allTimeMax = 0m;

            var days = entries
                .Where(x => _e1rmCalculator.IsValidSet(x.Weight!.Value, x.Reps!.Value))
                .GroupBy(x => x.Date.Date);

            foreach (var day in days)
            {
                var best = day
                    .Select(x => new
                    {
                        Weight = x.Weight!.Value,
                        Reps = x.Reps!.Value,
                        E1RM = _e1rmCalculator.CalculateEpley(x.Weight!.Value, x.Reps!.Value)
                    })
                    .Where(x => x.E1RM > 0)
                    .OrderByDescending(x => x.E1RM)
                    .ThenByDescending(x => x.Weight)
                    .FirstOrDefault();

                if (best == null) continue;

                dataPoints.Add(new ExerciseProgressPointDto
                {
                    Date = day.Key.ToString("yyyy-MM-dd"),
                    MaxE1RM = best.E1RM,
                    TopSetWeight = best.Weight,
                    TopSetReps = best.Reps
                });

                allTimeMax = _e1rmCalculator.CalculateBest(best.Weight, best.Reps, allTimeMax);
            }

            return new ExerciseProgressResponseDto
            {
                ExerciseId = exerciseId,
                ExerciseName = exerciseName,
                DataPoints = dataPoints.OrderBy(p => p.Date, StringComparer.Ordinal).ToList(),
                AllTimeMaxE1RM = allTimeMax
            };
        }
    }
}
