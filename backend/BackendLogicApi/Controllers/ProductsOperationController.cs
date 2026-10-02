using BackendLogicApi.Interfaces;
using Microsoft.AspNetCore.Mvc;
using BackendLogicApi.Models;
using Microsoft.EntityFrameworkCore;
using BackendLogicApi.Services;

namespace BackendLogicApi.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ProductsOperationController : ControllerBase
    {
        private readonly IProductOperationsService _productsOperationService;
        private readonly ICalorieCalculatorService _caloreieCalculatorService;
        private readonly IProductServiceAPI _productServiceAPI;


        public ProductsOperationController(IProductOperationsService productsOperationService, ICalorieCalculatorService calorieCalculatorService,IProductServiceAPI productServiceAPI )
        {
            _productsOperationService = productsOperationService;
            _caloreieCalculatorService = calorieCalculatorService;
            _productServiceAPI = productServiceAPI;

        }

        [HttpGet("recent")]
        public async Task<ActionResult<List<ProductLogEntry>>> GetRecentLogs([FromQuery] DateTime? date)
        {
            var logs = await _productsOperationService.GetRecentLogsAsync();

            if (date.HasValue)
            {
                logs = logs.Where(log => log.LoggedAt.ToLocalTime().Date == date.Value.Date).ToList();
            }

            return Ok(logs);
        }


        [HttpPost("add")]
        public async Task<IActionResult> AddUserLog([FromBody] AddLogRequest request)
        {
                var calculated = _caloreieCalculatorService.CalculateForWeight(request.Product, request.Grams);

                if (calculated == null)
                {
                    
                return BadRequest(new { message = "Brak wartości odżywczych błąd." });
            }

             await _productsOperationService.AddUserLogAsync(request.Product, request.Grams, calculated);


            return Ok("Produkt dodany");
        }
        [HttpDelete("delete/{id}")]
        public async Task<IActionResult> DeleteUserLog(int id)
        {
            await _productsOperationService.DeleteUserLogAsync(id);
            return Ok("Produkt usunięty");
        }
        [HttpPut("update")]
        public async Task<IActionResult> UpdateUserLog([FromBody] ProductLogEntry updatedEntry)
        {
            try
            {
                await _productsOperationService.UpdateUserLogAsync(updatedEntry);
                return Ok("Produkt zedytowany");
            }
            catch (ArgumentException ex)
            {
                return NotFound(new { message = ex.Message });
            }
        }
        [HttpGet("search")]
        [Microsoft.AspNetCore.Authorization.AllowAnonymous]
        public async Task<IActionResult> SearchProducts([FromQuery] string query)
        {
            if (string.IsNullOrWhiteSpace(query))
                return BadRequest("Zapytanie nie może być puste.");

            try
            {
                var result = await _productServiceAPI.GetProductFromApiName(query);
                return Ok(result);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"SearchProducts error: {ex}");
                return StatusCode(500, $"Błąd podczas wyszukiwania produktów: {ex.Message}");
            }
        }


    }
}







