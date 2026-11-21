using ExerciseAPI.Data;
using ExerciseAPI.DTOs;
using ExerciseAPI.Interfaces;
using ExerciseAPI.Models;
using Microsoft.EntityFrameworkCore;
using System.Linq.Expressions;

namespace ExerciseAPI.Services
{
    /// <summary>
    /// Thin adapter over records data. Owns EF I/O, time-zone conversion,
    /// the <see cref="CountsTowardsStats"/> filter and benchmark/stale/plateau
    /// lookups, then delegates all mathematical analysis to <see cref="RecordsAnalysis"/>.
    /// </summary>
    public class RecordsService : IRecordsService
    {
        private readonly AppDbContext _context;

        public RecordsService(AppDbContext context)
        {
            _context = context;
        }

        /// <summary>
        /// PLANNED sessions are plans, not training: they never reach volume, streak
        /// or record statistics. Legacy rows without a session always count.
        /// </summary>
        private Expression<Func<UserExercise, bool>> CountsTowardsStats => ue =>
            ue.SessionId == null
            || _context.WorkoutSessions.Any(s => s.Id == ue.SessionId && s.Status != WorkoutStatus.Planned);

        // ---------- Analytics (delegate to RecordsAnalysis) ----------

        public async Task<OneRepMaxProgressionResponseDto> Get1RMProgression(int userId)
        {
            var sets = await FetchSets(userId, exerciseId: null, startUtc: null, endUtc: null, endExclusive: false, localTimeZone: null);
            return RecordsAnalysis.Analyze1RMProgression(sets);
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

            DateTime? startUtc = startDate.HasValue
                ? DateTime.SpecifyKind(startDate.Value.Date, DateTimeKind.Utc)
                : null;
            DateTime? endUtc = endDate.HasValue
                ? DateTime.SpecifyKind(endDate.Value.Date.AddDays(1).AddTicks(-1), DateTimeKind.Utc)
                : null;

            var sets = await FetchSets(userId, exerciseId, startUtc, endUtc, endExclusive: false, localTimeZone: null);
            return RecordsAnalysis.AnalyzeExerciseProgress(sets, exerciseId, exerciseName);
        }

        public async Task<GlobalAnalyticsResponseDto> GetOverview(
            int userId,
            DateTime? startDate,
            DateTime? endDate,
            string? timeZoneId = null)
        {
            var timeZone = ResolveTimeZone(timeZoneId);

            DateTime? startUtc = startDate.HasValue
                ? ConvertLocalDateToUtc(startDate.Value.Date, timeZone)
                : null;
            DateTime? endUtc = endDate.HasValue
                ? ConvertLocalDateToUtc(endDate.Value.Date.AddDays(1), timeZone)
                : null;

            var sets = await FetchSets(userId, exerciseId: null, startUtc, endUtc, endExclusive: true, localTimeZone: timeZone);

            var insights = await ComputeInsights(userId);
            var weeklyStreak = await ComputeWeeklyStreak(userId, timeZone);

            var result = RecordsAnalysis.AnalyzeOverview(sets, startDate, endDate, insights);
            result.WeeklyStreak = weeklyStreak;
            return result;
        }

        // ---------- Controller-direct (simple lookups) ----------

        public async Task<IReadOnlyList<PersonalRecordDto>> GetHistory(int userId)
        {
            var rows = await _context.PersonalRecords
                .Where(pr => pr.UserId == userId)
                .Join(_context.Exercises,
                    pr => pr.ExerciseId,
                    e => e.Id,
                    (pr, e) => new { pr, e })
                .OrderByDescending(x => x.pr.Weight)
                .ToListAsync();

            return rows.Select(x => new PersonalRecordDto(
                x.pr.Id,
                x.pr.ExerciseId,
                x.e.Name,
                x.e.Category,
                x.pr.Weight,
                x.pr.Reps,
                x.pr.Date,
                x.pr.UserWeightAtTime,
                x.pr.UserAgeAtTime,
                x.pr.DietStatusAtTime,
                x.pr.StrengthToWeightRatio)).ToList();
        }

