using Neo4jClient;

namespace Library.DBManager
{
    public class DBSession
    {
        GraphClient client;
        DBSession()
        {
            client = new GraphClient(new Uri("http://localhost:7474/db/data"), "neo4j", "neo4jm");
            try
            {
                client.ConnectAsync().Wait();
            }
            catch (Exception exc)
            {
                Console.WriteLine("Connection failed: " + exc.Message);
            }
        }
    }
}
