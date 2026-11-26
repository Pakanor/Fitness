using BackendLogicApi.Interfaces;
using BackendLogicApi.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class CalorieCalculatorController : ControllerBase
{
    private readonly ICalorieCalculatorService _calculator;
    private readonly IProductOperationsService _productOperations;

    public CalorieCalculatorController(ICalorieCalculatorService calculator, IProductOperationsService productOperations)
    {
        _calculator = calculator;
        _productOperations = productOperations;
    }

    [HttpPost("calculate")]
    public async Task<ActionResult<Nutriments>> Calculate([FromBody] CalculationRequest request)
    {
        Product product = request.Product;
        
        if (product == null && request.ProductId.HasValue)
        {
            product = await _productOperations.GetProductByIdAsync(request.ProductId.Value);
            if (product == null)
            {
                return NotFound(new { message = "Produkt nie znaleziony." });
            }
        }

        if (product == null)
        {
            return BadRequest(new { message = "Produkt jest wymagany." });
        }

        var result = _calculator.CalculateForWeight(product, request.Grams);
        return Ok(result);
    }
}

