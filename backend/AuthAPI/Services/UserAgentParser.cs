namespace AuthAPI.Services
{
    public static class UserAgentParser
    {
        public static (string Device, string Browser, string Os) Parse(string? userAgent)
        {
            if (string.IsNullOrEmpty(userAgent))
                return ("Nieznane urządzenie", "Przeglądarka", "Nieznany system");

            var os = "Nieznany system";
            if (userAgent.Contains("Windows NT")) os = "Windows";
            else if (userAgent.Contains("Macintosh") || userAgent.Contains("Mac OS X")) os = "macOS";
            else if (userAgent.Contains("Android")) os = "Android";
            else if (userAgent.Contains("iPhone") || userAgent.Contains("iPad")) os = "iOS";
            else if (userAgent.Contains("Linux")) os = "Linux";

            var browser = "Przeglądarka";
            if (userAgent.Contains("Edg/")) browser = "Edge";
            else if (userAgent.Contains("Chrome/")) browser = "Chrome";
            else if (userAgent.Contains("Firefox/")) browser = "Firefox";
            else if (userAgent.Contains("Safari/")) browser = "Safari";
            else if (userAgent.Contains("OPR/") || userAgent.Contains("Opera/")) browser = "Opera";

            var device = "Komputer";
            if (userAgent.Contains("Mobi") || userAgent.Contains("Android") || userAgent.Contains("iPhone")) device = "Urządzenie mobilne";
            else if (userAgent.Contains("iPad")) device = "Tablet";

            return (device, browser, os);
        }
    }
}
