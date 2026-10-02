using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using ExerciseAPI.Interfaces;
using ExerciseAPI.DTOs;
using ExerciseAPI.Models;

namespace ExerciseAPI.Controllers
{
    [ApiController]
    [Route("api/templates")]
    [Authorize]
    public class TemplateController : FitnessControllerBase
    {
        private readonly ITemplateService _templateService;

        public TemplateController(ITemplateService templateService, IHttpContextAccessor httpContextAccessor)
            : base(httpContextAccessor)
        {
            _templateService = templateService;
        }

        [HttpPost]
        public async Task<IActionResult> CreateTemplate([FromBody] CreateTemplateDto dto)
        {
            if (!HasCurrentUser)
                return Unauthorized();

            try
            {
                var template = await _templateService.CreateTemplate(CurrentUserId, dto.Name, dto.ExerciseIds);
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
            if (!HasCurrentUser)
                return Unauthorized();

            var template = await _templateService.GetTemplateById(id, CurrentUserId);
            if (template == null)
                return NotFound();

            var response = MapToResponseDto(template);
            return Ok(response);
        }

        [HttpGet]
        public async Task<IActionResult> GetUserTemplates()
        {
            if (!HasCurrentUser)
                return Unauthorized();

            var templates = await _templateService.GetUserTemplates(CurrentUserId);
            var response = templates.Select(MapToResponseDto).ToList();
            return Ok(response);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateTemplate(int id, [FromBody] UpdateTemplateDto dto)
        {
            if (!HasCurrentUser)
                return Unauthorized();

            try
            {
                var template = await _templateService.UpdateTemplate(id, CurrentUserId, dto.Name, dto.ExerciseIds);
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
            if (!HasCurrentUser)
                return Unauthorized();

            var deleted = await _templateService.DeleteTemplate(id, CurrentUserId);
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
                        Category = te.Exercise?.Category ?? string.Empty,
                        Order = te.Order
                    }).ToList()
            };
        }
    }
}