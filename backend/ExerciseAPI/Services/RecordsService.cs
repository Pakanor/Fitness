using ExerciseAPI.Data;
using ExerciseAPI.DTOs;
using Microsoft.EntityFrameworkCore;

namespace ExerciseAPI.Services
{
    public class RecordsService
    {
        private readonly AppDbContext _context;
        private readonly OneRepMaxCalculator _calculator;

        private static readonly string[] MainCompoundLifts = new[]
        {
            "squat", "bench press", "deadlift", "overhead press",
            "przysiad", "wyciskanie sztangi", "martwy ciąg", "wyciskanie nad głowę"
        };

        public RecordsService(AppDbContext context, OneRepMaxCalculator calculator)
        {
            _context = context;
            _calculator = calculator;
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
    }
}