        public async Task<IReadOnlyList<ExerciseSearchDto>> SearchExercises(int userId, string query)
        {
            if (string.IsNullOrWhiteSpace(query))
                return new List<ExerciseSearchDto>();

            var rows = await _context.Exercises
                .Where(e => EF.Functions.ILike(e.Name, $"%{query}%"))
                .Take(20)
                .Select(e => new
                {
                    e.Id,
                    e.Name,
                    e.Category,
                    HasPR = _context.PersonalRecords.Any(pr => pr.UserId == userId && pr.ExerciseId == e.Id)
                })
                .ToListAsync();

            return rows
                .Select(r => new ExerciseSearchDto(r.Id, r.Name, r.Category, r.HasPR))
                .ToList();
        }

        public async Task<IReadOnlyList<PersonalRecordDto>> GetExerciseHistory(int userId, int exerciseId)
        {
            var rows = await _context.PersonalRecords
                .Where(pr => pr.UserId == userId && pr.ExerciseId == exerciseId)
                .Join(_context.Exercises,
                    pr => pr.ExerciseId,
                    e => e.Id,
                    (pr, e) => new { pr, e })
                .OrderByDescending(x => x.pr.Date)
                .ToListAsync();

            return rows.Select(x => new PersonalRecordDto(
                x.pr.Id,
                x.pr.ExerciseId,
                x.e.Name,
                x.e.Category,
                x.pr.Weight,
                x.pr.Reps,
                x.pr.Date,
                x.pr.UserWeightAtTime,
                x.pr.UserAgeAtTime,
                x.pr.DietStatusAtTime,
                x.pr.StrengthToWeightRatio)).ToList();
        }

        // ---------- Fetch / DB helpers ----------

        private async Task<List<SetRecord>> FetchSets(
            int userId,
            int? exerciseId,
            DateTime? startUtc,
            DateTime? endUtc,
            bool endExclusive,
            TimeZoneInfo? localTimeZone)
        {
            var query = _context.UserExercise
                .Where(ue => ue.UserId == userId)
                .Where(CountsTowardsStats)
                .Include(ue => ue.Exercise)
                    .ThenInclude(e => e!.MuscleGroupMappings)
                    .ThenInclude(mapping => mapping.MuscleGroup)
                .Include(ue => ue.Sets)
                .AsQueryable();

            if (exerciseId.HasValue)
                query = query.Where(ue => ue.ExerciseId == exerciseId.Value);

            if (startUtc.HasValue)
                query = query.Where(ue => ue.Date >= startUtc.Value);

            if (endUtc.HasValue)
                query = endExclusive
                    ? query.Where(ue => ue.Date < endUtc.Value)
                    : query.Where(ue => ue.Date <= endUtc.Value);

            var entries = await query.ToListAsync();

            var records = new List<SetRecord>();
            foreach (var entry in entries)
            {
                var date = localTimeZone != null ? ToUserLocalDate(entry.Date, localTimeZone) : entry.Date;
                var name = entry.Exercise?.Name ?? "";
                var category = entry.Exercise?.Category ?? "";
                var isBenchmark = entry.Exercise?.IsBenchmark ?? false;
                var muscleWeights = GetMuscleWeights(entry.Exercise).ToList();

                foreach (var set in entry.Sets)
                {
                    records.Add(new SetRecord(
                        date,
                        entry.ExerciseId,
                        set.Weight,
                        set.Reps,
                        set.RPE,
                        set.SetType,
                        name,
                        category,
                        isBenchmark,
                        muscleWeights));
                }
            }

            return records;
        }

