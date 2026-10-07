using ExerciseAPI.Data;
using ExerciseAPI.DTOs;
using ExerciseAPI.Interfaces;
using ExerciseAPI.Models;
using Microsoft.EntityFrameworkCore;

namespace ExerciseAPI.Services
{
    public class SessionStateException : InvalidOperationException
    {
        public SessionStateException(string message) : base(message) { }
    }

    public class SessionNotFoundException : InvalidOperationException
    {
        public SessionNotFoundException(string message) : base(message) { }
    }

    public class WorkoutSessionService : IWorkoutSessionService
    {
        private readonly AppDbContext _context;

        public WorkoutSessionService(AppDbContext context)
        {
            _context = context;
        }

        public Task<WorkoutSession?> GetSessionByDate(int userId, DateTime date)
        {
            var target = DateTime.SpecifyKind(date, DateTimeKind.Utc).Date;
            return _context.WorkoutSessions
                .Include(s => s.Exercises)
                .Where(s => s.UserId == userId && s.Date == target && s.Exercises.Any())
                .FirstOrDefaultAsync();
        }

        public Task<WorkoutSession?> GetSessionById(int sessionId, int userId)
        {
            return _context.WorkoutSessions
                .Include(s => s.Template)
                .Include(s => s.Exercises)
                .FirstOrDefaultAsync(s => s.Id == sessionId && s.UserId == userId);
        }

        public Task<WorkoutSession?> GetActiveSession(int userId)
        {
            return _context.WorkoutSessions
                .Include(s => s.Exercises)
                .Where(s => s.UserId == userId && s.Status == WorkoutStatus.InProgress)
                .OrderByDescending(s => s.Date)
                .FirstOrDefaultAsync();
        }

        public Task<List<WorkoutSession>> GetIncompleteSessions(int userId)
        {
            return _context.WorkoutSessions
                .Include(s => s.Exercises)
                .Include(s => s.Template)
                .Where(s => s.UserId == userId
                    && s.Status != WorkoutStatus.Completed
                    && s.Exercises.Any())
                .OrderByDescending(s => s.Date)
                .ToListAsync();
        }

        public async Task<WorkoutSession> CreateFromTemplate(int userId, int templateId, DateTime date)
        {
            var target = DateTime.SpecifyKind(date, DateTimeKind.Utc).Date;

            var template = await _context.WorkoutTemplates
                .Include(t => t.TemplateExercises)
                .FirstOrDefaultAsync(t => t.Id == templateId && t.UserId == userId);

            if (template == null)
                throw new SessionNotFoundException("Szablon nie istnieje.");

            if (!template.TemplateExercises.Any())
                throw new SessionStateException("Szablon nie zawiera żadnych ćwiczeń.");

            var existingSession = await _context.WorkoutSessions
                .Include(s => s.Exercises)
                .FirstOrDefaultAsync(s => s.UserId == userId && s.Date == target);

            if (existingSession?.Exercises.Any() == true)
                throw new SessionStateException("Na ten dzień istnieje już zaplanowany trening.");

            var now = DateTime.UtcNow;
            var session = existingSession ?? new WorkoutSession
            {
                UserId = userId,
                Date = target,
                CreatedAt = now
            };

            session.Status = WorkoutStatus.Planned;
            session.TemplateId = templateId;
            session.StartMode = WorkoutStartMode.FromTemplate;
            session.TotalVolume = WorkoutSession.EmptyVolume;
            session.UpdatedAt = now;

            var exercises = template.TemplateExercises
                .OrderBy(te => te.Order)
                .Select(te => new UserExercise
                {
                    UserId = userId,
                    ExerciseId = te.ExerciseId,
                    Date = target,
                    Session = session,
                    TemplateId = templateId,
                    StartMode = WorkoutStartMode.FromTemplate,
                    Status = WorkoutStatus.Planned
                })
                .ToList();

            session.Exercises = exercises;

            if (existingSession == null)
                _context.WorkoutSessions.Add(session);
            await _context.SaveChangesAsync();

            return session;
        }

        public async Task<WorkoutSession> Start(int userId, int sessionId)
        {
            var session = await GetOwnedSession(userId, sessionId);

            if (session.Status == WorkoutStatus.InProgress)
                return session;

            if (session.Status != WorkoutStatus.Planned)
                throw new SessionStateException("Trening został już zakończony.");

            var now = DateTime.UtcNow;
            session.Status = WorkoutStatus.InProgress;
            session.StartedAt = now;
            session.UpdatedAt = now;

            foreach (var entry in session.Exercises)
                entry.Status = WorkoutStatus.InProgress;

            await _context.SaveChangesAsync();
            return session;
        }

        public async Task<WorkoutSession> Finish(int userId, int sessionId)
        {
            var session = await GetOwnedSession(userId, sessionId);

            if (session.Status == WorkoutStatus.Completed)
                return session;

            if (session.Status != WorkoutStatus.InProgress)
                throw new SessionStateException("Trening można zakończyć dopiero po jego rozpoczęciu.");

            var now = DateTime.UtcNow;
            session.Status = WorkoutStatus.Completed;
            session.CompletedAt = now;
            session.UpdatedAt = now;
            session.TotalVolume = await RecalculateVolume(session);

            foreach (var entry in session.Exercises)
                entry.Status = WorkoutStatus.Completed;

            await _context.SaveChangesAsync();
            return session;
        }

