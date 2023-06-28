const colorsChoice = document.querySelector('#colorsChoice')
const game = document.querySelector('#game')
const cursor = document.querySelector('#cursor')
game.width = 2000
game.height = 600
const gridCellSize = 10

let pixels_dict = {};
let cooldown = 0;


const ctx = game.getContext('2d');
const gridCtx = game.getContext('2d');

const colorList=[
    "#000000", "#808080", "#A9A9A9", "#D3D3D3", "#F5F5F5", "#FFFFFF", "#FFFAF0", "#FFF0F5", "#FFE4E1", "#FFC0CB", "#FF69B4", "#FF1493", "#DB7093", "#FF00FF", "#C71585", "#D8BFD8", "#DDA0DD", "#EE82EE", "#DA70D6", "#BA55D3", "#9932CC", "#8A2BE2", "#4B0082", "#7B68EE", "#6A5ACD", "#9370DB", 
    "#8B008B", "#BC8F8F", "#F08080", "#FF7F50", "#FF6347","#FF0000", "#DC143C", "#FFA07A", "#E9967A", "#FA8072", "#B22222", "#8B0000", "#F5F5DC", "#FFE4C4", "#F5DEB3", "#DEB887", "#F4A460", "#FFA500", "#FF8C00", "#D2691E", "#CD853F", "#A0522D", "#8B4513", "#FFFFE0", "#FFFACD", "#FFFF00", "#FFD700", 
    "#DAA520", "#B8860B", "#BDB76B", "#9ACD32", "#6B8E23", "#808000", "#556B2F", "#ADFF2F", "#7CFC00", "#F5FFFA", "#3CB371", "#2E8B57", "#778899", "#7FFFD4", "#00FFFF", "#40E0D0", "#20B2AA", "#008B8B", "#B0E0E6", "#87CEFA", "#00BFFF", "#1E90FF", "#E6E6FA", "#B0C4DE", "#6495ED", 
    "#4682B4", "#0000FF", "#0000CD", "#191970"
]
let currentColorChoice = colorList[9]

function createPixel(x, y, color, pseudo){
    ctx.beginPath()
    ctx.fillStyle = color
    ctx.fillRect(x, y,gridCellSize, gridCellSize)
    pixels_dict[x + "_" + y] = {"pseudo": pseudo}
}

function addPixelIntoGame(){
    if (cooldown > 0){
        return
    }
    const x = cursor.offsetLeft
    const y = cursor.offsetTop - game.offsetTop
    createPixel(x, y, currentColorChoice, sessionStorage.getItem("pseudo"))

    cooldown = 10
    document.getElementById("cooldown").innerHTML = 10;
    var cooldownTimer = setInterval(function(){
        cooldown -= 1;
        if(cooldown <= 0){
            clearInterval(cooldownTimer);
            cooldown = 0;
        }
        document.getElementById("cooldown").innerHTML = cooldown;
    }, 1000);

    $.ajax({
        url: "https://ze9sdfdqfa.execute-api.eu-west-1.amazonaws.com/api/pixels",
        type: "PUT",
        dataType: 'json',
        crossDomain: true ,
        contentType:'application/json',
        async:true,
        data: JSON.stringify({"x": x, "y": y, "color": currentColorChoice, "pseudo": sessionStorage.getItem("pseudo")}),
        error: function (xhr, ajaxOptions, thrownError) {
            if (xhr.status == 403){
                alert("Cooldown en cours")
                ctx.beginPath()
                ctx.fillStyle = "#FFFFFF"
                ctx.fillRect(x, y,gridCellSize, gridCellSize)
                delete pixels_dict[x + "_" + y]
            }
        }
    })

}


