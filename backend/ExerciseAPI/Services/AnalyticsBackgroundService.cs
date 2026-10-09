using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Hosting;
using ExerciseAPI.Data;
using ExerciseAPI.Models;

namespace ExerciseAPI.Services
{
    public sealed class AnalyticsBackgroundService : BackgroundService
    {
        private readonly IServiceScopeFactory _scopeFactory;
        private readonly AnalyticsQueue _queue;
        private readonly ILogger<AnalyticsBackgroundService> _logger;

        private const int MaxRetries = 3;
        private static readonly TimeSpan[] RetryDelays = { TimeSpan.FromSeconds(1), TimeSpan.FromSeconds(5), TimeSpan.FromSeconds(30) };

        public AnalyticsBackgroundService(
            IServiceScopeFactory scopeFactory,
            AnalyticsQueue queue,
            ILogger<AnalyticsBackgroundService> logger)
        {
            _scopeFactory = scopeFactory;
            _queue = queue;
            _logger = logger;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            _logger.LogInformation("Analytics background worker started");

            await foreach (var evt in _queue.ReadAllAsync(stoppingToken))
            {
                var attempt = 0;
                while (true)
                {
                    try
                    {
                        await ProcessEventAsync(evt, stoppingToken);
                        break;
                    }
                    catch (Exception ex) when (attempt < MaxRetries)
                    {
                        attempt++;
                        var delay = RetryDelays[Math.Min(attempt - 1, RetryDelays.Length - 1)];
                        _logger.LogWarning(ex, "Retry {Attempt}/{MaxRetries} for SessionId={SessionId} after {Delay}s", attempt, MaxRetries, evt.SessionId, delay.TotalSeconds);
                        await Task.Delay(delay, stoppingToken);
                    }
                    catch (Exception ex)
                    {
                        _logger.LogError(ex, "Dead-letter: Failed SetRecordedEvent for SessionId={SessionId}, UserExerciseId={UserExerciseId} after {MaxRetries} retries", evt.SessionId, evt.UserExerciseId, MaxRetries);
                        break;
                    }
                }
            }
        }

        private async Task ProcessEventAsync(SetRecordedEvent evt, CancellationToken ct)
        {
            using var scope = _scopeFactory.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

            var session = await db.WorkoutSessions
                .Include(s => s.Exercises)
                    .ThenInclude(e => e.Sets)
                .FirstOrDefaultAsync(s => s.Id == evt.SessionId, ct);

            if (session == null)
            {
                _logger.LogWarning("Session {SessionId} not found for analytics processing", evt.SessionId);
                return;
            }

            var entry = session.Exercises.FirstOrDefault(e => e.Id == evt.UserExerciseId);
            if (entry == null)
            {
                _logger.LogWarning("UserExercise {UserExerciseId} not found for analytics processing", evt.UserExerciseId);
                return;
            }

            session.TotalVolume = CalculateVolume(session);
            session.UpdatedAt = DateTime.UtcNow;

            await UpdatePersonalRecordAsync(db, entry, evt.UserWeight, ct);

            await db.SaveChangesAsync(ct);

            _logger.LogDebug("Analytics updated for SessionId={SessionId}, TotalVolume={Volume}", session.Id, session.TotalVolume);
        }

        private static decimal CalculateVolume(WorkoutSession session)
        {
            return session.Exercises.Sum(e =>
                e.Sets.Where(s => !s.IsWarmup).Sum(s => s.Weight * s.Reps)
            );
        }

        private static async Task UpdatePersonalRecordAsync(AppDbContext db, UserExercise entry, decimal? userWeight, CancellationToken ct)
        {
            var bestSet = entry.Sets
                .Where(s => !s.IsWarmup && s.Weight > 0 && s.Reps > 0)
                .OrderByDescending(s => s.Weight * (1 + s.Reps / 30.0m))
                .FirstOrDefault();

            if (bestSet == null)
                return;

            var previousRecord = await db.PersonalRecords
                .Where(pr => pr.UserId == entry.UserId
                             && pr.ExerciseId == entry.ExerciseId
                             && pr.Reps == bestSet.Reps)
                .OrderByDescending(pr => pr.Weight)
                .FirstOrDefaultAsync(ct);

            if (previousRecord != null && bestSet.Weight <= previousRecord.Weight)
                return;

            db.PersonalRecords.Add(new PersonalRecord
            {
                UserId = entry.UserId,
                ExerciseId = entry.ExerciseId,
                Weight = bestSet.Weight,
                Reps = bestSet.Reps,
                Date = entry.Date,
                UserWeightAtTime = userWeight,
                StrengthToWeightRatio = userWeight.HasValue && userWeight.Value > 0
                    ? Math.Round(bestSet.Weight / userWeight.Value, 2)
                    : null
            });
        }
    }
}