        public async Task<WorkoutSession> Reopen(int userId, int sessionId)
        {
            var session = await GetOwnedSession(userId, sessionId);

            if (session.Status == WorkoutStatus.InProgress)
                return session;

            if (session.Status != WorkoutStatus.Completed)
                throw new SessionStateException("Wznowić można tylko zakończony trening.");

            var now = DateTime.UtcNow;
            session.Status = WorkoutStatus.InProgress;
            session.CompletedAt = null;
            session.UpdatedAt = now;
            session.TotalVolume = CalculateVolume(session);

            foreach (var entry in session.Exercises)
                entry.Status = WorkoutStatus.InProgress;

            await _context.SaveChangesAsync();
            return session;
        }

        public async Task<(UserExercise Entry, WorkoutSession Session)> LogSet(int userId, LogSetDto dto, decimal? userWeight = null)        {
            var session = await GetOwnedSession(userId, dto.SessionId);

            if (session.Status == WorkoutStatus.Planned && session.Date.Date > DateTime.UtcNow.Date)
                throw new SessionStateException("Najpierw rozpocznij trening, aby zapisywać serie.");

            UserExercise entry;

            if (dto.UserExerciseId.HasValue)
            {
                entry = session.Exercises.FirstOrDefault(e => e.Id == dto.UserExerciseId.Value)
                    ?? throw new SessionNotFoundException("Ćwiczenie nie należy do tego treningu.");

                if (entry.ExerciseId != dto.ExerciseId)
                    throw new SessionStateException("Ćwiczenie nie należy do tego treningu.");
            }
            else
            {
                var exerciseExists = await _context.Exercises.AnyAsync(e => e.Id == dto.ExerciseId);
                if (!exerciseExists)
                    throw new SessionStateException("Niepoprawne ćwiczenie.");

                entry = new UserExercise
                {
                    UserId = userId,
                    ExerciseId = dto.ExerciseId,
                    Date = session.Date,
                    Session = session,
                    TemplateId = session.TemplateId,
                    StartMode = session.StartMode,
                    Status = WorkoutStatus.InProgress
                };

                session.Exercises.Add(entry);
                _context.UserExercise.Add(entry);
            }

            entry.Sets = dto.Sets;
            entry.Reps = dto.Reps;
            entry.Weight = dto.Weight;
            entry.RPE = dto.RPE;
            entry.IsWarmup = dto.IsWarmup;
            if (session.Status == WorkoutStatus.Planned)
            {
                session.Status = WorkoutStatus.InProgress;
                session.StartedAt = DateTime.UtcNow;
            }

            var completed = session.Exercises.Any() && session.Exercises.All(exercise =>
                exercise.Sets.HasValue && exercise.Reps.HasValue && exercise.Weight.HasValue);

            if (completed)
            {
                session.Status = WorkoutStatus.Completed;
                session.CompletedAt = DateTime.UtcNow;
            }
            else if (session.Status == WorkoutStatus.Completed)
            {
                session.Status = WorkoutStatus.InProgress;
                session.CompletedAt = null;
            }

            entry.Status = completed ? WorkoutStatus.Completed : WorkoutStatus.InProgress;
            if (completed)
            {
                foreach (var exercise in session.Exercises)
                    exercise.Status = WorkoutStatus.Completed;
            }

            session.UpdatedAt = DateTime.UtcNow;
            session.TotalVolume = CalculateVolume(session);

            await _context.SaveChangesAsync();
            await UpdatePersonalRecordAsync(entry, userWeight);

            return (entry, session);
        }

        public async Task<decimal> RecalculateVolume(WorkoutSession session)
        {
            await _context.Entry(session).Collection(s => s.Exercises).LoadAsync();
            var volume = CalculateVolume(session);
            session.TotalVolume = volume;
            return volume;
        }

        private static decimal CalculateVolume(WorkoutSession session)
        {
            return session.Exercises.Sum(e =>
                e.Sets.HasValue && e.Reps.HasValue && e.Weight.HasValue
                    ? e.Sets.Value * e.Reps.Value * e.Weight.Value
                    : 0m);
        }

        private async Task<WorkoutSession> GetOwnedSession(int userId, int sessionId)
        {
            var session = await _context.WorkoutSessions
                .Include(s => s.Exercises)
                .FirstOrDefaultAsync(s => s.Id == sessionId && s.UserId == userId);

            return session ?? throw new SessionNotFoundException("Trening nie istnieje.");
        }

        private async Task UpdatePersonalRecordAsync(UserExercise entry, decimal? userWeight)
        {
            if (!entry.Weight.HasValue || !entry.Reps.HasValue)
                return;

            var previousRecord = await _context.PersonalRecords
                .Where(pr => pr.UserId == entry.UserId
                             && pr.ExerciseId == entry.ExerciseId
                             && pr.Reps == entry.Reps.Value)
                .OrderByDescending(pr => pr.Weight)
                .FirstOrDefaultAsync();

            if (previousRecord != null && entry.Weight <= previousRecord.Weight)
                return;

            _context.PersonalRecords.Add(new PersonalRecord
            {
                UserId = entry.UserId,
                ExerciseId = entry.ExerciseId,
                Weight = entry.Weight.Value,
                Reps = entry.Reps.Value,
                Date = entry.Date,
                UserWeightAtTime = userWeight,
                StrengthToWeightRatio = userWeight.HasValue && userWeight.Value > 0
                    ? Math.Round(entry.Weight.Value / userWeight.Value, 2)
                    : null
            });

            await _context.SaveChangesAsync();
        }
    }
}
