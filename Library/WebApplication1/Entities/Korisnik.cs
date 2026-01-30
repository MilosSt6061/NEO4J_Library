using Newtonsoft.Json;

namespace Library.Entities
{
    public class Korisnik
    {
        [JsonProperty("username")]
        public string Username { get; set; }

        [JsonProperty("password")]
        public string Password { get; set; }

        [JsonProperty("name")]
        public string Name { get; set; }

        [JsonProperty("lastname")]
        public string Lastname { get; set; }

        [JsonProperty("email")]
        public string Email { get; set; }
        [JsonProperty("number")]
        public string Number { get; set; }

        [JsonProperty("role")]
        public string Role { get; set; }
        public bool _created { get; set; }
    }
}
