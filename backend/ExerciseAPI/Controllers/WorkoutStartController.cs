using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using ExerciseAPI.Interfaces;
using ExerciseAPI.DTOs;
using FitnessApp.Core.Interfaces;
using FitnessApp.Core.Models;

namespace ExerciseAPI.Controllers
{
    [ApiController]
    [Route("api/workout-start")]
    [Authorize]
    public class WorkoutStartController : ControllerBase
    {
        private readonly IWorkoutStartModeService _workoutStartModeService;
        private readonly ITemplateService _templateService;
        private readonly ICurrentUserAccessor _currentUserAccessor;

        public WorkoutStartController(IWorkoutStartModeService workoutStartModeService, ITemplateService templateService, ICurrentUserAccessor currentUserAccessor)
        {
            _workoutStartModeService = workoutStartModeService;
            _templateService = templateService;
            _currentUserAccessor = currentUserAccessor;
        }

        [HttpGet("previous")]
        public async Task<IActionResult> GetPreviousWorkout()
        {
            var currentUser = _currentUserAccessor.Get();
            if (!currentUser.IsAuthenticated)
                return Unauthorized();

            var exercises = await _workoutStartModeService.GetPreviousWorkoutExercises(currentUser.Id);
            if (!exercises.Any())
                return NotFound("No previous workouts to copy");

            var response = exercises
                .SelectMany(e => e.Sets
                    .Select(set => new
                    {
                        e.ExerciseId,
                        ExerciseName = e.Exercise?.Name ?? string.Empty,
                        Category = e.Exercise?.Category ?? string.Empty,
                        set.SetNumber,
                        set.Weight,
                        set.Reps,
                        set.RPE,
                        SetType = set.SetType,
                    }))
                .ToList();

            return Ok(response);
        }

        // Type-safe: returns the most recent COMPLETED workout for the given template
        // so the UI can render "Poprzednio" hints matched by ExerciseId.
        [HttpGet("previous-by-template/{templateId}")]
        public async Task<IActionResult> GetPreviousWorkoutByTemplate(int templateId)
        {
            var currentUser = _currentUserAccessor.Get();
            if (!currentUser.IsAuthenticated)
                return Unauthorized();

            var exercises = await _workoutStartModeService.GetPreviousWorkoutByTemplate(currentUser.Id, templateId);
            if (!exercises.Any())
                return NotFound("No previous workouts for this template");

            var response = exercises
                .SelectMany(e => e.Sets
                    .Select(set => new
                    {
                        e.ExerciseId,
                        ExerciseName = e.Exercise?.Name ?? string.Empty,
                        Category = e.Exercise?.Category ?? string.Empty,
                        set.SetNumber,
                        set.Weight,
                        set.Reps,
                        set.RPE,
                        SetType = set.SetType,
                    }))
                .ToList();

            return Ok(response);
        }

        [HttpPost("from-template/{templateId}")]
        public async Task<IActionResult> StartFromTemplate(int templateId)
        {
            var currentUser = _currentUserAccessor.Get();
            if (!currentUser.IsAuthenticated)
                return Unauthorized();

            try
            {
                var exercises = await _workoutStartModeService.CreateWorkoutFromTemplate(currentUser.Id, templateId);
                return Ok(new { message = "Workout created from template", exerciseCount = exercises.Count });
            }
            catch (InvalidOperationException ex)
            {
                return NotFound(ex.Message);
            }
        }

        [HttpPost("copy-previous")]
        public async Task<IActionResult> CopyPreviousWorkout()
        {
            var currentUser = _currentUserAccessor.Get();
            if (!currentUser.IsAuthenticated)
                return Unauthorized();

            try
            {
                var exercises = await _workoutStartModeService.CopyPreviousWorkout(currentUser.Id);
                return Ok(new { message = "Workout copied from previous session", exerciseCount = exercises.Count });
            }
            catch (InvalidOperationException ex)
            {
                return NotFound(ex.Message);
            }
        }

        // Type-safe copy: copies the most recent COMPLETED workout of the given template.
        [HttpPost("copy-previous/{templateId}")]
        public async Task<IActionResult> CopyPreviousWorkoutByTemplate(int templateId)
        {
            var currentUser = _currentUserAccessor.Get();
            if (!currentUser.IsAuthenticated)
                return Unauthorized();

            try
            {
                var exercises = await _workoutStartModeService.CopyPreviousWorkout(currentUser.Id, templateId);
                return Ok(new { message = "Workout copied from previous session for template", exerciseCount = exercises.Count });
            }
            catch (InvalidOperationException ex)
            {
                return NotFound(ex.Message);
            }
        }

        [HttpGet("templates")]
        public async Task<IActionResult> GetUserTemplates()
        {
            var currentUser = _currentUserAccessor.Get();
            if (!currentUser.IsAuthenticated)
                return Unauthorized();

            var templates = await _templateService.GetUserTemplates(currentUser.Id);
            var response = templates.Select(t => new
            {
                t.Id,
                t.Name,
                ExerciseCount = t.TemplateExercises.Count,
                t.CreatedAt
            }).ToList();

            return Ok(response);
        }
    }
}