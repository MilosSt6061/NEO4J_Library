using Library.DBManager.Setup;
using Library.Entities;
using Library.Entities.DTO;
using Library.Entities.Tools;

namespace Library.DBManager.Providers
{
    public class PosedovanjeProvider
    {
        private readonly Neo4jService _service;
        public PosedovanjeProvider(Neo4jService service)
        {
            _service = service;
        }

        public async Task<DBResponse> CreatePosedovanje(PosedovanjeDTO pos)
        {
            try
            {
                var client = await _service.GetClientAsync();
                var result = await client.Cypher
                    .Match("(l:Biblioteka {id: $bid})")
                    .Match("(b:Knjiga {id: $kid})")
                    .Create("(l)-[r:POSEDUJE {br_primeraka: $br_primeraka, br_iz: $br_iz}]->(b)")
                    .WithParams(new
                    {
                        bid = pos.bid,
                        kid = pos.kid,
                        br_primeraka = pos.br_primeraka,
                        br_iz = pos.br_iz
                    })
                    .Return(r => r.Count())
                    .ResultsAsync;

                bool created = result.Single() == 1;

                return new DBResponse
                {
                    Success = created,
                    Message = created ? "Uspesno kreirano" : "Postojeci id"
                };
            }
            catch (Exception ex)
            {
                return new DBResponse
                {
                    Success = false,
                    Message = ex.Message
                };
            }
        }

        public async Task<List<PosedovanjeDTO>> GetAllBooksFromLibrary(string lid)
        {
            try
            {
                var client = await _service.GetClientAsync();
                var result = await client.Cypher
                    .Match("(l:Biblioteka {id: $id})")
                    .Match("(l)-[r:POSEDUJE]->(b)")
                    .WithParam("id", lid)
                    .Return((l, r, b) => new PosedovanjeDTO
                    {
                        kid = b.As<Knjiga>().id,
                        bid = l.As<Biblioteka>().Id,
                        br_primeraka = r.As<PosedovanjeHelper>().br_primeraka,
                        br_iz = r.As<PosedovanjeHelper>().br_iz
                    })
                    .ResultsAsync;

                List<PosedovanjeDTO> lista = result.ToList();

                return lista;
            }
            catch (Exception ex)
            {
                return null;
            }
        }

        public async Task<List<PosedovanjeDTO>> GetAllBooksFromLibraryByName(string lid, string name)
        {
            try
            {
                string namepat = "(?i).*" + name + ".*";
                var client = await _service.GetClientAsync();
                var result = await client.Cypher
                    .Match("(l:Biblioteka {id: $id})")
                    .Match("(l)-[r:POSEDUJE]->(b)")
                    .Where("b.naziv =~ $namepat")
                    .WithParams(new
                    {
                        id = lid,
                        namepat = namepat
                    })
                    .Return((l, r, b) => new PosedovanjeDTO
                    {
                        kid = b.As<Knjiga>().id,
                        bid = l.As<Biblioteka>().Id,
                        br_primeraka = r.As<PosedovanjeHelper>().br_primeraka,
                        br_iz = r.As<PosedovanjeHelper>().br_iz
                    })
                    .ResultsAsync;

                List<PosedovanjeDTO> lista = result.ToList();

                return lista;
            }
            catch (Exception ex)
            {
                return null;
            }
        }

        public async Task<List<PosedovanjeDTO>> GetAllBooksFromLibraryByAutor(string lid, string aid)
        {
            try
            {
                var client = await _service.GetClientAsync();
                var result = await client.Cypher
                    .Match("(l:Biblioteka {id: $id})")
                    .Match("(l)-[r:POSEDUJE]->(b)<-[r1:NAPISAO]-(a)")
                    .Where("a.id =~ $aid")
                    .WithParams(new
                    {
                        id = lid,
                        aid = aid
                    })
                    .Return((l, r, b) => new PosedovanjeDTO
                    {
                        kid = b.As<Knjiga>().id,
                        bid = l.As<Biblioteka>().Id,
                        br_primeraka = r.As<PosedovanjeHelper>().br_primeraka,
                        br_iz = r.As<PosedovanjeHelper>().br_iz
                    })
                    .ResultsAsync;

                List<PosedovanjeDTO> lista = result.ToList();

                return lista;
            }
            catch (Exception ex)
            {
                return null;
            }
        }

        public async Task<DBResponse> EditPosedovanje(PosedovanjeDTO pos)
        {
            try
            {
                var client = await _service.GetClientAsync();
                var result = await client.Cypher
                    .Match("(l:Biblioteka {id: $lid})")
                    .Match("(b:Knjiga {id: $bid})")
                    .Match("(l)-[r:Poseduje]->(b)")
                    .Set("r.br_primeraka = $br_primeraka, r.br_iz = $br_iz")
                    .WithParams(new
                    {
                        lid = pos.bid,
                        bid = pos.kid,
                        br_primeraka = pos.br_primeraka,
                        br_iz = pos.br_iz
                    })
                    .Return(r => r.Count())
                    .ResultsAsync;

                bool created = result.Single() == 1;

                return new DBResponse
                {
                    Success = created,
                    Message = created ? "Uspesno kreirano" : "Postojeci id"
                };
            }
            catch (Exception ex)
            {
                return new DBResponse
                {
                    Success = false,
                    Message = ex.Message
                };
            }
        }

        public async Task<DBResponse> DeletePosedovanje(string bid, string kid)
        {
            try
            {
                var client = await _service.GetClientAsync();
                await client.Cypher
                    .Match("(l:Biblioteka {id: $lid})")
                    .Match("(b:Knjiga {id: $bid})")
                    .Match("(l)-[r:Poseduje]->(b)")
                    .WithParams(new
                    {
                        lid = bid,
                        bid = kid
                    })
                    .Delete("r")
                    .ExecuteWithoutResultsAsync();

                return new DBResponse
                {
                    Success = true,
                    Message = "Uspesno izbrisano"
                };
            }
            catch (Exception ex)
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
