using Library.DBManager.Providers;
using Library.Entities;
using Library.Entities.DTO;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace Library.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class IznajmljivanjeController : ControllerBase
    {
        IznajmljivanjeProvider IznajmljivanjeProvider { get; set; }

        public IznajmljivanjeController(IznajmljivanjeProvider b)
        {
            IznajmljivanjeProvider = b;
        }
        [HttpPost("Rent_add")]
        public async Task<IActionResult> InsertLibrary([FromBody] IznajmljivanjeDTO lib)
        {
            try
            {
                var response = await IznajmljivanjeProvider.CreateIznajmljivanje(lib);
                if (response.Success == false)
                {
                    return BadRequest(response.Message);
                }
                return Ok(response.Message);
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }
        [HttpGet("Rent_all")]
        public async Task<IActionResult> SviKorisnici(string username)
        {
            try
            {
                return Ok(await IznajmljivanjeProvider.GetIznajmljivanja(username));
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }


        [HttpGet("Rent_all_fromlib")]
        public async Task<IActionResult> SviKorisnici(string username, string id)
        {
            try
            {
                return Ok(await IznajmljivanjeProvider.GetIznajmljivanja(username,id));
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        [HttpPut("Rent_edit")]
        public async Task<IActionResult> Editrent(string username, string id, string bookid)
        {
            try
            {
                var response = await IznajmljivanjeProvider.EditIznajmljivanje(username,id,bookid);
                if (response.Success == false)
                {
                    return BadRequest(response.Message);
                }
                return Ok(response.Message);
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }
    }
}