        private async Task<List<InsightDto>> ComputeInsights(int userId)
        {
            var insights = new List<InsightDto>();

            var benchmarkExercises = await _context.Exercises
                .Where(e => e.IsBenchmark)
                .ToListAsync();

            if (benchmarkExercises.Count == 0)
                return insights;

            var benchmarkIds = benchmarkExercises.Select(e => e.Id).ToList();

            // Single query for all of the user's benchmark history (avoids the old N+1).
            var userBenchEntries = await _context.UserExercise
                .Where(ue => ue.UserId == userId && benchmarkIds.Contains(ue.ExerciseId))
                .Where(CountsTowardsStats)
                .Include(ue => ue.Sets)
                .OrderByDescending(ue => ue.Date)
                .ToListAsync();

            var byExercise = userBenchEntries
                .GroupBy(ue => ue.ExerciseId)
                .ToDictionary(g => g.Key, g => g.ToList());

            var threeWeeksAgo = DateTime.UtcNow.AddDays(-21);

            foreach (var bench in benchmarkExercises)
            {
                byExercise.TryGetValue(bench.Id, out var entries);
                entries ??= new List<UserExercise>();
                var lastPerf = entries.FirstOrDefault();

                if (lastPerf == null || lastPerf.Date < threeWeeksAgo)
                {
                    insights.Add(new InsightDto
                    {
                        Type = "StaleBenchmark",
                        Title = $"Brak wykonania: {bench.Name}",
                        Description = lastPerf == null
                            ? "Ćwiczenie benchmarkowe nie było jeszcze wykonywane."
                            : $"Nie wykonywane od {Math.Round((DateTime.UtcNow - lastPerf.Date.ToUniversalTime()).TotalDays, 0)} dni (ponad 3 tygodnie).",
                        Severity = "info",
                        ExerciseId = bench.Id
                    });
                }
            }

            foreach (var bench in benchmarkExercises)
            {
                byExercise.TryGetValue(bench.Id, out var entries);
                entries ??= new List<UserExercise>();

                if (entries.Count < 4)
                    continue;

                var sessionE1RMs = entries
                    .Take(4)
                    .Select(ue =>
                    {
                        var ws = ue.Sets
                            .Select(s => new WorkingSetInput
                            {
                                Weight = s.Weight,
                                Reps = s.Reps,
                                Rpe = s.RPE,
                                SetType = s.SetType
                            })
                            .ToList();
                        return WorkingSet.GetBestE1RM(WorkingSet.Select(ws));
                    })
                    .ToList();

                var noGrowth = sessionE1RMs[0] <= sessionE1RMs[1]
                    && sessionE1RMs[1] <= sessionE1RMs[2]
                    && sessionE1RMs[2] <= sessionE1RMs[3];

                if (noGrowth && sessionE1RMs[0] > 0)
                {
                    insights.Add(new InsightDto
                    {
                        Type = "Plateau",
                        Title = $"Plateau: {bench.Name}",
                        Description = "e1RM nie rośnie przez ostatnie 4 sesje. Rozważ zmianę programu, objętości lub intensywności.",
                        Severity = "warn",
                        ExerciseId = bench.Id
                    });
                }
            }

            return insights;
        }

        private async Task<int?> ComputeWeeklyStreak(int userId, TimeZoneInfo timeZone)
        {
            var completedSessions = await _context.WorkoutSessions
                .Where(s => s.UserId == userId && s.Status == WorkoutStatus.Completed)
                .ToListAsync();

            if (completedSessions.Count == 0)
                return null;

            var qualifyingWeeks = completedSessions
                .Select(s => GetWeekStart(ToUserLocalDate(s.Date, timeZone)))
                .GroupBy(d => d)
                .Where(g => g.Count() >= 3)
                .Select(g => g.Key)
                .ToHashSet();

            if (qualifyingWeeks.Count == 0)
                return null;

            var currentWeekStart = GetWeekStart(ToUserLocalDate(DateTime.UtcNow, timeZone));
            var consecutive = 0;
            for (var i = 0; i < 200; i++)
            {
                if (qualifyingWeeks.Contains(currentWeekStart.AddDays(-7 * i)))
                    consecutive++;
                else
                    break;
            }

            return consecutive;
        }

        // ---------- Pure/stateless helpers ----------

        private static DateTime GetWeekStart(DateTime date)
        {
            var day = date.Date;
            var offset = ((int)day.DayOfWeek + 6) % 7;
            return day.AddDays(-offset);
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