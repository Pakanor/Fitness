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
                .Where(ue => ue.UserId == userId)
                .Where(CountsTowardsStats)
                .Include(ue => ue.Sets)
                .Join(_context.Exercises,
                    ue => ue.ExerciseId,
                    e => e.Id,
                    (ue, e) => new
                    {
                        ue.Date,
                        Sets = ue.Sets,
                        e.Name,
                        e.Category,
                        e.IsBenchmark
                    })
                .OrderBy(x => x.Date)
                .ToListAsync();

            var setRecords = userExercises
                .SelectMany(x => x.Sets
                    .Where(s => s.Weight > 0 && s.Reps > 0)
                    .Select(s => new
                    {
                        x.Date,
                        Weight = s.Weight,
                        Reps = s.Reps,
                        x.Name,
                        x.Category,
                        x.IsBenchmark
                    }))
                .ToList();

            var exercisesByName = setRecords
                .GroupBy(x => x.Name.ToLower())
                .ToDictionary(
                    g => g.Key,
                    g => g.First()
                );

            var benchmarkExercises = setRecords
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
                            _calculator.CalculateEpley(x.Weight, x.Reps))
                            .First();
                        return new OneRepMaxDataPointDto
                        {
                            Date = g.Key,
                            Estimated1RM = _calculator.CalculateEpley(
                                bestSet.Weight, bestSet.Reps)
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
                    && ue.ExerciseId == exerciseId)
                .Where(CountsTowardsStats);

            if (startDate.HasValue)
            {
                var startUtc = DateTime.SpecifyKind(startDate.Value.Date, DateTimeKind.Utc);
                query = query.Where(ue => ue.Date >= startUtc);
            }

            if (endDate.HasValue)
            {
                var endUtc = DateTime.SpecifyKind(endDate.Value.Date.AddDays(1).AddTicks(-1), DateTimeKind.Utc);
                query = query.Where(ue => ue.Date <= endUtc);
            }

            var entries = await query
                .Include(ue => ue.Exercise)
                .ThenInclude(e => e!.MuscleGroupMappings)
                .ThenInclude(mapping => mapping.MuscleGroup)
                .Include(ue => ue.Sets)
                .ToListAsync();

            var setRecords = entries
                .SelectMany(entry => entry.Sets
                    .Select(set => new SetRecord
                    {
                        Date = entry.Date,
                        Weight = set.Weight,
                        Reps = set.Reps,
                        Rpe = set.RPE,
                        IsWarmup = set.IsWarmup,
                        Exercise = entry.Exercise
                    }))
                .ToList();

            var dataPoints = new List<ExerciseProgressPointDto>();
            var allTimeMax = 0m;

            var validEntries = setRecords
                .Where(x => _e1rmCalculator.IsValidSet(x.Weight, x.Reps))
                .ToList();

            var bestExerciseE1Rm = validEntries
                .Where(x => !x.IsWarmup)
                .Select(x => _e1rmCalculator.CalculateBrzycki(x.Weight, x.Reps, x.Rpe))
                .DefaultIfEmpty(0m)
                .Max();

            var days = validEntries.GroupBy(x => x.Date.Date);

            foreach (var day in days)
            {
                var best = day
                    .Select(x => new
                    {
                        Weight = x.Weight,
                        Reps = x.Reps,
                        Rpe = x.Rpe,
                        E1RM = _e1rmCalculator.CalculateBrzycki(x.Weight, x.Reps, x.Rpe)
                    })
                    .Where(x => x.E1RM > 0)
                    .OrderByDescending(x => x.E1RM)
                    .ThenByDescending(x => x.Weight)
                    .FirstOrDefault();

                if (best == null) continue;

                var topSet = day
                    .OrderByDescending(x => x.Weight)
                    .ThenByDescending(x => x.Reps)
                    .First();

                dataPoints.Add(new ExerciseProgressPointDto
                {
                    Date = day.Key.ToString("yyyy-MM-dd"),
                    MaxE1RM = best.E1RM,
                    TopSetWeight = topSet.Weight,
                    TopSetReps = topSet.Reps,
                    TopSetRpe = topSet.Rpe,
                    HasRpe = best.Rpe.HasValue
                });

                allTimeMax = _e1rmCalculator.CalculateBest(best.Weight, best.Reps, best.Rpe, allTimeMax);
            }

            var hardEntries = validEntries
                .Where(x => IsHardSet(x, bestExerciseE1Rm))
                .ToList();

            var muscleAnalytics = hardEntries
                .SelectMany(x => GetMuscleWeights(x.Exercise),
                    (entry, mapping) => new
                    {
                        MuscleGroupKey = mapping.Key,
                        mapping.Name,
                        Week = GetWeekStart(entry.Date),
                        HardSets = mapping.Weight,
                        Reps = entry.Reps
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

            var workload = validEntries
                .GroupBy(x => x.Date.Date)
                .OrderBy(x => x.Key)
                .Select(day => new ExerciseWorkloadPointDto
                {
                    Date = day.Key.ToString("yyyy-MM-dd"),
                    Tonnage = day.Sum(x => x.Weight * x.Reps),
                    Repetitions = day.Sum(x => x.Reps),
                    AverageReps = (decimal)Math.Round(day.Average(x => x.Reps), 2),
                    HardSets = hardEntries.Where(x => x.Date.Date == day.Key).Sum(x => 1m)
                })
                .ToList();

            var repRanges = validEntries
                .GroupBy(x => GetRepRange(x.Reps))
                .OrderBy(x => x.Key)
                .Select(group => new ExerciseRepRangeDto
                {
                    Range = group.Key,
                    Sets = group.Sum(x => 1m)
                })
                .ToList();

            var allTimePr = validEntries
                .OrderByDescending(x => x.Weight)
                .ThenByDescending(x => x.Reps)
                .FirstOrDefault();

            return new ExerciseProgressResponseDto
            {
                ExerciseId = exerciseId,
                ExerciseName = exerciseName,
                DataPoints = dataPoints.OrderBy(p => p.Date, StringComparer.Ordinal).ToList(),
                AllTimeMaxE1RM = allTimeMax,
                MuscleAnalytics = muscleAnalytics,
                Workload = workload,
                RepRanges = repRanges,
                AllTimePrWeight = allTimePr?.Weight ?? 0m,
                AllTimePrReps = allTimePr?.Reps ?? 0,
                TotalSets = validEntries.Count,
                LastPerformedDate = validEntries.OrderByDescending(x => x.Date).FirstOrDefault()?.Date.ToString("yyyy-MM-dd")
            };
        }

        public async Task<GlobalAnalyticsResponseDto> GetOverview(
            int userId,
            DateTime? startDate,
            DateTime? endDate,
            string? timeZoneId = null)
        {
            var timeZone = ResolveTimeZone(timeZoneId);
            var query = _context.UserExercise
                .Where(ue => ue.UserId == userId)
                .Where(CountsTowardsStats)
                .Include(ue => ue.Exercise)
                .ThenInclude(e => e!.MuscleGroupMappings)
                .ThenInclude(mapping => mapping.MuscleGroup)
                .Include(ue => ue.Sets)
                .AsQueryable();

            if (startDate.HasValue)
            {
                var startUtc = ConvertLocalDateToUtc(startDate.Value.Date, timeZone);
                query = query.Where(ue => ue.Date >= startUtc);
            }

            if (endDate.HasValue)
            {
                var endExclusiveUtc = ConvertLocalDateToUtc(endDate.Value.Date.AddDays(1), timeZone);
                query = query.Where(ue => ue.Date < endExclusiveUtc);
            }

            var entries = await query.ToListAsync();
            var setRecords = entries
                .SelectMany(entry => entry.Sets
                    .Select(set => new SetRecord
                    {
                        Date = entry.Date,
                        Weight = set.Weight,
                        Reps = set.Reps,
                        Rpe = set.RPE,
                        IsWarmup = set.IsWarmup,
                        Exercise = entry.Exercise,
                        ExerciseId = entry.ExerciseId
                    }))
                .ToList();

            var validEntries = setRecords
                .Where(x => _e1rmCalculator.IsValidSet(x.Weight, x.Reps))
                .ToList();

            var bestByExercise = validEntries
                .Where(x => !x.IsWarmup)
                .GroupBy(x => x.ExerciseId)
                .ToDictionary(
                    group => group.Key,
                    group => group.Max(x => _e1rmCalculator.CalculateBrzycki(x.Weight, x.Reps, x.Rpe)));

            var hardEntries = validEntries
                .Where(x => bestByExercise.TryGetValue(x.ExerciseId, out var best) && IsHardSet(x, best))
                .ToList();

            var periodStart = startDate?.Date
                ?? (validEntries.Count > 0
                    ? ToUserLocalDate(validEntries.Min(x => x.Date), timeZone)
                    : DateTime.Today);
            var periodEnd = endDate?.Date
                ?? (validEntries.Count > 0
                    ? ToUserLocalDate(validEntries.Max(x => x.Date), timeZone)
                    : periodStart);
            var weekCount = GetCalendarWeekCount(periodStart, periodEnd);

            var muscleVolume = hardEntries
                .SelectMany(x => GetMuscleWeights(x.Exercise),
                    (entry, mapping) => new
                    {
                        mapping.Key,
                        mapping.Name,
                        HardSets = mapping.Weight
                    })
                .GroupBy(x => new { x.Key, x.Name })
                .OrderBy(x => x.Key.Name)
                .Select(group => new GlobalMuscleVolumeDto
                {
                    Key = group.Key.Key,
                    Name = group.Key.Name,
                    HardSets = Math.Round(group.Sum(x => x.HardSets) / weekCount, 2)
                })
                .ToList();

            var activity = hardEntries
                .GroupBy(x => ToUserLocalDate(x.Date, timeZone))
                .OrderBy(x => x.Key)
                .Select(day => new TrainingActivityDayDto
                {
                    Date = day.Key.ToString("yyyy-MM-dd"),
                    HardSets = day.Sum(x => 1m)
                })
                .ToList();

            var weeklyTrend = hardEntries
                .GroupBy(x => GetWeekStart(ToUserLocalDate(x.Date, timeZone)))
                .OrderBy(x => x.Key)
                .Select(week => new WeeklyTrainingTrendDto
                {
                    Week = week.Key.ToString("yyyy-MM-dd"),
                    HardSets = week.Sum(x => 1m),
                    AverageRpe = setRecords
                        .Where(x => GetWeekStart(ToUserLocalDate(x.Date, timeZone)) == week.Key && x.Rpe.HasValue)
                        .Any()
                        ? (decimal?)Math.Round(setRecords
                            .Where(x => GetWeekStart(ToUserLocalDate(x.Date, timeZone)) == week.Key && x.Rpe.HasValue)
                            .Select(x => (double)x.Rpe!.Value)
                            .Average(), 2)
                        : null
                })
                .ToList();

            return new GlobalAnalyticsResponseDto
            {
                MuscleVolume = muscleVolume,
                Activity = activity,
                WeeklyTrend = weeklyTrend
            };
        }

        private static bool IsHardSet(SetRecord entry, decimal bestE1Rm)
        {
            return !entry.IsWarmup
                && (bestE1Rm <= 0m || entry.Weight >= bestE1Rm * 0.5m);
        }

        private static DateTime GetWeekStart(DateTime date)
        {
            var day = date.Date;
            var offset = ((int)day.DayOfWeek + 6) % 7;
            return day.AddDays(-offset);
        }

        private static int GetCalendarWeekCount(DateTime periodStart, DateTime periodEnd)
        {
            var firstWeek = GetWeekStart(periodStart);
            var lastWeek = GetWeekStart(periodEnd);
            return Math.Max(1, (int)((lastWeek - firstWeek).TotalDays / 7) + 1);
        }

        private static TimeZoneInfo ResolveTimeZone(string? timeZoneId)
        {
            if (string.IsNullOrWhiteSpace(timeZoneId))
                return TimeZoneInfo.Utc;

            try
            {
                return TimeZoneInfo.FindSystemTimeZoneById(timeZoneId);
            }
            catch (TimeZoneNotFoundException)
            {
                return TimeZoneInfo.Utc;
            }
            catch (InvalidTimeZoneException)
            {
                return TimeZoneInfo.Utc;
            }
        }

        private static DateTime ConvertLocalDateToUtc(DateTime localDate, TimeZoneInfo timeZone)
        {
            var unspecified = DateTime.SpecifyKind(localDate, DateTimeKind.Unspecified);
            return TimeZoneInfo.ConvertTimeToUtc(unspecified, timeZone);
        }

        private static DateTime ToUserLocalDate(DateTime value, TimeZoneInfo timeZone)
        {
            var utcValue = DateTime.SpecifyKind(value, DateTimeKind.Utc);
            return TimeZoneInfo.ConvertTimeFromUtc(utcValue, timeZone).Date;
        }

        private static string GetRepRange(int reps) => reps <= 5 ? "1-5" : reps <= 10 ? "6-10" : "11-15";

        /// <summary>
        /// Flattened record of a single workout set with its owning exercise context.
        /// Used by analytics queries that previously consumed aggregated UserExercise rows.
        /// </summary>
        private class SetRecord
        {
            public DateTime Date { get; set; }
            public decimal Weight { get; set; }
            public int Reps { get; set; }
            public decimal? Rpe { get; set; }
            public bool IsWarmup { get; set; }
            public Exercise? Exercise { get; set; }
            public int ExerciseId { get; set; }
        }

        private static IEnumerable<(string Key, string Name, decimal Weight)> GetMuscleWeights(Exercise? exercise)
        {
            if (exercise == null)
                return Enumerable.Empty<(string, string, decimal)>();

            if (exercise.MuscleGroupMappings.Count > 0)
            {
                return exercise.MuscleGroupMappings.Select(mapping =>
                    (mapping.MuscleGroupKey, mapping.MuscleGroup?.NamePl ?? mapping.MuscleGroupKey, mapping.WeightPercentage));
            }

            return new[]
            {
                ("chest_main", "Klatka piersiowa", exercise.ChestMain),
                ("deltoid_anterior", "Bark przedni", exercise.DeltoidAnterior),
                ("deltoid_lateral", "Bark boczny", exercise.DeltoidLateral),
                ("deltoid_posterior", "Bark tylny", exercise.DeltoidPosterior),
                ("biceps", "Biceps", exercise.Biceps),
                ("triceps", "Triceps", exercise.Triceps),
                ("forearms", "Przedramiona", exercise.Forearms),
                ("lats", "Plecy szerokie", exercise.Lats),
                ("rhomboids", "Romby i czworoboczny", exercise.Rhomboids),
                ("lower_back", "Dolny odcinek pleców", exercise.LowerBack),
                ("abs", "Brzuch", exercise.Abs),
                ("core_stabilizers", "Stabilizatory tułowia", exercise.CoreStabilizers),
                ("quadriceps", "Czwórki", exercise.Quadriceps),
                ("hamstrings", "Dwugłowe uda", exercise.Hamstrings),
                ("glutes", "Pośladki", exercise.Glutes),
                ("calves", "Łydki", exercise.Calves)
            }.Where(mapping => mapping.Item3 > 0)
                .Select(mapping => (mapping.Item1, mapping.Item2, mapping.Item3));
        }
    }
}
