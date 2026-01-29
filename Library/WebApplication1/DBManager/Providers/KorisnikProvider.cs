using Library.DBManager.Setup;
using Library.Entities;
using Library.Entities.Tools;
using Neo4jClient.Cypher;

/*namespace Library.DBManager.Providers
{
    public class KorisnikProvider
    {
        private readonly Neo4jService _service;
        public KorisnikProvider(Neo4jService service)
        {
            _service = service;
        }

        public async DBResponse InsertUser(Korisnik user)
        {
            try
            {
                var client = await _service.GetClientAsync();
                var createdActors = await client.Cypher
                    .Create("(a:Korisnik {username: $username, name: $name, lastname: $lastname, email: $email, number: $number, role: $user})")
                    .WithParams(new
                    {
                        username = user.Username,
                        name = user.Name,
                        lastname = user.Lastname,
                        email = user.Email,
                        number = user.Number
                    })
                    .Return(a => a.As<Korisnik>())
                    .ResultsAsync;

                 return new DBResponse
                 {
                    Success = true,
                    Message = "Uspesno kreirano"
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
}*/