function drawGrids(ctx, width, height, cellWidth, cellHeight){
    ctx.beginPath()
    ctx.strokeStyle = "#ccc"

    for(let i = 0; i < width; i++){
        ctx.moveTo(i*cellWidth, 0)
        ctx.lineTo(i*cellWidth,height)
    }

    for(let i = 0; i < height; i++){
        ctx.moveTo(0, i*cellHeight)
        ctx.lineTo(width, i*cellHeight)
    }

    ctx.stroke()

    $.ajax({
        url: "https://ze9sdfdqfa.execute-api.eu-west-1.amazonaws.com/api/pixels",
        dataType: 'json',
        crossDomain: true,
        contentType:'application/json',
        async:true,
        success: function (response) {
            response.forEach(function(pixel){
                createPixel(pixel['x'], pixel['y'], pixel['color'], pixel["pseudo"])
            })
        },
    })

    setInterval(function(){ 
        $.ajax({
            url: "https://ze9sdfdqfa.execute-api.eu-west-1.amazonaws.com/api/pixels",
            dataType: 'json',
            crossDomain: true,
            contentType:'application/json',
            async:true,
            success: function (response) {
                response.forEach(function(pixel){
                    createPixel(pixel['x'], pixel['y'], pixel['color'], pixel["pseudo"])
                })
            },
        })
    }, 1000);
}

function startPixelPiou(){
    game.style.display = "block";
    drawGrids(gridCtx, game.width, game.height, gridCellSize, gridCellSize)
    colorList.forEach(color=> {
        const colorItem = document.createElement('div')
        colorItem.style.backgroundColor = color
        colorsChoice.appendChild(colorItem)
    
        colorItem.addEventListener('click', () =>{
            currentColorChoice = color
    
            colorItem.innerHTML = `<i class="fa-solid fa-check"></i>`
    
            setTimeout(()=> {
                colorItem.innerHTML=""
            }, 1000)
        })
    
    })
    cursor.addEventListener('click', function(event){
        addPixelIntoGame()
    })
    game.addEventListener('click', function(){
        addPixelIntoGame()
    })
    game.addEventListener('mousemove', function(event){
        const cursorLeft = event.pageX - (cursor.offsetWidth/2)
        let cursorTop = event.pageY - (cursor.offsetHeight/2) - game.offsetTop
    
        if (cursorTop < 0){
            cursorTop = 0
        }
    
        cursor.style.left = Math.floor(cursorLeft/gridCellSize)*gridCellSize + "px"
        cursor.style.top = game.offsetTop + Math.floor(cursorTop/gridCellSize)*gridCellSize + "px"
    
        const x = cursor.offsetLeft
        const y = cursor.offsetTop - game.offsetTop
    
        var key = x + "_" + y
        var tooltip = document.querySelector('#pixel_pseudo');
        if (key in pixels_dict){
            tooltip.innerHTML = pixels_dict[key]["pseudo"]
            tooltip.style.display = "block";
            tooltip.style.position = "absolute";
            tooltip.style.left = Math.floor(cursorLeft/gridCellSize)*gridCellSize + gridCellSize + "px";
            tooltip.style.top =  game.offsetTop + Math.floor(cursorTop/gridCellSize)*gridCellSize - tooltip.offsetHeight + "px";
        }
        else{
            tooltip.style.display = "none";
        }
    })
}






let pseudo = sessionStorage.getItem("pseudo");
if (pseudo == null){
    $('<div id="dialog-form">Quel est ton pseudo ?<input type="text" style="z-index:10000" name="name"><br></div>').dialog({
        modal: true,
        buttons: {
            'OK': function () {
                pseudo = $('input[name="name"]').val();
                sessionStorage.setItem("pseudo", pseudo);
                $('#welcome').html('Welcome, ' + pseudo);
                startPixelPiou();
                $(this).dialog('close');
            }
        },
        open: function() {
            $("#dialog-form").keypress(function(e) {
                if (e.keyCode == $.ui.keyCode.ENTER) {
                    $(this).parent().find("button:eq(0)").trigger("click");
                }
            });
        }
    });
}
else{
    $('#welcome').html('Welcome back, ' + pseudo);
    startPixelPiou();
}
