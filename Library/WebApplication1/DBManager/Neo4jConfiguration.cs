using DotNetEnv;
namespace Neo4J_Movies.Configurations
{
    public class Neo4jConfiguration
    {
        public string? uri { get; set; }
        public string? username { get; set; }
        public string? password { get; set; }

        public void Validate()
        {
            if (string.IsNullOrWhiteSpace(uri))
                throw new InvalidOperationException("Neo4j URI is required");
        
            if (string.IsNullOrWhiteSpace(username))
                throw new InvalidOperationException("Neo4j Username is required");
        
            if (string.IsNullOrWhiteSpace(password))
                throw new InvalidOperationException("Neo4j Password is required");
        }   

        public static Neo4jConfiguration Local => new()
        {
            uri = Environment.GetEnvironmentVariable("NEO4J_URI_LOCAL"),
            username = Environment.GetEnvironmentVariable("NEO4J_USERNAME"),
            password = Environment.GetEnvironmentVariable("NEO4J_PASSWORD_LOCAL")
        };
        
        public static Neo4jConfiguration Aura => new()
        {
            uri = Environment.GetEnvironmentVariable("NEO4J_URI_AURA"),
            username = Environment.GetEnvironmentVariable("NEO4J_USERNAME"),
            password = Environment.GetEnvironmentVariable("NEO4J_PASSWORD_AURA")
        };
    }
}