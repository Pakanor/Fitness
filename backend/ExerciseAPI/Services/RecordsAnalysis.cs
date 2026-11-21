using ExerciseAPI.DTOs;
using ExerciseAPI.Models;

namespace ExerciseAPI.Services
{
    /// <summary>
    /// Pure analysis core for records. Operates entirely on in-memory
    /// <see cref="SetRecord"/> data: no EF, no time zones, no exceptions.
    /// The adapter (<see cref="RecordsService"/>) is responsible for I/O,
    /// time-zone conversion and benchmark/PR lookups, then delegates here.
    /// </summary>
    public static class RecordsAnalysis
    {
        public static OneRepMaxProgressionResponseDto Analyze1RMProgression(IEnumerable<SetRecord> sets)
        {
            var working = sets.Where(s => WorkingSet.Counts(ToWorkingSet(s))).ToList();

            var benchmarkExercises = working
                .Where(s => s.IsBenchmark)
                .GroupBy(s => s.ExerciseName.ToLower())
                .ToList();

            var lifts = new List<OneRepMaxLiftDto>();

            foreach (var exGroup in benchmarkExercises)
            {
                var firstEntry = exGroup.First();

                var history = exGroup
                    .GroupBy(s => s.Date.Date)
                    .Select(g =>
                    {
                        var bestSet = g
                            .OrderByDescending(s => Performance.E1RM(new PerformanceSet(s.Weight, s.Reps, s.Rpe)) ?? 0m)
                            .First();
                        return new OneRepMaxDataPointDto
                        {
                            Date = g.Key,
                            Estimated1RM = Performance.E1RM(new PerformanceSet(bestSet.Weight, bestSet.Reps, bestSet.Rpe)) ?? 0m
                        };
                    })
                    .OrderBy(h => h.Date)
                    .ToList();

                var latest1RM = history.LastOrDefault()?.Estimated1RM ?? 0;

                lifts.Add(new OneRepMaxLiftDto
                {
                    LiftName = firstEntry.ExerciseName,
                    ExerciseCategory = firstEntry.ExerciseCategory,
                    Current1RM = latest1RM,
                    History = history
                });
            }

            lifts = lifts.OrderByDescending(l => l.Current1RM).ToList();

            return new OneRepMaxProgressionResponseDto { Lifts = lifts };
        }

        public static ExerciseProgressResponseDto AnalyzeExerciseProgress(
            IEnumerable<SetRecord> sets,
            int exerciseId,
            string exerciseName)
        {
            var all = sets.ToList();

            var workingSets = all.Select(ToWorkingSet).ToList();

            var validIndices = workingSets
                .Select((ws, i) => new { ws, i })
                .Where(x => WorkingSet.Counts(x.ws))
                .Select(x => x.i)
                .ToList();

            var validEntries = validIndices.Select(i => all[i]).ToList();

            var bestExerciseE1Rm = WorkingSet.GetBestE1RM(validIndices.Select(i => workingSets[i]));

            var dataPoints = new List<ExerciseProgressPointDto>();
            var allTimeMax = 0m;

            foreach (var day in validEntries.GroupBy(s => s.Date.Date))
            {
                var best = day
                    .Select(s => new
                    {
                        s.Weight,
                        s.Reps,
                        s.Rpe,
                        E1RM = Performance.E1RM(new PerformanceSet(s.Weight, s.Reps, s.Rpe))
                    })
                    .Where(x => x.E1RM.HasValue && x.E1RM.Value > 0)
                    .OrderByDescending(x => x.E1RM)
                    .ThenByDescending(x => x.Weight)
                    .FirstOrDefault();

                if (best == null) continue;

                var topSet = day
                    .OrderByDescending(s => s.Weight)
                    .ThenByDescending(s => s.Reps)
                    .First();

                dataPoints.Add(new ExerciseProgressPointDto
                {
                    Date = day.Key.ToString("yyyy-MM-dd"),
                    MaxE1RM = best.E1RM!.Value,
                    TopSetWeight = topSet.Weight,
                    TopSetReps = topSet.Reps,
                    TopSetRpe = topSet.Rpe,
                    HasRpe = best.Rpe.HasValue
                });

                allTimeMax = Math.Max(allTimeMax, best.E1RM.Value);
            }

            var hardEntries = validEntries
                .Where(s => WorkingSet.Counts(ToWorkingSet(s), bestExerciseE1Rm))
                .ToList();

            var muscleAnalytics = hardEntries
                .SelectMany(s => s.MuscleWeights,
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
                .GroupBy(s => s.Date.Date)
                .OrderBy(g => g.Key)
                .Select(day => new ExerciseWorkloadPointDto
                {
                    Date = day.Key.ToString("yyyy-MM-dd"),
                    Tonnage = day.Sum(s => s.Weight * s.Reps),
                    Repetitions = day.Sum(s => s.Reps),
                    AverageReps = (decimal)Math.Round(day.Average(s => s.Reps), 2),
                    HardSets = hardEntries.Where(s => s.Date.Date == day.Key).Sum(x => 1m)
                })
                .ToList();

            var repRanges = validEntries
                .GroupBy(s => GetRepRange(s.Reps))
                .OrderBy(g => g.Key)
                .Select(group => new ExerciseRepRangeDto
                {
                    Range = group.Key,
                    Sets = group.Sum(x => 1m)
                })
                .ToList();

            var allTimePr = validEntries
                .Select(s => new
                {
                    s.Weight,
                    s.Reps,
                    E1RM = Performance.E1RM(new PerformanceSet(s.Weight, s.Reps, s.Rpe))
                })
                .Where(x => x.E1RM.HasValue)
                .OrderByDescending(x => x.E1RM!.Value)
                .ThenByDescending(x => x.Weight)
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
                LastPerformedDate = validEntries.OrderByDescending(s => s.Date).FirstOrDefault()?.Date.ToString("yyyy-MM-dd")
            };
        }

