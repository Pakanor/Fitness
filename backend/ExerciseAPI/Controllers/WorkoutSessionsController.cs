using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using ExerciseAPI.Data;
using ExerciseAPI.DTOs;
using ExerciseAPI.Interfaces;
using ExerciseAPI.Models;
using ExerciseAPI.Services;
using Microsoft.EntityFrameworkCore;
using FitnessApp.Core.Interfaces;
using FitnessApp.Core.Models;

namespace ExerciseAPI.Controllers
{
    /// <summary>
    /// Workout session lifecycle: PLANNED -> IN_PROGRESS -> COMPLETED.
    /// Planned sessions list their exercises but reject every set write.
    /// </summary>
    [ApiController]
    [Route("api/workouts")]
    [Authorize]
    public class WorkoutSessionsController : ControllerBase
    {
        private readonly IWorkoutSessionService _sessionService;
        private readonly AppDbContext _context;
        private readonly PersonalRecordsService _personalRecords;
        private readonly ICurrentUserAccessor _currentUserAccessor;

        public WorkoutSessionsController(
            IWorkoutSessionService sessionService,
            AppDbContext context,
            PersonalRecordsService personalRecords,
            ICurrentUserAccessor currentUserAccessor)
        {
            _sessionService = sessionService;
            _context = context;
            _personalRecords = personalRecords;
            _currentUserAccessor = currentUserAccessor;
        }

        [HttpGet]
        public async Task<IActionResult> GetSessionForDate([FromQuery] string date)
        {
            var currentUser = _currentUserAccessor.Get();
            if (!currentUser.IsAuthenticated)
                return Unauthorized();

            if (!DateTime.TryParse(date, out var parsedDate))
                return BadRequest("Nieprawidłowy format daty");

            var session = await _sessionService.GetSessionByDate(currentUser.Id, parsedDate);
            if (session == null)
                return NotFound("Brak zaplanowanego treningu na ten dzień.");

            var response = await MapToResponseAsync(session);
            return Ok(response);
        }

        [HttpGet("active")]
        public async Task<IActionResult> GetActiveSession()
        {
            var currentUser = _currentUserAccessor.Get();
            if (!currentUser.IsAuthenticated)
                return Unauthorized();

            var session = await _sessionService.GetActiveSession(currentUser.Id);
            if (session == null)
                return NotFound("Brak niedokończonego treningu.");

            var response = await MapToResponseAsync(session);
            return Ok(response);
        }

