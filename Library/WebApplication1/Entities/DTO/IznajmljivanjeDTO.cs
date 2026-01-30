using Newtonsoft.Json;

namespace Library.Entities.DTO
{
    public class IznajmljivanjeDTO
    {
        public string Username { get; set; }
        public string LibID { get; set; }
        public string BookID { get; set; }
        public string Date { get; set; }
        public bool Returned { get; set; }
    }

    public class IznaljmiljivanjeHelper
    {
        [JsonProperty("bookid")]
        public string BookID { get; set; }

        [JsonProperty("date")]
        public string Date { get; set; }

        [JsonProperty("returned")]
        public bool Returned { get; set; }
    }
}
