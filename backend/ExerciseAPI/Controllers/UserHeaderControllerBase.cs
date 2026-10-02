using Microsoft.AspNetCore.Mvc;
using System.Globalization;

namespace ExerciseAPI.Controllers
{
    public abstract class FitnessControllerBase : ControllerBase
    {
        protected int CurrentUserId { get; }
        protected double UserWeight { get; }
        protected string UserExperience { get; }
        protected bool HasCurrentUser { get; }

        protected FitnessControllerBase(IHttpContextAccessor httpContextAccessor)
        {
            var headers = httpContextAccessor.HttpContext?.Request.Headers;
            if (headers == null || !int.TryParse(headers["X-User-Id"], out var userId))
            {
                CurrentUserId = -1;
                UserWeight = 75.0;
                UserExperience = "intermediate";
                HasCurrentUser = false;
                return;
            }

            CurrentUserId = userId;
            UserWeight = double.TryParse(headers["X-User-Weight"], NumberStyles.Any, CultureInfo.InvariantCulture, out var weight)
                ? weight
                : 75.0;

            var experience = headers["X-User-TrainingExperience"].ToString();
            UserExperience = string.IsNullOrWhiteSpace(experience) ? "intermediate" : experience;
            HasCurrentUser = true;
        }
    }
}