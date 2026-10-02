using BackendLogicApi.Models;


namespace BackendLogicApi.Interfaces
{
    public interface ICalorieCalculatorService
    {
        Nutriments? CalculateForWeight(Product product, double grams);

    }
}