        [HttpGet("incomplete")]
        public async Task<IActionResult> GetIncompleteSessions()
        {
            var currentUser = _currentUserAccessor.Get();
            if (!currentUser.IsAuthenticated)
                return Unauthorized();

            var sessions = await _sessionService.GetIncompleteSessions(currentUser.Id);
            return Ok(sessions.Select(session => new
            {
                session.Id,
                session.Date,
                TemplateName = session.Template?.Name,
                ExerciseCount = session.Exercises.Count,
                Status = ToStatusString(session.Status)
            }));
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetSession(int id)
        {
            var currentUser = _currentUserAccessor.Get();
            if (!currentUser.IsAuthenticated)
                return Unauthorized();

            var session = await _sessionService.GetSessionById(id, currentUser.Id);
            if (session == null)
                return NotFound();

            var response = await MapToResponseAsync(session);
            return Ok(response);
        }

        [HttpPost("from-template/{templateId}")]
        public async Task<IActionResult> CreateFromTemplate(int templateId, [FromBody] CreateSessionFromTemplateDto dto)
        {
            var currentUser = _currentUserAccessor.Get();
            if (!currentUser.IsAuthenticated)
                return Unauthorized();

            try
            {
                var session = await _sessionService.CreateFromTemplate(currentUser.Id, templateId, dto.Date);
                var response = await MapToResponseAsync(session);
                return CreatedAtAction(nameof(GetSession), new { id = session.Id }, response);
            }
            catch (SessionNotFoundException ex)
            {
                return NotFound(ex.Message);
            }
            catch (SessionStateException ex)
            {
                return Conflict(ex.Message);
            }
        }

        [HttpPatch("{id}/start")]
        public async Task<IActionResult> Start(int id)
        {
            var currentUser = _currentUserAccessor.Get();
            if (!currentUser.IsAuthenticated)
                return Unauthorized();

            try
            {
                var session = await _sessionService.Start(currentUser.Id, id);
                var response = await MapToResponseAsync(session);
                return Ok(response);
            }
            catch (SessionNotFoundException ex)
            {
                return NotFound(ex.Message);
            }
            catch (SessionStateException ex)
            {
                return Conflict(ex.Message);
            }
        }

        [HttpPatch("{id}/finish")]
        public async Task<IActionResult> Finish(int id)
        {
            var currentUser = _currentUserAccessor.Get();
            if (!currentUser.IsAuthenticated)
                return Unauthorized();

            try
            {
                var session = await _sessionService.Finish(currentUser.Id, id);
                var response = await MapToResponseAsync(session);
                return Ok(response);
            }
            catch (SessionNotFoundException ex)
            {
                return NotFound(ex.Message);
            }
            catch (SessionStateException ex)
            {
                return Conflict(ex.Message);
            }
        }

        [HttpPatch("{id}/reopen")]
        public async Task<IActionResult> Reopen(int id)
        {
            var currentUser = _currentUserAccessor.Get();
            if (!currentUser.IsAuthenticated)
                return Unauthorized();

            try
            {
                var session = await _sessionService.Reopen(currentUser.Id, id);
                var response = await MapToResponseAsync(session);
                return Ok(response);
            }
            catch (SessionNotFoundException ex)
            {
                return NotFound(ex.Message);
            }
            catch (SessionStateException ex)
            {
                return Conflict(ex.Message);
            }
        }

        [HttpPost("sets")]
        public async Task<IActionResult> LogSet([FromBody] LogSetDto dto)
        {
            var currentUser = _currentUserAccessor.Get();
            if (!currentUser.IsAuthenticated)
                return Unauthorized();

            if (dto == null)
                return BadRequest("Brak danych.");

            var userWeight = currentUser.Profile?.Weight ?? UserProfile.Default.Weight;

            try
            {
                var (entry, session) = await _sessionService.LogSet(currentUser.Id, dto, userWeight);
                var response = await MapToResponseAsync(session);
                
                bool isPr = false;
                try
                {
                    var workingSets = entry.Sets
                        .Select(s => new WorkingSetInput
                        {
                            Weight = s.Weight,
                            Reps = s.Reps,
                            Rpe = s.RPE,
                            SetType = s.SetType
                        })
                        .ToList();

                    var outcome = await _personalRecords.RecordAsync(
                        currentUser.Id, entry.ExerciseId, workingSets, entry.Date, userWeight);
                    isPr = outcome.IsPr;
                }
                catch { }
                
                return Ok(new
                {
                    entry = new
                    {
                        userExerciseId = entry.Id,
                        exerciseId = entry.ExerciseId,
                        sets = entry.Sets.Select(s => new { s.Id, s.SetNumber, s.Weight, s.Reps, s.RPE, SetType = s.SetType, Volume = s.Weight * s.Reps }),
                    },
                    session = response,
                    isPr = isPr
                });
            }
            catch (SessionNotFoundException ex)
            {
                return NotFound(ex.Message);
            }
            catch (SessionStateException ex)
            {
                return Conflict(ex.Message);
            }
        }

        [HttpPut("sets/{setId}")]
        public async Task<IActionResult> UpdateSet(int setId, [FromBody] LogSingleSetDto dto)
        {
            var currentUser = _currentUserAccessor.Get();
            if (!currentUser.IsAuthenticated)
                return Unauthorized();

            if (dto == null)
                return BadRequest("Brak danych.");

            var set = await _context.WorkoutSets
                .Include(s => s.UserExercise)
                    .ThenInclude(ue => ue.Session)
                .FirstOrDefaultAsync(s => s.Id == setId && s.UserExercise.UserId == currentUser.Id);

            if (set == null)
                return NotFound("Seria nie znaleziona.");

            var session = set.UserExercise.Session;
            if (session.Status == WorkoutStatus.Completed)
                return Conflict("Zakończony trening jest zablokowany do edycji. Użyj opcji 'Wznów trening'.");

            if (session.Status == WorkoutStatus.Planned && session.Date.Date > DateTime.UtcNow.Date)
                return Conflict("Najpierw rozpocznij trening, aby edytować serie.");

            if (dto.SetNumber < 1 || dto.SetNumber > 100)
                return BadRequest("Numer serii poza zakresem 1-100.");

            if (dto.Reps < 0 || dto.Reps > 1000)
                return BadRequest("Nieprawidłowa liczba powtórzeń.");

            if (dto.Weight < 0 || dto.Weight > 1000)
                return BadRequest("Nieprawidłowy ciężar.");

            if (dto.RPE.HasValue && (dto.RPE < 1 || dto.RPE > 10))
                return BadRequest("RPE musi być w zakresie 1-10.");

            if (dto.SetType == Models.SetType.Warmup && dto.Weight == 0 && dto.Reps == 0)
                return BadRequest("Seria musi mieć ciężar lub powtórzenia.");

            var existingSet = await _context.WorkoutSets
                .Where(s => s.UserExerciseId == set.UserExerciseId && s.Id != setId)
                .FirstOrDefaultAsync(s => s.SetNumber == dto.SetNumber);

            if (existingSet != null)
                return Conflict($"Seria o numerze {dto.SetNumber} już istnieje.");

            set.SetNumber = dto.SetNumber;
            set.Weight = dto.Weight;
            set.Reps = dto.Reps;
            set.RPE = dto.RPE;
            set.SetType = dto.SetType;
            set.DurationSeconds = dto.DurationSeconds;

            session.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            var response = await MapToResponseAsync(session);
            return Ok(response);
        }

        [HttpDelete("sets/{setId}")]
        public async Task<IActionResult> DeleteSet(int setId)
        {
            var currentUser = _currentUserAccessor.Get();
            if (!currentUser.IsAuthenticated)
                return Unauthorized();

            var set = await _context.WorkoutSets
                .Include(s => s.UserExercise)
                    .ThenInclude(ue => ue.Session)
                .FirstOrDefaultAsync(s => s.Id == setId && s.UserExercise.UserId == currentUser.Id);

            if (set == null)
                return NotFound("Seria nie znaleziona.");

            var session = set.UserExercise.Session;
            if (session.Status == WorkoutStatus.Completed)
                return Conflict("Zakończony trening jest zablokowany do edycji. Użyj opcji 'Wznów trening'.");

            if (session.Status == WorkoutStatus.Planned && session.Date.Date > DateTime.UtcNow.Date)
                return Conflict("Najpierw rozpocznij trening, aby usunąć serie.");

            _context.WorkoutSets.Remove(set);
            session.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            var response = await MapToResponseAsync(session);
            return Ok(response);
        }

        private async Task<WorkoutSessionResponseDto> MapToResponseAsync(WorkoutSession session)
        {
            var exerciseIds = session.Exercises.Select(e => e.ExerciseId).Distinct().ToList();

            var exercises = await _context.Exercises
                .Where(e => exerciseIds.Contains(e.Id))
                .Select(e => new { e.Id, e.Name, e.Category, e.GifUrl })
                .ToListAsync();

            string? templateName = null;
            if (session.TemplateId.HasValue)
            {
                templateName = await _context.WorkoutTemplates
                    .Where(t => t.Id == session.TemplateId.Value)
                    .Select(t => t.Name)
                    .FirstOrDefaultAsync();
            }

            return new WorkoutSessionResponseDto
            {
                Id = session.Id,
                UserId = session.UserId,
                Date = session.Date,
                Status = ToStatusString(session.Status),
                TemplateId = session.TemplateId,
                TemplateName = templateName,
                StartMode = session.StartMode.ToString(),
                TotalVolume = session.TotalVolume,
                ExerciseCount = session.Exercises.Count,
                CanLogSets = session.Status == WorkoutStatus.InProgress,
                CanReopen = session.Status == WorkoutStatus.Completed,
                CreatedAt = session.CreatedAt,
                UpdatedAt = session.UpdatedAt,
                StartedAt = session.StartedAt,
                CompletedAt = session.CompletedAt,
                Exercises = session.Exercises
                    .OrderBy(e => e.Id)
                    .Select(e =>
                    {
                        var exercise = exercises.FirstOrDefault(x => x.Id == e.ExerciseId);
                        var sets = e.Sets.OrderBy(s => s.SetNumber).ToList();
                        return new SessionExerciseDto
                        {
                            UserExerciseId = e.Id,
                            ExerciseId = e.ExerciseId,
                            ExerciseName = exercise?.Name ?? string.Empty,
                            Category = exercise?.Category ?? string.Empty,
                            GifUrl = exercise?.GifUrl ?? string.Empty,
                            Sets = sets.Select(s => new SessionSetDto
                            {
                                Id = s.Id,
                                SetNumber = s.SetNumber,
                                Weight = s.Weight,
                                Reps = s.Reps,
                                RPE = s.RPE,
                                SetType = s.SetType
                            }).ToList(),
                            SetsCount = sets.Count,
                            Reps = sets.FirstOrDefault()?.Reps,
                            Weight = sets.FirstOrDefault()?.Weight,
                            RPE = sets.FirstOrDefault()?.RPE,
                            SetType = sets.FirstOrDefault()?.SetType ?? Models.SetType.Normal,
                            SupersetGroupId = e.SupersetGroupId,
                            Notes = e.Notes,
                            Volume = sets.Sum(s => s.Weight * s.Reps)
                        };
                    })
                    .ToList()
            };
        }

        internal static string ToStatusString(WorkoutStatus status) => status switch
        {
            WorkoutStatus.Planned => "planned",
            WorkoutStatus.InProgress => "in_progress",
            WorkoutStatus.Completed => "completed",
            _ => status.ToString().ToLowerInvariant()
        };
    }
}