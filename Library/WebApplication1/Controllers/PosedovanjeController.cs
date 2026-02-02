using Library.DBManager.Providers;
using Library.Entities.DTO;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace Library.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class PosedovanjeController : ControllerBase
    {
        PosedovanjeProvider PosedovanjeProvider { get; set; }

        public PosedovanjeController(PosedovanjeProvider b)
        {
            PosedovanjeProvider = b;
        }

        [HttpPost("AddBookToLib")]
        public async Task<IActionResult> AddBookToLibrary([FromBody] PosedovanjeDTO lib)
        {
            try
            {
                var response = await PosedovanjeProvider.CreatePosedovanje(lib);
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
        [HttpGet("GetBooksFromLibrary/{libid}")]
        public async Task<IActionResult> AllBooks(string libid)
        {
            try
            {
                return Ok(await PosedovanjeProvider.GetAllBooksFromLibrary(libid));
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }


        [HttpGet("GetBooksFromLibraryByName/{libid}/{name}")]
        public async Task<IActionResult> AllBooksByName(string libid, string name)
        {
            try
            {
                return Ok(await PosedovanjeProvider.GetAllBooksFromLibraryByName(libid,name));
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        [HttpGet("GetBooksFromLibraryByAutor/{libid}/{autid}")]
        public async Task<IActionResult> AllBooksByAutor(string libid, string autid)
        {
            try
            {
                return Ok(await PosedovanjeProvider.GetAllBooksFromLibraryByAutor(libid,autid));
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        [HttpPut("EditBookInLibrary")]
        public async Task<IActionResult> EditPosedovanje([FromBody]PosedovanjeDTO Pos)
        {
            try
            {
                var response = await PosedovanjeProvider.EditPosedovanje(Pos);
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

        [HttpDelete("DeleteBookInLibrary/{bid}/{kid}")]
        public async Task<IActionResult> DeletePosedovanje(string bid, string kid)
        {
            try
            {
                var response = await PosedovanjeProvider.DeletePosedovanje(bid,kid);
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
