using Microsoft.AspNetCore.Mvc;
using ExerciseAPI.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http.HttpResults;
using ExerciseAPI.Data;
using ExerciseAPI.Models;
using ExerciseAPI.DTOs;
using ExerciseAPI.Interfaces;
namespace ExerciseAPI.Controllers
{
    [ApiController]

    [Route("api/[controller]")]
    public class ExerciseDbController : FitnessControllerBase
    {
        private readonly ExerciseDbImportService _importService;
        private readonly AppDbContext _context;
        private readonly IMuscleDamageService _muscleDamageService;


        public ExerciseDbController(ExerciseDbImportService importService, AppDbContext context, IMuscleDamageService muscleDamageService, IHttpContextAccessor httpContextAccessor)
            : base(httpContextAccessor)
        {
            _importService = importService;
            _context = context;
            _muscleDamageService = muscleDamageService;


        }
        //[Authorize(Roles = "Admin")]

        [HttpPost("import")]
        public async Task<IActionResult> Import()
        {
            await _importService.ImportExercisesAsync();
            return Ok("Import ćwiczeń zakończony.");
        }

        [HttpPost("import-gifs")]
        public async Task<IActionResult> ImportGifs()
        {
            var count = await _importService.ImportGifsFromApiAsync();
            return Ok($"Zaktualizowano {count} ćwiczeń z GIF-ami.");
        }


        [HttpDelete("exercises/clear")]
        public async Task<IActionResult> ClearExercises()
        {
            _context.Exercises.RemoveRange(_context.Exercises);
            await _context.SaveChangesAsync();
            return Ok("Wyczyszczono wszystkie ćwiczenia.");
        }
        [HttpGet("exercise")]
        public async Task<IActionResult> GetAll()
        {
            var exercises = await _context.Exercises
                .Select(e => new
                {
                    e.Id,
                    e.ExternalId,
                    e.Name,
                    e.Description,
                    e.Category,
                    e.ImageUrl,
                    e.GifUrl,
                    MuscleMappings = _context.ExerciseMuscleGroups
                        .Where(emg => emg.ExerciseId == e.Id)
                        .Select(emg => new
                        {
                            MuscleGroupKey = emg.MuscleGroupKey,
                            WeightPercentage = emg.WeightPercentage
                        })
                        .ToList()
                })
                .ToListAsync();
            return Ok(exercises);
        }
        [HttpGet("exercise/categories")]
        public async Task<IActionResult> GetExerciseCategories()
        {
            var categories = await _context.Exercises
            .Select(e => e.Category)
            .Distinct()
            .ToListAsync();
            return Ok(categories);
        }
        [HttpGet("exercise/{bodyPart}")]
        public async Task<IActionResult> GetExercisesByBodyParts(string bodyPart)
        {
            var exercises = await _context.Exercises
                .Where(e => e.Category.ToLower() == bodyPart.ToLower())
                .Select(e => new
                {
                    e.Id,
                    e.Name,
                    e.Category,
                    e.ImageUrl,
                    e.GifUrl,
                    MuscleMappings = _context.ExerciseMuscleGroups
                        .Where(emg => emg.ExerciseId == e.Id)
                        .Select(emg => new
                        {
                            emg.MuscleGroupKey,
                            emg.WeightPercentage
                        })
                        .ToList()
                })
                .ToListAsync();
            return Ok(exercises);
        }
        
