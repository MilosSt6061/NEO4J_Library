using Library.DBManager.Setup;
using Library.Entities;
using Library.Entities.DTO;
using Library.Entities.Tools;
using Neo4jClient.Cypher;

namespace Library.DBManager.Providers
{
    public class NapisaoProvider
    {
        private readonly Neo4jService _service;
        public NapisaoProvider(Neo4jService service)
        {
            _service = service;
        }
        public async Task<List<Autor>> GetAutorsOfBook(string knjigaId)
        {
            try
            {
                var client = await _service.GetClientAsync();
                var data = await client.Cypher
                    .Match("(k:Knjiga {id: $id})")
                    .Match("(a)-[r:NAPISAO]->(k)")
                    .WithParams(new
                    {
                        id = knjigaId
                    })
                    .Return(a => a.As<Autor>())
                    .ResultsAsync;
                return data.ToList();
            }
            catch(Exception ex)
            {
                return null;
            }
        }
        public async Task<DBResponse> CreateNapisao(string imeAutora, string prezimeAutora, string knjigaId)
        {
            try
            {
                var client = await _service.GetClientAsync();
                var count = await client.Cypher
                    .Match("(a:Autor {ime: $ime, prezime: $prezime})")
                    .Match("(k:Knjiga {id: $id})")
                    .Merge("(a)-[r:NAPISAO]->(k)")
                    .WithParams(new
                    {
                        ime = imeAutora,
                        prezime = prezimeAutora,
                        id = knjigaId
                    })
                    .Return(r => r.Count())
                    .ResultsAsync;
                bool created = count.Single() == 1;
                return new DBResponse
                {
                    Success = created,
                    Message = created ? "Autor je uspesno napisao knjigu!" : "Autor je neuspesno napisao knjigu!"
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
