using BackendLogicApi.Interfaces;
using BackendLogicApi.Models;
using Microsoft.AspNetCore.Mvc;

[ApiController]
[Route("api/[controller]")]
public class CalorieCalculatorController : ControllerBase
{
    private readonly ICalorieCalculatorService _calculator;

    public CalorieCalculatorController(ICalorieCalculatorService calculator)
    {
        _calculator = calculator;
    }

    [HttpPost("calculate")]
    public ActionResult<Nutriments> Calculate([FromBody] CalculationRequest request)
    {
        var result = _calculator.CalculateForWeight(request.Product, request.Grams);
        return Ok(result);
    }
}