        [HttpGet("exercise/id/{id}")]
        public async Task<IActionResult> GetExerciseById(int id)
        {
            var exercise = await _context.Exercises.FindAsync(id);
            if (exercise == null)
                return NotFound();

            var mappings = await _context.ExerciseMuscleGroups
                .Where(emg => emg.ExerciseId == id)
                .Select(emg => new
                {
                    emg.MuscleGroupKey,
                    emg.WeightPercentage
                })
                .ToListAsync();

            return Ok(new
            {
                exercise.Id,
                exercise.ExternalId,
                exercise.Name,
                exercise.Description,
                exercise.Category,
                exercise.ImageUrl,
                exercise.GifUrl,
                MuscleMappings = mappings
            });
        }
        [HttpGet("exercise/search/{term}")]
        public async Task<IActionResult> SearchExercises(string term)
        {
            var exercises = await _context.Exercises
                .Where(e => e.Name.ToLower().Contains(term.ToLower()))
                .Select(e => new
                {
                    e.Id,
                    e.Name,
                    e.Category,
                    MuscleMappings = _context.ExerciseMuscleGroups
                        .Where(emg => emg.ExerciseId == e.Id)
                        .Select(emg => new
                        {
                            emg.MuscleGroupKey,
                            emg.WeightPercentage
                        })
                        .ToList()
                })
                .ToListAsync();
            return Ok(exercises);
        }
        [HttpPut("exercise/{id}/mappings")]
        public async Task<IActionResult> UpdateMappings(int id, [FromBody] List<ExerciseAPI.Models.ExerciseMuscleGroup> mappings)
        {
            var exercise = await _context.Exercises.FindAsync(id);
            if (exercise == null)
                return NotFound("Ćwiczenie nie istnieje");

            var existing = await _context.ExerciseMuscleGroups
                .Where(emg => emg.ExerciseId == id)
                .ToListAsync();
            _context.ExerciseMuscleGroups.RemoveRange(existing);

            foreach (var m in mappings)
            {
                m.ExerciseId = id;
                m.Id = 0;
                _context.ExerciseMuscleGroups.Add(m);
            }

            await _context.SaveChangesAsync();
            return Ok("Zapisano");
        }

        [HttpPost("userexercise/add")]
        [Authorize]
        public async Task<IActionResult> AddUserExercise([FromBody] AddUserExerciseDto dto)
        {
            if (!HasCurrentUser)
                return Unauthorized();

            var exerciseExists = await _context.Exercises.AnyAsync(e => e.Id == dto.ExerciseId);
            if (!exerciseExists)
                return BadRequest("Niepoprawne ćwiczenie");

            if (dto.RPE.HasValue && (dto.RPE < 1 || dto.RPE > 10))
                return BadRequest("RPE musi być w zakresie 1-10");

            if (dto.RIR.HasValue && (dto.RIR < 0 || dto.RIR > 4))
                return BadRequest("RIR musi być w zakresie 0-4");

            var entity = new UserExercise
            {
                UserId = CurrentUserId,
                ExerciseId = dto.ExerciseId,
                Sets = dto.Sets,
                Reps = dto.Reps,
                Weight = dto.Weight,
                RPE = dto.RPE,
                RIR = dto.RIR,
                Date = dto.Date.HasValue
                    ? DateTime.SpecifyKind(dto.Date.Value.Date, DateTimeKind.Utc)
                    : DateTime.UtcNow
            };

            _context.UserExercise.Add(entity);
            await _context.SaveChangesAsync();

            if (entity.Weight.HasValue && entity.Reps.HasValue)
            {
                var previousRecord = await _context.PersonalRecords
                    .Where(pr => pr.UserId == entity.UserId && pr.ExerciseId == entity.ExerciseId && pr.Reps == entity.Reps.Value)
                    .OrderByDescending(pr => pr.Weight)
                    .FirstOrDefaultAsync();

                if (previousRecord == null || entity.Weight > previousRecord.Weight)
                {
                    decimal userWeight = (decimal)UserWeight;
                    int? userAge = null;

                    var pr = new PersonalRecord
                    {
                        UserId = entity.UserId,
                        ExerciseId = entity.ExerciseId,
                        Weight = entity.Weight.Value,
                        Reps = entity.Reps.Value,
                        Date = entity.Date,
                        UserWeightAtTime = userWeight,
                        UserAgeAtTime = userAge,
                        StrengthToWeightRatio = userWeight > 0
                            ? Math.Round(entity.Weight.Value / userWeight, 2)
                            : null
                    };

                    _context.PersonalRecords.Add(pr);
                    await _context.SaveChangesAsync();
                }
            }

            var response = new UserExerciseResponseDto
            {
                Id = entity.Id,
                ExerciseId = entity.ExerciseId,
                Sets = entity.Sets,
                Reps = entity.Reps,
                Weight = entity.Weight,
                RPE = entity.RPE,
                RIR = entity.RIR,
                Date = entity.Date
            };

            return Ok(response);
        }


