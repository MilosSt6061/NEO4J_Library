using Library.DBManager.Setup;
using Library.Entities;
using Library.Entities.Tools;

namespace Library.DBManager.Providers
{
    public class AutorProvider
    {
        private readonly Neo4jService _service;
        public AutorProvider(Neo4jService service)
        {
            _service = service;
        }
        public async Task<List<Autor>> GetAllAutors()
        {
            try
            {
                var client = await _service.GetClientAsync();
                var autori = await client.Cypher
                    .Match("(a:Autor)")
                    .Return(a => a.As<Autor>())
                    .ResultsAsync;
                var data = autori.ToList();
                return data;
            }
            catch(Exception ex)
            {
                return null;
            }
        }
        public async Task<List<Autor>> GetAuthorsByName(string ime)
        {
            try
            {
                var client = await _service.GetClientAsync();
                var autori = await client.Cypher
                    .Match("(a:Autor)")
                    .Where("a.ime is not null and a.ime =~ $ime")
                    .WithParam("ime", ime)
                    .Return(a => a.As<Autor>())
                    .ResultsAsync;
                var data = autori.ToList();
                return data;
            }
            catch(Exception ex)
            {
                return null;
            }
        }
        public async Task<DBResponse> CreateAuthor(Autor autor)
        {
            try
            {
                var client = await _service.GetClientAsync();
                autor.id = Guid.NewGuid().ToString();
                var count = await client.Cypher
                    .Create("(a:Autor {id: $id, ime: $ime, prezime: $prezime, godinaRodjenja: $godinaRodjenja, biografija: $biografija})")
                    .WithParams(new
                    {
                        id = autor.id,
                        ime = autor.ime,
                        prezime = autor.prezime,
                        godinaRodjenja = autor.godinaRodjenja,
                        biografija = autor.biografija
                    })
                    .Return(a => a.Count())
                    .ResultsAsync;
                bool created = count.Single() == 1;
                return new DBResponse
                {
                    Success = created,
                    Message = created ? "Uspesno kreiran autor!" : "Autor nije uspesno kreiran!"
                };
            }
            catch(Exception ex)
            {
                return new DBResponse
                {
                    Success = false,
                    Message = ex.Message
                };
            }
        }
        public async Task<DBResponse> UpdateAuthor(Autor autor)
        {
            try
            {
                var client = await _service.GetClientAsync();
                var author = await client.Cypher
                    .Match("(a:Autor)")
                    .Where("a.id is not null and a.id =~ $id")
                    .WithParam("id", autor.id)
                    .Set("a.ime = $ime, a.prezime = $prezime, a.godinaRodjenja = $godinaRodjenja, a.biografija = $biografija")
                    .WithParams(new
                    {
                        ime = autor.ime,
                        prezime = autor.prezime,
                        godinaRodjenja = autor.godinaRodjenja,
                        biografija = autor.biografija
                    })
                    .Return(a => a.As<Autor>())
                    .ResultsAsync;
                bool updated = author == autor;
                return new DBResponse
                {
                    Success = updated,
                    Message = updated ? "Uspesno izmenjen autor!" : "Autor nije uspesno izmenjen!"
                };
            }
            catch(Exception ex)
            {
                return new DBResponse
                {
                    Success = false,
                    Message = ex.Message
                };
            }
        }
        public async Task<DBResponse> DeleteAuthor(string id)
        {
            try
            {
                var client = await _service.GetClientAsync();
                await client.Cypher
                    .Match("(a:Autor)")
                    .Where("a.id is not null and a.id =~ $id")
                    .WithParam("id", id)
                    .DetachDelete("a")
                    .ExecuteWithoutResultsAsync();
                return new DBResponse
                {
                    Success = true,
                    Message = "Uspesno obrisan autor!"
                };
            }
            catch(Exception ex)
            {
                return new DBResponse
                {
                    Success = false,
                    Message = ex.Message
                };
            }
        }
    }
}