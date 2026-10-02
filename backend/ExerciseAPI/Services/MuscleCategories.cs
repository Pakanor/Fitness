namespace ExerciseAPI.Services
{
    // Centralized muscle-group -> recovery-category mapping used by both the
    // damage recorder and the live recovery reader, so the two never drift.
    public static class MuscleCategories
    {
        public record Info(string NamePl, string Category, double Lambda, double TMax);

        private static readonly Dictionary<string, Info> Map = new()
        {
            ["biceps"] = new("Biceps", "Małe", 0.08, 48),
            ["triceps"] = new("Triceps", "Małe", 0.08, 48),
            ["calves"] = new("Łydki", "Małe", 0.08, 48),
            ["deltoid_lateral"] = new("Bark boczny", "Małe", 0.08, 48),
            ["deltoid_posterior"] = new("Bark tylny", "Małe", 0.08, 48),
            ["deltoid_anterior"] = new("Bark przedni", "Małe", 0.08, 48),
            ["forearms"] = new("Przedramiona", "Małe", 0.08, 48),
            ["abs"] = new("Brzuch", "Małe", 0.08, 48),
            ["core_stabilizers"] = new("Stabilizatory tułowia", "Małe", 0.08, 48),
            ["rhomboids"] = new("Romby i czworoboczny", "Małe", 0.08, 48),
            ["chest_main"] = new("Klatka piersiowa", "Średnie", 0.05, 72),
            ["hamstrings"] = new("Dwugłowe uda", "Średnie", 0.05, 72),
            ["lower_back"] = new("Dolny odcinek pleców", "Średnie", 0.05, 72),
            ["quadriceps"] = new("Czwórki", "Duże", 0.04, 96),
            ["lats"] = new("Plecy szerokie", "Duże", 0.04, 96),
            ["glutes"] = new("Pośladki", "Duże", 0.04, 96),
        };

        public static Info Get(string key) =>
            Map.TryGetValue(key, out var info) ? info : new Info("?", "Średnie", 0.05, 72);

        public static IEnumerable<string> AllKeys => Map.Keys;
    }
}