        public static GlobalAnalyticsResponseDto AnalyzeOverview(
            IEnumerable<SetRecord> sets,
            DateTime? startDate,
            DateTime? endDate,
            IReadOnlyList<InsightDto>? precomputedInsights = null)
        {
            var all = sets.ToList();

            var validEntries = all.Where(s => WorkingSet.Counts(ToWorkingSet(s))).ToList();

            var periodStart = startDate?.Date
                ?? (validEntries.Count > 0 ? validEntries.Min(s => s.Date).Date : DateTime.Today);
            var periodEnd = endDate?.Date
                ?? (validEntries.Count > 0 ? validEntries.Max(s => s.Date).Date : periodStart);
            var weekCount = GetCalendarWeekCount(periodStart, periodEnd);

            var bestByExercise = validEntries
                .GroupBy(s => s.ExerciseId)
                .ToDictionary(
                    group => group.Key,
                    group => WorkingSet.GetBestE1RM(group.Select(ToWorkingSet)));

            var hardEntries = validEntries
                .Where(s => bestByExercise.TryGetValue(s.ExerciseId, out var best) && WorkingSet.Counts(ToWorkingSet(s), best))
                .ToList();

            var muscleVolume = hardEntries
                .SelectMany(s => s.MuscleWeights,
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
                .GroupBy(s => s.Date.Date)
                .OrderBy(g => g.Key)
                .Select(day => new TrainingActivityDayDto
                {
                    Date = day.Key.ToString("yyyy-MM-dd"),
                    HardSets = day.Sum(x => 1m)
                })
                .ToList();

            var weeklyTrend = hardEntries
                .GroupBy(s => GetWeekStart(s.Date))
                .OrderBy(g => g.Key)
                .Select(week => new WeeklyTrainingTrendDto
                {
                    Week = week.Key.ToString("yyyy-MM-dd"),
                    HardSets = week.Sum(x => 1m),
                    AverageRpe = ComputeAverageRpe(all, week.Key)
                })
                .ToList();

            var insights = new List<InsightDto>();

            if (muscleVolume.Any())
            {
                var avg = muscleVolume.Average(m => (double)m.HardSets);
                foreach (var mv in muscleVolume)
                {
                    if ((double)mv.HardSets < 10 && avg > 12)
                    {
                        insights.Add(new InsightDto
                        {
                            Type = "UnderTrainedMuscle",
                            Title = $"Niedostateczna objętość: {mv.Name}",
                            Description = $"Średnia {mv.HardSets} hard sets/tydzień przy średniej dla pozostałych partii ~{Math.Round(avg, 1)}. Rozważ zwiększenie objętości.",
                            Severity = "warn",
                            MuscleKey = mv.Key
                        });
                    }
                }
            }

            if (precomputedInsights != null && precomputedInsights.Count > 0)
                insights.AddRange(precomputedInsights);

            return new GlobalAnalyticsResponseDto
            {
                MuscleVolume = muscleVolume,
                Activity = activity,
                WeeklyTrend = weeklyTrend,
                Insights = insights
            };
        }

        private static decimal? ComputeAverageRpe(List<SetRecord> all, DateTime weekStart)
        {
            var rpes = all
                .Where(s => GetWeekStart(s.Date) == weekStart && s.Rpe.HasValue)
                .Select(s => (double)s.Rpe!.Value)
                .ToList();

            return rpes.Count > 0 ? (decimal?)Math.Round(rpes.Average(), 2) : null;
        }

        private static WorkingSetInput ToWorkingSet(SetRecord s) => new()
        {
            Weight = s.Weight,
            Reps = s.Reps,
            Rpe = s.Rpe,
            SetType = s.SetType
        };

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

        private static string GetRepRange(int reps) => reps <= 5 ? "1-5" : reps <= 10 ? "6-10" : "11-15";
    }
}