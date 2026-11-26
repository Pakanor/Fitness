using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using ExerciseAPI.Interfaces;
using ExerciseAPI.DTOs;
using ExerciseAPI.Models;
using FitnessApp.Core.Interfaces;

namespace ExerciseAPI.Controllers
{
    [ApiController]
    [Route("api/templates")]
    [Authorize]
    public class TemplateController : ControllerBase
    {
        private readonly ITemplateService _templateService;
        private readonly ICurrentUserAccessor _currentUserAccessor;

        public TemplateController(ITemplateService templateService, ICurrentUserAccessor currentUserAccessor)
        {
            _templateService = templateService;
            _currentUserAccessor = currentUserAccessor;
        }

        [HttpPost]
        public async Task<IActionResult> CreateTemplate([FromBody] CreateTemplateDto dto)
        {
            var currentUser = _currentUserAccessor.Get();
            if (!currentUser.IsAuthenticated)
                return Unauthorized();

            try
            {
                var template = await _templateService.CreateTemplate(currentUser.Id, dto.Name, dto.ExerciseIds);
                var response = MapToResponseDto(template);
                return CreatedAtAction(nameof(GetTemplate), new { id = template.Id }, response);
            }
            catch (ArgumentException ex)
            {
                return BadRequest(ex.Message);
            }
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetTemplate(int id)
        {
            var currentUser = _currentUserAccessor.Get();
            if (!currentUser.IsAuthenticated)
                return Unauthorized();

            var template = await _templateService.GetTemplateById(id, currentUser.Id);
            if (template == null)
                return NotFound();

            var response = MapToResponseDto(template);
            return Ok(response);
        }

        [HttpGet]
        public async Task<IActionResult> GetUserTemplates()
        {
            var currentUser = _currentUserAccessor.Get();
            if (!currentUser.IsAuthenticated)
                return Unauthorized();

            var templates = await _templateService.GetUserTemplates(currentUser.Id);
            var response = templates.Select(MapToResponseDto).ToList();
            return Ok(response);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateTemplate(int id, [FromBody] UpdateTemplateDto dto)
        {
            var currentUser = _currentUserAccessor.Get();
            if (!currentUser.IsAuthenticated)
                return Unauthorized();

            try
            {
                var template = await _templateService.UpdateTemplate(id, currentUser.Id, dto.Name, dto.ExerciseIds);
                var response = MapToResponseDto(template);
                return Ok(response);
            }
            catch (InvalidOperationException ex)
            {
                return NotFound(ex.Message);
            }
            catch (ArgumentException ex)
            {
                return BadRequest(ex.Message);
            }
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteTemplate(int id)
        {
            var currentUser = _currentUserAccessor.Get();
            if (!currentUser.IsAuthenticated)
                return Unauthorized();

            var deleted = await _templateService.DeleteTemplate(id, currentUser.Id);
            if (!deleted)
                return NotFound();

            return NoContent();
        }

        private TemplateResponseDto MapToResponseDto(WorkoutTemplate template)
        {
            return new TemplateResponseDto
            {
                Id = template.Id,
                Name = template.Name,
                CreatedAt = template.CreatedAt,
                UpdatedAt = template.UpdatedAt,
                Exercises = template.TemplateExercises
                    .OrderBy(te => te.Order)
                    .Select(te => new TemplateExerciseDto
                    {
                        ExerciseId = te.ExerciseId,
                        ExerciseName = te.Exercise?.Name ?? string.Empty,
                        GifUrl = te.Exercise?.GifUrl,
                        Category = te.Exercise?.Category ?? string.Empty,
                        Order = te.Order
                    }).ToList()
            };
        }
    }
}