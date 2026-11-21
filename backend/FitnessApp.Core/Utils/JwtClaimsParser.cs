using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;

namespace FitnessApp.Core.Utils;

public static class JwtClaimsParser
{
    public static (decimal? Weight, string? TrainingExperience, decimal? CaloricTarget) ParseProfileClaims(string token)
    {
        try
        {
            var handler = new JwtSecurityTokenHandler();
            var jwtToken = handler.ReadJwtToken(token);
            
            var weightClaim = jwtToken.Claims.FirstOrDefault(c => c.Type == "current_weight");
            var experienceClaim = jwtToken.Claims.FirstOrDefault(c => c.Type == "training_experience");
            var caloricTargetClaim = jwtToken.Claims.FirstOrDefault(c => c.Type == "caloric_target");

            decimal? weight = null;
            if (weightClaim != null && decimal.TryParse(weightClaim.Value, System.Globalization.NumberStyles.Any, System.Globalization.CultureInfo.InvariantCulture, out var w))
            {
                weight = w;
            }

            string? experience = experienceClaim?.Value;
            if (string.IsNullOrWhiteSpace(experience))
            {
                experience = null;
            }

            decimal? caloricTarget = null;
            if (caloricTargetClaim != null && decimal.TryParse(caloricTargetClaim.Value, System.Globalization.NumberStyles.Any, System.Globalization.CultureInfo.InvariantCulture, out var ct))
            {
                caloricTarget = ct;
            }

            return (weight, experience, caloricTarget);
        }
        catch
        {
            return (null, null, null);
        }
    }
}