using Newtonsoft.Json;

namespace Library.Entities
{
    public class Biblioteka
    {
        [JsonProperty("id")]
        public string Id { get; set; }

        [JsonProperty("name")]
        public string Naziv { get; set; }

        [JsonProperty("address")]
        public string Adresa { get; set; }
    }
}
