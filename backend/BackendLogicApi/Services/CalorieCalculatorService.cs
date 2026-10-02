using BackendLogicApi.Interfaces;
using BackendLogicApi.Models;
using Microsoft.AspNetCore.Mvc;

namespace BackendLogicApi.Services
{

   
    public class CalorieCalculatorService : ICalorieCalculatorService
    {

        public Nutriments? CalculateForWeight(Product product, double grams)
        {
            if (product?.Nutriments == null ||
                product.Nutriments.Energy == 0 ||
                product.Nutriments.Fat == 0 ||
                product.Nutriments.Carbs == 0 ||
                product.Nutriments.Proteins == 0 ||
                product.Nutriments.Salt == 0)
                return null;

            double factor = grams / 100.0;

            double energy = (double)product.Nutriments.Energy * factor;
            string energyUnit = product.Nutriments.EnergyUnit ?? "kJ";

            if (energyUnit.ToLower() == "kj")
            {
                energy = energy / 4.184;
                energyUnit = "kcal";
            }

            return new Nutriments
            {
                Energy = Math.Round(energy, 2),
                Fat = Math.Round((double)product.Nutriments.Fat * factor, 2),
                Carbs = Math.Round((double)product.Nutriments.Carbs * factor, 2),
                Proteins = Math.Round((double)product.Nutriments.Proteins * factor, 2),
                Salt = Math.Round((double)product.Nutriments.Salt * factor, 2),
                EnergyUnit = energyUnit
            };
        }

    }
}
