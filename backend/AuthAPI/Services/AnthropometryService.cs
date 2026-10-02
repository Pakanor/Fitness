namespace AuthAPI.Services
{
    public class AnthropometryService
    {
        public (decimal? bfPercent, decimal whr, decimal vtaper) Calculate(
            decimal height, decimal neck, decimal waist, decimal hips, decimal shoulders, decimal weight, string? gender)
        {
            decimal whr = hips > 0 ? Math.Round(waist / hips, 2) : 0;
            decimal vtaper = waist > 0 ? Math.Round(shoulders / waist, 2) : 0;
            decimal? bfPercent = null;

            if (height > 0 && neck > 0 && waist > 0 && hips > 0)
            {
                if (gender?.ToLower() == "male")
                {
                    double logWaistNeck = Math.Log10((double)(waist - neck));
                    double logHeight = Math.Log10((double)height);
                    bfPercent = Math.Round((decimal)(86.010 * logWaistNeck - 70.041 * logHeight + 36.76), 1);
                }
                else
                {
                    double logWaistHipsNeck = Math.Log10((double)(waist + hips - neck));
                    double logHeight = Math.Log10((double)height);
                    bfPercent = Math.Round((decimal)(163.205 * logWaistHipsNeck - 97.684 * logHeight - 78.387), 1);
                }

                if (bfPercent < 0) bfPercent = 0;
            }

            return (bfPercent, whr, vtaper);
        }
    }
}
