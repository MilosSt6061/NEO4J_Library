using Library.DBManager.Providers;
using Library.Entities;
using Library.Entities.DTO;
using Microsoft.AspNetCore.Mvc;

namespace Library.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class NapisaoController : ControllerBase
    {
        NapisaoProvider napisaoProvider { get; set; }
        public NapisaoController(NapisaoProvider napisaoProvider)
        {
            this.napisaoProvider = napisaoProvider;
        }

        [HttpGet("VratiAutoreKnjige/{knjigaId}")]
        public async Task<IActionResult> VratiAutoreKnjige(string knjigaId)
        {
            try
            {
                var response = await napisaoProvider.GetAutorsOfBook(knjigaId);
                return Ok(response);
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        [HttpPost("KreirajNapisao/{imeAutora}/{prezimeAutora}/{knjigaId}")]
        public async Task<IActionResult> KreirajNapisao(string imeAutora, string prezimeAutora, string knjigaId)
        {
            try
            {
                var response = await napisaoProvider.CreateNapisao(imeAutora, prezimeAutora, knjigaId);
                if(response.Success) return Ok(response.Message);
                else return BadRequest(response.Message);
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }
    }
}