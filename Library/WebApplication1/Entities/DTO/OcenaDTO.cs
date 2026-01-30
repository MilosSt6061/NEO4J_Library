namespace Library.Entities.DTO
{
    public class OcenaDTO
    {
        public string username { get; set; }
        public string knjigaId { get; set; }
        public int ocena { get; set; }
        public string komentar { get; set; }
    }
    public class OcenaHelper
    {
        public string username { get; set; }
        public int ocena { get; set; }
        public string komentar { get; set; }
    }
}