        [HttpGet("userexercise/bydate")]
        [Authorize]
        public async Task<IActionResult> GetExercisesByDate([FromQuery] string date)
        {
            if (!HasCurrentUser)
                return Unauthorized();

            if (!DateTime.TryParse(date, out var parsedDate))
                return BadRequest("Nieprawidłowy format daty");

            var all = await _context.UserExercise
                .Where(ue => ue.UserId == CurrentUserId)
                .ToListAsync();

            var filtered = all
            .Where(ue => ue.Date.Date == parsedDate.Date) 
            .ToList();

            var exerciseIds = filtered.Select(ue => ue.ExerciseId).Distinct().ToList();

            var exercises = await _context.Exercises
                .Where(e => exerciseIds.Contains(e.Id))
                .ToListAsync();

            var result = filtered.Select(ue => {
                var exercise = exercises.FirstOrDefault(e => e.Id == ue.ExerciseId);

                // Build primaryMuscles from the exercise's 16 activation columns.
                string primaryMuscles = "";
                if (exercise != null)
                {
                    var engaged = new List<string>();
                    void AddIf(decimal v, string name) { if (v >= 0.4m) engaged.Add(name); }
                    AddIf(exercise.Quadriceps, "Czwórki");
                    AddIf(exercise.Hamstrings, "Dwugłowe uda");
                    AddIf(exercise.Glutes, "Pośladki");
                    AddIf(exercise.ChestMain, "Klatka");
                    AddIf(exercise.Lats, "Plecy szerokie");
                    AddIf(exercise.DeltoidAnterior, "Bark przedni");
                    AddIf(exercise.DeltoidLateral, "Bark boczny");
                    AddIf(exercise.DeltoidPosterior, "Bark tylny");
                    AddIf(exercise.Biceps, "Biceps");
                    AddIf(exercise.Triceps, "Triceps");
                    AddIf(exercise.Forearms, "Przedramiona");
                    AddIf(exercise.Abs, "Brzuch");
                    AddIf(exercise.CoreStabilizers, "Stabilizatory");
                    AddIf(exercise.LowerBack, "Dolny pleców");
                    AddIf(exercise.Rhomboids, "Romby");
                    AddIf(exercise.Calves, "Łydki");
                    if (engaged.Count > 0) primaryMuscles = string.Join(", ", engaged);
                }

                return new {
                    userExerciseId = ue.Id,
                    exerciseId = ue.ExerciseId,
                    name = exercise?.Name ?? "Nieznane",
                    category = exercise?.Category ?? "",
                    primaryMuscles,
                    gifUrl = exercise?.GifUrl ?? "",
                    sets = ue.Sets,
                    reps = ue.Reps,
                    weight = ue.Weight,
                    rpe = ue.RPE,
                    rir = ue.RIR,
                    templateId = ue.TemplateId,
                    date = ue.Date
                };
            }).ToList();

            return Ok(result);
        }


        [HttpGet("userexercise/byuser")]
        [Authorize]
        public async Task<IActionResult> GetUserExercises()
        {
            if (!HasCurrentUser)
                return Unauthorized();

            var exercises = await _context.UserExercise
                .Where(ue => ue.UserId == CurrentUserId)
                .Select(ue => new { ue.ExerciseId })
                .ToListAsync();

            return Ok(exercises);
        }

       [HttpDelete("userexercise/{id}")]
        [Authorize]
        public async Task<IActionResult> DeleteUserExercise(int id)
        {
                if (!HasCurrentUser)
                return Unauthorized();

                var entry = await _context.UserExercise.FindAsync(id);

                if (entry == null || entry.UserId != CurrentUserId)
                return NotFound();

            _context.UserExercise.Remove(entry);
            await _context.SaveChangesAsync();

            // Editing/deleting a session changes the damage baseline -> rebuild it.
            await _muscleDamageService.RecordSessionDamageAsync(CurrentUserId, entry.Date);

            return NoContent();
        }
}
}