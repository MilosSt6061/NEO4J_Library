using Newtonsoft.Json;

namespace Library.Entities.DTO
{
    public class KorisnikDTO
    {
        [JsonProperty("username")]
        public string Username { get; set; }

        [JsonProperty("name")]
        public string Name { get; set; }

        [JsonProperty("lastname")]
        public string Lastname { get; set; }

        [JsonProperty("email")]
        public string Email { get; set; }

        [JsonProperty("number")]
        public string Number { get; set; }
    }
}
