using ExerciseAPI.Data;
using ExerciseAPI.Models;
using Microsoft.EntityFrameworkCore;

namespace ExerciseAPI.Services
{
    /// <summary>
    /// The only writer of PersonalRecords. Compares the best working set of a
    /// logged batch against the best e1RM already recorded for that exercise.
    /// </summary>
    public class PersonalRecordsService
    {
        private readonly AppDbContext _context;

        public PersonalRecordsService(AppDbContext context)
        {
            _context = context;
        }

        public async Task<PrOutcome> RecordAsync(
            int userId,
            int exerciseId,
            IEnumerable<WorkingSetInput> sets,
            DateTime date,
            decimal? userWeight,
            CancellationToken ct = default)
        {
            var candidate = SelectBestSet(sets);
            if (candidate == null)
                return new PrOutcome(false, null, null);

            var previous = await FindBestRecordAsync(userId, exerciseId, ct);
            var outcome = Performance.EvaluatePr(candidate.Value, previous);

            if (!outcome.IsPr)
                return outcome;

            _context.PersonalRecords.Add(new PersonalRecord
            {
                UserId = userId,
                ExerciseId = exerciseId,
                Weight = candidate.Value.Weight,
                Reps = candidate.Value.Reps,
                Date = date,
                UserWeightAtTime = userWeight,
                StrengthToWeightRatio = userWeight.HasValue && userWeight.Value > 0
                    ? Math.Round(candidate.Value.Weight / userWeight.Value, 2)
                    : null
            });
            await _context.SaveChangesAsync(ct);

            return outcome;
        }

        private static PerformanceSet? SelectBestSet(IEnumerable<WorkingSetInput> sets)
        {
            var best = WorkingSet.Select(sets)
                .Select(s => new PerformanceSet(s.Weight, s.Reps, s.Rpe))
                .Select(s => new { Set = s, E1RM = Performance.E1RM(s) })
                .Where(x => x.E1RM.HasValue)
                .OrderByDescending(x => x.E1RM!.Value)
                .ThenByDescending(x => x.Set.Weight)
                .FirstOrDefault();

            return best == null ? null : best.Set;
        }

        private async Task<PreviousPr?> FindBestRecordAsync(int userId, int exerciseId, CancellationToken ct)
        {
            var records = await _context.PersonalRecords
                .Where(pr => pr.UserId == userId && pr.ExerciseId == exerciseId)
                .ToListAsync(ct);

            var best = records
                .Select(pr => new
                {
                    Record = pr,
                    E1RM = Performance.E1RM(new PerformanceSet(pr.Weight, pr.Reps))
                })
                .Where(x => x.E1RM.HasValue)
                .OrderByDescending(x => x.E1RM!.Value)
                .ThenByDescending(x => x.Record.Weight)
                .FirstOrDefault();

            if (best == null)
                return null;

            return new PreviousPr(best.E1RM!.Value, best.Record.Weight, best.Record.Reps);
        }
    }
}
